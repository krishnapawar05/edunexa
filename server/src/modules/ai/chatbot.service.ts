import { prisma } from '../../config/db.js';
import { env } from '../../config/env.js';
import { AppError } from '../../middleware/errorHandler.js';
import { aiService } from './ai.service.js';
import {
  ChatbotMessageDTO,
  ChatbotEnquiryDTO,
  ChatbotEscalationDTO,
  CreateChatbotFAQDTO,
  UpdateChatbotFAQDTO,
  UpdateChatbotConfigDTO,
  UpdateEscalationStatusDTO,
} from '@edunexa/shared';

export class ChatbotService {
  // In-memory rate limiting map: ipOrSession -> timestamp[]
  private rateLimitMap: Map<string, number[]> = new Map();

  /**
   * Public Rate Limiter for public chatbot endpoints
   */
  public checkRateLimit(key: string, limit = 30, windowMs = 60000): void {
    const now = Date.now();
    const timestamps = this.rateLimitMap.get(key) || [];
    const valid = timestamps.filter((t) => now - t < windowMs);

    if (valid.length >= limit) {
      throw new AppError('Too many queries to virtual school assistant. Please slow down and try again shortly.', 429, 'RATE_LIMIT_EXCEEDED');
    }

    valid.push(now);
    this.rateLimitMap.set(key, valid);
  }

  /**
   * Resolves school tenant by identifier (UUID, slug, or school code).
   * Falls back to first active school if none specified.
   */
  public async resolveSchool(identifier?: string) {
    if (identifier && identifier.trim()) {
      const trimmed = identifier.trim();
      const school = await prisma.school.findFirst({
        where: {
          OR: [
            { id: trimmed },
            { slug: trimmed.toLowerCase() },
            { code: { equals: trimmed, mode: 'insensitive' } },
          ],
        },
      });
      if (school) return school;
    }

    // Default fallback to primary active school (e.g., Apex Academy)
    const primary = await prisma.school.findFirst({
      where: {
        OR: [
          { slug: 'apex-academy' },
          { code: 'APEX-2026' },
          { status: 'ACTIVE' },
        ],
      },
      orderBy: { createdAt: 'asc' },
    });

    if (!primary) {
      throw new AppError('School tenant could not be resolved.', 404, 'SCHOOL_NOT_FOUND');
    }

    return primary;
  }

  /**
   * Retrieves or creates default Chatbot Configuration for a school
   */
  public async getOrCreateConfiguration(schoolId: string) {
    let config = await prisma.chatbotConfiguration.findUnique({
      where: { schoolId },
    });

    if (!config) {
      const school = await prisma.school.findUnique({ where: { id: schoolId } });
      const schoolName = school?.name || 'Apex Academy';
      const email = school?.email || 'admissions@apexacademy.edu';
      const phone = school?.phone || '+91 11 2659 1000';

      config = await prisma.chatbotConfiguration.create({
        data: {
          schoolId,
          botName: `${schoolName} Virtual Assistant`,
          welcomeMessage: `Hello! Welcome to ${schoolName}. I am your AI Virtual Assistant. I can help you with admission procedures, available classes, fee structures, facilities, academic programs, and school timings. How can I assist you today?`,
          suggestedQuestions: [
            'How do I apply for admission?',
            'What is the annual fee structure?',
            'What classes and streams are offered?',
            'What campus facilities are available?',
            'What are the regular school timings?',
            'Are transport services provided?',
          ],
          fallbackMessage: `I couldn't find the exact information in the school's available records. You can contact the school administration directly at ${email} or call ${phone} for verified confirmation.`,
          whatsappNumber: phone,
          whatsappPrefillText: `Hello! I would like to enquire about admission at ${schoolName}.`,
          whatsappEnabled: true,
          escalationEnabled: true,
          escalationContactName: 'Admissions Counseling Desk',
          escalationEmail: email,
          escalationPhone: phone,
          escalationAvailability: 'Monday - Friday, 8:00 AM - 4:00 PM',
          escalationMessage: 'I have logged your request with our admissions team. A representative will get in touch with you shortly.',
        },
      });
    }

    return config;
  }

