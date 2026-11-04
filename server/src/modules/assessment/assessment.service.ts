import { prisma } from '../../config/db.js';
import { AppError } from '../../middleware/errorHandler.js';
import {
  CreateQuestionBankItemDTO,
  UpdateQuestionBankItemDTO,
  CreateQuestionPaperDTO,
  UpdateQuestionPaperDTO,
  SaveAssessmentAnswerDTO,
  SubmitAssessmentAttemptDTO,
  EvaluateAssessmentAttemptDTO,
  PublishAssessmentResultsDTO,
} from '@edunexa/shared';

export class AssessmentService {
  // ==========================================================================
  // 1. QUESTION BANK MANAGEMENT
  // ==========================================================================

  async createQuestionBankItem(
    schoolId: string,
    createdById: string,
    dto: CreateQuestionBankItemDTO
  ) {
    return await prisma.questionBankItem.create({
      data: {
        schoolId,
        createdById,
        subjectId: dto.subjectId,
        classId: dto.classId || null,
        chapter: dto.chapter || null,
        topic: dto.topic || null,
        difficulty: dto.difficulty || 'MEDIUM',
        questionType: dto.questionType,
        questionText: dto.questionText,
        marks: dto.marks,
        negativeMarks: dto.negativeMarks || 0,
        explanation: dto.explanation || null,
        imageUrl: dto.imageUrl || null,
        metadata: dto.metadata ? (dto.metadata as any) : undefined,
      },
      include: {
        subject: true,
        class: true,
      },
    });
  }

  async listQuestionBankItems(
    schoolId: string,
    filters?: {
      subjectId?: string;
      classId?: string;
      difficulty?: 'EASY' | 'MEDIUM' | 'HARD';
      questionType?: string;
      chapter?: string;
      search?: string;
    }
  ) {
    const where: any = { schoolId };

    if (filters?.subjectId) where.subjectId = filters.subjectId;
    if (filters?.classId) where.classId = filters.classId;
    if (filters?.difficulty) where.difficulty = filters.difficulty;
    if (filters?.questionType) where.questionType = filters.questionType;
    if (filters?.chapter) where.chapter = { contains: filters.chapter, mode: 'insensitive' };
    if (filters?.search) {
      where.OR = [
        { questionText: { contains: filters.search, mode: 'insensitive' } },
        { topic: { contains: filters.search, mode: 'insensitive' } },
        { chapter: { contains: filters.search, mode: 'insensitive' } },
      ];
    }

    return await prisma.questionBankItem.findMany({
      where,
      include: {
        subject: true,
        class: true,
      },
      orderBy: [{ updatedAt: 'desc' }],
    });
  }

  async getQuestionBankItem(schoolId: string, id: string) {
    const item = await prisma.questionBankItem.findFirst({
      where: { id, schoolId },
      include: {
        subject: true,
        class: true,
      },
    });
    if (!item) {
      throw new AppError('Question bank item not found', 404, 'NOT_FOUND');
    }
    return item;
  }

  async updateQuestionBankItem(
    schoolId: string,
    id: string,
    dto: UpdateQuestionBankItemDTO
  ) {
    await this.getQuestionBankItem(schoolId, id);

    return await prisma.questionBankItem.update({
      where: { id },
      data: {
        subjectId: dto.subjectId,
        classId: dto.classId,
        chapter: dto.chapter,
        topic: dto.topic,
        difficulty: dto.difficulty,
        questionType: dto.questionType,
        questionText: dto.questionText,
        marks: dto.marks,
        negativeMarks: dto.negativeMarks,
        explanation: dto.explanation,
        imageUrl: dto.imageUrl,
        metadata: dto.metadata !== undefined ? (dto.metadata as any) : undefined,
      },
      include: {
        subject: true,
        class: true,
      },
    });
  }

  async deleteQuestionBankItem(schoolId: string, id: string) {
    await this.getQuestionBankItem(schoolId, id);
    return await prisma.questionBankItem.delete({
      where: { id },
    });
  }

  // ==========================================================================
  // 2. QUESTION PAPER BUILDER
  // ==========================================================================

