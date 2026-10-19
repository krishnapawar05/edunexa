import { Request, Response, NextFunction } from 'express';
import {
  academicService,
} from './academic.service.js';
import {
  MarkStudentAttendanceSchema,
  CorrectAttendanceSchema,
  MarkStaffAttendanceSchema,
  StaffLeaveRequestSchema,
  CreateQuizSchema,
  SubmitQuizAttemptSchema,
  GradeQuizReviewSchema,
  CreateExamScheduleSchema,
  SubmitExamMarksBatchSchema,
  CorrectExamMarkSchema,
  PublishExamSchema,
  ApiSuccessResponse,
} from '@edunexa/shared';
import { AppError } from '../../middleware/errorHandler.js';

export class AcademicController {
  // ==========================================================================
  // 1. ATTENDANCE CONTROLLERS
  // ==========================================================================

  async recordStudentAttendance(req: Request, res: Response, next: NextFunction) {
    try {
      const parsed = MarkStudentAttendanceSchema.parse(req.body);
      const schoolId = req.user!.schoolId!;
      const markedByUserId = req.user!.userId;

      const result = await academicService.recordStudentAttendance(schoolId, markedByUserId, parsed);
      const response: ApiSuccessResponse<typeof result> = {
        success: true,
        data: result,
      };
      res.status(201).json(response);
    } catch (error) {
      next(error);
    }
  }

  async correctStudentAttendance(req: Request, res: Response, next: NextFunction) {
    try {
      const parsed = CorrectAttendanceSchema.parse(req.body);
      const schoolId = req.user!.schoolId!;
      const correctedByUserId = req.user!.userId;

      const result = await academicService.correctStudentAttendance(schoolId, correctedByUserId, parsed);
      const response: ApiSuccessResponse<typeof result> = {
        success: true,
        data: result,
      };
      res.status(200).json(response);
    } catch (error) {
      next(error);
    }
  }

  async getStudentAttendanceSummary(req: Request, res: Response, next: NextFunction) {
    try {
      const { studentProfileId } = req.params;
      const schoolId = req.user!.schoolId!;

      const result = await academicService.getStudentAttendanceSummary(schoolId, studentProfileId);
      const response: ApiSuccessResponse<typeof result> = {
        success: true,
        data: result,
      };
      res.status(200).json(response);
    } catch (error) {
      next(error);
    }
  }

  async getClassAttendanceReport(req: Request, res: Response, next: NextFunction) {
    try {
      const schoolId = req.user!.schoolId!;
      const className = req.query.className as string;
      const sectionName = req.query.sectionName as string;
      const date = req.query.date as string || new Date().toISOString().split('T')[0];

      if (!className || !sectionName) {
        throw new AppError('className and sectionName are required query parameters.', 400, 'BAD_REQUEST');
      }

      const result = await academicService.getClassAttendanceReport(schoolId, className, sectionName, date);
      const response: ApiSuccessResponse<typeof result> = {
        success: true,
        data: result,
      };
      res.status(200).json(response);
    } catch (error) {
      next(error);
    }
  }

  async recordStaffAttendance(req: Request, res: Response, next: NextFunction) {
    try {
      const parsed = MarkStaffAttendanceSchema.parse(req.body);
      const schoolId = req.user!.schoolId!;
      const markedByUserId = req.user!.userId;

      const result = await academicService.recordStaffAttendance(schoolId, markedByUserId, parsed);
      const response: ApiSuccessResponse<typeof result> = {
        success: true,
        data: result,
      };
      res.status(200).json(response);
    } catch (error) {
      next(error);
    }
  }

  async submitStaffLeaveRequest(req: Request, res: Response, next: NextFunction) {
    try {
      const parsed = StaffLeaveRequestSchema.parse(req.body);
      const schoolId = req.user!.schoolId!;

      const result = await academicService.submitStaffLeaveRequest(schoolId, parsed.staffProfileId, parsed);
      const response: ApiSuccessResponse<typeof result> = {
        success: true,
        data: result,
      };
      res.status(201).json(response);
    } catch (error) {
      next(error);
    }
  }

