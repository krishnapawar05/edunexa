import { Request, Response, NextFunction } from 'express';
import { portalsService } from './portals.service.js';
import { AppError } from '../../middleware/errorHandler.js';
import {
  ScheduleMeetingSchema,
  UpdateMeetingStatusSchema,
  SendCommunicationMessageSchema,
  AddStudentRemarkSchema,
  CreateLibraryBookSchema,
  IssueBookSchema,
} from '@edunexa/shared';

export class PortalsController {
  // ==========================================================================
  // 1. STUDENT CONTROLLER
  // ==========================================================================

  async getStudentDashboard(req: Request, res: Response, next: NextFunction) {
    try {
      const schoolId = req.schoolId || (req.user as any)?.schoolId;
      const userId = (req.user as any)?.id || (req.user as any)?.userId;
      if (!schoolId || !userId) throw new AppError('Tenant and authenticated context required', 400);

      const data = await portalsService.getStudentDashboardTelemetry(schoolId, userId);
      res.status(200).json({ success: true, data });
    } catch (err) {
      next(err);
    }
  }

  async getStudentAdmissionDetails(req: Request, res: Response, next: NextFunction) {
    try {
      const schoolId = req.schoolId || (req.user as any)?.schoolId;
      const userId = (req.user as any)?.id || (req.user as any)?.userId;
      if (!schoolId || !userId) throw new AppError('Tenant and authenticated context required', 400);

      const data = await portalsService.getStudentAdmissionDetails(schoolId, userId);
      res.status(200).json({ success: true, data });
    } catch (err) {
      next(err);
    }
  }

  async getStudentLibrary(req: Request, res: Response, next: NextFunction) {
    try {
      const schoolId = req.schoolId || (req.user as any)?.schoolId;
      const userId = (req.user as any)?.id || (req.user as any)?.userId;
      if (!schoolId || !userId) throw new AppError('Tenant and authenticated context required', 400);

      const data = await portalsService.getStudentLibraryHistory(schoolId, userId);
      res.status(200).json({ success: true, data });
    } catch (err) {
      next(err);
    }
  }

  async getStudentMeetings(req: Request, res: Response, next: NextFunction) {
    try {
      const schoolId = req.schoolId || (req.user as any)?.schoolId;
      const userId = (req.user as any)?.id || (req.user as any)?.userId;
      if (!schoolId || !userId) throw new AppError('Tenant and authenticated context required', 400);

      const data = await portalsService.getStudentMeetings(schoolId, userId);
      res.status(200).json({ success: true, data });
    } catch (err) {
      next(err);
    }
  }

  // ==========================================================================
  // 2. PARENT CONTROLLER (MULTI-CHILD)
  // ==========================================================================

  async getParentChildren(req: Request, res: Response, next: NextFunction) {
    try {
      const schoolId = req.schoolId || (req.user as any)?.schoolId;
      const parentUserId = (req.user as any)?.id || (req.user as any)?.userId;
      if (!schoolId || !parentUserId) throw new AppError('Tenant and authenticated context required', 400);

      const children = await portalsService.getParentChildren(schoolId, parentUserId);
      res.status(200).json({ success: true, data: children });
    } catch (err) {
      next(err);
    }
  }

  async getParentChildDashboard(req: Request, res: Response, next: NextFunction) {
    try {
      const schoolId = req.schoolId || (req.user as any)?.schoolId;
      const parentUserId = (req.user as any)?.id || (req.user as any)?.userId;
      const studentProfileId = req.params.studentProfileId;
      if (!schoolId || !parentUserId || !studentProfileId) {
        throw new AppError('Missing required parameter studentProfileId', 400);
      }

      const data = await portalsService.getParentChildDashboard(schoolId, parentUserId, studentProfileId);
      res.status(200).json({ success: true, data });
    } catch (err) {
      next(err);
    }
  }

  async getParentChildHomework(req: Request, res: Response, next: NextFunction) {
    try {
      const schoolId = req.schoolId || (req.user as any)?.schoolId;
      const parentUserId = (req.user as any)?.id || (req.user as any)?.userId;
      const studentProfileId = req.params.studentProfileId;
      if (!schoolId || !parentUserId || !studentProfileId) {
        throw new AppError('Missing required parameter studentProfileId', 400);
      }

      const data = await portalsService.getParentChildHomework(schoolId, parentUserId, studentProfileId);
      res.status(200).json({ success: true, data });
    } catch (err) {
      next(err);
    }
  }

  async getParentChildReceipts(req: Request, res: Response, next: NextFunction) {
    try {
      const schoolId = req.schoolId || (req.user as any)?.schoolId;
      const parentUserId = (req.user as any)?.id || (req.user as any)?.userId;
      const studentProfileId = req.params.studentProfileId;
      if (!schoolId || !parentUserId || !studentProfileId) {
        throw new AppError('Missing required parameter studentProfileId', 400);
      }

      const data = await portalsService.getParentChildReceipts(schoolId, parentUserId, studentProfileId);
      res.status(200).json({ success: true, data });
    } catch (err) {
      next(err);
    }
  }