  async createQuestionPaper(
    schoolId: string,
    createdById: string,
    dto: CreateQuestionPaperDTO
  ) {
    return await prisma.$transaction(async (tx: any) => {
      const paper = await tx.questionPaper.create({
        data: {
          schoolId,
          createdById,
          title: dto.title,
          subjectId: dto.subjectId,
          classId: dto.classId || null,
          academicSessionId: dto.academicSessionId || null,
          examScheduleId: dto.examScheduleId || null,
          instructions: dto.instructions || null,
          durationMinutes: dto.durationMinutes,
          totalMarks: dto.totalMarks,
          passingMarks: dto.passingMarks,
          status: dto.status || 'DRAFT',
          randomizeQuestions: dto.randomizeQuestions ?? false,
          randomizeOptions: dto.randomizeOptions ?? false,
          sections: dto.sections ? (dto.sections as any) : null,
          items: {
            create: dto.items.map((item, index) => ({
              questionBankItemId: item.questionBankItemId || null,
              sectionName: item.sectionName || 'Section A',
              orderIndex: item.orderIndex ?? index,
              questionText: item.questionText,
              questionType: item.questionType,
              marks: item.marks,
              negativeMarks: item.negativeMarks ?? 0,
              explanation: item.explanation || null,
              imageUrl: item.imageUrl || null,
              metadata: item.metadata ? (item.metadata as any) : null,
            })),
          },
        },
        include: {
          items: {
            orderBy: { orderIndex: 'asc' },
          },
          subject: true,
          class: true,
          examSchedule: true,
        },
      });

      return paper;
    });
  }

  async listQuestionPapers(
    schoolId: string,
    filters?: {
      subjectId?: string;
      classId?: string;
      status?: 'DRAFT' | 'PUBLISHED' | 'ARCHIVED';
      examScheduleId?: string;
      search?: string;
    }
  ) {
    const where: any = { schoolId };
    if (filters?.subjectId) where.subjectId = filters.subjectId;
    if (filters?.classId) where.classId = filters.classId;
    if (filters?.status) where.status = filters.status;
    if (filters?.examScheduleId) where.examScheduleId = filters.examScheduleId;
    if (filters?.search) {
      where.title = { contains: filters.search, mode: 'insensitive' };
    }

    return await prisma.questionPaper.findMany({
      where,
      include: {
        subject: true,
        class: true,
        examSchedule: true,
        _count: {
          select: {
            items: true,
            attempts: true,
          },
        },
      },
      orderBy: [{ updatedAt: 'desc' }],
    });
  }

  async getQuestionPaper(schoolId: string, id: string) {
    const paper = await prisma.questionPaper.findFirst({
      where: { id, schoolId },
      include: {
        subject: true,
        class: true,
        examSchedule: true,
        items: {
          orderBy: { orderIndex: 'asc' },
        },
      },
    });
    if (!paper) {
      throw new AppError('Question paper not found', 404, 'NOT_FOUND');
    }
    return paper;
  }

  async updateQuestionPaper(
    schoolId: string,
    id: string,
    dto: UpdateQuestionPaperDTO
  ) {
    await this.getQuestionPaper(schoolId, id);

    return await prisma.$transaction(async (tx: any) => {
      // If items are provided, replace them
      if (dto.items && dto.items.length > 0) {
        await tx.questionPaperItem.deleteMany({
          where: { questionPaperId: id },
        });

        await tx.questionPaperItem.createMany({
          data: dto.items.map((item: any, index: number) => ({
            questionPaperId: id,
            questionBankItemId: item.questionBankItemId || null,
            sectionName: item.sectionName || 'Section A',
            orderIndex: item.orderIndex ?? index,
            questionText: item.questionText,
            questionType: item.questionType,
            marks: item.marks,
            negativeMarks: item.negativeMarks ?? 0,
            explanation: item.explanation || null,
            imageUrl: item.imageUrl || null,
            metadata: item.metadata ? (item.metadata as any) : null,
          })),
        });
      }

      const updated = await tx.questionPaper.update({
        where: { id },
        data: {
          title: dto.title,
          subjectId: dto.subjectId,
          classId: dto.classId,
          academicSessionId: dto.academicSessionId,
          examScheduleId: dto.examScheduleId,
          instructions: dto.instructions,
          durationMinutes: dto.durationMinutes,
          totalMarks: dto.totalMarks,
          passingMarks: dto.passingMarks,
          status: dto.status,
          randomizeQuestions: dto.randomizeQuestions,
          randomizeOptions: dto.randomizeOptions,
          sections: dto.sections ? (dto.sections as any) : undefined,
        },
        include: {
          items: {
            orderBy: { orderIndex: 'asc' },
          },
          subject: true,
          class: true,
          examSchedule: true,
        },
      });

      return updated;
    });
  }

