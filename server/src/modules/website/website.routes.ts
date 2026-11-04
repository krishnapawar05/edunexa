import { Router } from 'express';
import { websiteController } from './website.controller.js';
import { authenticateUser, requireRole } from '../../middleware/auth.middleware.js';
import { PlatformRole } from '@edunexa/shared';

const router = Router();

// ============================================================================
// 1. PUBLIC WEBSITE & GALLERY ROUTES (Open to all visitors)
// ============================================================================
router.get('/public', websiteController.getPublicWebsiteData);
router.get('/public/categories', websiteController.getPublicGalleryCategories);
router.get('/public/gallery', websiteController.getPublicGalleryItems);
router.get('/public/documents', websiteController.getPublicDocuments);

// Public aliases
router.get('/gallery/categories', websiteController.getPublicGalleryCategories);
router.get('/gallery/items', websiteController.getPublicGalleryItems);
router.get('/documents', websiteController.getPublicDocuments);

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

export default router;