  async getParentChildMeetings(req: Request, res: Response, next: NextFunction) {
    try {
      const schoolId = req.schoolId || (req.user as any)?.schoolId;
      const parentUserId = (req.user as any)?.id || (req.user as any)?.userId;
      const studentProfileId = req.params.studentProfileId;
      if (!schoolId || !parentUserId || !studentProfileId) {
        throw new AppError('Missing required parameter studentProfileId', 400);
      }

      const data = await portalsService.getParentChildMeetings(schoolId, parentUserId, studentProfileId);
      res.status(200).json({ success: true, data });
    } catch (err) {
      next(err);
    }
  }

  async getParentMessages(req: Request, res: Response, next: NextFunction) {
    try {
      const schoolId = req.schoolId || (req.user as any)?.schoolId;
      const parentUserId = (req.user as any)?.id || (req.user as any)?.userId;
      const studentProfileId = req.params.studentProfileId;
      if (!schoolId || !parentUserId || !studentProfileId) {
        throw new AppError('Missing required parameter studentProfileId', 400);
      }

      const data = await portalsService.getParentMessages(schoolId, parentUserId, studentProfileId);
      res.status(200).json({ success: true, data });
    } catch (err) {
      next(err);
    }
  }

  async sendParentMessage(req: Request, res: Response, next: NextFunction) {
    try {
      const schoolId = req.schoolId || (req.user as any)?.schoolId;
      const parentUserId = (req.user as any)?.id || (req.user as any)?.userId;
      const studentProfileId = req.params.studentProfileId;
      if (!schoolId || !parentUserId || !studentProfileId) {
        throw new AppError('Missing required parameter studentProfileId', 400);
      }

      const parsed = SendCommunicationMessageSchema.safeParse(req.body);
      if (!parsed.success) {
        throw new AppError('Validation failed: ' + parsed.error.issues.map((i) => i.message).join(', '), 422);
      }

      const msg = await portalsService.sendParentMessage(schoolId, parentUserId, studentProfileId, parsed.data);
      res.status(201).json({ success: true, data: msg });
    } catch (err) {
      next(err);
    }
  }

  // ==========================================================================
  // 3. TEACHER CONTROLLER
  // ==========================================================================

  async getTeacherDashboard(req: Request, res: Response, next: NextFunction) {
    try {
      const schoolId = req.schoolId || (req.user as any)?.schoolId;
      const teacherUserId = (req.user as any)?.id || (req.user as any)?.userId;
      if (!schoolId || !teacherUserId) throw new AppError('Tenant and authenticated context required', 400);

      const data = await portalsService.getTeacherDashboardTelemetry(schoolId, teacherUserId);
      res.status(200).json({ success: true, data });
    } catch (err) {
      next(err);
    }
  }

  async getTeacherAcademicReports(req: Request, res: Response, next: NextFunction) {
    try {
      const schoolId = req.schoolId || (req.user as any)?.schoolId;
      if (!schoolId) throw new AppError('Tenant context required', 400);

      const classId = req.query.classId as string | undefined;
      const subjectId = req.query.subjectId as string | undefined;

      const data = await portalsService.getTeacherAcademicPerformanceReports(schoolId, classId, subjectId);
      res.status(200).json({ success: true, data });
    } catch (err) {
      next(err);
    }
  }

  async getStudentRemarks(req: Request, res: Response, next: NextFunction) {
    try {
      const schoolId = req.schoolId || (req.user as any)?.schoolId;
      const studentProfileId = req.params.studentProfileId;
      if (!schoolId || !studentProfileId) throw new AppError('Missing studentProfileId', 400);

      const data = await portalsService.getStudentRemarks(schoolId, studentProfileId);
      res.status(200).json({ success: true, data });
    } catch (err) {
      next(err);
    }
  }

  async addStudentRemark(req: Request, res: Response, next: NextFunction) {
    try {
      const schoolId = req.schoolId || (req.user as any)?.schoolId;
      const teacherUserId = (req.user as any)?.id || (req.user as any)?.userId;
      if (!schoolId || !teacherUserId) throw new AppError('Tenant and authenticated context required', 400);

      const parsed = AddStudentRemarkSchema.safeParse(req.body);
      if (!parsed.success) {
        throw new AppError('Validation failed: ' + parsed.error.issues.map((i) => i.message).join(', '), 422);
      }

      const remark = await portalsService.addStudentRemark(schoolId, teacherUserId, parsed.data);
      res.status(201).json({ success: true, data: remark });
    } catch (err) {
      next(err);
    }
  }

