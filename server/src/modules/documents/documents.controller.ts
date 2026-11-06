import { Request, Response, NextFunction } from 'express';
import { documentsService } from './documents.service.js';
import { prisma } from '../../config/db.js';
import { verifyAccessToken } from '../../utils/crypto.js';
import {
  CreateDownloadableDocSchema,
  UpdateDownloadableDocSchema,
  IssueCertificateSchema,
  UpdateCertificateStatusSchema,
  RecordDocumentAccessSchema,
} from '@edunexa/shared';
import { AppError } from '../../middleware/errorHandler.js';

export class DocumentsController {
  // ============================================================================
  // 1. PUBLIC DOWNLOAD CENTRE
  // ============================================================================

  async listPublicDocuments(req: Request, res: Response, next: NextFunction) {
    try {
      const schoolIdentifier =
        (req.query.schoolIdentifier as string) ||
        (req.query.schoolId as string) ||
        (req.headers['x-school-slug'] as string) ||
        'apex-academy';

      const { category, q } = req.query;

      const result = await documentsService.listPublicDocuments(schoolIdentifier, {
        category: category as string,
        query: q as string,
      });

      res.status(200).json({ success: true, data: result.documents, school: result.school });
    } catch (err) {
      next(err);
    }
  }

  async getPublicDocument(req: Request, res: Response, next: NextFunction) {
    try {
      const schoolIdentifier =
        (req.query.schoolIdentifier as string) ||
        (req.query.schoolId as string) ||
        (req.headers['x-school-slug'] as string) ||
        'apex-academy';

      const { id } = req.params;

      const document = await documentsService.getPublicDocument(schoolIdentifier, id);

      // Record access
      await documentsService.logDocumentAccess(
        document.schoolId,
        undefined,
        'PUBLIC',
        {
          documentType: 'PUBLIC_DOCUMENT',
          documentId: document.id,
          documentTitle: document.title,
          action: 'DOWNLOAD',
        },
        req.ip,
        req.headers['user-agent']
      );

      res.status(200).json({ success: true, data: document });
    } catch (err) {
      next(err);
    }
  }

  // ============================================================================
  // 2. ADMIN DOCUMENT MANAGEMENT
  // ============================================================================

  async createAdminDocument(req: Request, res: Response, next: NextFunction) {
    try {
      const schoolId = req.user!.schoolId!;
      const userId = req.user!.userId;
      const parsed = CreateDownloadableDocSchema.parse(req.body);

      const created = await documentsService.createAdminDocument(schoolId, userId, parsed);

      res.status(201).json({ success: true, data: created });
    } catch (err) {
      next(err);
    }
  }

  async listAdminDocuments(req: Request, res: Response, next: NextFunction) {
    try {
      const schoolId = req.user!.schoolId!;
      const { category, targetAudience, status, q } = req.query;

      const list = await documentsService.listAdminDocuments(schoolId, {
        category: category as string,
        targetAudience: targetAudience as string,
        publicationStatus: status as string,
        query: q as string,
      });

      res.status(200).json({ success: true, data: list });
    } catch (err) {
      next(err);
    }
  }

  async updateAdminDocument(req: Request, res: Response, next: NextFunction) {
    try {
      const schoolId = req.user!.schoolId!;
      const { id } = req.params;
      const parsed = UpdateDownloadableDocSchema.parse(req.body);

      const updated = await documentsService.updateAdminDocument(schoolId, id, parsed);

      res.status(200).json({ success: true, data: updated });
    } catch (err) {
      next(err);
    }
  }

  async deleteAdminDocument(req: Request, res: Response, next: NextFunction) {
    try {
      const schoolId = req.user!.schoolId!;
      const { id } = req.params;

      await documentsService.deleteAdminDocument(schoolId, id);

      res.status(200).json({ success: true, message: 'Document deleted successfully.' });
    } catch (err) {
      next(err);
    }
  }

  // ============================================================================
  // 3. STUDENT & PARENT ACADEMIC DOWNLOAD CENTRE
  // ============================================================================

  async getStudentAcademicDocuments(req: Request, res: Response, next: NextFunction) {
    try {
      const schoolId = req.user!.schoolId!;
      const userId = req.user!.userId;
      const role = req.user!.role;
      const { studentProfileId } = req.params;

      const result = await documentsService.getStudentAcademicDocuments(
        schoolId,
        studentProfileId,
        userId,
        role
      );

      res.status(200).json({ success: true, data: result });
    } catch (err) {
      next(err);
    }
  }

  // ============================================================================
  // 4. CERTIFICATES MANAGEMENT
  // ============================================================================

  async issueCertificate(req: Request, res: Response, next: NextFunction) {
    try {
      const schoolId = req.user!.schoolId!;
      const adminUserId = req.user!.userId;
      const parsed = IssueCertificateSchema.parse(req.body);

      const cert = await documentsService.issueCertificate(schoolId, adminUserId, parsed);

      res.status(201).json({ success: true, data: cert });
    } catch (err) {
      next(err);
    }
  }

  async listCertificates(req: Request, res: Response, next: NextFunction) {
    try {
      const schoolId = req.user!.schoolId!;
      const { certificateType, status, q } = req.query;

      const list = await documentsService.listCertificates(schoolId, {
        certificateType: certificateType as string,
        status: status as string,
        query: q as string,
      });

      res.status(200).json({ success: true, data: list });
    } catch (err) {
      next(err);
    }
  }

  async updateCertificateStatus(req: Request, res: Response, next: NextFunction) {
    try {
      const schoolId = req.user!.schoolId!;
      const { id } = req.params;
      const parsed = UpdateCertificateStatusSchema.parse(req.body);

      const updated = await documentsService.updateCertificateStatus(schoolId, id, parsed);

      res.status(200).json({ success: true, data: updated });
    } catch (err) {
      next(err);
    }
  }

  async verifyCertificatePublic(req: Request, res: Response, next: NextFunction) {
    try {
      const { qrToken } = req.params;

      const verified = await documentsService.verifyCertificatePublic(qrToken);

      res.status(200).json({ success: true, data: verified });
    } catch (err) {
      next(err);
    }
  }

  // ============================================================================
  // 5. AUDIT LOGGING
  // ============================================================================

  async recordAccess(req: Request, res: Response, next: NextFunction) {
    try {
      let schoolId = req.user?.schoolId;
      let userId = req.user?.userId;
      let role = req.user?.role;

      if (!userId && req.headers.authorization?.startsWith('Bearer ')) {
        try {
          const token = req.headers.authorization.split(' ')[1];
          const payload = verifyAccessToken(token);
          userId = payload.userId;
          role = payload.role;
          schoolId = payload.schoolId;
        } catch {}
      }

      if (!schoolId) {
        const defaultSchool = await prisma.school.findFirst();
        schoolId = defaultSchool?.id || '';
      }

      const parsed = RecordDocumentAccessSchema.parse(req.body);

      const logged = await documentsService.logDocumentAccess(
        schoolId,
        userId,
        role,
        parsed,
        req.ip,
        req.headers['user-agent']
      );

      res.status(201).json({ success: true, data: logged });
    } catch (err) {
      next(err);
    }
  }

  async getAccessLogs(req: Request, res: Response, next: NextFunction) {
    try {
      const schoolId = req.user!.schoolId!;
      const limit = Number(req.query.limit) || 50;

      const logs = await documentsService.getAccessLogs(schoolId, limit);

      res.status(200).json({ success: true, data: logs });
    } catch (err) {
      next(err);
    }
  }
}

export const documentsController = new DocumentsController();