  async deleteQuestionPaper(schoolId: string, id: string) {
    await this.getQuestionPaper(schoolId, id);
    return await prisma.questionPaper.delete({
      where: { id },
    });
  }

  // ==========================================================================
  // 3. ONLINE EXAMINATION & QUIZ ENGINE
  // ==========================================================================

  async startAttempt(
    schoolId: string,
    studentProfileId: string,
    questionPaperId: string
  ) {
    const paper = await prisma.questionPaper.findFirst({
      where: { id: questionPaperId, schoolId },
      include: {
        items: {
          orderBy: { orderIndex: 'asc' },
        },
        subject: true,
      },
    });

    if (!paper) {
      throw new AppError('Question paper not found', 404, 'NOT_FOUND');
    }

    if (paper.status !== 'PUBLISHED') {
      throw new AppError('This examination has not been published yet', 400, 'EXAM_NOT_PUBLISHED');
    }

    // Check for an existing attempt
    let existingAttempt = await prisma.assessmentAttempt.findFirst({
      where: {
        questionPaperId,
        studentProfileId,
      },
      include: {
        answers: true,
      },
    });

    if (existingAttempt) {
      // If already submitted or evaluated, do not allow re-taking
      if (existingAttempt.status !== 'IN_PROGRESS') {
        throw new AppError(`Examination already ${existingAttempt.status.toLowerCase()}`, 400, 'EXAM_ALREADY_COMPLETED');
      }

      // Check if time expired
      const elapsedMinutes = (Date.now() - new Date(existingAttempt.startedAt).getTime()) / (60 * 1000);
      if (elapsedMinutes > paper.durationMinutes + 2) {
        // Auto-finalize expired attempt
        return await this.submitAttempt(schoolId, studentProfileId, {
          attemptId: existingAttempt.id,
          isAutoSubmitted: true,
        });
      }

      // Return sanitized questions with saved answers
      const sanitizedPaper = this.sanitizePaperForStudent(paper, existingAttempt.answers);
      return {
        attempt: existingAttempt,
        paper: sanitizedPaper,
      };
    }

    // Create a new attempt
    const newAttempt = await prisma.assessmentAttempt.create({
      data: {
        schoolId,
        questionPaperId,
        studentProfileId,
        attemptNumber: 1,
        startedAt: new Date(),
        durationMinutes: paper.durationMinutes,
        status: 'IN_PROGRESS',
      },
      include: {
        answers: true,
      },
    });

    const sanitizedPaper = this.sanitizePaperForStudent(paper, []);
    return {
      attempt: newAttempt,
      paper: sanitizedPaper,
    };
  }

