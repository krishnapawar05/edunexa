import { Request, Response, NextFunction } from 'express';
import { websiteService } from './website.service.js';
import {
  UpdateWebsiteContentSchema,
  CreateHighlightSchema,
  CreateFacilitySchema,
  CreateAchievementSchema,
  CreateTestimonialSchema,
  CreateDocumentSchema,
  CreateGalleryCategorySchema,
  CreateGalleryItemSchema,
  ApiSuccessResponse,
} from '@edunexa/shared';

export class WebsiteController {
  // ==========================================================================
  // PUBLIC WEBSITE ENDPOINTS
  // ==========================================================================

  async getPublicWebsiteData(req: Request, res: Response, next: NextFunction) {
    try {
      const identifierOrHost =
        (req.query.schoolIdentifier as string) ||
        (req.headers['x-school-slug'] as string) ||
        req.headers.host;

      const data = await websiteService.getPublicWebsiteData(identifierOrHost);
      const response: ApiSuccessResponse<typeof data> = {
        success: true,
        data,
      };
      res.status(200).json(response);
    } catch (err) {
      next(err);
    }
  }

  async getPublicGalleryCategories(req: Request, res: Response, next: NextFunction) {
    try {
      const identifierOrHost =
        (req.query.schoolIdentifier as string) ||
        (req.headers['x-school-slug'] as string) ||
        req.headers.host;

      const school = await websiteService.resolveSchool(identifierOrHost);
      if (!school) {
        res.status(200).json({ success: true, data: [] });
        return;
      }

      await websiteService.ensureInitialContent(school.id);
      const categories = await websiteService.getGalleryCategories(school.id, true);
      res.status(200).json({ success: true, data: categories });
    } catch (err) {
      next(err);
    }
  }

  async getPublicGalleryItems(req: Request, res: Response, next: NextFunction) {
    try {
      const identifierOrHost =
        (req.query.schoolIdentifier as string) ||
        (req.headers['x-school-slug'] as string) ||
        req.headers.host;

      const school = await websiteService.resolveSchool(identifierOrHost);
      if (!school) {
        res.status(200).json({ success: true, data: { items: [], total: 0, page: 1, limit: 20, totalPages: 0 } });
        return;
      }

      await websiteService.ensureInitialContent(school.id);

      const categorySlug = (req.query.categoryId as string) || (req.query.category as string) || undefined;
      const categoryId = req.query.categoryId as string | undefined;
      const mediaType = req.query.mediaType as string | undefined;
      const page = req.query.page ? parseInt(req.query.page as string, 10) : 1;
      const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : 24;

      const result = await websiteService.getGalleryItems(school.id, {
        categorySlug,
        categoryId,
        mediaType,
        page,
        limit,
        publicOnly: true,
      });

      res.status(200).json({ success: true, data: result });
    } catch (err) {
      next(err);
    }
  }

  async getPublicDocuments(req: Request, res: Response, next: NextFunction) {
    try {
      const identifierOrHost =
        (req.query.schoolIdentifier as string) ||
        (req.headers['x-school-slug'] as string) ||
        req.headers.host;

      const school = await websiteService.resolveSchool(identifierOrHost);
      if (!school) {
        res.status(200).json({ success: true, data: [] });
        return;
      }

      await websiteService.ensureInitialContent(school.id);
      const docs = await websiteService.getAdminWebsiteData(school.id);
      res.status(200).json({ success: true, data: docs.documents.filter((d: any) => d.isPublished) });
    } catch (err) {
      next(err);
    }
  }

  // ==========================================================================
  // ADMIN CMS ENDPOINTS
  // ==========================================================================

  async getAdminWebsiteData(req: Request, res: Response, next: NextFunction) {
    try {
      const schoolId = req.user!.schoolId!;
      const data = await websiteService.getAdminWebsiteData(schoolId);
      res.status(200).json({ success: true, data });
    } catch (err) {
      next(err);
    }
  }

  async updateWebsiteContent(req: Request, res: Response, next: NextFunction) {
    try {
      const schoolId = req.user!.schoolId!;
      const parsed = UpdateWebsiteContentSchema.parse(req.body);
      const updated = await websiteService.updateWebsiteContent(schoolId, parsed);
      res.status(200).json({ success: true, data: updated });
    } catch (err) {
      next(err);
    }
  }