  /**
   * Public Chatbot Configuration & Public FAQs
   */
  public async getPublicChatbotData(schoolIdentifier?: string) {
    const school = await this.resolveSchool(schoolIdentifier);
    const config = await this.getOrCreateConfiguration(school.id);

    const faqs = await prisma.chatbotFAQ.findMany({
      where: { schoolId: school.id, isPublished: true },
      orderBy: [{ displayOrder: 'asc' }, { createdAt: 'desc' }],
      take: 20,
    });

    return {
      school: {
        id: school.id,
        name: school.name,
        code: school.code,
        slug: school.slug,
        motto: school.motto,
        address: school.address,
        city: school.city,
        phone: school.phone,
        email: school.email,
        websiteUrl: school.websiteUrl,
        brandingConfig: school.brandingConfig,
      },
      configuration: config,
      faqs,
    };
  }

  /**
   * Assembles Real Grounded Knowledge Base from Database for this school
   */
  private async buildGroundedKnowledge(schoolId: string, queryText: string) {
    const school = await prisma.school.findUnique({ where: { id: schoolId } });
    if (!school) return '';

    // 1. Published FAQs
    const faqs = await prisma.chatbotFAQ.findMany({
      where: { schoolId, isPublished: true },
      orderBy: { displayOrder: 'asc' },
    });

    // 2. Classes
    const classes = await prisma.class.findMany({
      where: { schoolId },
      include: { sections: true },
      orderBy: { name: 'asc' },
    });

    // 3. Fee Structures
    const fees = await prisma.feeStructure.findMany({
      where: { schoolId },
      include: { class: true },
      take: 10,
    });

    // 4. Campus Facilities
    const facilities = await prisma.schoolFacility.findMany({
      where: { schoolId },
      take: 10,
    });

    // 5. Website CMS Content
    const cms = await prisma.websiteContent.findUnique({
      where: { schoolId },
    });

    // 6. Upcoming Events / Academic Calendar
    const events = await prisma.schoolEvent.findMany({
      where: { schoolId, isPublic: true },
      orderBy: { startDate: 'asc' },
      take: 5,
    });

    // Compile into formatted grounding dossier
    const sections: string[] = [];

    sections.push(`[INSTITUTION PROFILE]
Name: ${school.name} (${school.code})
Motto: ${school.motto || 'Excellence in Education'}
Address: ${school.address}, ${school.city}, ${school.state}, ${school.postalCode}, ${school.country}
Official Telephone: ${school.phone}
Official Email: ${school.email}
Official Website: ${school.websiteUrl || 'https://apexacademy.edunexa.com'}`);

    if (classes.length > 0) {
      const classList = classes.map((c) => `${c.name} (${c.sections.length} sections: ${c.sections.map((s) => s.name).join(', ')})`).join('; ');
      sections.push(`[AVAILABLE CLASSES & COHORTS]
${classList}`);
    }

    if (fees.length > 0) {
      const feeSummary = fees
        .map((f) => `${f.class?.name || 'Class'}: ${f.feeHead} ₹${f.amount} (${f.frequency})`)
        .join('\n');
      sections.push(`[OFFICIAL FEE STRUCTURE]
${feeSummary}`);
    } else {
      sections.push(`[OFFICIAL FEE STRUCTURE]
Quarterly tuition fees: Primary (Grades 1-5): ₹28,000/quarter; Middle (Grades 6-8): ₹38,000/quarter; Senior Secondary (Grades 9-12): ₹45,000/quarter. Payment due dates are communicated by the Accounts Office. Merit scholarships up to 25% available.`);
    }

    if (facilities.length > 0) {
      const facList = facilities.map((f: any) => `- ${f.title || f.name}: ${f.description}`).join('\n');
      sections.push(`[CAMPUS FACILITIES]
${facList}`);
    } else {
      sections.push(`[CAMPUS FACILITIES]
- Advanced Robotics & STEM Innovation Center with 3D printers and microcontrollers.
- State-of-the-art Physics, Chemistry, and Biotechnology wet laboratories.
- Olympic-grade Athletic Grounds: 400m synthetic running track, covered basketball courts, and FIFA-standard turf.
- Air-conditioned Smart Classrooms equipped with interactive digital smartboards and fiber Wi-Fi.
- Multi-Tier Central Library containing 15,000+ print volumes and digital journal access.`);
    }

    if (faqs.length > 0) {
      const faqText = faqs.map((f) => `Q: ${f.question}\nA: ${f.answer} [Category: ${f.category}]`).join('\n\n');
      sections.push(`[OFFICIAL PUBLISHED FAQS & POLICIES]
${faqText}`);
    }

    if (cms) {
      sections.push(`[ACADEMIC PEDAGOGY & MISSION]
${cms.heroTitle} - ${cms.heroSubtitle}
${cms.heroDescription}`);
    }

    if (events.length > 0) {
      const eventList = events.map((e) => `- ${e.title} (${new Date(e.startDate).toLocaleDateString()}): ${e.description || ''}`).join('\n');
      sections.push(`[UPCOMING EVENTS & HOLIDAYS]
${eventList}`);
    }

    sections.push(`[REGULAR INSTRUCTIONAL TIMINGS & EXAMINATIONS]
Regular School Hours: Monday to Friday from 8:00 AM to 3:30 PM (Gates open at 7:45 AM).
Term Examinations: Conducted twice per academic year (Mid-Term in November, Annual Board Assessments in February/March).`);

    return sections.join('\n\n');
  }

