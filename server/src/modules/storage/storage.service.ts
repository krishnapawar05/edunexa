import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { prisma } from '../../config/db.js';
import { AppError } from '../../middleware/errorHandler.js';
import { SecureFileUploadDTO, PlatformRole } from '@edunexa/shared';

const UPLOAD_ROOT_DIR = path.resolve(process.cwd(), 'uploads');
const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024; // 10MB

// Whitelist of strictly permitted MIME types and extensions
const ALLOWED_MIME_TYPES: Record<string, string[]> = {
  'image/jpeg': ['.jpg', '.jpeg'],
  'image/png': ['.png'],
  'image/webp': ['.webp'],
  'image/gif': ['.gif'],
  'image/svg+xml': ['.svg'],
  'application/pdf': ['.pdf'],
  'application/msword': ['.doc'],
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'],
  'text/csv': ['.csv'],
  'text/plain': ['.txt'],
};

export class StorageService {
  constructor() {
    this.ensureDirectoryExists(UPLOAD_ROOT_DIR);
    this.ensureDirectoryExists(path.join(UPLOAD_ROOT_DIR, 'public'));
    this.ensureDirectoryExists(path.join(UPLOAD_ROOT_DIR, 'secure'));
  }

  private ensureDirectoryExists(dirPath: string) {
    if (!fs.existsSync(dirPath)) {
      fs.mkdirSync(dirPath, { recursive: true });
    }
  }

  /**
   * Sanitizes a filename to prevent path traversal and shell injection
   */
  sanitizeFilename(rawFilename: string): string {
    const base = path.basename(rawFilename);
    // Strip dangerous characters, keep only alphanumerics, dots, dashes, underscores
    return base.replace(/[^a-zA-Z0-9._-]/g, '_').toLowerCase();
  }

  /**
   * Validates file buffer, size, MIME type, and extension
   */
  validateFile(filename: string, mimeType: string, fileBuffer: Buffer) {
    if (!fileBuffer || fileBuffer.length === 0) {
      throw new AppError('File payload is empty or missing.', 422, 'EMPTY_FILE');
    }

    if (fileBuffer.length > MAX_FILE_SIZE_BYTES) {
      throw new AppError(
        `File size (${(fileBuffer.length / (1024 * 1024)).toFixed(2)}MB) exceeds maximum permitted limit of 10MB.`,
        413,
        'FILE_TOO_LARGE'
      );
    }

    const cleanMime = mimeType.toLowerCase().trim();
    const validExtensions = ALLOWED_MIME_TYPES[cleanMime];

    if (!validExtensions) {
      throw new AppError(
        `File type '${cleanMime}' is not permitted. Permitted types: PDF, DOCX, XLSX, CSV, JPG, PNG, WEBP, SVG, TXT.`,
        415,
        'UNSUPPORTED_MEDIA_TYPE'
      );
    }

    const ext = path.extname(filename).toLowerCase();
    if (!validExtensions.includes(ext)) {
      throw new AppError(
        `File extension '${ext}' does not match declared MIME type '${cleanMime}'.`,
        422,
        'INVALID_FILE_EXTENSION'
      );
    }
  }

  /**
   * Uploads and secures a file payload with SHA-256 verification and path isolation
   */
  async uploadFile(
    schoolId: string,
    uploaderId: string | null,
    dto: SecureFileUploadDTO
  ) {
    // 1. Decode base64 buffer
    let fileBuffer: Buffer;
    try {
      // Strip base64 data prefix if present (e.g. data:image/png;base64,...)
      const cleanBase64 = dto.base64Data.replace(/^data:[a-zA-Z0-9/+-]+;base64,/, '');
      fileBuffer = Buffer.from(cleanBase64, 'base64');
    } catch {
      throw new AppError('Invalid Base64 file encoding.', 422, 'INVALID_BASE64');
    }

    // 2. Validate
    const sanitizedName = this.sanitizeFilename(dto.originalName);
    this.validateFile(sanitizedName, dto.mimeType, fileBuffer);

    // 3. Generate SHA-256 Checksum
    const checksum = crypto.createHash('sha256').update(fileBuffer).digest('hex');

    // 4. Partition storage (public vs secure tenant directory)
    const partition = dto.isPublic ? 'public' : path.join('secure', schoolId);
    const targetFolder = path.resolve(UPLOAD_ROOT_DIR, partition, dto.category.toLowerCase());
    this.ensureDirectoryExists(targetFolder);

    const uniqueId = crypto.randomUUID();
    const diskFileName = `${uniqueId}_${sanitizedName}`;
    const destinationPath = path.resolve(targetFolder, diskFileName);

    // Path traversal verification: ensure final path starts with UPLOAD_ROOT_DIR
    if (!destinationPath.startsWith(UPLOAD_ROOT_DIR)) {
      throw new AppError('Path traversal detected in destination filename.', 403, 'PATH_TRAVERSAL_DETECTED');
    }

    // 5. Write to disk
    fs.writeFileSync(destinationPath, fileBuffer);

    // 6. Verify uploader exists in database before linking foreign key
    let verifiedUploaderId = null;
    if (uploaderId) {
      try {
        const uExists = await prisma.user.findUnique({ where: { id: uploaderId }, select: { id: true } });
        if (uExists) verifiedUploaderId = uExists.id;
      } catch {
        verifiedUploaderId = null;
      }
    }

    // 7. Record metadata in PostgreSQL
    const relativeStoragePath = path.relative(UPLOAD_ROOT_DIR, destinationPath).replace(/\\/g, '/');

    const secureRecord = await prisma.secureFile.create({
      data: {
        id: uniqueId,
        schoolId,
        uploaderId: verifiedUploaderId,
        originalName: dto.originalName,
        sanitizedName,
        storagePath: relativeStoragePath,
        mimeType: dto.mimeType,
        fileSizeBytes: fileBuffer.length,
        isPublic: dto.isPublic ?? false,
        category: dto.category,
        checksum,
        metadata: dto.metadata || {},
      },
    });

    return {
      fileId: secureRecord.id,
      fileName: secureRecord.sanitizedName,
      fileSizeBytes: secureRecord.fileSizeBytes,
      mimeType: secureRecord.mimeType,
      isPublic: secureRecord.isPublic,
      category: secureRecord.category,
      checksum: secureRecord.checksum,
      downloadUrl: secureRecord.isPublic
        ? `/uploads/${relativeStoragePath}`
        : `/api/v1/storage/files/${secureRecord.id}`,
      createdAt: secureRecord.createdAt,
    };
  }

