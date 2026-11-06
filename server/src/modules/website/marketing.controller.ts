import { Request, Response, NextFunction } from 'express';
import { prisma } from '../../config/db.js';
import { marketingService } from './marketing.service.js';
import {
  UpsertPageSEOSchema,
  UpdateMarketingIntegrationSchema,
  CreateBlogArticleSchema,
  UpdateBlogArticleSchema,
  CreateMarketingBannerSchema,
  UpdateMarketingBannerSchema,
  CreateCallbackRequestSchema,
  UpdateCallbackStatusSchema,
  NewsletterSubscribeSchema,
  CreateLeadFollowUpSchema,
  UpdateLeadFollowUpSchema,
  RecordAnalyticsEventSchema,
} from '@edunexa/shared';
import { AppError } from '../../middleware/errorHandler.js';

export class MarketingController {
  // ============================================================================
  // PUBLIC ENDPOINTS
  // ============================================================================

  async getPageSeo(req: Request, res: Response, next: NextFunction) {
    try {
      const schoolIdentifier = (req.headers['x-school-slug'] as string) || (req.query.schoolSlug as string);
      const pagePath = (req.query.path as string) || '/';
      const seo = await marketingService.getPageSeo(schoolIdentifier, pagePath);
      res.json({ success: true, data: seo });
    } catch (err) {
      next(err);
    }
  }

  async getSchemaMarkup(req: Request, res: Response, next: NextFunction) {
    try {
      const schoolIdentifier = (req.headers['x-school-slug'] as string) || (req.query.schoolSlug as string);
      const schema = await marketingService.getEducationalInstitutionSchema(schoolIdentifier);
      res.json({ success: true, data: schema });
    } catch (err) {
      next(err);
    }
  }

  async getSitemapXml(req: Request, res: Response, next: NextFunction) {
    try {
      const schoolIdentifier = (req.headers['x-school-slug'] as string) || (req.query.schoolSlug as string);
      const hostOrigin = `${req.protocol}://${req.get('host')}`;
      const xml = await marketingService.generateSitemapXml(schoolIdentifier, hostOrigin);
      res.header('Content-Type', 'application/xml');
      res.send(xml);
    } catch (err) {
      next(err);
    }
  }

  async getRobotsTxt(req: Request, res: Response, next: NextFunction) {
    try {
      const schoolIdentifier = (req.headers['x-school-slug'] as string) || (req.query.schoolSlug as string);
      const hostOrigin = `${req.protocol}://${req.get('host')}`;
      const robots = await marketingService.generateRobotsTxt(schoolIdentifier, hostOrigin);
      res.header('Content-Type', 'text/plain');
      res.send(robots);
    } catch (err) {
      next(err);
    }
  }

  async listPublicBlogs(req: Request, res: Response, next: NextFunction) {
    try {
      const schoolIdentifier = (req.headers['x-school-slug'] as string) || (req.query.schoolSlug as string);
      const result = await marketingService.listPublicBlogs(schoolIdentifier, req.query as any);
      res.json({ success: true, data: result.items, meta: { total: result.total, page: result.page, totalPages: result.totalPages } });
    } catch (err) {
      next(err);
    }
  }

  async getPublicBlogBySlug(req: Request, res: Response, next: NextFunction) {
    try {
      const schoolIdentifier = (req.headers['x-school-slug'] as string) || (req.query.schoolSlug as string);
      const { slug } = req.params;
      const result = await marketingService.getPublicBlogBySlug(schoolIdentifier, slug);
      res.json({ success: true, data: result });
    } catch (err) {
      next(err);
    }
  }

  async listPublicBanners(req: Request, res: Response, next: NextFunction) {
    try {
      const schoolIdentifier = (req.headers['x-school-slug'] as string) || (req.query.schoolSlug as string);
      const banners = await marketingService.listPublicBanners(schoolIdentifier);
      res.json({ success: true, data: banners });
    } catch (err) {
      next(err);
    }
  }