  async reviewStaffLeaveRequest(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const { decision } = req.body;
      const schoolId = req.user!.schoolId!;
      const reviewedByUserId = req.user!.userId;

      if (decision !== 'APPROVED' && decision !== 'REJECTED') {
        throw new AppError("decision must be either 'APPROVED' or 'REJECTED'", 400, 'BAD_REQUEST');
      }

      const result = await academicService.reviewStaffLeaveRequest(schoolId, id, reviewedByUserId, decision);
      const response: ApiSuccessResponse<typeof result> = {
        success: true,
        data: result,
      };
      res.status(200).json(response);
    } catch (error) {
      next(error);
    }
  }

  async listStaffLeaveRequests(req: Request, res: Response, next: NextFunction) {
    try {
      const schoolId = req.user!.schoolId!;
      const { status } = req.query;
      const result = await academicService.listStaffLeaveRequests(schoolId, status as string);
      const response: ApiSuccessResponse<typeof result> = {
        success: true,
        data: result,
      };
      res.status(200).json(response);
    } catch (error) {
      next(error);
    }
  }

  // ==========================================================================
  // 2. QUIZ CONTROLLERS
  // ==========================================================================

  async createQuiz(req: Request, res: Response, next: NextFunction) {
    try {
      const parsed = CreateQuizSchema.parse(req.body);
      const schoolId = req.user!.schoolId!;
      const createdByUserId = req.user!.userId;

      const result = await academicService.createQuiz(schoolId, createdByUserId, parsed);
      const response: ApiSuccessResponse<typeof result> = {
        success: true,
        data: result,
      };
      res.status(201).json(response);
    } catch (error) {
      next(error);
    }
  }

  async listQuizzes(req: Request, res: Response, next: NextFunction) {
    try {
      const schoolId = req.user!.schoolId!;
      const className = req.query.className as string;

      const result = await academicService.listQuizzes(schoolId, className);
      const response: ApiSuccessResponse<typeof result> = {
        success: true,
        data: result,
      };
      res.status(200).json(response);
    } catch (error) {
      next(error);
    }
  }

  async startQuizAttempt(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params; // quizId
      const schoolId = req.user!.schoolId!;
      // Default student profile mapping for demo/test callers
      const studentProfileId = (req.query.studentProfileId as string) || (req.user?.role === 'STUDENT' ? 'stu-aarav-01' : 'stu-aarav-01');

      const result = await academicService.startQuizAttempt(schoolId, id, studentProfileId);
      const response: ApiSuccessResponse<typeof result> = {
        success: true,
        data: result,
      };
      res.status(200).json(response);
    } catch (error) {
      next(error);
    }
  }

  async submitQuizAttempt(req: Request, res: Response, next: NextFunction) {
    try {
      const parsed = SubmitQuizAttemptSchema.parse(req.body);
      const schoolId = req.user!.schoolId!;
      const studentProfileId = (req.query.studentProfileId as string) || (req.user?.role === 'STUDENT' ? 'stu-aarav-01' : 'stu-aarav-01');

      const result = await academicService.submitQuizAttempt(schoolId, studentProfileId, parsed);
      const response: ApiSuccessResponse<typeof result> = {
        success: true,
        data: result,
      };
      res.status(200).json(response);
    } catch (error) {
      next(error);
    }
  }

  async reviewQuizSubjective(req: Request, res: Response, next: NextFunction) {
    try {
      const parsed = GradeQuizReviewSchema.parse(req.body);
      const schoolId = req.user!.schoolId!;
      const teacherUserId = req.user!.userId;

      const result = await academicService.reviewQuizSubjective(schoolId, teacherUserId, parsed);
      const response: ApiSuccessResponse<typeof result> = {
        success: true,
        data: result,
      };
      res.status(200).json(response);
    } catch (error) {
      next(error);
    }
  }

  // ==========================================================================
  // 3. EXAMINATIONS & MARKS CONTROLLERS
  // ==========================================================================

  async createExamSchedule(req: Request, res: Response, next: NextFunction) {
    try {
      const parsed = CreateExamScheduleSchema.parse(req.body);
      const schoolId = req.user!.schoolId!;
      const createdByUserId = req.user!.userId;

      const result = await academicService.createExamSchedule(schoolId, createdByUserId, parsed);
      const response: ApiSuccessResponse<typeof result> = {
        success: true,
        data: result,
      };
      res.status(201).json(response);
    } catch (error) {
      next(error);
    }
  }

  async listExamSchedules(req: Request, res: Response, next: NextFunction) {
    try {
      const schoolId = req.user!.schoolId!;
      const className = req.query.className as string;

      const result = await academicService.listExamSchedules(schoolId, className);
      const response: ApiSuccessResponse<typeof result> = {
        success: true,
        data: result,
      };
      res.status(200).json(response);
    } catch (error) {
      next(error);
    }
  }

  async submitExamMarksBatch(req: Request, res: Response, next: NextFunction) {
    try {
      const parsed = SubmitExamMarksBatchSchema.parse(req.body);
      const schoolId = req.user!.schoolId!;
      const enteredByUserId = req.user!.userId;

      const result = await academicService.submitExamMarksBatch(schoolId, enteredByUserId, parsed);
      const response: ApiSuccessResponse<typeof result> = {
        success: true,
        data: result,
      };
      res.status(200).json(response);
    } catch (error) {
      next(error);
    }
  }

  async correctExamMark(req: Request, res: Response, next: NextFunction) {
    try {
      const parsed = CorrectExamMarkSchema.parse(req.body);
      const schoolId = req.user!.schoolId!;
      const correctedByUserId = req.user!.userId;

      const result = await academicService.correctExamMark(schoolId, correctedByUserId, parsed);
      const response: ApiSuccessResponse<typeof result> = {
        success: true,
        data: result,
      };
      res.status(200).json(response);
    } catch (error) {
      next(error);
    }
  }

  async publishExamResults(req: Request, res: Response, next: NextFunction) {
    try {
      const parsed = PublishExamSchema.parse(req.body);
      const schoolId = req.user!.schoolId!;

      const result = await academicService.publishExamResults(schoolId, parsed.examScheduleId, parsed.publish);
      const response: ApiSuccessResponse<typeof result> = {
        success: true,
        data: result,
      };
      res.status(200).json(response);
    } catch (error) {
      next(error);
    }
  }

  // ==========================================================================
  // 4. REPORT CARD & DASHBOARD CONTROLLER
  // ==========================================================================

  async getStudentReportCard(req: Request, res: Response, next: NextFunction) {
    try {
      const { studentProfileId } = req.params;
      const schoolId = req.user!.schoolId!;
      const caller = {
        userId: req.user!.userId,
        role: req.user!.role,
      };

      const result = await academicService.getStudentReportCard(schoolId, studentProfileId, caller);
      const response: ApiSuccessResponse<typeof result> = {
        success: true,
        data: result,
      };
      res.status(200).json(response);
    } catch (error) {
      next(error);
    }
  }
}

export const academicController = new AcademicController();