  private sanitizePaperForStudent(paper: any, answers: any[] = []) {
    let items = [...paper.items];

    // Randomize questions if enabled
    if (paper.randomizeQuestions) {
      items = items.sort(() => Math.random() - 0.5);
    }

    const sanitizedItems = items.map((item) => {
      const rawMeta = (item.metadata as any) || {};
      const answerRecord = answers.find((a) => a.paperItemId === item.id);

      // Strip correct answers from choices
      let choices = rawMeta.choices
        ? rawMeta.choices.map((c: any) => ({
            id: c.id || c.choiceText,
            choiceText: c.choiceText,
            orderIndex: c.orderIndex ?? 0,
          }))
        : undefined;

      if (choices && paper.randomizeOptions) {
        choices = choices.sort(() => Math.random() - 0.5);
      }

      // Strip answers from blanks
      let blanksCount = rawMeta.blanks ? rawMeta.blanks.length : undefined;

      // Match the following items: randomize right column if not submitted
      let matchPairs = rawMeta.matchPairs
        ? {
            leftItems: rawMeta.matchPairs.leftItems,
            rightItems: rawMeta.matchPairs.rightItems,
          }
        : undefined;

      // Numerical: hide expected number and tolerance, keep unit
      let numerical = rawMeta.numerical
        ? {
            unit: rawMeta.numerical.unit || '',
          }
        : undefined;

      return {
        id: item.id,
        sectionName: item.sectionName,
        orderIndex: item.orderIndex,
        questionText: item.questionText,
        questionType: item.questionType,
        marks: item.marks,
        negativeMarks: item.negativeMarks,
        imageUrl: item.imageUrl,
        choices,
        blanksCount,
        matchPairs,
        numerical,
        studentAnswer: answerRecord?.studentAnswer || null,
      };
    });

    return {
      id: paper.id,
      title: paper.title,
      subject: paper.subject,
      instructions: paper.instructions,
      durationMinutes: paper.durationMinutes,
      totalMarks: paper.totalMarks,
      passingMarks: paper.passingMarks,
      sections: paper.sections,
      items: sanitizedItems,
    };
  }

  async saveAnswer(
    schoolId: string,
    studentProfileId: string,
    dto: SaveAssessmentAnswerDTO
  ) {
    const attempt = await prisma.assessmentAttempt.findFirst({
      where: {
        id: dto.attemptId,
        schoolId,
        studentProfileId,
      },
      include: {
        questionPaper: true,
      },
    });

    if (!attempt) {
      throw new AppError('Assessment attempt not found', 404, 'NOT_FOUND');
    }

    if (attempt.status !== 'IN_PROGRESS') {
      throw new AppError('Assessment has already been submitted and cannot be modified', 400, 'ALREADY_SUBMITTED');
    }

    // Check time expiry with 2-minute grace
    const elapsedMinutes = (Date.now() - new Date(attempt.startedAt).getTime()) / (60 * 1000);
    if (elapsedMinutes > attempt.durationMinutes + 2) {
      // Auto submit attempt
      await this.submitAttempt(schoolId, studentProfileId, {
        attemptId: attempt.id,
        isAutoSubmitted: true,
      });
      throw new AppError('Assessment time limit has expired. Your exam was automatically submitted.', 400, 'TIME_EXPIRED');
    }

    const item = await prisma.questionPaperItem.findFirst({
      where: {
        id: dto.paperItemId,
        questionPaperId: attempt.questionPaperId,
      },
    });

    if (!item) {
      throw new AppError('Question not found in this assessment', 404, 'NOT_FOUND');
    }

    const answer = await prisma.assessmentAnswer.upsert({
      where: {
        attemptId_paperItemId: {
          attemptId: attempt.id,
          paperItemId: dto.paperItemId,
        },
      },
      update: {
        studentAnswer: dto.studentAnswer as any,
      },
      create: {
        attemptId: attempt.id,
        paperItemId: dto.paperItemId,
        studentAnswer: dto.studentAnswer as any,
        maxMarks: item.marks,
      },
    });

    return answer;
  }