  async submitCallbackRequest(req: Request, res: Response, next: NextFunction) {
    try {
      const schoolIdentifier = (req.headers['x-school-slug'] as string) || (req.query.schoolSlug as string);
      const parsed = CreateCallbackRequestSchema.parse(req.body);
      const callback = await marketingService.submitCallbackRequest(schoolIdentifier, parsed);
      res.status(201).json({
        success: true,
        message: 'Your callback request has been received. Our admission counsellor will contact you shortly.',
        data: callback,
      });
    } catch (err) {
      next(err);
    }
  }

  async subscribeNewsletter(req: Request, res: Response, next: NextFunction) {
    try {
      const schoolIdentifier = (req.headers['x-school-slug'] as string) || (req.query.schoolSlug as string);
      const { email, source } = NewsletterSubscribeSchema.parse(req.body);
      const subscriber = await marketingService.subscribeNewsletter(schoolIdentifier, email, source);
      res.status(201).json({
        success: true,
        message: 'Thank you for subscribing to our school newsletter!',
        data: subscriber,
      });
    } catch (err) {
      next(err);
    }
  }

  async unsubscribeNewsletter(req: Request, res: Response, next: NextFunction) {
    try {
      const schoolIdentifier = (req.headers['x-school-slug'] as string) || (req.query.schoolSlug as string);
      const { email } = req.body;
      if (!email) throw new AppError('Email is required', 400, 'VALIDATION_FAILED');
      await marketingService.unsubscribeNewsletter(schoolIdentifier, email);
      res.json({ success: true, message: 'You have been unsubscribed from our newsletter.' });
    } catch (err) {
      next(err);
    }
  }

  async recordAnalyticsEvent(req: Request, res: Response, next: NextFunction) {
    try {
      const schoolIdentifier = (req.headers['x-school-slug'] as string) || (req.query.schoolSlug as string);
      const parsed = RecordAnalyticsEventSchema.parse(req.body);
      const event = await marketingService.recordAnalyticsEvent(schoolIdentifier, parsed);
      res.status(201).json({ success: true, data: event });
    } catch (err) {
      next(err);
    }
  }

  // ============================================================================
  // ADMIN SEO & MARKETING CONFIG
  // ============================================================================

  async listPageSeos(req: Request, res: Response, next: NextFunction) {
    try {
      const schoolId = (req as any).user?.schoolId;
      if (!schoolId) throw new AppError('School ID required', 400, 'BAD_REQUEST');
      const seos = await marketingService.listPageSeos(schoolId);
      res.json({ success: true, data: seos });
    } catch (err) {
      next(err);
    }
  }

  async upsertPageSeo(req: Request, res: Response, next: NextFunction) {
    try {
      const schoolId = (req as any).user?.schoolId;
      if (!schoolId) throw new AppError('School ID required', 400, 'BAD_REQUEST');
      const parsed = UpsertPageSEOSchema.parse(req.body);
      const updated = await marketingService.upsertPageSeo(schoolId, parsed);
      res.json({ success: true, message: 'Page SEO settings updated successfully', data: updated });
    } catch (err) {
      next(err);
    }
  }

  async getMarketingConfig(req: Request, res: Response, next: NextFunction) {
    try {
      let schoolId = (req as any).user?.schoolId || (req as any).schoolId || (req.query?.schoolId as string);
      if (!schoolId) {
        const defaultSchool = await prisma.school.findFirst({ select: { id: true } });
        schoolId = defaultSchool?.id;
      }
      if (!schoolId) throw new AppError('School ID required', 400, 'BAD_REQUEST');
      const config = await marketingService.getMarketingConfig(schoolId);
      res.json({ success: true, data: config });
    } catch (err) {
      next(err);
    }
  }

  async updateMarketingConfig(req: Request, res: Response, next: NextFunction) {
    try {
      const schoolId = (req as any).user?.schoolId;
      if (!schoolId) throw new AppError('School ID required', 400, 'BAD_REQUEST');
      const parsed = UpdateMarketingIntegrationSchema.parse(req.body);
      const updated = await marketingService.updateMarketingConfig(schoolId, parsed);
      res.json({ success: true, message: 'Marketing integrations updated successfully', data: updated });
    } catch (err) {
      next(err);
    }
  }

  // ============================================================================
  // ADMIN BLOGS
  // ============================================================================