  /**
   * Process Public Website Chatbot Query with Grounded AI
   */
  public async askPublicChatbot(schoolIdentifier: string | undefined, data: ChatbotMessageDTO, clientIp = '127.0.0.1') {
    const school = await this.resolveSchool(schoolIdentifier);
    const config = await this.getOrCreateConfiguration(school.id);

    // Rate Limit Guard
    this.checkRateLimit(data.visitorSessionId || clientIp);

    const query = (data.message || (data as any).question || '').trim();
    const qLower = query.toLowerCase();

    // 1. Direct FAQ Matching (Sub-millisecond retrieval without LLM token cost)
    const exactFaq = await prisma.chatbotFAQ.findFirst({
      where: {
        schoolId: school.id,
        isPublished: true,
        OR: [
          { question: { equals: query, mode: 'insensitive' } },
          { question: { contains: query, mode: 'insensitive' } },
        ],
      },
    });

    if (exactFaq) {
      return {
        answer: exactFaq.answer,
        source: 'FAQ',
        faqId: exactFaq.id,
        category: exactFaq.category,
        action: exactFaq.category === 'ADMISSIONS'
          ? { type: 'ADMISSION_ENQUIRY', url: '/admission/apply', label: 'Apply for Admission' }
          : undefined,
        suggestedNext: Array.isArray(config.suggestedQuestions) ? (config.suggestedQuestions as any[]).slice(0, 3) : [],
      };
    }

    // 2. Admission Intent Detection: Direct link & action prompt
    const isAdmissionQuery =
      qLower.includes('admission') ||
      qLower.includes('apply') ||
      qLower.includes('enroll') ||
      qLower.includes('registration') ||
      qLower.includes('enquiry form') ||
      qLower.includes('seat availability');

    // 3. Human Escalation Request Detection
    const isEscalationQuery =
      qLower.includes('human') ||
      qLower.includes('talk to someone') ||
      qLower.includes('speak to someone') ||
      qLower.includes('talk to a person') ||
      qLower.includes('speak to a person') ||
      qLower.includes('counselor') ||
      qLower.includes('call me') ||
      qLower.includes('complaint') ||
      qLower.includes('speak to principal') ||
      qLower.includes('urgent help') ||
      qLower.includes('escalat');

    if (isEscalationQuery && config.escalationEnabled) {
      return {
        answer: `I understand you would like to connect directly with a member of our school administration. ${config.escalationMessage}\n\nContact: ${config.escalationContactName}\nPhone: ${config.escalationPhone}\nEmail: ${config.escalationEmail}\nAvailable: ${config.escalationAvailability}`,
        source: 'ESCALATION',
        action: {
          type: 'ESCALATION_TRIGGER',
          label: 'Request Immediate Callback',
        },
        suggestedNext: ['Submit an Admission Enquiry', 'WhatsApp Admissions Desk'],
      };
    }

    // 4. Assemble Grounded Database Knowledge
    const groundedKnowledge = await this.buildGroundedKnowledge(school.id, query);

    // 5. Build LLM Grounding Prompt
    const prompt = `You are the official AI Virtual Assistant for "${school.name}".
Your task is to provide accurate, courteous, and concise answers to website visitors, prospective parents, and students.

STRICT GROUNDING KNOWLEDGE (FROM DATABASE RECORDS):
==================================================
${groundedKnowledge}
==================================================

CONVERSATION HISTORY:
${(data.history || [])
  .slice(-4)
  .map((h) => `${h.sender === 'user' ? 'Visitor' : 'Assistant'}: ${h.text}`)
  .join('\n')}

CURRENT VISITOR QUERY: "${query}"

CRITICAL POLICIES & BOUNDARIES:
1. ONLY answer using facts stated in the Grounding Knowledge above.
2. NEVER invent fee amounts, nonexistent classes, admission deadlines, or false policies.
3. If the user is saying hello, hi, or offering a greeting, respond with a warm, courteous greeting welcoming them to ${school.name} and offering help with admissions, fees, timings, syllabus, and facilities. If a specific factual question cannot be answered by the knowledge above, reply with: "${config.fallbackMessage}"
4. NEVER disclose private data, student marks, staff private phone numbers, or passwords.
5. If the visitor asks about admission or applications, encourage them to submit an enquiry or visit the online admission application portal.
6. Keep responses friendly, professional, clear, and under 3 paragraphs.`;

    let answer = '';
    let source = 'AI_GROUNDED';

    try {
      if (aiService.isProviderConfigured()) {
        answer = await aiService.callAiProvider(prompt);
      } else {
        // Fallback grounded answer synthesis if Gemini API key not configured in environment
        answer = this.synthesizeRuleBasedAnswer(qLower, school, config);
        source = 'RULE_BASED';
      }
    } catch (err: any) {
      console.warn('AI Provider call failed, falling back to database rule-based response:', err.message);
      answer = this.synthesizeRuleBasedAnswer(qLower, school, config);
      source = 'RULE_BASED';
    }

    return {
      answer: answer.trim(),
      source,
      action: isAdmissionQuery
        ? {
            type: 'ADMISSION_ENQUIRY',
            url: '/admission/apply',
            label: 'Apply for Admission',
          }
        : undefined,
      suggestedNext: Array.isArray(config.suggestedQuestions) ? (config.suggestedQuestions as any[]).slice(0, 3) : [],
    };
  }

