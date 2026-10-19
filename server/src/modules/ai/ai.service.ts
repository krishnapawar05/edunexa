import { env } from '../../config/env.js';
import {
  AiProviderStatusResponse,
  SchoolInfoQueryDTO,
  SchoolInfoAnswerResponse,
  GenerateQuizDraftDTO,
  AiQuizDraftResponse,
  AiGeneratedQuestion,
  ReviewAiQuizDraftDTO,
} from '@edunexa/shared';
import { z } from 'zod';

// ============================================================================
// APPROVED INSTITUTIONAL KNOWLEDGE BASE (SYNTHETIC GROUNDING DATA)
// ============================================================================

interface GroundedDocument {
  id: string;
  category: 'ADMISSIONS' | 'POLICIES' | 'EVENTS' | 'TIMETABLES' | 'FEES';
  title: string;
  keywords: string[];
  content: string;
}

const APPROVED_SCHOOL_DOCUMENTS: GroundedDocument[] = [
  {
    id: 'doc-adm-01',
    category: 'ADMISSIONS',
    title: 'Admissions Criteria and Deadlines (Academic Year 2026-2027)',
    keywords: ['admission', 'apply', 'deadline', 'eligibility', 'documents', 'entrance', 'age'],
    content:
      'Admissions for the 2026-2027 academic session open on November 1, 2026 and close on January 31, 2027. Minimum age for Grade 1 is 6 years as of June 1, 2026. Required documents: Birth certificate, previous 2 years academic report cards, transfer certificate (TC), and immunization record. Entrance assessments are conducted for Grade 6 and above in Mathematics, English, and Science.',
  },
  {
    id: 'doc-pol-01',
    category: 'POLICIES',
    title: 'Student Attendance & Leave Policy',
    keywords: ['attendance', 'leave', 'absence', 'minimum attendance', 'medical', 'excused'],
    content:
      'Students are required to maintain a minimum of 75% aggregate attendance across each academic term to be eligible for final board examinations. Medical leaves exceeding 2 consecutive days require a valid medical practitioner certificate submitted to the homeroom teacher within 48 hours of return.',
  },
  {
    id: 'doc-pol-02',
    category: 'POLICIES',
    title: 'Uniform, Code of Conduct & Digital Device Policy',
    keywords: ['uniform', 'conduct', 'mobile', 'phone', 'discipline', 'laptop', 'device', 'bullying'],
    content:
      'Personal smartphones must be powered off and deposited in homeroom security lockers during instructional hours (8:00 AM – 3:30 PM). Laptops and tablets are permitted strictly for pedagogical use in designated labs. The institution maintains a zero-tolerance policy towards bullying, harassment, and academic dishonesty.',
  },
  {
    id: 'doc-fee-01',
    category: 'FEES',
    title: 'Institutional Fee Schedules & Concessions',
    keywords: ['fee', 'tuition', 'payment', 'due date', 'concession', 'scholarship', 'refund', 'installments'],
    content:
      'Tuition fees are structured on a quarterly basis: Primary Wing (Grades 1-5): ₹28,000/quarter; Middle Wing (Grades 6-8): ₹38,000/quarter; Senior Secondary (Grades 9-12): ₹45,000/quarter. Term 2 fee payment deadline is October 15, 2026. Merit-based fee concessions (up to 25%) are available for students scoring >95% in aggregate board exams upon application to the Accounts Office.',
  },
  {
    id: 'doc-evt-01',
    category: 'EVENTS',
    title: 'Annual Academic & Cultural Calendar 2026',
    keywords: ['event', 'sports day', 'annual day', 'science exhibition', 'vacation', 'holidays', 'diwali', 'winter break'],
    content:
      'Key upcoming events for Term 2: Annual Science & Robotics Exhibition on November 14, 2026; Inter-House Athletics & Sports Meet on December 5, 2026. Winter vacation commences on December 24, 2026 and school reopens on January 4, 2027.',
  },
  {
    id: 'doc-time-01',
    category: 'TIMETABLES',
    title: 'Instructional Timings & Examination Blocks',
    keywords: ['timetable', 'timing', 'periods', 'exam schedule', 'midterm', 'bell schedule', 'duration'],
    content:
      'Regular school hours are Monday through Friday from 8:00 AM to 3:30 PM, comprising eight 45-minute instructional periods. Term 2 Mid-Term Examinations are scheduled from November 20 to November 28, 2026. Examination sessions run from 9:00 AM to 12:00 PM in the Main Examination Hall.',
  },
];