  async listAdminBlogs(req: Request, res: Response, next: NextFunction) {
    try {
      const schoolId = (req as any).user?.schoolId;
      if (!schoolId) throw new AppError('School ID required', 400, 'BAD_REQUEST');
      const result = await marketingService.listAdminBlogs(schoolId, req.query as any);
      res.json({ success: true, data: result.items, meta: { total: result.total, page: result.page, totalPages: result.totalPages } });
    } catch (err) {
      next(err);
    }
  }

  async createBlog(req: Request, res: Response, next: NextFunction) {
    try {
      const schoolId = (req as any).user?.schoolId;
      if (!schoolId) throw new AppError('School ID required', 400, 'BAD_REQUEST');
      const parsed = CreateBlogArticleSchema.parse(req.body);
      const article = await marketingService.createBlog(schoolId, parsed);
      res.status(201).json({ success: true, message: 'Blog article created successfully', data: article });
    } catch (err) {
      next(err);
    }
  }

  async updateBlog(req: Request, res: Response, next: NextFunction) {
    try {
      const schoolId = (req as any).user?.schoolId;
      if (!schoolId) throw new AppError('School ID required', 400, 'BAD_REQUEST');
      const { id } = req.params;
      const parsed = UpdateBlogArticleSchema.parse(req.body);
      const updated = await marketingService.updateBlog(schoolId, id, parsed);
      res.json({ success: true, message: 'Blog article updated successfully', data: updated });
    } catch (err) {
      next(err);
    }
  }

  async deleteBlog(req: Request, res: Response, next: NextFunction) {
    try {
      const schoolId = (req as any).user?.schoolId;
      if (!schoolId) throw new AppError('School ID required', 400, 'BAD_REQUEST');
      const { id } = req.params;
      await marketingService.deleteBlog(schoolId, id);
      res.json({ success: true, message: 'Blog article deleted successfully' });
    } catch (err) {
      next(err);
    }
  }

  // ============================================================================
  // ADMIN BANNERS
  // ============================================================================

  async listAdminBanners(req: Request, res: Response, next: NextFunction) {
    try {
      const schoolId = (req as any).user?.schoolId;
      if (!schoolId) throw new AppError('School ID required', 400, 'BAD_REQUEST');
      const banners = await marketingService.listAdminBanners(schoolId);
      res.json({ success: true, data: banners });
    } catch (err) {
      next(err);
    }
  }

  async createBanner(req: Request, res: Response, next: NextFunction) {
    try {
      const schoolId = (req as any).user?.schoolId;
      if (!schoolId) throw new AppError('School ID required', 400, 'BAD_REQUEST');
      const parsed = CreateMarketingBannerSchema.parse(req.body);
      const banner = await marketingService.createBanner(schoolId, parsed);
      res.status(201).json({ success: true, message: 'Banner created successfully', data: banner });
    } catch (err) {
      next(err);
    }
  }

  async updateBanner(req: Request, res: Response, next: NextFunction) {
    try {
      const schoolId = (req as any).user?.schoolId;
      if (!schoolId) throw new AppError('School ID required', 400, 'BAD_REQUEST');
      const { id } = req.params;
      const parsed = UpdateMarketingBannerSchema.parse(req.body);
      const updated = await marketingService.updateBanner(schoolId, id, parsed);
      res.json({ success: true, message: 'Banner updated successfully', data: updated });
    } catch (err) {
      next(err);
    }
  }

  async deleteBanner(req: Request, res: Response, next: NextFunction) {
    try {
      const schoolId = (req as any).user?.schoolId;
      if (!schoolId) throw new AppError('School ID required', 400, 'BAD_REQUEST');
      const { id } = req.params;
      await marketingService.deleteBanner(schoolId, id);
      res.json({ success: true, message: 'Banner deleted successfully' });
    } catch (err) {
      next(err);
    }
  }

  // ============================================================================
  // ADMIN CALLBACKS & NEWSLETTER
  // ============================================================================

  async listCallbacks(req: Request, res: Response, next: NextFunction) {
    try {
      const schoolId = (req as any).user?.schoolId;
      if (!schoolId) throw new AppError('School ID required', 400, 'BAD_REQUEST');
      const result = await marketingService.listAdminCallbacks(schoolId, req.query as any);
      res.json({ success: true, data: result.items, meta: { total: result.total, page: result.page, totalPages: result.totalPages } });
    } catch (err) {
      next(err);
    }
  }