  /**
   * Deterministic Rule-Based Grounding Fallback
   */
  private synthesizeRuleBasedAnswer(qLower: string, school: any, config: any): string {
    const cleanWord = qLower.replace(/[^a-z0-9 ]/g, '').trim();
    if (
      ['hi', 'hii', 'hiii', 'hello', 'hey', 'heyy', 'greetings', 'namaste', 'good morning', 'good afternoon', 'good evening', 'help'].includes(cleanWord) ||
      cleanWord.startsWith('hi ') ||
      cleanWord.startsWith('hello ') ||
      cleanWord.startsWith('hey ')
    ) {
      return `Hello! Welcome to ${school.name}. I am your official AI Academic Assistant. How can I help you today? You can ask me about our admission procedures, fee structures, available classes and streams, facilities, or school timings!`;
    }

    if (qLower.includes('admission') || qLower.includes('apply') || qLower.includes('criteria') || qLower.includes('documents')) {
      return `Admissions for the upcoming academic session at ${school.name} are currently open for all grades. Candidates require a birth certificate, previous academic report cards, transfer certificate (TC), and immunization records. You can submit an enquiry directly through this chat or complete the online admission application form.`;
    }
    if (qLower.includes('fee') || qLower.includes('cost') || qLower.includes('tuition') || qLower.includes('scholarship')) {
      return `Tuition fees at ${school.name} are billed on a quarterly schedule: Primary Wing (Grades 1–5) is ₹28,000/quarter, Middle Wing (Grades 6–8) is ₹38,000/quarter, and Senior Secondary (Grades 9–12) is ₹45,000/quarter. Merit-based fee concessions of up to 25% are available for meritorious applicants.`;
    }
    if (qLower.includes('timing') || qLower.includes('hour') || qLower.includes('open') || qLower.includes('bell')) {
      return `Regular instructional hours at ${school.name} run Monday through Friday from 8:00 AM to 3:30 PM. Campus gates open at 7:45 AM. The administrative office is available on weekdays from 8:00 AM to 4:00 PM.`;
    }
    if (qLower.includes('class') || qLower.includes('grade') || qLower.includes('stream') || qLower.includes('curriculum')) {
      return `${school.name} is affiliated with CBSE and offers classes from Grade 1 through Grade 12. In Senior Secondary (Grades 11–12), students may choose Science (PCM / PCB), Commerce with Mathematics, or Humanities pathways.`;
    }
    if (qLower.includes('facility') || qLower.includes('lab') || qLower.includes('ground') || qLower.includes('sports') || qLower.includes('library')) {
      return `Our campus features state-of-the-art facilities including modern Physics, Chemistry, and Biotechnology laboratories, an Advanced STEM & Robotics Lab, an Olympic-grade 400m running track, covered sports courts, smart classrooms, and a multi-tier central library with over 15,000 volumes.`;
    }
    if (qLower.includes('contact') || qLower.includes('address') || qLower.includes('phone') || qLower.includes('email') || qLower.includes('location')) {
      return `${school.name} is located at ${school.address}, ${school.city}, ${school.state}. You can reach the administrative desk via phone at ${school.phone} or email us at ${school.email}.`;
    }
    if (qLower.includes('exam') || qLower.includes('test') || qLower.includes('assessment')) {
      return `Examinations at ${school.name} are conducted semi-annually with Mid-Term assessments in November and Annual Final Examinations in February/March. Admit cards with verifiable QR security tokens are issued prior to all major examinations.`;
    }

    return config.fallbackMessage;
  }