// Zod Schema to validate provider response for Quiz Generation
const ProviderQuizResponseSchema = z.object({
  questions: z.array(
    z.object({
      questionText: z.string().min(5),
      questionType: z.enum(['MULTIPLE_CHOICE', 'SHORT_ANSWER', 'TRUE_FALSE']),
      options: z.array(z.string()).optional(),
      correctAnswer: z.string().min(1),
      explanation: z.string().min(5),
      suggestedDifficulty: z.enum(['EASY', 'MEDIUM', 'HARD']),
    })
  ).min(1),
});

export class AiService {
  // In-memory store for generated drafts
  private drafts: Map<string, AiQuizDraftResponse> = new Map();

  // Rate-limiting map: userId -> timestamps array
  private rateLimitMap: Map<string, number[]> = new Map();

  // Test provider hook: allows tests to inject mock responses or force errors
  private testProviderOverride: ((prompt: string) => Promise<string>) | null = null;

  /**
   * Set custom provider override for deterministic unit testing
   */
  public setTestProviderOverride(override: ((prompt: string) => Promise<string>) | null) {
    this.testProviderOverride = override;
  }

  /**
   * Check if AI provider API key is configured
   */
  public isProviderConfigured(): boolean {
    return !!(this.testProviderOverride || (env.aiProviderApiKey && env.aiProviderApiKey.trim().length > 0));
  }

  /**
   * Returns current AI provider configuration status
   */
  public getStatus(): AiProviderStatusResponse {
    const configured = this.isProviderConfigured();
    return {
      isConfigured: configured,
      provider: configured ? 'Google Gemini' : 'None (Unconfigured)',
      model: env.aiProviderModel || 'gemini-2.0-flash',
      message: configured
        ? 'AI provider is configured and available for grounded school assistance and quiz draft generation.'
        : 'AI provider is not configured. Please configure AI_PROVIDER_API_KEY in the server environment to enable live AI features.',
      supportedFeatures: {
        schoolInformationAssistant: configured,
        aiQuizGeneration: configured,
      },
    };
  }

  /**
   * Check user rate limit (max 10 requests per minute)
   */
  private checkRateLimit(userId: string) {
    const now = Date.now();
    const windowMs = 60000;
    const maxRequests = 10;

    const timestamps = this.rateLimitMap.get(userId) || [];
    const recent = timestamps.filter((t) => now - t < windowMs);

    if (recent.length >= maxRequests) {
      const err: any = new Error('Rate limit exceeded for AI operations. Maximum 10 requests per minute.');
      err.statusCode = 429;
      err.code = 'RATE_LIMIT_EXCEEDED';
      throw err;
    }

    recent.push(now);
    this.rateLimitMap.set(userId, recent);
  }

  /**
   * FEATURE 1: SCHOOL INFORMATION ASSISTANT
   * Answers questions using approved school information with strict grounding
   */
  public async askSchoolAssistant(
    userId: string,
    schoolId: string,
    query: SchoolInfoQueryDTO
  ): Promise<SchoolInfoAnswerResponse> {
    this.checkRateLimit(userId);

    // If provider is not configured, return honest 503 error
    if (!this.isProviderConfigured()) {
      const err: any = new Error(
        'AI Provider is not configured on this server. To enable the School Information Assistant, please set AI_PROVIDER_API_KEY in server/.env.'
      );
      err.statusCode = 503;
      err.code = 'AI_PROVIDER_NOT_CONFIGURED';
      throw err;
    }

    const qLower = query.question.toLowerCase().trim();

    // 1. Grounding Search against approved documents
    const matchingDocs = APPROVED_SCHOOL_DOCUMENTS.filter((doc) => {
      if (query.contextScope !== 'GENERAL' && doc.category !== query.contextScope) {
        return false;
      }
      return doc.keywords.some((kw) => qLower.includes(kw)) || doc.content.toLowerCase().includes(qLower);
    });

    // 2. Unavailable Information check: If no approved document matches, DO NOT HALLUCINATE
    if (matchingDocs.length === 0) {
      return {
        question: query.question,
        answer:
          'I could not find approved institutional records regarding your inquiry. In accordance with EduNexa policy, I do not generate unverified information. Please contact the School Administration Office directly at admissions@apexacademy.edu or frontdesk@apexacademy.edu for verified guidance.',
        groundedSources: [],
        isMissingInformation: true,
        confidence: 'LOW',
        timestamp: new Date().toISOString(),
        disclaimer:
          'AI-generated response grounded strictly in approved institutional policies. Verify critical academic decisions with administration.',
        model: env.aiProviderModel || 'gemini-2.0-flash',
      };
    }

    // 3. Grounded Context Construction
    const groundedContext = matchingDocs.map((d) => `[Document: ${d.title}]\n${d.content}`).join('\n\n');
    const groundedSources = matchingDocs.map((d) => d.title);

    const prompt = `You are the EduNexa School Information Assistant for school tenant "${schoolId}".
Ground your answers STRICTLY in the following APPROVED INSTITUTIONAL RECORDS:
----------------------------------------
${groundedContext}
----------------------------------------
User Question: "${query.question}"

RULES:
1. Only answer based on the facts explicitly stated above.
2. If the question asks for information not present in the records above, say: "The approved institutional records do not contain this information."
3. Do not assume or extrapolate. Keep the answer professional, concise, and helpful.`;

    // 4. Call Provider (with timeout and error handling)
    const rawAnswer = await this.callAiProvider(prompt);

    return {
      question: query.question,
      answer: rawAnswer.trim(),
      groundedSources,
      isMissingInformation: false,
      confidence: 'HIGH',
      timestamp: new Date().toISOString(),
      disclaimer:
        'AI-generated response grounded strictly in approved institutional policies. Verify critical academic decisions with administration.',
      model: env.aiProviderModel || 'gemini-2.0-flash',
    };
  }

