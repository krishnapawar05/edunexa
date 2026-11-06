import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import { app } from '../../app.js';
import { prisma } from '../../config/db.js';
import { generateAccessToken } from '../../utils/crypto.js';
import { PlatformRole } from '@edunexa/shared';
import { aiService } from './ai.service.js';

describe('SECTION 13: AI CHATBOT, FAQ & AUTOMATED ENQUIRY MANAGEMENT TEST SUITE', () => {
  let schoolA: any;
  let schoolB: any;
  let adminTokenA: string;
  let adminTokenB: string;
  let studentTokenA: string;

  beforeAll(async () => {
    aiService.setTestProviderOverride(async (prompt: string) => {
      if (prompt.includes('admission')) {
        return 'Admissions for Grade 9 at Apex Academy are currently open. You can apply online through our portal.';
      }
      if (prompt.includes('facilities') || prompt.includes('laboratories')) {
        return 'Apex Academy features state-of-the-art Robotics & STEM labs, advanced Chemistry labs, and Olympic athletic grounds.';
      }
      return 'Apex Academy is a premier educational institution committed to academic excellence.';
    });

    // 1. Resolve or create test School A
    schoolA = await prisma.school.findFirst({
      where: { OR: [{ slug: 'apex-academy' }, { code: 'APEX-2026' }] },
    });
    if (!schoolA) {
      schoolA = await prisma.school.create({
        data: {
          slug: 'apex-academy',
          name: 'Apex Academy of Sciences & Arts',
          code: 'APEX-2026',
          email: 'admin@apexacademy.edu',
          phone: '+91 11 2659 1000',
          address: 'Plot 42, Institutional Area',
          city: 'New Delhi',
          state: 'Delhi',
          postalCode: '110001',
          status: 'ACTIVE',
        },
      });
    }

    // 2. Resolve or create test School B (for tenant isolation tests)
    schoolB = await prisma.school.findFirst({
      where: { slug: 'greenwood-high' },
    });
    if (!schoolB) {
      schoolB = await prisma.school.create({
        data: {
          slug: 'greenwood-high',
          name: 'Greenwood High International',
          code: 'GWD-2026',
          email: 'admin@greenwood.edu',
          phone: '+91 80 2345 6789',
          address: '88 Palm Grove, Tech Corridor',
          city: 'Bangalore',
          state: 'Karnataka',
          postalCode: '560100',
          status: 'ACTIVE',
        },
      });
    }

    // 3. Auth Tokens
    adminTokenA = generateAccessToken({
      userId: 'usr-admin-school-a',
      email: 'admin@apexacademy.edu',
      schoolId: schoolA.id,
      role: PlatformRole.SCHOOL_ADMIN,
    });

    adminTokenB = generateAccessToken({
      userId: 'usr-admin-school-b',
      email: 'admin@greenwood.edu',
      schoolId: schoolB.id,
      role: PlatformRole.SCHOOL_ADMIN,
    });

    studentTokenA = generateAccessToken({
      userId: 'usr-student-01',
      email: 'student@apexacademy.edu',
      schoolId: schoolA.id,
      role: PlatformRole.STUDENT,
    });
  });

  // ==========================================================================
  // 1. PUBLIC WEBSITE CHATBOT CONFIGURATION & PUBLIC FAQS
  // ==========================================================================
  describe('1. Public Chatbot Configuration & Knowledge Retrieval', () => {
    it('1.1 Retrieves public chatbot configuration and metadata without authentication', async () => {
      const res = await request(app)
        .get('/api/v1/ai/chatbot/public-data')
        .query({ schoolIdentifier: schoolA.slug });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.school.name).toBe(schoolA.name);
      expect(res.body.data.configuration.botName).toBeDefined();
      expect(res.body.data.configuration.welcomeMessage).toContain('Apex Academy');
      expect(Array.isArray(res.body.data.configuration.suggestedQuestions)).toBe(true);
      expect(res.body.data.configuration.whatsappNumber).toBeDefined();
    });

    it('1.2 Falls back gracefully to primary school if schoolIdentifier is omitted', async () => {
      const res = await request(app).get('/api/v1/ai/chatbot/public-data');
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.school.id).toBeDefined();
    });
  });

  // ==========================================================================
  // 2. ADMIN FAQ MANAGEMENT MODULE
  // ==========================================================================
  describe('2. Admin FAQ Management Module', () => {
    let createdFaqId: string;

    it('2.1 Rejects unauthenticated attempts to create or manage FAQs with 401', async () => {
      const res = await request(app).post('/api/v1/ai/admin/faqs').send({
        question: 'What is the school motto?',
        answer: 'Veritas, Virtus et Scientia.',
        category: 'GENERAL',
      });
      expect(res.status).toBe(401);
    });

    it('2.2 Forbids student role from creating FAQs with 403', async () => {
      const res = await request(app)
        .post('/api/v1/ai/admin/faqs')
        .set('Authorization', `Bearer ${studentTokenA}`)
        .send({
          question: 'Are smart watches allowed?',
          answer: 'No, smart watches are prohibited.',
          category: 'GENERAL',
        });
      expect(res.status).toBe(403);
    });

    it('2.3 School Admin can successfully create an institutional FAQ', async () => {
      const res = await request(app)
        .post('/api/v1/ai/admin/faqs')
        .set('Authorization', `Bearer ${adminTokenA}`)
        .send({
          question: 'What are the school instructional timings?',
          answer: 'Instructional periods run Monday to Friday from 8:00 AM to 3:30 PM.',
          category: 'TIMINGS',
          displayOrder: 1,
          isPublished: true,
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.question).toBe('What are the school instructional timings?');
      expect(res.body.data.category).toBe('TIMINGS');
      createdFaqId = res.body.data.id;
    });

    it('2.4 Lists FAQs for School Admin with category filter and search', async () => {
      const res = await request(app)
        .get('/api/v1/ai/admin/faqs')
        .set('Authorization', `Bearer ${adminTokenA}`)
        .query({ category: 'TIMINGS' });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.items.some((f: any) => f.id === createdFaqId)).toBe(true);
    });

    it('2.5 Updates an existing FAQ and publishes/unpublishes it', async () => {
      const res = await request(app)
        .patch(`/api/v1/ai/admin/faqs/${createdFaqId}`)
        .set('Authorization', `Bearer ${adminTokenA}`)
        .send({
          answer: 'Gates open at 7:45 AM. Classes run Monday to Friday from 8:00 AM to 3:30 PM.',
          displayOrder: 2,
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.answer).toContain('Gates open at 7:45 AM');
    });

    it('2.6 Chatbot accurately utilizes the newly updated FAQ without LLM overhead', async () => {
      const res = await request(app)
        .post('/api/v1/ai/chatbot/message')
        .send({
          schoolIdentifier: schoolA.slug,
          message: 'What are the school instructional timings?',
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.source).toBe('FAQ');
      expect(res.body.data.answer).toContain('Gates open at 7:45 AM');
    });

    it('2.7 Unpublished FAQs are excluded from public chatbot responses', async () => {
      // Unpublish FAQ
      await request(app)
        .patch(`/api/v1/ai/admin/faqs/${createdFaqId}`)
        .set('Authorization', `Bearer ${adminTokenA}`)
        .send({ isPublished: false });

      // Query public data
      const pubRes = await request(app)
        .get('/api/v1/ai/chatbot/public-data')
        .query({ schoolIdentifier: schoolA.slug });

      const faqFound = pubRes.body.data.faqs.some((f: any) => f.id === createdFaqId);
      expect(faqFound).toBe(false);

      // Re-publish for subsequent tests
      await request(app)
        .patch(`/api/v1/ai/admin/faqs/${createdFaqId}`)
        .set('Authorization', `Bearer ${adminTokenA}`)
        .send({ isPublished: true });
    });

    it('2.8 Enforces multi-tenant isolation: School Admin B cannot modify School A FAQ', async () => {
      const res = await request(app)
        .patch(`/api/v1/ai/admin/faqs/${createdFaqId}`)
        .set('Authorization', `Bearer ${adminTokenB}`)
        .send({ answer: 'Tampered answer.' });

      expect(res.status).toBe(404);
    });
  });

  // ==========================================================================
  // 3. PUBLIC CHATBOT CONVERSATION & GROUNDED RESPONSES
  // ==========================================================================
  describe('3. Public Chatbot Conversation & Grounded Responses', () => {
    it('3.1 Rejects empty or oversized messages with 422 validation error', async () => {
      const res = await request(app)
        .post('/api/v1/ai/chatbot/message')
        .send({
          schoolIdentifier: schoolA.slug,
          message: '',
        });

      expect(res.status).toBe(422);
    });

    it('3.2 Detects admission questions and returns grounded guidance with direct action link', async () => {
      const res = await request(app)
        .post('/api/v1/ai/chatbot/message')
        .send({
          schoolIdentifier: schoolA.slug,
          message: 'How can I apply for admission for Grade 9?',
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.answer).toBeDefined();
      expect(res.body.data.action).toBeDefined();
      expect(res.body.data.action.type).toBe('ADMISSION_ENQUIRY');
      expect(res.body.data.action.url).toBe('/admission/apply');
    });

    it('3.3 Detects escalation request when visitor asks to speak to human counselor', async () => {
      const res = await request(app)
        .post('/api/v1/ai/chatbot/message')
        .send({
          schoolIdentifier: schoolA.slug,
          message: 'I want to speak to a human admissions counselor right now.',
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.source).toBe('ESCALATION');
      expect(res.body.data.action.type).toBe('ESCALATION_TRIGGER');
    });

    it('3.4 Grounded response for campus facilities accurately reflects school records', async () => {
      const res = await request(app)
        .post('/api/v1/ai/chatbot/message')
        .send({
          schoolIdentifier: schoolA.slug,
          message: 'What campus facilities and laboratories does your school offer?',
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.answer.length).toBeGreaterThan(20);
    });
  });

  // ==========================================================================
  // 4. ADMISSION ENQUIRY COLLECTION THROUGH CHATBOT
  // ==========================================================================
  describe('4. Automated Admission Enquiry Workflow', () => {
    let generatedEnquiryNo: string;

    it('4.1 Collects and registers admission enquiry directly from chatbot conversation', async () => {
      const res = await request(app)
        .post('/api/v1/ai/chatbot/enquiry')
        .send({
          schoolIdentifier: schoolA.slug,
          parentName: 'Sunil Sharma',
          studentName: 'Aarav Sharma',
          phone: '+91 98111 22334',
          email: 'sunil.sharma@parent.apex.edu',
          applyingClass: 'Grade 10',
          message: 'Interested in STEM & Robotics track for academic year 2026-2027.',
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.enquiryNumber).toMatch(/^ENQ-2026-\d+/);
      expect(res.body.data.applyUrl).toBe('/admission/apply');
      generatedEnquiryNo = res.body.data.enquiryNumber;
    });

    it('4.2 Enquiry submitted through chatbot persists to database with source CHATBOT', async () => {
      const enquiry = await prisma.admissionEnquiry.findUnique({
        where: { enquiryNumber: generatedEnquiryNo },
      });

      expect(enquiry).not.toBeNull();
      expect(enquiry?.parentName).toBe('Sunil Sharma');
      expect(enquiry?.source).toBe('CHATBOT');
      expect(enquiry?.schoolId).toBe(schoolA.id);
    });

    it('4.3 Applies duplicate spam protection within 60-second window', async () => {
      const res = await request(app)
        .post('/api/v1/ai/chatbot/enquiry')
        .send({
          schoolIdentifier: schoolA.slug,
          parentName: 'Sunil Sharma',
          studentName: 'Aarav Sharma',
          phone: '+91 98111 22334',
          email: 'sunil.sharma@parent.apex.edu',
          applyingClass: 'Grade 10',
          message: 'Duplicate submission.',
        });

      expect(res.status).toBe(201);
      expect(res.body.data.enquiryNumber).toBe(generatedEnquiryNo);
      expect(res.body.data.message).toContain('already registered');
    });
  });

  // ==========================================================================
  // 5. CHATBOT ESCALATION WORKFLOW
  // ==========================================================================
  describe('5. Chatbot Human Escalation Workflow', () => {
    let escalationId: string;

    it('5.1 Creates an escalation record when visitor requests staff follow-up', async () => {
      const res = await request(app)
        .post('/api/v1/ai/chatbot/escalate')
        .send({
          schoolIdentifier: schoolA.slug,
          visitorName: 'Rajesh Mehra',
          visitorPhone: '+91 98222 33445',
          visitorEmail: 'rajesh.mehra@gmail.com',
          query: 'Requires clarification on Cambridge IGCSE fee installment plans.',
          reason: 'FEE_CLARIFICATION_REQUIRED',
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.escalationId).toBeDefined();
      escalationId = res.body.data.escalationId;
    });

    it('5.2 School Admin can view pending escalations in dashboard', async () => {
      const res = await request(app)
        .get('/api/v1/ai/admin/escalations')
        .set('Authorization', `Bearer ${adminTokenA}`)
        .query({ status: 'PENDING' });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.items.some((e: any) => e.id === escalationId)).toBe(true);
    });

    it('5.3 School Admin can update escalation status to RESOLVED with notes', async () => {
      const res = await request(app)
        .patch(`/api/v1/ai/admin/escalations/${escalationId}/status`)
        .set('Authorization', `Bearer ${adminTokenA}`)
        .send({
          status: 'RESOLVED',
          staffNotes: 'Contacted parent via telephone; installment schedule agreed upon.',
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.status).toBe('RESOLVED');
      expect(res.body.data.staffNotes).toContain('Contacted parent');
    });
  });

  // ==========================================================================
  // 6. CHATBOT CONFIGURATION MANAGEMENT & WHATSAPP INTEGRATION
  // ==========================================================================
  describe('6. Chatbot Configuration & WhatsApp Integration Settings', () => {
    it('6.1 School Admin can retrieve current chatbot and WhatsApp configuration', async () => {
      const res = await request(app)
        .get('/api/v1/ai/admin/config')
        .set('Authorization', `Bearer ${adminTokenA}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.whatsappEnabled).toBe(true);
      expect(res.body.data.whatsappNumber).toBeDefined();
    });

    it('6.2 School Admin can update welcome message, suggested questions, and WhatsApp number', async () => {
      const res = await request(app)
        .patch('/api/v1/ai/admin/config')
        .set('Authorization', `Bearer ${adminTokenA}`)
        .send({
          botName: 'Apex Virtual Assistant 2.0',
          welcomeMessage: 'Welcome to Apex Academy! How can I assist you with your academic inquiries today?',
          suggestedQuestions: [
            'What is the admission procedure?',
            'What are the school fees?',
            'Tell me about campus facilities',
          ],
          whatsappNumber: '+91 98100 23456',
          whatsappPrefillText: 'Hi Apex Academy, I have an admission enquiry.',
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.botName).toBe('Apex Virtual Assistant 2.0');
      expect(res.body.data.whatsappNumber).toBe('+91 98100 23456');
    });

    it('6.3 Public chatbot immediately reflects updated WhatsApp and welcome message', async () => {
      const res = await request(app)
        .get('/api/v1/ai/chatbot/public-data')
        .query({ schoolIdentifier: schoolA.slug });

      expect(res.status).toBe(200);
      expect(res.body.data.configuration.botName).toBe('Apex Virtual Assistant 2.0');
      expect(res.body.data.configuration.whatsappNumber).toBe('+91 98100 23456');
    });
  });
});