  async submitAttempt(
    schoolId: string,
    studentProfileId: string,
    dto: SubmitAssessmentAttemptDTO
  ) {
    const attempt = await prisma.assessmentAttempt.findFirst({
      where: {
        id: dto.attemptId,
        schoolId,
        studentProfileId,
      },
      include: {
        questionPaper: {
          include: {
            items: true,
          },
        },
        answers: true,
      },
    });

    if (!attempt) {
      throw new AppError('Assessment attempt not found', 404, 'NOT_FOUND');
    }

    // Idempotent: If already submitted or evaluated, return current status
    if (attempt.status !== 'IN_PROGRESS') {
      return attempt;
    }

    // Save any pending answers passed in submission payload
    if (dto.answers && dto.answers.length > 0) {
      for (const ans of dto.answers) {
        const item = attempt.questionPaper.items.find((i: any) => i.id === ans.paperItemId);
        if (item) {
          await prisma.assessmentAnswer.upsert({
            where: {
              attemptId_paperItemId: {
                attemptId: attempt.id,
                paperItemId: ans.paperItemId,
              },
            },
            update: {
              studentAnswer: ans.studentAnswer as any,
            },
            create: {
              attemptId: attempt.id,
              paperItemId: ans.paperItemId,
              studentAnswer: ans.studentAnswer as any,
              maxMarks: item.marks,
            },
          });
        }
      }
    }

    // Fetch freshly saved answers
    const freshAnswers = await prisma.assessmentAnswer.findMany({
      where: { attemptId: attempt.id },
    });

    // Run Auto-Evaluation Engine for all objective questions
    let totalScore = 0;
    let allQuestionsEvaluated = true;

    for (const item of attempt.questionPaper.items) {
      const answer = freshAnswers.find((a: any) => a.paperItemId === item.id);
      const evalResult = this.evaluateObjectiveItem(item, answer?.studentAnswer);

      if (evalResult.isAutoEvaluated) {
        const marksAwarded = evalResult.marksAwarded;
        totalScore += marksAwarded;

        await prisma.assessmentAnswer.upsert({
          where: {
            attemptId_paperItemId: {
              attemptId: attempt.id,
              paperItemId: item.id,
            },
          },
          update: {
            isEvaluated: true,
            isAutoEvaluated: true,
            marksAwarded,
            teacherRemarks: evalResult.remarks,
          },
          create: {
            attemptId: attempt.id,
            paperItemId: item.id,
            studentAnswer: undefined,
            maxMarks: item.marks,
            isEvaluated: true,
            isAutoEvaluated: true,
            marksAwarded,
            teacherRemarks: evalResult.remarks,
          },
        });
      } else {
        // Subjective: Short answer, Long answer, Descriptive, File upload
        allQuestionsEvaluated = false;
      }
    }

    const percentage = attempt.questionPaper.totalMarks > 0
      ? (totalScore / attempt.questionPaper.totalMarks) * 100
      : 0;

    const isPassed = totalScore >= attempt.questionPaper.passingMarks;

    const finalStatus = allQuestionsEvaluated ? 'EVALUATED' : 'SUBMITTED';

    return await prisma.assessmentAttempt.update({
      where: { id: attempt.id },
      data: {
        submittedAt: new Date(),
        isAutoSubmitted: dto.isAutoSubmitted ?? false,
        scoreObtained: allQuestionsEvaluated ? totalScore : null,
        percentage: allQuestionsEvaluated ? Math.round(percentage * 10) / 10 : null,
        isPassed: allQuestionsEvaluated ? isPassed : null,
        status: finalStatus,
      },
      include: {
        answers: true,
        questionPaper: {
          include: {
            subject: true,
          },
        },
      },
    });
  }

  // ==========================================================================
  // 4. AUTO-EVALUATION LOGIC FOR OBJECTIVE TYPES
  // ==========================================================================