  async updateSchoolBranding(req: Request, res: Response, next: NextFunction) {
    try {
      const schoolId = req.user!.schoolId!;
      const updated = await websiteService.updateSchoolBranding(schoolId, req.body);
      res.status(200).json({ success: true, data: updated });
    } catch (err) {
      next(err);
    }
  }

  // Highlights
  async createHighlight(req: Request, res: Response, next: NextFunction) {
    try {
      const schoolId = req.user!.schoolId!;
      const parsed = CreateHighlightSchema.parse(req.body);
      const item = await websiteService.createHighlight(schoolId, parsed);
      res.status(201).json({ success: true, data: item });
    } catch (err) {
      next(err);
    }
  }

  async updateHighlight(req: Request, res: Response, next: NextFunction) {
    try {
      const schoolId = req.user!.schoolId!;
      const id = req.params.id;
      const item = await websiteService.updateHighlight(schoolId, id, req.body);
      res.status(200).json({ success: true, data: item });
    } catch (err) {
      next(err);
    }
  }

  async deleteHighlight(req: Request, res: Response, next: NextFunction) {
    try {
      const schoolId = req.user!.schoolId!;
      const id = req.params.id;
      await websiteService.deleteHighlight(schoolId, id);
      res.status(200).json({ success: true, message: 'Highlight deleted successfully.' });
    } catch (err) {
      next(err);
    }
  }

  // Facilities
  async createFacility(req: Request, res: Response, next: NextFunction) {
    try {
      const schoolId = req.user!.schoolId!;
      const parsed = CreateFacilitySchema.parse(req.body);
      const item = await websiteService.createFacility(schoolId, parsed);
      res.status(201).json({ success: true, data: item });
    } catch (err) {
      next(err);
    }
  }

  async updateFacility(req: Request, res: Response, next: NextFunction) {
    try {
      const schoolId = req.user!.schoolId!;
      const id = req.params.id;
      const item = await websiteService.updateFacility(schoolId, id, req.body);
      res.status(200).json({ success: true, data: item });
    } catch (err) {
      next(err);
    }
  }

  async deleteFacility(req: Request, res: Response, next: NextFunction) {
    try {
      const schoolId = req.user!.schoolId!;
      const id = req.params.id;
      await websiteService.deleteFacility(schoolId, id);
      res.status(200).json({ success: true, message: 'Facility deleted successfully.' });
    } catch (err) {
      next(err);
    }
  }

  // Achievements
  async createAchievement(req: Request, res: Response, next: NextFunction) {
    try {
      const schoolId = req.user!.schoolId!;
      const parsed = CreateAchievementSchema.parse(req.body);
      const item = await websiteService.createAchievement(schoolId, parsed);
      res.status(201).json({ success: true, data: item });
    } catch (err) {
      next(err);
    }
  }

  async updateAchievement(req: Request, res: Response, next: NextFunction) {
    try {
      const schoolId = req.user!.schoolId!;
      const id = req.params.id;
      const item = await websiteService.updateAchievement(schoolId, id, req.body);
      res.status(200).json({ success: true, data: item });
    } catch (err) {
      next(err);
    }
  }

  async deleteAchievement(req: Request, res: Response, next: NextFunction) {
    try {
      const schoolId = req.user!.schoolId!;
      const id = req.params.id;
      await websiteService.deleteAchievement(schoolId, id);
      res.status(200).json({ success: true, message: 'Achievement deleted successfully.' });
    } catch (err) {
      next(err);
    }
  }

  // Testimonials
  async createTestimonial(req: Request, res: Response, next: NextFunction) {
    try {
      const schoolId = req.user!.schoolId!;
      const parsed = CreateTestimonialSchema.parse(req.body);
      const item = await websiteService.createTestimonial(schoolId, parsed);
      res.status(201).json({ success: true, data: item });
    } catch (err) {
      next(err);
    }
  }

  async updateTestimonial(req: Request, res: Response, next: NextFunction) {
    try {
      const schoolId = req.user!.schoolId!;
      const id = req.params.id;
      const item = await websiteService.updateTestimonial(schoolId, id, req.body);
      res.status(200).json({ success: true, data: item });
    } catch (err) {
      next(err);
    }
  }

  async deleteTestimonial(req: Request, res: Response, next: NextFunction) {
    try {
      const schoolId = req.user!.schoolId!;
      const id = req.params.id;
      await websiteService.deleteTestimonial(schoolId, id);
      res.status(200).json({ success: true, message: 'Testimonial deleted successfully.' });
    } catch (err) {
      next(err);
    }
  }

