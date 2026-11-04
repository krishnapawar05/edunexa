import { Request, Response, NextFunction } from 'express';
import { coreSchoolService } from './core.service.js';
import { accountProvisioningService } from './provisioning.service.js';
import { ApiSuccessResponse } from '@edunexa/shared';

export class CoreSchoolController {
  async getAcademicStructure(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const data = await coreSchoolService.getAcademicStructure(req.schoolId!);
      res.status(200).json({ success: true, data });
    } catch (err) {
      next(err);
    }
  }

  async createAcademicSession(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const session = await coreSchoolService.createAcademicSession(req.schoolId!, req.body);
      res.status(201).json({ success: true, data: session });
    } catch (err) {
      next(err);
    }
  }

  async createClass(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const cls = await coreSchoolService.createClass(req.schoolId!, req.body);
      res.status(201).json({ success: true, data: cls });
    } catch (err) {
      next(err);
    }
  }

  async createSection(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const sec = await coreSchoolService.createSection(req.schoolId!, req.params.classId, req.body);
      res.status(201).json({ success: true, data: sec });
    } catch (err) {
      next(err);
    }
  }

  async createSubject(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const sub = await coreSchoolService.createSubject(req.schoolId!, req.params.classId, req.body);
      res.status(201).json({ success: true, data: sub });
    } catch (err) {
      next(err);
    }
  }

  async listStudents(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { query, className, sectionName, page, limit } = req.query;
      const result = await coreSchoolService.listStudents(req.schoolId!, {
        query: query as string,
        className: className as string,
        sectionName: sectionName as string,
        page: page ? parseInt(page as string, 10) : 1,
        limit: limit ? parseInt(limit as string, 10) : 10,
      });

      const response: ApiSuccessResponse<typeof result.items> = {
        success: true,
        data: result.items,
        meta: result.meta,
      };
      res.status(200).json(response);
    } catch (err) {
      next(err);
    }
  }

  async createStudent(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const student = await coreSchoolService.createStudent(req.schoolId!, req.body);
      res.status(201).json({ success: true, data: student });
    } catch (err) {
      next(err);
    }
  }

  async getStudentById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const student = await coreSchoolService.getStudentById(req.schoolId!, req.params.id);
      res.status(200).json({ success: true, data: student });
    } catch (err) {
      next(err);
    }
  }

  async listStaff(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { department, query, page, limit } = req.query;
      const result = await coreSchoolService.listStaff(req.schoolId!, {
        department: department as string,
        query: query as string,
        page: page ? parseInt(page as string, 10) : 1,
        limit: limit ? parseInt(limit as string, 10) : 10,
      });

      res.status(200).json({
        success: true,
        data: result.items,
        meta: result.meta,
      });
    } catch (err) {
      next(err);
    }
  }

  async createStaff(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const staff = await coreSchoolService.createStaff(req.schoolId!, req.body);
      res.status(201).json({ success: true, data: staff });
    } catch (err) {
      next(err);
    }
  }

  async assignTeacher(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await coreSchoolService.assignTeacher(req.schoolId!, req.body);
      res.status(200).json({ success: true, data: result });
    } catch (err) {
      next(err);
    }
  }

  async generateIdCard(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { holderType, profileId } = req.body;
      const card = await coreSchoolService.generateIdCard(req.schoolId!, holderType, profileId);
      res.status(201).json({ success: true, data: card });
    } catch (err) {
      next(err);
    }
  }

  async deactivateIdCard(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const { reason } = req.body;
      const card = await coreSchoolService.deactivateIdCard(req.schoolId!, id, reason);
      res.status(200).json({ success: true, data: card });
    } catch (err) {
      next(err);
    }
  }

  async verifyIdCardPublic(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { token } = req.params;
      const result = await coreSchoolService.verifyIdCardPublic(token);
      res.status(200).json({ success: true, data: result });
    } catch (err) {
      next(err);
    }
  }

  async listAdmissions(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { status } = req.query;
      const admissions = await coreSchoolService.listAdmissions(req.schoolId!, status as string);
      res.status(200).json({ success: true, data: admissions });
    } catch (err) {
      next(err);
    }
  }

  async reviewAdmission(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const result = await coreSchoolService.reviewAdmission(req.schoolId!, id, req.body);
      res.status(200).json({ success: true, data: result });
    } catch (err) {
      next(err);
    }
  }

  async submitAdmission(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const schoolIdentifier = req.schoolId || req.body.schoolId || req.body.schoolIdentifier || 'apex-academy';
      const result = await coreSchoolService.submitAdmissionApplication(schoolIdentifier, req.body);
      res.status(201).json({ success: true, data: result });
    } catch (err) {
      next(err);
    }
  }

  async getPublicFaculty(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const schoolIdentifier = (req.query.schoolIdentifier as string) || 'apex-academy';
      const faculty = await coreSchoolService.getPublicFaculty(schoolIdentifier);
      res.status(200).json({ success: true, data: faculty });
    } catch (err) {
      next(err);
    }
  }

  async getPublicEvents(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const schoolIdentifier = (req.query.schoolIdentifier as string) || 'apex-academy';
      const events = await coreSchoolService.getPublicEvents(schoolIdentifier);
      res.status(200).json({ success: true, data: events });
    } catch (err) {
      next(err);
    }
  }

  async getPublicNotices(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const schoolIdentifier = (req.query.schoolIdentifier as string) || 'apex-academy';
      const notices = await coreSchoolService.getPublicNotices(schoolIdentifier);
      res.status(200).json({ success: true, data: notices });
    } catch (err) {
      next(err);
    }
  }

  async getPublicDepartments(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const schoolIdentifier = (req.query.schoolIdentifier as string) || 'apex-academy';
      const departments = await coreSchoolService.getPublicDepartments(schoolIdentifier);
      res.status(200).json({ success: true, data: departments });
    } catch (err) {
      next(err);
    }
  }

  async getSchoolOverviewStats(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const stats = await coreSchoolService.getSchoolOverviewStats(req.schoolId!);
      res.status(200).json({ success: true, data: stats });
    } catch (err) {
      next(err);
    }
  }

  async updateStudent(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const updated = await coreSchoolService.updateStudent(req.schoolId!, id, req.body);
      res.status(200).json({ success: true, data: updated });
    } catch (err) {
      next(err);
    }
  }

  async deleteStudent(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const result = await coreSchoolService.deleteStudent(req.schoolId!, id);
      res.status(200).json({ success: true, data: result });
    } catch (err) {
      next(err);
    }
  }

  async updateStaffStatus(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const { status } = req.body;
      const updated = await coreSchoolService.updateStaffStatus(req.schoolId!, id, status);
      res.status(200).json({ success: true, data: updated });
    } catch (err) {
      next(err);
    }
  }

  async updateStaff(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const updated = await coreSchoolService.updateStaff(req.schoolId!, id, req.body);
      res.status(200).json({ success: true, data: updated });
    } catch (err) {
      next(err);
    }
  }

  async getTeacherProfile(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const profile = await coreSchoolService.getTeacherProfile(req.schoolId!, req.user!.userId);
      res.status(200).json({ success: true, data: profile });
    } catch (err) {
      next(err);
    }
  }

  async getParentChildren(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const children = await coreSchoolService.getParentChildren(req.schoolId!, req.user!.userId);
      res.status(200).json({ success: true, data: children });
    } catch (err) {
      next(err);
    }
  }

  async getStaffById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const staff = await coreSchoolService.getStaffById(req.schoolId!, req.params.id);
      res.status(200).json({ success: true, data: staff });
    } catch (err) {
      next(err);
    }
  }

  async triggerUserPasswordReset(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { userId } = req.params;
      const result = await coreSchoolService.triggerUserPasswordReset(
        req.schoolId!,
        userId,
        req.user!.userId
      );
      res.status(200).json({ success: true, data: result });
    } catch (err) {
      next(err);
    }
  }

  async updateUserAccountStatus(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { userId } = req.params;
      const { isActive, reason } = req.body;
      const result = await coreSchoolService.updateUserAccountStatus(
        req.schoolId!,
        userId,
        isActive,
        req.user!.userId,
        reason
      );
      res.status(200).json({ success: true, data: result });
    } catch (err) {
      next(err);
    }
  }

  async resendInvitation(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { invitationId } = req.params;
      const result = await coreSchoolService.resendInvitation(
        req.schoolId!,
        invitationId,
        req.user!.userId
      );
      res.status(200).json({ success: true, data: result });
    } catch (err) {
      next(err);
    }
  }

  async revokeInvitation(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { invitationId } = req.params;
      const { reason } = req.body;
      const result = await coreSchoolService.revokeInvitation(
        req.schoolId!,
        invitationId,
        req.user!.userId,
        reason
      );
      res.status(200).json({ success: true, data: result });
    } catch (err) {
      next(err);
    }
  }

  async listInvitations(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const status = req.query.status as string | undefined;
      const result = await accountProvisioningService.listInvitations(req.schoolId!, status);
      res.status(200).json({ success: true, data: result });
    } catch (err) {
      next(err);
    }
  }

  async bulkStudentActions(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { ids, action, params } = req.body;
      const result = await coreSchoolService.bulkStudentActions(
        req.schoolId!,
        action,
        ids,
        params,
        req.user?.userId
      );
      res.status(200).json({ success: true, data: result });
    } catch (err) {
      next(err);
    }
  }

  async bulkAdmissionsReview(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { ids, action, params } = req.body;
      const result = await coreSchoolService.bulkAdmissionsReview(
        req.schoolId!,
        action,
        ids,
        params,
        req.user?.userId
      );
      res.status(200).json({ success: true, data: result });
    } catch (err) {
      next(err);
    }
  }

  async bulkStaffActions(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { ids, action, params } = req.body;
      const result = await coreSchoolService.bulkStaffActions(
        req.schoolId!,
        action,
        ids,
        params,
        req.user?.userId
      );
      res.status(200).json({ success: true, data: result });
    } catch (err) {
      next(err);
    }
  }

  async listTenantAccounts(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { role, search, status, page, limit } = req.query;
      const result = await accountProvisioningService.listTenantUsers(req.schoolId!, {
        role: role as string,
        search: search as string,
        status: status as string,
        page: page ? Number(page) : undefined,
        limit: limit ? Number(limit) : undefined,
      });
      res.status(200).json({ success: true, data: result });
    } catch (err) {
      next(err);
    }
  }

  async adminResetPassword(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { userId } = req.params;
      const { temporaryPassword, mustChangePassword, reason } = req.body;
      const result = await accountProvisioningService.adminResetPassword({
        schoolId: req.schoolId,
        targetUserId: userId,
        temporaryPassword,
        mustChangePassword,
        actingUserId: req.user?.userId,
        actingUserRole: req.user!.role,
        reason,
      });
      res.status(200).json({
        success: true,
        data: result,
        message: result.message,
      });
    } catch (err) {
      next(err);
    }
  }

  async adminUnlockAccount(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { userId } = req.params;
      const { reason } = req.body;
      const result = await accountProvisioningService.adminUnlockAccount({
        schoolId: req.schoolId,
        targetUserId: userId,
        actingUserId: req.user?.userId,
        actingUserRole: req.user!.role,
        reason,
      });
      res.status(200).json({
        success: true,
        data: result,
        message: result.message,
      });
    } catch (err) {
      next(err);
    }
  }

  async bulkUserAccountActions(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { userIds, action, reason } = req.body;
      const result = await accountProvisioningService.bulkUserAccountActions({
        schoolId: req.schoolId!,
        userIds,
        action,
        actingUserId: req.user?.userId,
        actingUserRole: req.user!.role,
        reason,
      });
      res.status(200).json({ success: true, data: result });
    } catch (err) {
      next(err);
    }
  }
}

export const coreSchoolController = new CoreSchoolController();