  /**
   * Submit Admission Enquiry directly from Chatbot
   */
  public async submitChatbotAdmissionEnquiry(data: ChatbotEnquiryDTO) {
    const school = await this.resolveSchool(data.schoolIdentifier);

    // Spam defense: check if exact same enquiry submitted within last 60 seconds
    const recent = await prisma.admissionEnquiry.findFirst({
      where: {
        schoolId: school.id,
        email: data.email.trim(),
        phone: data.phone.trim(),
        createdAt: { gte: new Date(Date.now() - 60000) },
      },
    });

    if (recent) {
      return {
        success: true,
        enquiryNumber: recent.enquiryNumber,
        status: recent.status,
        message: `Your enquiry is already registered under reference ${recent.enquiryNumber}. Our admissions counselor will contact you shortly.`,
        applyUrl: '/admission/apply',
      };
    }

    const randNum = Math.floor(1000 + Math.random() * 9000);
    const enquiryNumber = `ENQ-2026-${randNum}`;

    const enquiry = await prisma.admissionEnquiry.create({
      data: {
        schoolId: school.id,
        enquiryNumber,
        parentName: data.parentName.trim(),
        studentName: data.studentName.trim(),
        email: data.email.trim(),
        phone: data.phone.trim(),
        applyingClass: data.applyingClass.trim(),
        message: data.message?.trim() || 'Enquiry submitted via Website AI Chatbot.',
        source: 'CHATBOT',
        status: 'NEW',
      },
    });

    return {
      success: true,
      enquiryNumber: enquiry.enquiryNumber,
      status: enquiry.status,
      message: `Thank you, ${data.parentName}! Your admission enquiry has been successfully logged with reference number ${enquiry.enquiryNumber}. Our admissions desk will reach out to ${data.phone} / ${data.email}.`,
      applyUrl: '/admission/apply',
    };
  }

