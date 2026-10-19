import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import request from 'supertest';
import { app } from '../../app.js';
import { aiService } from './ai.service.js';
import { generateAccessToken } from '../../utils/crypto.js';
import { PlatformRole } from '@edunexa/shared';

describe('STAGE 7: EduNexa AI Features Test Suite', () => {
  const teacherUser = {
    userId: 'usr-teacher-ai-01',
    email: 'julian.thorne@apexacademy.edu',
    schoolId: 'school-apex-01',
    role: PlatformRole.TEACHER,
  };

  const studentUser = {
    userId: 'usr-student-ai-01',
    email: 'aarav.sharma@apexacademy.edu',
    schoolId: 'school-apex-01',
    role: PlatformRole.STUDENT,
  };

  const teacherToken = generateAccessToken(teacherUser);
  const studentToken = generateAccessToken(studentUser);

  afterEach(() => {
    // Reset any test provider overrides
    aiService.setTestProviderOverride(null);
  });

  describe('1. AI Provider Status & Configuration Transparency', () => {
    it('1a. Returns honest status when no AI provider API key is configured', async () => {
      aiService.setTestProviderOverride(null);

      const res = await request(app).get('/api/v1/ai/status');

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.isConfigured).toBe(false);
      expect(res.body.data.provider).toBe('None (Unconfigured)');
      expect(res.body.data.message).toContain('AI provider is not configured');
    });

    it('1b. School Information Assistant rejects execution with 503 if provider unconfigured', async () => {
      aiService.setTestProviderOverride(null);

      const res = await request(app)
        .post('/api/v1/ai/assistant/ask')
        .set('Authorization', `Bearer ${studentToken}`)
        .send({
          question: 'What is the attendance policy for term examinations?',
          contextScope: 'POLICIES',
        });

      expect(res.status).toBe(503);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('AI_PROVIDER_NOT_CONFIGURED');
      expect(res.body.error.message).toContain('AI Provider is not configured');
    });

    it('1c. Quiz generation rejects execution with 503 if provider unconfigured', async () => {
      aiService.setTestProviderOverride(null);

      const res = await request(app)
        .post('/api/v1/ai/quiz/generate')
        .set('Authorization', `Bearer ${teacherToken}`)
        .send({
          studyMaterial: 'Newton laws of motion describe the relationship between a body and the forces acting upon it.',
          subject: 'Physics',
          gradeLevel: 'Grade 10',
          questionCount: 2,
        });

      expect(res.status).toBe(503);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('AI_PROVIDER_NOT_CONFIGURED');
    });
  });

  describe('2. FEATURE 1: Grounded School Information Assistant', () => {
    beforeEach(() => {
      // Mock an approved LLM provider response
      aiService.setTestProviderOverride(async (prompt: string) => {
        if (prompt.includes('Attendance & Leave Policy')) {
          return 'According to Apex Academy policy, students must maintain a minimum of 75% aggregate attendance to be eligible for board examinations.';
        }
        if (prompt.includes('Admissions Criteria')) {
          return 'Admissions for 2026-2027 open on November 1, 2026 and close on January 31, 2027. Required documents include birth certificate and academic transcripts.';
        }
        return 'Information retrieved successfully.';
      });
    });

    it('2a. Grounded Q&A answers policy questions based strictly on approved documents', async () => {
      const res = await request(app)
        .post('/api/v1/ai/assistant/ask')
        .set('Authorization', `Bearer ${studentToken}`)
        .send({
          question: 'What is the minimum attendance required for final exams?',
          contextScope: 'POLICIES',
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.answer).toContain('75% aggregate attendance');
      expect(res.body.data.isMissingInformation).toBe(false);
      expect(res.body.data.groundedSources).toContain('Student Attendance & Leave Policy');
      expect(res.body.data.disclaimer).toContain('AI-generated response grounded strictly');
    });

    it('2b. Grounded Q&A answers admission deadline queries', async () => {
      const res = await request(app)
        .post('/api/v1/ai/assistant/ask')
        .set('Authorization', `Bearer ${studentToken}`)
        .send({
          question: 'When is the admission application deadline and what documents are needed?',
          contextScope: 'ADMISSIONS',
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.answer).toContain('January 31, 2027');
      expect(res.body.data.groundedSources).toContain('Admissions Criteria and Deadlines (Academic Year 2026-2027)');
    });

    it('2c. Unavailable Information: Clearly states missing information without hallucinating or inventing facts', async () => {
      const res = await request(app)
        .post('/api/v1/ai/assistant/ask')
        .set('Authorization', `Bearer ${studentToken}`)
        .send({
          question: 'What time does the Olympic swimming pool and space observatory open on Sundays?',
          contextScope: 'GENERAL',
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.isMissingInformation).toBe(true);
      expect(res.body.data.confidence).toBe('LOW');
      expect(res.body.data.answer).toContain('I could not find approved institutional records');
      expect(res.body.data.groundedSources).toEqual([]);
    });

    it('2d. Rejects invalid or empty question inputs with 422', async () => {
      const res = await request(app)
        .post('/api/v1/ai/assistant/ask')
        .set('Authorization', `Bearer ${studentToken}`)
        .send({
          question: 'Hi', // Too short (< 3 chars)
        });

      expect(res.status).toBe(422);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('VALIDATION_ERROR');
    });
  });

  describe('3. FEATURE 2: AI-Assisted Quiz Generation & Teacher Approval Workflow', () => {
    beforeEach(() => {
      // Mock valid structured JSON provider response
      aiService.setTestProviderOverride(async (_prompt: string) => {
        return JSON.stringify({
          questions: [
            {
              questionText: 'What is the SI unit of electric potential difference?',
              questionType: 'MULTIPLE_CHOICE',
              options: ['Volt', 'Ampere', 'Ohm', 'Coulomb'],
              correctAnswer: 'Volt',
              explanation: 'The SI unit of electric potential difference (voltage) is the Volt (V), defined as one joule per coulomb.',
              suggestedDifficulty: 'MEDIUM',
            },
            {
              questionText: 'State Ohm Law equation relating Voltage, Current, and Resistance.',
              questionType: 'SHORT_ANSWER',
              correctAnswer: 'V = I * R',
              explanation: 'Ohm law states that voltage is directly proportional to current multiplied by resistance.',
              suggestedDifficulty: 'EASY',
            },
          ],
        });
      });
    });

    it('3a. Unauthorized role (Student) cannot invoke AI quiz generation (403 FORBIDDEN_ROLE)', async () => {
      const res = await request(app)
        .post('/api/v1/ai/quiz/generate')
        .set('Authorization', `Bearer ${studentToken}`)
        .send({
          studyMaterial: 'Electricity and Ohm law fundamentals for Grade 10 students.',
          subject: 'Physics',
          gradeLevel: 'Grade 10',
          questionCount: 2,
        });

      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('FORBIDDEN_ROLE');
    });

    it('3b. Teacher can generate draft questions: Invariants enforced (isAiGenerated=true, reviewStatus=PENDING_REVIEW)', async () => {
      const res = await request(app)
        .post('/api/v1/ai/quiz/generate')
        .set('Authorization', `Bearer ${teacherToken}`)
        .send({
          studyMaterial: 'Electric current is the flow of electric charge. The potential difference across a conductor is measured in Volts. Ohm law relates V = I * R.',
          subject: 'Physics',
          gradeLevel: 'Grade 10',
          questionCount: 2,
          difficulty: 'MEDIUM',
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.status).toBe('DRAFT_PENDING_APPROVAL');
      expect(res.body.data.questions).toHaveLength(2);

      // Verify every question has mandatory AI flags and is pending review
      res.body.data.questions.forEach((q: any) => {
        expect(q.isAiGenerated).toBe(true);
        expect(q.reviewStatus).toBe('PENDING_REVIEW');
        expect(q.questionText).toBeTruthy();
        expect(q.correctAnswer).toBeTruthy();
        expect(q.explanation).toBeTruthy();
      });

      expect(res.body.data.disclaimer).toContain('require teacher review and approval before publication');
    });

    it('3c. Teacher can review, edit, and approve draft questions before publication', async () => {
      // 1. Generate draft
      const genRes = await request(app)
        .post('/api/v1/ai/quiz/generate')
        .set('Authorization', `Bearer ${teacherToken}`)
        .send({
          studyMaterial: 'Electric current is the flow of electric charge. Ohm law relates V = I * R.',
          subject: 'Physics',
          gradeLevel: 'Grade 10',
          questionCount: 2,
        });

      const draftId = genRes.body.data.draftId;
      const q1Id = genRes.body.data.questions[0].id;
      const q2Id = genRes.body.data.questions[1].id;

      // 2. Submit teacher review (Approve Q1 with minor edit, reject Q2)
      const reviewRes = await request(app)
        .patch(`/api/v1/ai/quiz/drafts/${draftId}/review`)
        .set('Authorization', `Bearer ${teacherToken}`)
        .send({
          reviews: [
            {
              questionId: q1Id,
              reviewStatus: 'APPROVED',
              editedQuestionText: 'What is the standard SI unit of electric potential difference (Voltage)?',
              teacherFeedback: 'Approved with clarifying terminology.',
            },
            {
              questionId: q2Id,
              reviewStatus: 'REJECTED',
              teacherFeedback: 'Too simple for Term 2 assessment.',
            },
          ],
        });

      expect(reviewRes.status).toBe(200);
      expect(reviewRes.body.success).toBe(true);
      expect(reviewRes.body.data.status).toBe('PARTIALLY_APPROVED');

      const updatedQ1 = reviewRes.body.data.questions.find((q: any) => q.id === q1Id);
      expect(updatedQ1.reviewStatus).toBe('APPROVED');
      expect(updatedQ1.questionText).toBe('What is the standard SI unit of electric potential difference (Voltage)?');

      const updatedQ2 = reviewRes.body.data.questions.find((q: any) => q.id === q2Id);
      expect(updatedQ2.reviewStatus).toBe('REJECTED');
    });
  });

  describe('4. Provider Reliability, Malformed Responses & Safety Handling', () => {
    it('4a. Handles malformed provider response with 502 MALFORMED_AI_RESPONSE', async () => {
      // Return invalid non-JSON output
      aiService.setTestProviderOverride(async () => {
        return 'Sorry, I am an AI and cannot generate questions right now.';
      });

      const res = await request(app)
        .post('/api/v1/ai/quiz/generate')
        .set('Authorization', `Bearer ${teacherToken}`)
        .send({
          studyMaterial: 'Cellular biology: Mitochondria is the powerhouse of the cell.',
          subject: 'Biology',
          gradeLevel: 'Grade 9',
          questionCount: 1,
        });

      expect(res.status).toBe(502);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('MALFORMED_AI_RESPONSE');
    });

    it('4b. Handles provider schema violation with 502 MALFORMED_AI_RESPONSE', async () => {
      // Return JSON missing required fields
      aiService.setTestProviderOverride(async () => {
        return JSON.stringify({ randomKey: 'unexpected data' });
      });

      const res = await request(app)
        .post('/api/v1/ai/quiz/generate')
        .set('Authorization', `Bearer ${teacherToken}`)
        .send({
          studyMaterial: 'Cellular biology: Mitochondria is the powerhouse of the cell.',
          subject: 'Biology',
          gradeLevel: 'Grade 9',
          questionCount: 1,
        });

      expect(res.status).toBe(502);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('MALFORMED_AI_RESPONSE');
    });

    it('4c. Handles provider network failure / outage safely', async () => {
      aiService.setTestProviderOverride(async () => {
        const err: any = new Error('Connection refused to AI backend gateway.');
        err.statusCode = 502;
        err.code = 'AI_PROVIDER_OUTAGE';
        throw err;
      });

      const res = await request(app)
        .post('/api/v1/ai/assistant/ask')
        .set('Authorization', `Bearer ${studentToken}`)
        .send({
          question: 'What is the attendance policy?',
          contextScope: 'POLICIES',
        });

      expect(res.status).toBe(502);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('AI_PROVIDER_OUTAGE');
    });

    it('4d. Multi-tenant isolation: Teacher from another school cannot access draft', async () => {
      aiService.setTestProviderOverride(async () => {
        return JSON.stringify({
          questions: [
            {
              questionText: 'Test question?',
              questionType: 'SHORT_ANSWER',
              correctAnswer: 'Answer',
              explanation: 'Explanation',
              suggestedDifficulty: 'EASY',
            },
          ],
        });
      });

      // 1. Generate draft in school-apex-01
      const genRes = await request(app)
        .post('/api/v1/ai/quiz/generate')
        .set('Authorization', `Bearer ${teacherToken}`)
        .send({
          studyMaterial: 'Sample study text with sufficient length for valid quiz generation testing.',
          subject: 'Science',
          gradeLevel: 'Grade 8',
          questionCount: 1,
        });

      const draftId = genRes.body.data.draftId;

      // 2. Teacher from another school (school-delta-02) tries to access
      const foreignTeacherToken = generateAccessToken({
        userId: 'usr-foreign-01',
        email: 'foreign.teacher@delta.edu',
        schoolId: 'school-delta-02',
        role: PlatformRole.TEACHER,
      });

      const accessRes = await request(app)
        .get(`/api/v1/ai/quiz/drafts/${draftId}`)
        .set('Authorization', `Bearer ${foreignTeacherToken}`);

      expect(accessRes.status).toBe(404); // Scoped to schoolId, returning 404 to avoid leaking draft existence
    });
  });
});
