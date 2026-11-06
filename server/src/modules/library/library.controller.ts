import { Request, Response, NextFunction } from 'express';
import { libraryService } from './library.service.js';
import {
  CreateLibraryBookSchema,
  UpdateLibraryBookSchema,
  IssueBookSchema,
  ReturnBookSchema,
  UpdateFineStatusSchema,
  UpdateLibrarySettingSchema,
} from '@edunexa/shared';
import { AppError } from '../../middleware/errorHandler.js';
import { prisma } from '../../config/db.js';

export class LibraryController {
  /**
   * Get Library Dashboard telemetry
   */
  async getDashboardStats(req: Request, res: Response, next: NextFunction) {
    try {
      const schoolId = req.schoolId || (req.user as any)?.schoolId;
      if (!schoolId) throw new AppError('Tenant school context required.', 400);

      const stats = await libraryService.getDashboardStats(schoolId);
      res.status(200).json({ success: true, data: stats });
    } catch (err) {
      next(err);
    }
  }

  /**
   * List books with search and filters
   */
  async listBooks(req: Request, res: Response, next: NextFunction) {
    try {
      const schoolId = req.schoolId || (req.user as any)?.schoolId;
      if (!schoolId) throw new AppError('Tenant school context required.', 400);

      const { search, category, status, language, page, limit } = req.query;
      const result = await libraryService.listBooks(schoolId, {
        search: search as string,
        category: category as string,
        status: status as string,
        language: language as string,
        page: page ? Number(page) : undefined,
        limit: limit ? Number(limit) : undefined,
      });

      res.status(200).json({ success: true, data: result });
    } catch (err) {
      next(err);
    }
  }

  /**
   * Retrieve single book details
   */
  async getBookById(req: Request, res: Response, next: NextFunction) {
    try {
      const schoolId = req.schoolId || (req.user as any)?.schoolId;
      if (!schoolId) throw new AppError('Tenant school context required.', 400);

      const book = await libraryService.getBookById(schoolId, req.params.id);
      res.status(200).json({ success: true, data: book });
    } catch (err) {
      next(err);
    }
  }

  /**
   * Add a new book to inventory
   */
  async createBook(req: Request, res: Response, next: NextFunction) {
    try {
      const schoolId = req.schoolId || (req.user as any)?.schoolId;
      if (!schoolId) throw new AppError('Tenant school context required.', 400);

      const parsed = CreateLibraryBookSchema.safeParse(req.body);
      if (!parsed.success) {
        throw new AppError(
          'Validation failed: ' + parsed.error.issues.map((i) => i.message).join(', '),
          422
        );
      }

      const book = await libraryService.createBook(schoolId, parsed.data);
      res.status(201).json({
        success: true,
        message: `Book '${book.title}' successfully cataloged in library.`,
        data: book,
      });
    } catch (err) {
      next(err);
    }
  }

  /**
   * Update book details or stock
   */
  async updateBook(req: Request, res: Response, next: NextFunction) {
    try {
      const schoolId = req.schoolId || (req.user as any)?.schoolId;
      if (!schoolId) throw new AppError('Tenant school context required.', 400);

      const parsed = UpdateLibraryBookSchema.safeParse(req.body);
      if (!parsed.success) {
        throw new AppError(
          'Validation failed: ' + parsed.error.issues.map((i) => i.message).join(', '),
          422
        );
      }

      const updated = await libraryService.updateBook(schoolId, req.params.id, parsed.data);
      res.status(200).json({
        success: true,
        message: 'Book record updated successfully.',
        data: updated,
      });
    } catch (err) {
      next(err);
    }
  }

  /**
   * Delete book record
   */
  async deleteBook(req: Request, res: Response, next: NextFunction) {
    try {
      const schoolId = req.schoolId || (req.user as any)?.schoolId;
      if (!schoolId) throw new AppError('Tenant school context required.', 400);

      await libraryService.deleteBook(schoolId, req.params.id);
      res.status(200).json({ success: true, message: 'Book deleted from catalog.' });
    } catch (err) {
      next(err);
    }
  }