  async updateCallbackStatus(req: Request, res: Response, next: NextFunction) {
    try {
      const schoolId = (req as any).user?.schoolId;
      if (!schoolId) throw new AppError('School ID required', 400, 'BAD_REQUEST');
      const { id } = req.params;
      const parsed = UpdateCallbackStatusSchema.parse(req.body);
      const updated = await marketingService.updateCallbackStatus(schoolId, id, parsed);
      res.json({ success: true, message: 'Callback request updated', data: updated });
    } catch (err) {
      next(err);
    }
  }

  async listSubscribers(req: Request, res: Response, next: NextFunction) {
    try {
      const schoolId = (req as any).user?.schoolId;
      if (!schoolId) throw new AppError('School ID required', 400, 'BAD_REQUEST');
      const subscribers = await marketingService.listSubscribers(schoolId, req.query as any);
      res.json({ success: true, data: subscribers });
    } catch (err) {
      next(err);
    }
  }

  // ============================================================================
  // ADMIN UNIFIED LEADS & FOLLOW-UPS
  // ============================================================================

  async listConsolidatedLeads(req: Request, res: Response, next: NextFunction) {
    try {
      const schoolId = (req as any).user?.schoolId;
      if (!schoolId) throw new AppError('School ID required', 400, 'BAD_REQUEST');
      const result = await marketingService.listConsolidatedLeads(schoolId, req.query as any);
      res.json({ success: true, data: result.items, meta: { total: result.total, page: result.page, totalPages: result.totalPages } });
    } catch (err) {
      next(err);
    }
  }

  async updateLeadStatus(req: Request, res: Response, next: NextFunction) {
    try {
      const schoolId = (req as any).user?.schoolId;
      if (!schoolId) throw new AppError('School ID required', 400, 'BAD_REQUEST');
      const { leadType, id } = req.params;
      const { status, staffNotes } = req.body;
      const updated = await marketingService.updateLeadStatus(schoolId, leadType as any, id, status, staffNotes);
      res.json({ success: true, message: 'Lead status updated', data: updated });
    } catch (err) {
      next(err);
    }
  }

  async createFollowUp(req: Request, res: Response, next: NextFunction) {
    try {
      const schoolId = (req as any).user?.schoolId;
      if (!schoolId) throw new AppError('School ID required', 400, 'BAD_REQUEST');
      const parsed = CreateLeadFollowUpSchema.parse(req.body);
      const followUp = await marketingService.createFollowUp(schoolId, parsed);
      res.status(201).json({ success: true, message: 'Follow-up scheduled successfully', data: followUp });
    } catch (err) {
      next(err);
    }
  }

  async listFollowUps(req: Request, res: Response, next: NextFunction) {
    try {
      const schoolId = (req as any).user?.schoolId;
      if (!schoolId) throw new AppError('School ID required', 400, 'BAD_REQUEST');
      const followUps = await marketingService.listFollowUps(schoolId, req.query as any);
      res.json({ success: true, data: followUps });
    } catch (err) {
      next(err);
    }
  }

  async updateFollowUp(req: Request, res: Response, next: NextFunction) {
    try {
      const schoolId = (req as any).user?.schoolId;
      if (!schoolId) throw new AppError('School ID required', 400, 'BAD_REQUEST');
      const { id } = req.params;
      const parsed = UpdateLeadFollowUpSchema.parse(req.body);
      const updated = await marketingService.updateFollowUp(schoolId, id, parsed);
      res.json({ success: true, message: 'Follow-up updated successfully', data: updated });
    } catch (err) {
      next(err);
    }
  }

  // ============================================================================
  // ADMIN MARKETING ANALYTICS DASHBOARD
  // ============================================================================

  async getMarketingAnalytics(req: Request, res: Response, next: NextFunction) {
    try {
      const schoolId = (req as any).user?.schoolId;
      if (!schoolId) throw new AppError('School ID required', 400, 'BAD_REQUEST');
      const analytics = await marketingService.getMarketingAnalytics(schoolId);
      res.json({ success: true, data: analytics });
    } catch (err) {
      next(err);
    }
  }
}

export const marketingController = new MarketingController();

