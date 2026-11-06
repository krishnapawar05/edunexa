import { Request, Response, NextFunction } from 'express';
import { storageService } from './storage.service.js';
import { SecureFileUploadSchema, SecureFileQuerySchema } from '@edunexa/shared';
import { AppError } from '../../middleware/errorHandler.js';

export class StorageController {
  async uploadFile(req: Request, res: Response, next: NextFunction) {
    try {
      const parsed = SecureFileUploadSchema.parse(req.body);

      // School context resolution
      const schoolId =
        req.schoolId ||
        req.user?.schoolId ||
        (req.headers['x-school-id'] as string) ||
        (req.body.schoolId as string);

      if (!schoolId) {
        throw new AppError('School tenant affiliation is required to store files.', 400, 'SCHOOL_ID_REQUIRED');
      }

      const uploaderId = req.user?.userId || null;
      const result = await storageService.uploadFile(schoolId, uploaderId, parsed);

      res.status(201).json({
        success: true,
        data: result,
        message: 'File uploaded and secured successfully with cryptographic checksum.',
      });
    } catch (err) {
      next(err);
    }
  }

  async getFile(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const { record, absolutePath } = await storageService.getFileForStream(id, req.user);

      // Security headers against MIME-sniffing and clickjacking
      res.setHeader('Content-Type', record.mimeType);
      res.setHeader('X-Content-Type-Options', 'nosniff');
      res.setHeader('Content-Security-Policy', "default-src 'none'");

      if (req.query.download === 'true') {
        res.setHeader('Content-Disposition', `attachment; filename="${record.originalName}"`);
      } else {
        res.setHeader('Content-Disposition', `inline; filename="${record.originalName}"`);
      }

      res.sendFile(absolutePath);
    } catch (err) {
      next(err);
    }
  }

  async getFileMetadata(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const { record } = await storageService.getFileForStream(id, req.user);

      res.status(200).json({
        success: true,
        data: record,
      });
    } catch (err) {
      next(err);
    }
  }

  async listFiles(req: Request, res: Response, next: NextFunction) {
    try {
      const schoolId =
        req.schoolId ||
        req.user?.schoolId ||
        (req.query.schoolId as string);

      if (!schoolId) {
        throw new AppError('School ID is required to list files.', 400, 'SCHOOL_ID_REQUIRED');
      }

      const query = SecureFileQuerySchema.parse(req.query);
      const result = await storageService.listFiles(schoolId, query);

      res.status(200).json({
        success: true,
        data: result,
      });
    } catch (err) {
      next(err);
    }
  }

  async deleteFile(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.user) {
        throw new AppError('Authentication required.', 401, 'UNAUTHORIZED');
      }

      const { id } = req.params;
      const result = await storageService.deleteFile(id, req.user);

      res.status(200).json({
        success: true,
        data: result,
        message: 'File record and physical storage purged successfully.',
      });
    } catch (err) {
      next(err);
    }
  }
}

export const storageController = new StorageController();