  /**
   * Issue a book to a student
   */
  async issueBook(req: Request, res: Response, next: NextFunction) {
    try {
      const schoolId = req.schoolId || (req.user as any)?.schoolId;
      const userId = (req.user as any)?.id || (req.user as any)?.userId;
      if (!schoolId) throw new AppError('Tenant school context required.', 400);

      const parsed = IssueBookSchema.safeParse(req.body);
      if (!parsed.success) {
        throw new AppError(
          'Validation failed: ' + parsed.error.issues.map((i) => i.message).join(', '),
          422
        );
      }

      const issue = await libraryService.issueBook(schoolId, userId, parsed.data);
      res.status(201).json({
        success: true,
        message: `Book '${issue.book.title}' successfully issued to student.`,
        data: issue,
      });
    } catch (err) {
      next(err);
    }
  }

  /**
   * Return a book and process fines
   */
  async returnBook(req: Request, res: Response, next: NextFunction) {
    try {
      const schoolId = req.schoolId || (req.user as any)?.schoolId;
      if (!schoolId) throw new AppError('Tenant school context required.', 400);

      const parsed = ReturnBookSchema.safeParse(req.body);
      if (!parsed.success) {
        throw new AppError(
          'Validation failed: ' + parsed.error.issues.map((i) => i.message).join(', '),
          422
        );
      }

      const issue = await libraryService.returnBook(schoolId, req.params.issueId, parsed.data);
      res.status(200).json({
        success: true,
        message: `Book '${issue.book.title}' return recorded successfully. ${
          issue.fineAmount > 0 ? `Overdue fine: ₹${issue.fineAmount}` : 'No overdue fine.'
        }`,
        data: issue,
      });
    } catch (err) {
      next(err);
    }
  }

  /**
   * List all issues / transactions
   */
  async listIssues(req: Request, res: Response, next: NextFunction) {
    try {
      const schoolId = req.schoolId || (req.user as any)?.schoolId;
      if (!schoolId) throw new AppError('Tenant school context required.', 400);

      const { status, studentProfileId, bookId, search, overdueOnly, page, limit } = req.query;

      const result = await libraryService.listIssues(schoolId, {
        status: status as string,
        studentProfileId: studentProfileId as string,
        bookId: bookId as string,
        search: search as string,
        overdueOnly: overdueOnly === 'true',
        page: page ? Number(page) : undefined,
        limit: limit ? Number(limit) : undefined,
      });

      res.status(200).json({ success: true, data: result });
    } catch (err) {
      next(err);
    }
  }

  /**
   * Overdue books list
   */
  async getOverdueBooks(req: Request, res: Response, next: NextFunction) {
    try {
      const schoolId = req.schoolId || (req.user as any)?.schoolId;
      if (!schoolId) throw new AppError('Tenant school context required.', 400);

      const search = req.query.search as string;
      const result = await libraryService.getOverdueBooks(schoolId, search);
      res.status(200).json({ success: true, data: result });
    } catch (err) {
      next(err);
    }
  }

  /**
   * Update fine status (mark paid or waive)
   */
  async updateFineStatus(req: Request, res: Response, next: NextFunction) {
    try {
      const schoolId = req.schoolId || (req.user as any)?.schoolId;
      if (!schoolId) throw new AppError('Tenant school context required.', 400);

      const parsed = UpdateFineStatusSchema.safeParse(req.body);
      if (!parsed.success) {
        throw new AppError(
          'Validation failed: ' + parsed.error.issues.map((i) => i.message).join(', '),
          422
        );
      }

      const issue = await libraryService.updateFineStatus(schoolId, req.params.issueId, parsed.data);
      res.status(200).json({
        success: true,
        message: `Fine status updated to ${issue.fineStatus}.`,
        data: issue,
      });
    } catch (err) {
      next(err);
    }
  }