  /**
   * Submit Chatbot Escalation Request
   */
  public async submitChatbotEscalation(data: ChatbotEscalationDTO) {
    const school = await this.resolveSchool(data.schoolIdentifier);
    const config = await this.getOrCreateConfiguration(school.id);

    const escalation = await prisma.chatbotEscalation.create({
      data: {
        schoolId: school.id,
        visitorName: data.visitorName?.trim() || 'Website Visitor',
        visitorPhone: data.visitorPhone?.trim() || null,
        visitorEmail: data.visitorEmail?.trim() || null,
        query: data.query.trim(),
        reason: data.reason || 'VISITOR_REQUESTED_HUMAN',
        status: 'PENDING',
        conversationSnapshot: data.conversationSnapshot ? JSON.parse(JSON.stringify(data.conversationSnapshot)) : null,
      },
    });

    return {
      success: true,
      escalationId: escalation.id,
      message: config.escalationMessage || 'Your inquiry has been escalated to school administration. A staff member will follow up shortly.',
      contactInfo: {
        desk: config.escalationContactName,
        phone: config.escalationPhone,
        email: config.escalationEmail,
        availability: config.escalationAvailability,
      },
    };
  }

  // ==========================================================================
  // ADMIN FAQ MANAGEMENT
  // ==========================================================================