  /**
   * Retrieves a file for streaming with tenant and RBAC verification
   */
  async getFileForStream(fileId: string, user?: { userId: string; schoolId?: string; role: string }) {
    const record = await prisma.secureFile.findUnique({
      where: { id: fileId },
    });

    if (!record) {
      throw new AppError(`File record with ID '${fileId}' not found.`, 404, 'FILE_NOT_FOUND');
    }

    // Public files require no authentication
    if (!record.isPublic) {
      if (!user) {
        throw new AppError('Authentication required to access private institutional documents.', 401, 'UNAUTHORIZED');
      }

      // Super Admin has global oversight
      if (user.role !== PlatformRole.SUPER_ADMIN) {
        // Enforce strict tenant isolation
        if (!user.schoolId || user.schoolId !== record.schoolId) {
          throw new AppError('Access forbidden: You cannot access private files belonging to another school tenant.', 403, 'CROSS_TENANT_ACCESS_DENIED');
        }
      }
    }

    const absolutePath = path.resolve(UPLOAD_ROOT_DIR, record.storagePath);

    // Path traversal check
    if (!absolutePath.startsWith(UPLOAD_ROOT_DIR) || !fs.existsSync(absolutePath)) {
      throw new AppError('File content is missing or path traversal error occurred.', 404, 'FILE_ON_DISK_MISSING');
    }

    return {
      record,
      absolutePath,
    };
  }

  /**
   * List files for school with filters and pagination
   */
  async listFiles(
    schoolId: string,
    params: { category?: string; isPublic?: boolean; search?: string; page?: number; limit?: number }
  ) {
    const page = Math.max(1, params.page || 1);
    const limit = Math.min(100, Math.max(1, params.limit || 50));
    const skip = (page - 1) * limit;

    const where: any = { schoolId };
    if (params.category) where.category = params.category;
    if (params.isPublic !== undefined) where.isPublic = params.isPublic;
    if (params.search) {
      where.OR = [
        { originalName: { contains: params.search, mode: 'insensitive' } },
        { sanitizedName: { contains: params.search, mode: 'insensitive' } },
      ];
    }

    const [items, total] = await Promise.all([
      prisma.secureFile.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          uploader: {
            select: { id: true, email: true, firstName: true, lastName: true },
          },
        },
      }),
      prisma.secureFile.count({ where }),
    ]);

    return {
      items: items.map((f) => ({
        ...f,
        downloadUrl: f.isPublic
          ? `/uploads/${f.storagePath}`
          : `/api/v1/storage/files/${f.id}`,
      })),
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  /**
   * Deletes a file with physical filesystem cleanup and authorization check
   */
  async deleteFile(fileId: string, user: { userId: string; schoolId?: string; role: string }) {
    const record = await prisma.secureFile.findUnique({
      where: { id: fileId },
    });

    if (!record) {
      throw new AppError(`File record with ID '${fileId}' not found.`, 404, 'FILE_NOT_FOUND');
    }

    // Role check: Only Super Admin, School Admin, or the uploader can delete
    const isOwner = record.uploaderId === user.userId;
    const isAdmin = [PlatformRole.SUPER_ADMIN, PlatformRole.SCHOOL_ADMIN, PlatformRole.PRINCIPAL].includes(user.role as any);

    if (!isOwner && !isAdmin) {
      throw new AppError('You do not have administrative authorization to delete this file.', 403, 'FORBIDDEN');
    }

    if (user.role !== PlatformRole.SUPER_ADMIN && user.schoolId !== record.schoolId) {
      throw new AppError('Cross-tenant file deletion is forbidden.', 403, 'CROSS_TENANT_ACCESS_DENIED');
    }

    // Remove file on disk if exists
    const absolutePath = path.resolve(UPLOAD_ROOT_DIR, record.storagePath);
    if (fs.existsSync(absolutePath)) {
      try {
        fs.unlinkSync(absolutePath);
      } catch (err) {
        console.warn(`[StorageService] Failed to unlink file on disk (${absolutePath}):`, err);
      }
    }

    await prisma.secureFile.delete({
      where: { id: fileId },
    });

    return { success: true, deletedFileId: fileId };
  }
}

export const storageService = new StorageService();