  /**
   * Student library history (supports role-based isolation)
   */
  async getStudentHistory(req: Request, res: Response, next: NextFunction) {
    try {
      const schoolId = req.schoolId || (req.user as any)?.schoolId;
      const user = req.user as any;
      if (!schoolId || !user) throw new AppError('Authenticated tenant context required.', 400);

      const studentProfileId = req.params.studentProfileId;

      // Access control check:
      // If user is STUDENT, they can only view their own profile
      if (user.role === 'STUDENT') {
        const studentProfile = await prisma.studentProfile.findFirst({
          where: { membershipId: user.membershipId || user.id },
        });
        if (!studentProfile || studentProfile.id !== studentProfileId) {
          throw new AppError('Access forbidden: Students can only access their own library history.', 403);
        }
      }

      // If user is PARENT, they can only view their linked wards
      if (user.role === 'PARENT') {
        const link = await prisma.parentStudentLink.findFirst({
          where: {
            parentMembershipId: user.membershipId || user.id,
            studentProfileId,
          },
        });
        if (!link) {
          throw new AppError('Access forbidden: Guardians can only view library records of linked children.', 403);
        }
      }

      const history = await libraryService.getStudentHistory(schoolId, studentProfileId);
      res.status(200).json({ success: true, data: history });
    } catch (err) {
      next(err);
    }
  }

  /**
   * Authenticated student self-service library endpoint
   */
  async getMyLibraryHistory(req: Request, res: Response, next: NextFunction) {
    try {
      const schoolId = req.schoolId || (req.user as any)?.schoolId;
      const user = req.user as any;
      if (!schoolId || !user) throw new AppError('Authenticated tenant context required.', 400);

      const studentProfile = await prisma.studentProfile.findFirst({
        where: { membershipId: user.membershipId || user.id },
      });

      if (!studentProfile) {
        throw new AppError('No student profile associated with this account.', 404);
      }

      const history = await libraryService.getStudentHistory(schoolId, studentProfile.id);
      res.status(200).json({ success: true, data: history });
    } catch (err) {
      next(err);
    }
  }

  /**
   * Library Settings
   */
  async getSettings(req: Request, res: Response, next: NextFunction) {
    try {
      const schoolId = req.schoolId || (req.user as any)?.schoolId;
      if (!schoolId) throw new AppError('Tenant school context required.', 400);

      const settings = await libraryService.getSettings(schoolId);
      res.status(200).json({ success: true, data: settings });
    } catch (err) {
      next(err);
    }
  }

  async updateSettings(req: Request, res: Response, next: NextFunction) {
    try {
      const schoolId = req.schoolId || (req.user as any)?.schoolId;
      if (!schoolId) throw new AppError('Tenant school context required.', 400);

      const parsed = UpdateLibrarySettingSchema.safeParse(req.body);
      if (!parsed.success) {
        throw new AppError(
          'Validation failed: ' + parsed.error.issues.map((i) => i.message).join(', '),
          422
        );
      }

      const updated = await libraryService.updateSettings(schoolId, parsed.data);
      res.status(200).json({
        success: true,
        message: 'Library configuration updated successfully.',
        data: updated,
      });
    } catch (err) {
      next(err);
    }
  }

  /**
   * Library Reports
   */
  async generateReport(req: Request, res: Response, next: NextFunction) {
    try {
      const schoolId = req.schoolId || (req.user as any)?.schoolId;
      if (!schoolId) throw new AppError('Tenant school context required.', 400);

      const { reportType, category, startDate, endDate, status } = req.query;
      if (!reportType) throw new AppError('Report type is required.', 400);

      const report = await libraryService.generateReport(schoolId, reportType as string, {
        category: category as string,
        startDate: startDate as string,
        endDate: endDate as string,
        status: status as string,
      });

      res.status(200).json({ success: true, data: report });
    } catch (err) {
      next(err);
    }
  }

  /**
   * Seed 30 sample books & realistic demo transactions
   */
  async seedSampleData(req: Request, res: Response, next: NextFunction) {
    try {
      const schoolId = req.schoolId || (req.user as any)?.schoolId;
      if (!schoolId) throw new AppError('Tenant school context required.', 400);

      const result = await libraryService.seedSampleBooks(schoolId);
      res.status(200).json({
        success: true,
        message: `Successfully seeded ${result.seededBooksCount} books across ${result.categoriesCount} categories and created realistic sample lending transactions.`,
        data: result,
      });
    } catch (err) {
      next(err);
    }
  }
}

export const libraryController = new LibraryController();