  /**
   * FEATURE 2: AI-ASSISTED QUIZ GENERATION
   * Generates draft quiz questions from study materials with teacher approval requirement
   */
  public async generateQuizDraft(
    teacherId: string,
    schoolId: string,
    dto: GenerateQuizDraftDTO
  ): Promise<AiQuizDraftResponse> {
    this.checkRateLimit(teacherId);

    // If provider is not configured, return honest 503 error
    if (!this.isProviderConfigured()) {
      const err: any = new Error(
        'AI Provider is not configured on this server. To enable AI-Assisted Quiz Generation, please set AI_PROVIDER_API_KEY in server/.env.'
      );
      err.statusCode = 503;
      err.code = 'AI_PROVIDER_NOT_CONFIGURED';
      throw err;
    }

    // Construct prompt instructing JSON output
    const prompt = `You are the EduNexa Pedagogical Quiz Assistant.
Generate ${dto.questionCount} curriculum-aligned quiz questions based STRICTLY on the following approved study materials:
Subject: ${dto.subject}
Grade Level: ${dto.gradeLevel}
Target Difficulty: ${dto.difficulty}

Study Material:
"""
${dto.studyMaterial}
"""

Output MUST be a valid JSON object matching this schema:
{
  "questions": [
    {
      "questionText": "Question string",
      "questionType": "MULTIPLE_CHOICE" | "SHORT_ANSWER" | "TRUE_FALSE",
      "options": ["Option A", "Option B", "Option C", "Option D"] (required if MULTIPLE_CHOICE),
      "correctAnswer": "Exact correct answer string",
      "explanation": "Clear pedagogical explanation of why this answer is correct",
      "suggestedDifficulty": "${dto.difficulty}"
    }
  ]
}

Respond ONLY with valid JSON. Do not wrap in markdown backticks or commentary.`;

    const rawResponse = await this.callAiProvider(prompt);

    // Parse and validate provider JSON response
    let parsedJson: any;
    try {
      // Strip markdown code fences if provider wraps output in ```json ... ```
      const cleaned = rawResponse.replace(/```json/gi, '').replace(/```/g, '').trim();
      parsedJson = JSON.parse(cleaned);
    } catch (parseErr) {
      const err: any = new Error('AI provider returned a non-JSON or malformed response.');
      err.statusCode = 502;
      err.code = 'MALFORMED_AI_RESPONSE';
      throw err;
    }

    const validation = ProviderQuizResponseSchema.safeParse(parsedJson);
    if (!validation.success) {
      const err: any = new Error('AI provider response failed schema validation: ' + validation.error.message);
      err.statusCode = 502;
      err.code = 'MALFORMED_AI_RESPONSE';
      throw err;
    }

    const draftId = `draft-quiz-${Date.now()}-${Math.floor(Math.random() * 1000)}`;

    const questions: AiGeneratedQuestion[] = validation.data.questions.map((q, idx) => ({
      id: `${draftId}-q${idx + 1}`,
      questionText: q.questionText,
      questionType: q.questionType,
      options: q.options,
      correctAnswer: q.correctAnswer,
      explanation: q.explanation,
      suggestedDifficulty: q.suggestedDifficulty,
      isAiGenerated: true, // Invariant: Identified as AI-generated
      reviewStatus: 'PENDING_REVIEW', // Invariant: Requires teacher review before publication
    }));

    const draftRecord: AiQuizDraftResponse = {
      draftId,
      schoolId,
      teacherId,
      subject: dto.subject,
      gradeLevel: dto.gradeLevel,
      questions,
      createdAt: new Date().toISOString(),
      status: 'DRAFT_PENDING_APPROVAL',
      disclaimer: 'AI-generated draft questions require teacher review and approval before publication to students.',
      model: env.aiProviderModel || 'gemini-2.0-flash',
    };

    this.drafts.set(draftId, draftRecord);
    return draftRecord;
  }

