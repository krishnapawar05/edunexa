import { Router } from 'express';
import { idCardsController } from './idcards.controller.js';
import { authenticateUser, requireRole } from '../../middleware/auth.middleware.js';
import { PlatformRole } from '@edunexa/shared';

const router = Router();

// ============================================================================
// 1. SELF-SERVICE ID CARD (Authenticated Student, Teacher, Staff)
// ============================================================================
router.get('/my-card', authenticateUser, idCardsController.getSelfServiceCard);

// ============================================================================
// 2. SCHOOL ADMIN & PRINCIPAL ID CARD MANAGEMENT
// ============================================================================
router.use(authenticateUser);
router.use(
  requireRole(
    PlatformRole.SCHOOL_ADMIN,
    PlatformRole.PRINCIPAL,
    PlatformRole.SUPER_ADMIN
  )
);

// Dashboard
router.get('/admin/stats', idCardsController.getDashboardStats);

// Rosters
router.get('/admin/students', idCardsController.listStudentIdCards);
router.get('/admin/employees', idCardsController.listEmployeeIdCards);

// Card generation & status
router.post('/admin/generate', idCardsController.generateIndividualIdCard);
router.post('/admin/bulk-generate', idCardsController.bulkGenerateIdCards);
router.patch('/admin/cards/:id/status', idCardsController.updateCardStatus);

// Templates
router.get('/admin/templates', idCardsController.listTemplates);
router.post('/admin/templates', idCardsController.createTemplate);
router.put('/admin/templates/:id', idCardsController.updateTemplate);
router.delete('/admin/templates/:id', idCardsController.deleteTemplate);

export default router;

