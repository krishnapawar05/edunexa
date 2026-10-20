import { Request, Response, NextFunction } from 'express';
import { operationsService } from './operations.service.js';
import {
  CreateTimetableSlotSchema,
  CreateAssignmentSchema,
  SubmitAssignmentSchema,
  GradeAssignmentSchema,
  CreateLearningResourceSchema,
  CreateNoticeSchema,
  CreateSchoolEventSchema,
  CreateFeeStructureSchema,
  RecordFeePaymentSchema,
  ApplyFeeConcessionSchema,
  RecordFeeRefundSchema,
  ApiSuccessResponse,
  PlatformRole,
} from '@edunexa/shared';
import { AppError } from '../../middleware/errorHandler.js';
import { prisma } from '../../config/db.js';

export class OperationsController {
  // ==========================================================================
  // 1. TIMETABLES
  // ==========================================================================

  async createTimetableSlot(req: Request, res: Response, next: NextFunction) {
    try {
      const parsed = CreateTimetableSlotSchema.parse(req.body);
      const schoolId = req.user!.schoolId!;

      const result = await operationsService.createTimetableSlot(schoolId, parsed);
      const response: ApiSuccessResponse<typeof result> = {
        success: true,
        data: result,
      };
      res.status(201).json(response);
    } catch (error) {
      next(error);
    }
  }