  private evaluateObjectiveItem(item: any, studentAnswer: any): {
    isAutoEvaluated: boolean;
    marksAwarded: number;
    remarks: string;
  } {
    const rawMeta = (item.metadata as any) || {};
    const maxMarks = item.marks;
    const negativeMarks = item.negativeMarks || 0;

    if (!studentAnswer) {
      if (
        item.questionType === 'MULTIPLE_CHOICE' ||
        item.questionType === 'MULTIPLE_SELECT' ||
        item.questionType === 'TRUE_FALSE' ||
        item.questionType === 'FILL_IN_BLANKS' ||
        item.questionType === 'MATCH_THE_FOLLOWING' ||
        item.questionType === 'NUMERICAL'
      ) {
        return { isAutoEvaluated: true, marksAwarded: 0, remarks: 'Not answered' };
      }
      return { isAutoEvaluated: false, marksAwarded: 0, remarks: 'Pending evaluation' };
    }

    switch (item.questionType) {
      case 'MULTIPLE_CHOICE': {
        const choices = rawMeta.choices || [];
        const correctChoice = choices.find((c: any) => c.isCorrect);
        const selectedId = studentAnswer.selectedChoiceIds?.[0] || studentAnswer.textAnswer;

        if (correctChoice && selectedId === (correctChoice.id || correctChoice.choiceText)) {
          return { isAutoEvaluated: true, marksAwarded: maxMarks, remarks: 'Correct choice selected' };
        }
        return { isAutoEvaluated: true, marksAwarded: -negativeMarks, remarks: 'Incorrect choice' };
      }

      case 'MULTIPLE_SELECT': {
        const choices = rawMeta.choices || [];
        const correctIds = choices.filter((c: any) => c.isCorrect).map((c: any) => c.id || c.choiceText);
        const selectedIds: string[] = studentAnswer.selectedChoiceIds || [];

        const isExactMatch =
          correctIds.length === selectedIds.length &&
          correctIds.every((id: string) => selectedIds.includes(id));

        if (isExactMatch) {
          return { isAutoEvaluated: true, marksAwarded: maxMarks, remarks: 'All correct options selected' };
        }
        return { isAutoEvaluated: true, marksAwarded: -negativeMarks, remarks: 'Incorrect option selection' };
      }

      case 'TRUE_FALSE': {
        const choices = rawMeta.choices || [];
        const correctChoice = choices.find((c: any) => c.isCorrect);
        const selected = (studentAnswer.selectedChoiceIds?.[0] || studentAnswer.textAnswer || '').trim().toLowerCase();

        if (correctChoice) {
          const correctId = (correctChoice.id || '').trim().toLowerCase();
          const correctText = (correctChoice.choiceText || '').trim().toLowerCase();
          if (selected === correctId || selected === correctText) {
            return { isAutoEvaluated: true, marksAwarded: maxMarks, remarks: 'Correct answer' };
          }
        } else {
          if (selected === 'true') {
            return { isAutoEvaluated: true, marksAwarded: maxMarks, remarks: 'Correct answer' };
          }
        }
        return { isAutoEvaluated: true, marksAwarded: -negativeMarks, remarks: 'Incorrect answer' };
      }

      case 'FILL_IN_BLANKS': {
        const blanks = rawMeta.blanks || [];
        const studentBlanks: string[] = studentAnswer.blankAnswers || [];

        if (blanks.length === 0) {
          return { isAutoEvaluated: true, marksAwarded: maxMarks, remarks: 'Auto-credited' };
        }

        let correctCount = 0;
        blanks.forEach((b: any, idx: number) => {
          const studentVal = (studentBlanks[idx] || '').trim().toLowerCase();
          const accepted = (b.acceptedAnswers || []).map((ans: string) => ans.trim().toLowerCase());
          if (accepted.includes(studentVal)) {
            correctCount++;
          }
        });

        const fraction = correctCount / blanks.length;
        const awarded = Math.round(fraction * maxMarks * 100) / 100;
        return {
          isAutoEvaluated: true,
          marksAwarded: awarded,
          remarks: `${correctCount}/${blanks.length} blanks correct`,
        };
      }

      case 'MATCH_THE_FOLLOWING': {
        const matchPairs = rawMeta.matchPairs;
        if (!matchPairs || !matchPairs.correctPairs) {
          return { isAutoEvaluated: true, marksAwarded: maxMarks, remarks: 'Auto-credited' };
        }

        const studentPairs: Array<{ leftIndex: number; rightIndex: number }> =
          studentAnswer.matchedPairs || [];

        let correctPairsCount = 0;
        const totalPairs = matchPairs.correctPairs.length;

        matchPairs.correctPairs.forEach((pair: any) => {
          const match = studentPairs.find(
            (sp) => sp.leftIndex === pair.leftIndex && sp.rightIndex === pair.rightIndex
          );
          if (match) correctPairsCount++;
        });

        const fraction = totalPairs > 0 ? correctPairsCount / totalPairs : 1;
        const awarded = Math.round(fraction * maxMarks * 100) / 100;
        return {
          isAutoEvaluated: true,
          marksAwarded: awarded,
          remarks: `${correctPairsCount}/${totalPairs} pairs correctly matched`,
        };
      }

      case 'NUMERICAL': {
        const numerical = rawMeta.numerical;
        if (!numerical || typeof numerical.expectedNumber !== 'number') {
          return { isAutoEvaluated: true, marksAwarded: maxMarks, remarks: 'Auto-credited' };
        }

        const studentVal = typeof studentAnswer.numericalValue === 'number'
          ? studentAnswer.numericalValue
          : parseFloat(studentAnswer.textAnswer || '');

        if (isNaN(studentVal)) {
          return { isAutoEvaluated: true, marksAwarded: -negativeMarks, remarks: 'Invalid numerical response' };
        }

        const tolerance = numerical.tolerance ?? 0.01;
        const diff = Math.abs(studentVal - numerical.expectedNumber);

        if (diff <= tolerance) {
          return { isAutoEvaluated: true, marksAwarded: maxMarks, remarks: 'Numerical answer within acceptable tolerance' };
        }
        return {
          isAutoEvaluated: true,
          marksAwarded: -negativeMarks,
          remarks: `Incorrect value (${studentVal}). Expected: ${numerical.expectedNumber} ±${tolerance}`,
        };
      }

      case 'SHORT_ANSWER':
      case 'LONG_ANSWER':
      case 'DESCRIPTIVE':
      case 'FILE_UPLOAD':
      default:
        // Subjective question requiring manual teacher evaluation
        return { isAutoEvaluated: false, marksAwarded: 0, remarks: 'Pending manual teacher evaluation' };
    }
  }

