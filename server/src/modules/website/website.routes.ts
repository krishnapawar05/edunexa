import { Router } from 'express';
import { websiteController } from './website.controller.js';
import { marketingController } from './marketing.controller.js';
import { authenticateUser, requireRole } from '../../middleware/auth.middleware.js';
import { PlatformRole } from '@edunexa/shared';

const router = Router();

// ============================================================================
// 1. PUBLIC WEBSITE, GALLERY, SEO & MARKETING ROUTES (Open to all visitors)
// ============================================================================
router.get('/public', websiteController.getPublicWebsiteData);
router.get('/public/categories', websiteController.getPublicGalleryCategories);
router.get('/public/gallery', websiteController.getPublicGalleryItems);
router.get('/public/documents', websiteController.getPublicDocuments);

// Public aliases
router.get('/gallery/categories', websiteController.getPublicGalleryCategories);
router.get('/gallery/items', websiteController.getPublicGalleryItems);
router.get('/documents', websiteController.getPublicDocuments);

// Section 14: Public SEO, Schema & Marketing
router.get('/seo', marketingController.getPageSeo);
router.get('/schema-markup', marketingController.getSchemaMarkup);
router.get('/sitemap.xml', marketingController.getSitemapXml);
router.get('/robots.txt', marketingController.getRobotsTxt);
router.get('/marketing/config', marketingController.getMarketingConfig);

// Section 14: Public Blogs
router.get('/blogs', marketingController.listPublicBlogs);
router.get('/blogs/:slug', marketingController.getPublicBlogBySlug);

// Section 14: Public Conversion Features (Banners, Callbacks, Newsletter)
router.get('/banners', marketingController.listPublicBanners);
router.post('/callback-requests', marketingController.submitCallbackRequest);
router.post('/newsletter/subscribe', marketingController.subscribeNewsletter);
router.post('/newsletter/unsubscribe', marketingController.unsubscribeNewsletter);
router.post('/analytics/event', marketingController.recordAnalyticsEvent);

// ============================================================================
// 2. ADMIN CMS & WEBSITE MANAGEMENT (Authenticated School Admin / Principal)
// ============================================================================
router.use(authenticateUser);
router.use(
  requireRole(
    PlatformRole.SCHOOL_ADMIN,
    PlatformRole.PRINCIPAL,
    PlatformRole.SUPER_ADMIN
  )
);

// Full CMS dataset
router.get('/admin', websiteController.getAdminWebsiteData);

// Content & Branding
router.put('/admin/content', websiteController.updateWebsiteContent);
router.put('/admin/branding', websiteController.updateSchoolBranding);

// Highlights (Why Choose Us)
router.post('/admin/highlights', websiteController.createHighlight);
router.put('/admin/highlights/:id', websiteController.updateHighlight);
router.delete('/admin/highlights/:id', websiteController.deleteHighlight);

// Facilities
router.post('/admin/facilities', websiteController.createFacility);
router.put('/admin/facilities/:id', websiteController.updateFacility);
router.delete('/admin/facilities/:id', websiteController.deleteFacility);

// Student Achievements
router.post('/admin/achievements', websiteController.createAchievement);
router.put('/admin/achievements/:id', websiteController.updateAchievement);
router.delete('/admin/achievements/:id', websiteController.deleteAchievement);

// Parent Testimonials
router.post('/admin/testimonials', websiteController.createTestimonial);
router.put('/admin/testimonials/:id', websiteController.updateTestimonial);
router.delete('/admin/testimonials/:id', websiteController.deleteTestimonial);

// Downloadable Documents
router.post('/admin/documents', websiteController.createDocument);
router.put('/admin/documents/:id', websiteController.updateDocument);
router.delete('/admin/documents/:id', websiteController.deleteDocument);

// Gallery Categories
router.get('/admin/gallery/categories', websiteController.getAdminGalleryCategories);
router.post('/admin/gallery/categories', websiteController.createGalleryCategory);
router.put('/admin/gallery/categories/:id', websiteController.updateGalleryCategory);
router.delete('/admin/gallery/categories/:id', websiteController.deleteGalleryCategory);

// Gallery Items
router.get('/admin/gallery/items', websiteController.getAdminGalleryItems);
router.post('/admin/gallery/items', websiteController.createGalleryItem);
router.put('/admin/gallery/items/:id', websiteController.updateGalleryItem);
router.delete('/admin/gallery/items/:id', websiteController.deleteGalleryItem);

// ============================================================================
// 3. ADMIN SEO, DIGITAL MARKETING & LEAD CONVERSION MANAGEMENT
// ============================================================================
// SEO & Integrations
router.get('/admin/seo', marketingController.listPageSeos);
router.put('/admin/seo', marketingController.upsertPageSeo);
router.get('/admin/marketing/config', marketingController.getMarketingConfig);
router.put('/admin/marketing/config', marketingController.updateMarketingConfig);

// Blogs
router.get('/admin/blogs', marketingController.listAdminBlogs);
router.post('/admin/blogs', marketingController.createBlog);
router.put('/admin/blogs/:id', marketingController.updateBlog);
router.delete('/admin/blogs/:id', marketingController.deleteBlog);

// Banners
router.get('/admin/banners', marketingController.listAdminBanners);
router.post('/admin/banners', marketingController.createBanner);
router.put('/admin/banners/:id', marketingController.updateBanner);
router.delete('/admin/banners/:id', marketingController.deleteBanner);

// Callbacks & Newsletter
router.get('/admin/callbacks', marketingController.listCallbacks);
router.put('/admin/callbacks/:id', marketingController.updateCallbackStatus);
router.get('/admin/newsletter/subscribers', marketingController.listSubscribers);

// Consolidated Leads & Counsellor Desk
router.get('/admin/leads', marketingController.listConsolidatedLeads);
router.put('/admin/leads/:leadType/:id/status', marketingController.updateLeadStatus);
router.get('/admin/follow-ups', marketingController.listFollowUps);
router.post('/admin/follow-ups', marketingController.createFollowUp);
router.put('/admin/follow-ups/:id', marketingController.updateFollowUp);

// Marketing Analytics Dashboard
router.get('/admin/marketing/analytics', marketingController.getMarketingAnalytics);

export default router;