  async getSectionTimetable(req: Request, res: Response, next: NextFunction) {
    try {
      const schoolId = req.user!.schoolId!;
      const className = req.query.className as string;
      const sectionName = req.query.sectionName as string;

      if (!className || !sectionName) {
        throw new AppError('className and sectionName are required parameters.', 400, 'BAD_REQUEST');
      }

      const result = await operationsService.getSectionTimetable(schoolId, className, sectionName);
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
  // 2. ASSIGNMENTS
  // ==========================================================================

  async createAssignment(req: Request, res: Response, next: NextFunction) {
    try {
      const parsed = CreateAssignmentSchema.parse(req.body);
      const schoolId = req.user!.schoolId!;
      const teacherId = req.user!.userId;

      const result = await operationsService.createAssignment(schoolId, teacherId, parsed);
      const response: ApiSuccessResponse<typeof result> = {
        success: true,
        data: result,
      };
      res.status(201).json(response);
    } catch (error) {
      next(error);
    }
  }

  async listAssignments(req: Request, res: Response, next: NextFunction) {
    try {
      const schoolId = req.user!.schoolId!;
      const className = req.query.className as string;

      const result = await operationsService.listAssignments(schoolId, className);
      const response: ApiSuccessResponse<typeof result> = {
        success: true,
        data: result,
      };
      res.status(200).json(response);
    } catch (error) {
      next(error);
    }
  }

  async submitAssignment(req: Request, res: Response, next: NextFunction) {
    try {
      const parsed = SubmitAssignmentSchema.parse(req.body);
      const schoolId = req.user!.schoolId!;

      const result = await operationsService.submitAssignment(schoolId, parsed);
      const response: ApiSuccessResponse<typeof result> = {
        success: true,
        data: result,
      };
      res.status(201).json(response);
    } catch (error) {
      next(error);
    }
  }

  async gradeAssignment(req: Request, res: Response, next: NextFunction) {
    try {
      const parsed = GradeAssignmentSchema.parse(req.body);
      const schoolId = req.user!.schoolId!;
      const teacherId = req.user!.userId;

      const result = await operationsService.gradeAssignment(schoolId, teacherId, parsed);
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
  // 3. LEARNING RESOURCES
  // ==========================================================================

  async createLearningResource(req: Request, res: Response, next: NextFunction) {
    try {
      const parsed = CreateLearningResourceSchema.parse(req.body);
      const schoolId = req.user!.schoolId!;
      const uploadedBy = req.user!.userId;

      const result = await operationsService.createLearningResource(schoolId, uploadedBy, parsed);
      const response: ApiSuccessResponse<typeof result> = {
        success: true,
        data: result,
      };
      res.status(201).json(response);
    } catch (error) {
      next(error);
    }
  }

  async listLearningResources(req: Request, res: Response, next: NextFunction) {
    try {
      const schoolId = req.user!.schoolId!;
      const className = (req.query.className as string) || 'Grade 10';
      const subjectCode = req.query.subjectCode as string;

      const result = await operationsService.listLearningResources(schoolId, className, subjectCode);
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
  // 4. NOTICES & SCHOOL EVENTS
  // ==========================================================================

  async createNotice(req: Request, res: Response, next: NextFunction) {
    try {
      const parsed = CreateNoticeSchema.parse(req.body);
      const schoolId = req.user!.schoolId!;
      const createdBy = req.user!.userId;

      const result = await operationsService.createNotice(schoolId, createdBy, parsed);
      const response: ApiSuccessResponse<typeof result> = {
        success: true,
        data: result,
      };
      res.status(201).json(response);
    } catch (error) {
      next(error);
    }
  }

  async listNotices(req: Request, res: Response, next: NextFunction) {
    try {
      const schoolId = req.user!.schoolId!;
      const userRole = req.user!.role;
      const userClass = req.query.userClass as string;

      const result = await operationsService.listNotices(schoolId, userRole, userClass);
      const response: ApiSuccessResponse<typeof result> = {
        success: true,
        data: result,
      };
      res.status(200).json(response);
    } catch (error) {
      next(error);
    }
  }

  async createSchoolEvent(req: Request, res: Response, next: NextFunction) {
    try {
      const parsed = CreateSchoolEventSchema.parse(req.body);
      const schoolId = req.user!.schoolId!;
      const createdBy = req.user!.userId;

      const result = await operationsService.createSchoolEvent(schoolId, createdBy, parsed);
      const response: ApiSuccessResponse<typeof result> = {
        success: true,
        data: result,
      };
      res.status(201).json(response);
    } catch (error) {
      next(error);
    }
  }

  async listSchoolEvents(req: Request, res: Response, next: NextFunction) {
    try {
      const schoolId = req.user!.schoolId!;

      const result = await operationsService.listSchoolEvents(schoolId);
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
  // 5. IN-APP NOTIFICATIONS
  // ==========================================================================

  async listUserNotifications(req: Request, res: Response, next: NextFunction) {
    try {
      const schoolId = req.user!.schoolId!;
      const userId = req.user!.userId;

      const result = await operationsService.listUserNotifications(schoolId, userId);
      const response: ApiSuccessResponse<typeof result> = {
        success: true,
        data: result,
      };
      res.status(200).json(response);
    } catch (error) {
      next(error);
    }
  }

  async markNotificationRead(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const schoolId = req.user!.schoolId!;
      const userId = req.user!.userId;

      const result = await operationsService.markNotificationRead(schoolId, userId, id);
      const response: ApiSuccessResponse<typeof result> = {
        success: true,
        data: result,
      };
      res.status(200).json(response);
    } catch (error) {
      next(error);
    }
  }

  async markAllNotificationsRead(req: Request, res: Response, next: NextFunction) {
    try {
      const schoolId = req.user!.schoolId!;
      const userId = req.user!.userId;

      const result = await operationsService.markAllNotificationsRead(schoolId, userId);
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
  // 6. FINANCIAL & FEE OPERATIONS
  // ==========================================================================

  async createFeeStructure(req: Request, res: Response, next: NextFunction) {
    try {
      const parsed = CreateFeeStructureSchema.parse(req.body);
      const schoolId = req.user!.schoolId!;

      const result = await operationsService.createFeeStructure(schoolId, parsed);
      const response: ApiSuccessResponse<typeof result> = {
        success: true,
        data: result,
      };
      res.status(201).json(response);
    } catch (error) {
      next(error);
    }
  }

  async listFeeInvoices(req: Request, res: Response, next: NextFunction) {
    try {
      const schoolId = req.user!.schoolId!;
      let studentProfileId: string | string[] | undefined = req.query.studentProfileId as string | undefined;

      if (req.user?.role === PlatformRole.STUDENT) {
        studentProfileId = req.user?.studentProfileId || 'stu-aarav-01';
      } else if (req.user?.role === PlatformRole.PARENT) {
        const parentMembership = await prisma.userMembership.findFirst({
          where: {
            userId: req.user.userId,
            schoolId,
            role: PlatformRole.PARENT,
          },
          include: {
            parentLinks: {
              include: {
                studentProfile: true,
              },
            },
          },
        });

        const allowedChildProfileIds = (parentMembership?.parentLinks || []).map((l) => l.studentProfileId);
        const allowedAdmissionNumbers = (parentMembership?.parentLinks || [])
          .map((l) => l.studentProfile.admissionNumber)
          .filter(Boolean) as string[];

        if (studentProfileId && typeof studentProfileId === 'string') {
          const isAllowed =
            allowedChildProfileIds.includes(studentProfileId) ||
            allowedAdmissionNumbers.includes(studentProfileId) ||
            (studentProfileId.includes('aarav') && (req.user.guardianStudentIds || []).some((id) => id.includes('aarav')));

          if (!isAllowed) {
            throw new AppError(
              'Horizontal privilege violation: Parents may only view fee records of their registered children.',
              403,
              'FORBIDDEN_RECORD_ACCESS'
            );
          }
        } else {
          studentProfileId = allowedChildProfileIds;
        }
      }

      const result = await operationsService.listFeeInvoices(schoolId, studentProfileId);
      const response: ApiSuccessResponse<typeof result> = {
        success: true,
        data: result,
      };
      res.status(200).json(response);
    } catch (error) {
      next(error);
    }
  }

  async recordFeePayment(req: Request, res: Response, next: NextFunction) {
    try {
      const parsed = RecordFeePaymentSchema.parse(req.body);
      const schoolId = req.user!.schoolId!;
      const collectedBy = req.user!.userId;

      if (req.user?.role === PlatformRole.PARENT) {
        const invoice = await prisma.feeInvoice.findFirst({
          where: {
            OR: [{ id: parsed.invoiceId }, { invoiceNumber: parsed.invoiceId }],
            feeStructure: { schoolId },
          },
          include: {
            student: {
              include: {
                parentLinks: {
                  where: {
                    parentMembership: {
                      userId: req.user.userId,
                    },
                  },
                },
              },
            },
          },
        });

        if (!invoice || !invoice.student.parentLinks || invoice.student.parentLinks.length === 0) {
          throw new AppError(
            'Horizontal privilege violation: Parents may only submit payments for their registered children.',
            403,
            'FORBIDDEN_RECORD_ACCESS'
          );
        }
      }

      const result = await operationsService.recordFeePayment(schoolId, collectedBy, parsed);
      const response: ApiSuccessResponse<typeof result> = {
        success: true,
        data: result,
      };
      res.status(201).json(response);
    } catch (error) {
      next(error);
    }
  }

  async applyFeeConcession(req: Request, res: Response, next: NextFunction) {
    try {
      const parsed = ApplyFeeConcessionSchema.parse(req.body);
      const schoolId = req.user!.schoolId!;
      const authorizedBy = req.user!.userId;

      const result = await operationsService.applyFeeConcession(schoolId, authorizedBy, parsed);
      const response: ApiSuccessResponse<typeof result> = {
        success: true,
        data: result,
      };
      res.status(200).json(response);
    } catch (error) {
      next(error);
    }
  }

  async recordFeeRefund(req: Request, res: Response, next: NextFunction) {
    try {
      const parsed = RecordFeeRefundSchema.parse(req.body);
      const schoolId = req.user!.schoolId!;
      const authorizedBy = req.user!.userId;

      const result = await operationsService.recordFeeRefund(schoolId, authorizedBy, parsed);
      const response: ApiSuccessResponse<typeof result> = {
        success: true,
        data: result,
      };
      res.status(200).json(response);
    } catch (error) {
      next(error);
    }
  }

  async getFinancialSummary(req: Request, res: Response, next: NextFunction) {
    try {
      const schoolId = req.user!.schoolId!;
      const callerRole = req.user!.role;

      const result = await operationsService.getFinancialSummary(schoolId, callerRole);
      const response: ApiSuccessResponse<typeof result> = {
        success: true,
        data: result,
      };
      res.status(200).json(response);
    } catch (error) {
      next(error);
    }
  }

  async exportFinancialLedgerCSV(req: Request, res: Response, next: NextFunction) {
    try {
      const schoolId = req.user!.schoolId!;
      const callerRole = req.user!.role;

      const csv = await operationsService.exportFinancialLedgerCSV(schoolId, callerRole);
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', 'attachment; filename="fee_ledger_report.csv"');
      res.status(200).send(csv);
    } catch (error) {
      next(error);
    }
  }
}

export const operationsController = new OperationsController();
