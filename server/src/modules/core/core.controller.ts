import { Request, Response, NextFunction } from 'express';
import { coreSchoolService } from './core.service.js';
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
      const { query, className, page, limit } = req.query;
      const result = await coreSchoolService.listStudents(req.schoolId!, {
        query: query as string,
        className: className as string,
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
      const schoolId = req.schoolId || req.body.schoolId || '92318ca5-473c-4436-a7cd-6b6eaadac413';
      const result = await coreSchoolService.submitAdmissionApplication(schoolId, req.body);
      res.status(201).json({ success: true, data: result });
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

  async getTeacherProfile(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const profile = await coreSchoolService.getTeacherProfile(req.schoolId!, req.user!.userId);
      res.status(200).json({ success: true, data: profile });
    } catch (err) {
      next(err);
    }
  }
}

export const coreSchoolController = new CoreSchoolController();
