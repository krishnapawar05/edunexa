import { Router } from 'express';
import { inventoryController } from './inventory.controller.js';
import { authenticateUser, requireRole } from '../../middleware/auth.middleware.js';
import { PlatformRole } from '@edunexa/shared';

const router = Router();

router.use(authenticateUser);

// Stats
router.get(
  '/stats',
  requireRole(PlatformRole.SCHOOL_ADMIN, PlatformRole.PRINCIPAL, PlatformRole.SUPER_ADMIN),
  inventoryController.getStats
);

// Categories
router.get(
  '/categories',
  requireRole(PlatformRole.SCHOOL_ADMIN, PlatformRole.PRINCIPAL, PlatformRole.SUPER_ADMIN, PlatformRole.TEACHER),
  inventoryController.listCategories
);
router.post(
  '/categories',
  requireRole(PlatformRole.SCHOOL_ADMIN, PlatformRole.PRINCIPAL, PlatformRole.SUPER_ADMIN),
  inventoryController.createCategory
);
router.delete(
  '/categories/:id',
  requireRole(PlatformRole.SCHOOL_ADMIN, PlatformRole.PRINCIPAL, PlatformRole.SUPER_ADMIN),
  inventoryController.deleteCategory
);

// Items
router.get(
  '/items',
  requireRole(PlatformRole.SCHOOL_ADMIN, PlatformRole.PRINCIPAL, PlatformRole.SUPER_ADMIN, PlatformRole.TEACHER),
  inventoryController.listItems
);
router.get(
  '/items/:id',
  requireRole(PlatformRole.SCHOOL_ADMIN, PlatformRole.PRINCIPAL, PlatformRole.SUPER_ADMIN, PlatformRole.TEACHER),
  inventoryController.getItemById
);
router.post(
  '/items',
  requireRole(PlatformRole.SCHOOL_ADMIN, PlatformRole.PRINCIPAL, PlatformRole.SUPER_ADMIN),
  inventoryController.createItem
);
router.patch(
  '/items/:id',
  requireRole(PlatformRole.SCHOOL_ADMIN, PlatformRole.PRINCIPAL, PlatformRole.SUPER_ADMIN),
  inventoryController.updateItem
);
router.delete(
  '/items/:id',
  requireRole(PlatformRole.SCHOOL_ADMIN, PlatformRole.PRINCIPAL, PlatformRole.SUPER_ADMIN),
  inventoryController.deleteItem
);

// Transactions
router.get(
  '/transactions',
  requireRole(PlatformRole.SCHOOL_ADMIN, PlatformRole.PRINCIPAL, PlatformRole.SUPER_ADMIN, PlatformRole.TEACHER),
  inventoryController.listTransactions
);
router.post(
  '/transactions',
  requireRole(PlatformRole.SCHOOL_ADMIN, PlatformRole.PRINCIPAL, PlatformRole.SUPER_ADMIN),
  inventoryController.recordTransaction
);

export default router;