  /**
   * Teacher Review & Approval of AI-generated questions
   */
  public reviewQuizDraft(
    teacherId: string,
    schoolId: string,
    draftId: string,
    dto: ReviewAiQuizDraftDTO
  ): AiQuizDraftResponse {
    const draft = this.drafts.get(draftId);
    if (!draft) {
      const err: any = new Error(`Quiz draft ${draftId} not found.`);
      err.statusCode = 404;
      err.code = 'DRAFT_NOT_FOUND';
      throw err;
    }

    if (draft.schoolId !== schoolId) {
      const err: any = new Error('Cross-tenant draft access forbidden.');
      err.statusCode = 403;
      err.code = 'FORBIDDEN_TENANT_ACCESS';
      throw err;
    }

    // Apply teacher reviews
    for (const review of dto.reviews) {
      const question = draft.questions.find((q) => q.id === review.questionId);
      if (question) {
        question.reviewStatus = review.reviewStatus;
        if (review.editedQuestionText) question.questionText = review.editedQuestionText;
        if (review.editedOptions) question.options = review.editedOptions;
        if (review.editedCorrectAnswer) question.correctAnswer = review.editedCorrectAnswer;
        if (review.teacherFeedback) question.teacherFeedback = review.teacherFeedback;
      }
    }

    // Determine overall draft status
    const allApproved = draft.questions.every((q) => q.reviewStatus === 'APPROVED');
    const anyApproved = draft.questions.some((q) => q.reviewStatus === 'APPROVED');

    if (allApproved) {
      draft.status = 'FULLY_APPROVED';
    } else if (anyApproved) {
      draft.status = 'PARTIALLY_APPROVED';
    } else {
      draft.status = 'DRAFT_PENDING_APPROVAL';
    }

    this.drafts.set(draftId, draft);
    return draft;
  }

  /**
   * Get draft by ID
   */
  public getQuizDraft(schoolId: string, draftId: string): AiQuizDraftResponse {
    const draft = this.drafts.get(draftId);
    if (!draft || draft.schoolId !== schoolId) {
      const err: any = new Error(`Quiz draft ${draftId} not found.`);
      err.statusCode = 404;
      err.code = 'DRAFT_NOT_FOUND';
      throw err;
    }
    return draft;
  }

  /**
   * Internal low-level provider caller with timeouts and error wrapping
   */
  private async callAiProvider(prompt: string): Promise<string> {
    // Check if test override is registered
    if (this.testProviderOverride) {
      return this.testProviderOverride(prompt);
    }

    const apiKey = env.aiProviderApiKey;
    if (!apiKey) {
      const err: any = new Error('AI provider API key not configured.');
      err.statusCode = 503;
      err.code = 'AI_PROVIDER_NOT_CONFIGURED';
      throw err;
    }

    const model = env.aiProviderModel || 'gemini-2.0-flash';
    const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 8000); // 8 second timeout

    try {
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: [
            {
              role: 'user',
              parts: [{ text: prompt }],
            },
          ],
          generationConfig: {
            temperature: 0.2,
            maxOutputTokens: 2048,
          },
        }),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        const errorText = await response.text();
        const err: any = new Error(`AI provider error (${response.status}): ${response.statusText}`);
        err.statusCode = 502;
        err.code = 'AI_PROVIDER_OUTAGE';
        throw err;
      }

      const json: any = await response.json();
      const text = json?.candidates?.[0]?.content?.parts?.[0]?.text;
      if (!text) {
        const err: any = new Error('AI provider returned an empty or malformed candidate payload.');
        err.statusCode = 502;
        err.code = 'MALFORMED_AI_RESPONSE';
        throw err;
      }

      return text;
    } catch (error: any) {
      clearTimeout(timeoutId);
      if (error.name === 'AbortError') {
        const err: any = new Error('AI provider request timed out after 8000ms.');
        err.statusCode = 504;
        err.code = 'AI_PROVIDER_TIMEOUT';
        throw err;
      }
      if (error.statusCode) throw error;

      const err: any = new Error('Failed to communicate with AI provider: ' + error.message);
      err.statusCode = 502;
      err.code = 'AI_PROVIDER_FAILURE';
      throw err;
    }
  }
}

export const aiService = new AiService();