  // ==========================================================================
  // 5. MANUAL EVALUATION DASHBOARD & RESULT FINALIZATION
  // ==========================================================================

  async evaluateAttempt(
    schoolId: string,
    teacherId: string,
    dto: EvaluateAssessmentAttemptDTO
  ) {
    const attempt = await prisma.assessmentAttempt.findFirst({
      where: {
        id: dto.attemptId,
        schoolId,
      },
      include: {
        questionPaper: {
          include: {
            items: true,
          },
        },
        answers: true,
      },
    });

    if (!attempt) {
      throw new AppError('Assessment attempt not found', 404, 'NOT_FOUND');
    }

    return await prisma.$transaction(async (tx: any) => {
      // Update each item evaluation
      for (const itemEval of dto.itemEvaluations) {
        const paperItem = attempt.questionPaper.items.find((i: any) => i.id === itemEval.paperItemId);
        if (!paperItem) continue;

        // Cap marks between 0 and maxMarks
        const cappedMarks = Math.min(Math.max(0, itemEval.marksAwarded), paperItem.marks);

        await tx.assessmentAnswer.upsert({
          where: {
            attemptId_paperItemId: {
              attemptId: attempt.id,
              paperItemId: itemEval.paperItemId,
            },
          },
          update: {
            isEvaluated: true,
            marksAwarded: cappedMarks,
            teacherRemarks: itemEval.teacherRemarks || null,
          },
          create: {
            attemptId: attempt.id,
            paperItemId: itemEval.paperItemId,
            studentAnswer: undefined,
            maxMarks: paperItem.marks,
            isEvaluated: true,
            isAutoEvaluated: false,
            marksAwarded: cappedMarks,
            teacherRemarks: itemEval.teacherRemarks || null,
          },
        });
      }

      // Recompute total marks obtained
      const allAnswers = await tx.assessmentAnswer.findMany({
        where: { attemptId: attempt.id },
      });

      const totalScore = allAnswers.reduce((sum: number, a: any) => sum + (a.marksAwarded || 0), 0);
      const percentage = attempt.questionPaper.totalMarks > 0
        ? (totalScore / attempt.questionPaper.totalMarks) * 100
        : 0;
      const isPassed = totalScore >= attempt.questionPaper.passingMarks;

      const updated = await tx.assessmentAttempt.update({
        where: { id: attempt.id },
        data: {
          scoreObtained: Math.round(totalScore * 100) / 100,
          percentage: Math.round(percentage * 10) / 10,
          isPassed,
          status: dto.status || 'EVALUATED',
          evaluatedById: teacherId,
          evaluatedAt: new Date(),
          teacherFeedback: dto.teacherFeedback || attempt.teacherFeedback,
        },
        include: {
          answers: true,
          student: {
            include: {
              membership: {
                include: {
                  user: true,
                },
              },
            },
          },
          questionPaper: true,
        },
      });

      return updated;
    });
  }

  // ==========================================================================
  // 6. RESULT PUBLICATION & EXAM MARK SYNCHRONIZATION
  // ==========================================================================