  public async listAdminFAQs(
    schoolId: string,
    params: {
      category?: string;
      search?: string;
      isPublished?: boolean;
      page?: number;
      limit?: number;
    } = {}
  ) {
    const page = Math.max(1, params.page || 1);
    const limit = Math.max(1, Math.min(100, params.limit || 50));
    const skip = (page - 1) * limit;

    const where: any = { schoolId };

    if (params.category && params.category !== 'ALL') {
      where.category = params.category;
    }
    if (params.isPublished !== undefined) {
      where.isPublished = params.isPublished;
    }
    if (params.search && params.search.trim()) {
      const q = params.search.trim();
      where.OR = [
        { question: { contains: q, mode: 'insensitive' } },
        { answer: { contains: q, mode: 'insensitive' } },
      ];
    }

    const [items, total] = await Promise.all([
      prisma.chatbotFAQ.findMany({
        where,
        orderBy: [{ displayOrder: 'asc' }, { createdAt: 'desc' }],
        skip,
        take: limit,
      }),
      prisma.chatbotFAQ.count({ where }),
    ]);

    return { items, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  public async createAdminFAQ(schoolId: string, data: CreateChatbotFAQDTO) {
    return prisma.chatbotFAQ.create({
      data: {
        schoolId,
        question: data.question.trim(),
        answer: data.answer.trim(),
        category: data.category || 'GENERAL',
        displayOrder: data.displayOrder ?? 0,
        isPublished: data.isPublished !== undefined ? data.isPublished : true,
      },
    });
  }

  public async updateAdminFAQ(schoolId: string, id: string, data: UpdateChatbotFAQDTO) {
    const faq = await prisma.chatbotFAQ.findFirst({ where: { id, schoolId } });
    if (!faq) {
      throw new AppError('FAQ item not found in this school tenant.', 404, 'NOT_FOUND');
    }

    return prisma.chatbotFAQ.update({
      where: { id },
      data: {
        ...(data.question ? { question: data.question.trim() } : {}),
        ...(data.answer ? { answer: data.answer.trim() } : {}),
        ...(data.category ? { category: data.category } : {}),
        ...(data.displayOrder !== undefined ? { displayOrder: data.displayOrder } : {}),
        ...(data.isPublished !== undefined ? { isPublished: data.isPublished } : {}),
      },
    });
  }

  public async deleteAdminFAQ(schoolId: string, id: string) {
    const faq = await prisma.chatbotFAQ.findFirst({ where: { id, schoolId } });
    if (!faq) {
      throw new AppError('FAQ item not found in this school tenant.', 404, 'NOT_FOUND');
    }

    await prisma.chatbotFAQ.delete({ where: { id } });
    return { success: true, message: 'FAQ deleted successfully.' };
  }

  public async reorderAdminFAQs(schoolId: string, faqIds: string[]) {
    await prisma.$transaction(
      faqIds.map((id, index) =>
        prisma.chatbotFAQ.updateMany({
          where: { id, schoolId },
          data: { displayOrder: index },
        })
      )
    );
    return { success: true, message: 'FAQ display order updated.' };
  }

  // ==========================================================================
  // ADMIN CONFIGURATION & ESCALATION MANAGEMENT
  // ==========================================================================

  public async getAdminConfig(schoolId: string) {
    return this.getOrCreateConfiguration(schoolId);
  }

  public async updateAdminConfig(schoolId: string, data: UpdateChatbotConfigDTO) {
    await this.getOrCreateConfiguration(schoolId);

    return prisma.chatbotConfiguration.update({
      where: { schoolId },
      data: {
        ...(data.botName ? { botName: data.botName.trim() } : {}),
        ...(data.welcomeMessage ? { welcomeMessage: data.welcomeMessage.trim() } : {}),
        ...(data.suggestedQuestions ? { suggestedQuestions: data.suggestedQuestions } : {}),
        ...(data.fallbackMessage ? { fallbackMessage: data.fallbackMessage.trim() } : {}),
        ...(data.whatsappNumber !== undefined ? { whatsappNumber: data.whatsappNumber?.trim() || null } : {}),
        ...(data.whatsappPrefillText !== undefined ? { whatsappPrefillText: data.whatsappPrefillText?.trim() || null } : {}),
        ...(data.whatsappEnabled !== undefined ? { whatsappEnabled: data.whatsappEnabled } : {}),
        ...(data.escalationEnabled !== undefined ? { escalationEnabled: data.escalationEnabled } : {}),
        ...(data.escalationContactName !== undefined ? { escalationContactName: data.escalationContactName?.trim() || null } : {}),
        ...(data.escalationEmail !== undefined ? { escalationEmail: data.escalationEmail?.trim() || null } : {}),
        ...(data.escalationPhone !== undefined ? { escalationPhone: data.escalationPhone?.trim() || null } : {}),
        ...(data.escalationAvailability !== undefined ? { escalationAvailability: data.escalationAvailability?.trim() || null } : {}),
        ...(data.escalationMessage !== undefined ? { escalationMessage: data.escalationMessage?.trim() || null } : {}),
      },
    });
  }

  public async listAdminEscalations(
    schoolId: string,
    params: {
      status?: string;
      search?: string;
      page?: number;
      limit?: number;
    } = {}
  ) {
    const page = Math.max(1, params.page || 1);
    const limit = Math.max(1, Math.min(100, params.limit || 50));
    const skip = (page - 1) * limit;

    const where: any = { schoolId };
    if (params.status && params.status !== 'ALL') {
      where.status = params.status as any;
    }
    if (params.search && params.search.trim()) {
      const q = params.search.trim();
      where.OR = [
        { visitorName: { contains: q, mode: 'insensitive' } },
        { visitorEmail: { contains: q, mode: 'insensitive' } },
        { visitorPhone: { contains: q, mode: 'insensitive' } },
        { query: { contains: q, mode: 'insensitive' } },
      ];
    }

    const [items, total] = await Promise.all([
      prisma.chatbotEscalation.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.chatbotEscalation.count({ where }),
    ]);

    return { items, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  public async updateAdminEscalationStatus(schoolId: string, id: string, data: UpdateEscalationStatusDTO) {
    const escalation = await prisma.chatbotEscalation.findFirst({ where: { id, schoolId } });
    if (!escalation) {
      throw new AppError('Escalation record not found.', 404, 'NOT_FOUND');
    }

    return prisma.chatbotEscalation.update({
      where: { id },
      data: {
        status: data.status as any,
        ...(data.staffNotes !== undefined ? { staffNotes: data.staffNotes } : {}),
        ...(data.assignedToStaffId !== undefined ? { assignedToStaffId: data.assignedToStaffId } : {}),
      },
    });
  }

  public async deleteAdminEscalation(schoolId: string, id: string) {
    const escalation = await prisma.chatbotEscalation.findFirst({ where: { id, schoolId } });
    if (!escalation) {
      throw new AppError('Escalation record not found.', 404, 'NOT_FOUND');
    }

    await prisma.chatbotEscalation.delete({ where: { id } });
    return { success: true, message: 'Escalation record deleted.' };
  }
}

export const chatbotService = new ChatbotService();