  // Documents
  async createDocument(req: Request, res: Response, next: NextFunction) {
    try {
      const schoolId = req.user!.schoolId!;
      const parsed = CreateDocumentSchema.parse(req.body);
      const item = await websiteService.createDocument(schoolId, parsed);
      res.status(201).json({ success: true, data: item });
    } catch (err) {
      next(err);
    }
  }

  async updateDocument(req: Request, res: Response, next: NextFunction) {
    try {
      const schoolId = req.user!.schoolId!;
      const id = req.params.id;
      const item = await websiteService.updateDocument(schoolId, id, req.body);
      res.status(200).json({ success: true, data: item });
    } catch (err) {
      next(err);
    }
  }

  async deleteDocument(req: Request, res: Response, next: NextFunction) {
    try {
      const schoolId = req.user!.schoolId!;
      const id = req.params.id;
      await websiteService.deleteDocument(schoolId, id);
      res.status(200).json({ success: true, message: 'Document deleted successfully.' });
    } catch (err) {
      next(err);
    }
  }

  // Gallery Categories
  async getAdminGalleryCategories(req: Request, res: Response, next: NextFunction) {
    try {
      const schoolId = req.user!.schoolId!;
      const categories = await websiteService.getGalleryCategories(schoolId, false);
      res.status(200).json({ success: true, data: categories });
    } catch (err) {
      next(err);
    }
  }

  async createGalleryCategory(req: Request, res: Response, next: NextFunction) {
    try {
      const schoolId = req.user!.schoolId!;
      const parsed = CreateGalleryCategorySchema.parse(req.body);
      const item = await websiteService.createGalleryCategory(schoolId, parsed);
      res.status(201).json({ success: true, data: item });
    } catch (err) {
      next(err);
    }
  }

  async updateGalleryCategory(req: Request, res: Response, next: NextFunction) {
    try {
      const schoolId = req.user!.schoolId!;
      const id = req.params.id;
      const item = await websiteService.updateGalleryCategory(schoolId, id, req.body);
      res.status(200).json({ success: true, data: item });
    } catch (err) {
      next(err);
    }
  }

  async deleteGalleryCategory(req: Request, res: Response, next: NextFunction) {
    try {
      const schoolId = req.user!.schoolId!;
      const id = req.params.id;
      await websiteService.deleteGalleryCategory(schoolId, id);
      res.status(200).json({ success: true, message: 'Gallery category deleted successfully.' });
    } catch (err) {
      next(err);
    }
  }

  // Gallery Items
  async getAdminGalleryItems(req: Request, res: Response, next: NextFunction) {
    try {
      const schoolId = req.user!.schoolId!;
      const categorySlug = req.query.category as string | undefined;
      const mediaType = req.query.mediaType as string | undefined;
      const page = req.query.page ? parseInt(req.query.page as string, 10) : 1;
      const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : 50;

      const result = await websiteService.getGalleryItems(schoolId, {
        categorySlug,
        mediaType,
        page,
        limit,
        publicOnly: false,
      });

      res.status(200).json({ success: true, data: result });
    } catch (err) {
      next(err);
    }
  }

  async createGalleryItem(req: Request, res: Response, next: NextFunction) {
    try {
      const schoolId = req.user!.schoolId!;
      const parsed = CreateGalleryItemSchema.parse(req.body);
      const item = await websiteService.createGalleryItem(schoolId, parsed);
      res.status(201).json({ success: true, data: item });
    } catch (err) {
      next(err);
    }
  }

  async updateGalleryItem(req: Request, res: Response, next: NextFunction) {
    try {
      const schoolId = req.user!.schoolId!;
      const id = req.params.id;
      const item = await websiteService.updateGalleryItem(schoolId, id, req.body);
      res.status(200).json({ success: true, data: item });
    } catch (err) {
      next(err);
    }
  }

  async deleteGalleryItem(req: Request, res: Response, next: NextFunction) {
    try {
      const schoolId = req.user!.schoolId!;
      const id = req.params.id;
      await websiteService.deleteGalleryItem(schoolId, id);
      res.status(200).json({ success: true, message: 'Gallery item deleted successfully.' });
    } catch (err) {
      next(err);
    }
  }
}

export const websiteController = new WebsiteController();