  async publishResults(
    schoolId: string,
    userId: string,
    dto: PublishAssessmentResultsDTO
  ) {
    const paper = await prisma.questionPaper.findFirst({
      where: { id: dto.questionPaperId, schoolId },
      include: {
        attempts: {
          include: {
            student: true,
          },
        },
        examSchedule: true,
      },
    });

    if (!paper) {
      throw new AppError('Question paper not found', 404, 'NOT_FOUND');
    }

    const newStatus = dto.publish ? 'PUBLISHED' : 'EVALUATED';

    return await prisma.$transaction(async (tx: any) => {
      // Update all evaluated or submitted attempts to PUBLISHED
      const updatedAttempts = await tx.assessmentAttempt.updateMany({
        where: {
          questionPaperId: dto.questionPaperId,
          schoolId,
          status: { in: ['SUBMITTED', 'EVALUATED', 'PUBLISHED'] },
        },
        data: {
          status: newStatus,
        },
      });

      // If syncToExamMarks is true and paper is attached to an ExamSchedule, sync to ExamMark!
      let syncedMarksCount = 0;
      if (dto.syncToExamMarks && paper.examScheduleId && dto.publish) {
        for (const att of paper.attempts) {
          if (att.scoreObtained !== null) {
            // Determine grade
            const pct = att.percentage || 0;
            let grade = 'F';
            if (pct >= 90) grade = 'A+';
            else if (pct >= 80) grade = 'A';
            else if (pct >= 70) grade = 'B';
            else if (pct >= 60) grade = 'C';
            else if (pct >= 50) grade = 'D';

            await tx.examMark.upsert({
              where: {
                examScheduleId_studentProfileId: {
                  examScheduleId: paper.examScheduleId,
                  studentProfileId: att.studentProfileId,
                },
              },
              update: {
                marksObtained: att.scoreObtained,
                grade,
                isAbsent: false,
                teacherRemarks: att.teacherFeedback || 'Synchronized from Online Assessment',
                enteredByUserId: userId,
              },
              create: {
                examScheduleId: paper.examScheduleId,
                studentProfileId: att.studentProfileId,
                marksObtained: att.scoreObtained,
                grade,
                isAbsent: false,
                teacherRemarks: att.teacherFeedback || 'Synchronized from Online Assessment',
                enteredByUserId: userId,
              },
            });
            syncedMarksCount++;
          }
        }
      }

      return {
        questionPaperId: paper.id,
        status: newStatus,
        attemptsCount: updatedAttempts.count,
        syncedMarksCount,
      };
    });
  }

  // ==========================================================================
  // 7. STUDENT & PARENT RESULT VISIBILITY
  // ==========================================================================

  async getStudentAssessmentResults(schoolId: string, studentProfileId: string) {
    return await prisma.assessmentAttempt.findMany({
      where: {
        schoolId,
        studentProfileId,
        status: { in: ['EVALUATED', 'PUBLISHED'] },
      },
      include: {
        questionPaper: {
          include: {
            subject: true,
            examSchedule: true,
          },
        },
        answers: {
          include: {
            paperItem: true,
          },
        },
      },
      orderBy: { submittedAt: 'desc' },
    });
  }

  async getAttemptDetails(
    schoolId: string,
    attemptId: string,
    role: string,
    studentProfileId?: string
  ) {
    const where: any = { id: attemptId, schoolId };
    if (role === 'STUDENT' && studentProfileId) {
      where.studentProfileId = studentProfileId;
    }

    const attempt = await prisma.assessmentAttempt.findFirst({
      where,
      include: {
        questionPaper: {
          include: {
            subject: true,
            class: true,
            examSchedule: true,
            items: {
              orderBy: { orderIndex: 'asc' },
            },
          },
        },
        student: {
          include: {
            membership: {
              include: {
                user: true,
              },
            },
            enrollments: {
              include: {
                class: true,
                section: true,
              },
            },
          },
        },
        answers: true,
      },
    });

    if (!attempt) {
      throw new AppError('Assessment attempt not found', 404, 'NOT_FOUND');
    }

    return attempt;
  }
}

export const assessmentService = new AssessmentService();