  async getTeacherMeetings(req: Request, res: Response, next: NextFunction) {
    try {
      const schoolId = req.schoolId || (req.user as any)?.schoolId;
      const userId = (req.user as any)?.id || (req.user as any)?.userId;
      const userRole = (req.user as any)?.role;
      if (!schoolId || !userId) throw new AppError('Tenant and authenticated context required', 400);

      const status = req.query.status as string | undefined;
      const data = await portalsService.getTeacherMeetings(schoolId, userId, userRole, status);
      res.status(200).json({ success: true, data });
    } catch (err) {
      next(err);
    }
  }

  async scheduleMeeting(req: Request, res: Response, next: NextFunction) {
    try {
      const schoolId = req.schoolId || (req.user as any)?.schoolId;
      const hostUserId = (req.user as any)?.id || (req.user as any)?.userId;
      const userRole = (req.user as any)?.role;
      if (!schoolId || !hostUserId) throw new AppError('Tenant and authenticated context required', 400);

      const parsed = ScheduleMeetingSchema.safeParse(req.body);
      if (!parsed.success) {
        throw new AppError('Validation failed: ' + parsed.error.issues.map((i) => i.message).join(', '), 422);
      }

      const meeting = await portalsService.scheduleMeeting(schoolId, hostUserId, userRole, parsed.data);
      res.status(201).json({ success: true, data: meeting });
    } catch (err) {
      next(err);
    }
  }

  async updateMeeting(req: Request, res: Response, next: NextFunction) {
    try {
      const schoolId = req.schoolId || (req.user as any)?.schoolId;
      const userId = (req.user as any)?.id || (req.user as any)?.userId;
      const userRole = (req.user as any)?.role;
      const meetingId = req.params.id;
      if (!schoolId || !meetingId) throw new AppError('Missing meetingId', 400);

      const parsed = UpdateMeetingStatusSchema.safeParse(req.body);
      if (!parsed.success) {
        throw new AppError('Validation failed: ' + parsed.error.issues.map((i) => i.message).join(', '), 422);
      }

      const updated = await portalsService.updateMeeting(schoolId, userId, userRole, meetingId, parsed.data);
      res.status(200).json({ success: true, data: updated });
    } catch (err) {
      next(err);
    }
  }

  async deleteMeeting(req: Request, res: Response, next: NextFunction) {
    try {
      const schoolId = req.schoolId || (req.user as any)?.schoolId;
      const userId = (req.user as any)?.id || (req.user as any)?.userId;
      const userRole = (req.user as any)?.role;
      const meetingId = req.params.id;
      if (!schoolId || !meetingId) throw new AppError('Missing meetingId', 400);

      const data = await portalsService.deleteMeeting(schoolId, userId, userRole, meetingId);
      res.status(200).json({ success: true, data });
    } catch (err) {
      next(err);
    }
  }

  // ==========================================================================
  // 4. LIBRARY CONTROLLER
  // ==========================================================================

  async listLibraryBooks(req: Request, res: Response, next: NextFunction) {
    try {
      const schoolId = req.schoolId || (req.user as any)?.schoolId;
      if (!schoolId) throw new AppError('Tenant context required', 400);

      const search = req.query.search as string | undefined;
      const category = req.query.category as string | undefined;

      const books = await portalsService.listLibraryBooks(schoolId, search, category);
      res.status(200).json({ success: true, data: books });
    } catch (err) {
      next(err);
    }
  }

  async createLibraryBook(req: Request, res: Response, next: NextFunction) {
    try {
      const schoolId = req.schoolId || (req.user as any)?.schoolId;
      if (!schoolId) throw new AppError('Tenant context required', 400);

      const parsed = CreateLibraryBookSchema.safeParse(req.body);
      if (!parsed.success) {
        throw new AppError('Validation failed: ' + parsed.error.issues.map((i) => i.message).join(', '), 422);
      }

      const book = await portalsService.createLibraryBook(schoolId, parsed.data);
      res.status(201).json({ success: true, data: book });
    } catch (err) {
      next(err);
    }
  }

  async issueBook(req: Request, res: Response, next: NextFunction) {
    try {
      const schoolId = req.schoolId || (req.user as any)?.schoolId;
      if (!schoolId) throw new AppError('Tenant context required', 400);

      const parsed = IssueBookSchema.safeParse(req.body);
      if (!parsed.success) {
        throw new AppError('Validation failed: ' + parsed.error.issues.map((i) => i.message).join(', '), 422);
      }

      const issue = await portalsService.issueBook(schoolId, parsed.data);
      res.status(201).json({ success: true, data: issue });
    } catch (err) {
      next(err);
    }
  }

  async returnBook(req: Request, res: Response, next: NextFunction) {
    try {
      const schoolId = req.schoolId || (req.user as any)?.schoolId;
      const issueId = req.params.issueId;
      if (!schoolId || !issueId) throw new AppError('Missing issueId', 400);

      const fineAmount = req.body?.fineAmount ? Number(req.body.fineAmount) : 0;
      const returned = await portalsService.returnBook(schoolId, issueId, fineAmount);
      res.status(200).json({ success: true, data: returned });
    } catch (err) {
      next(err);
    }
  }
}

export const portalsController = new PortalsController();

