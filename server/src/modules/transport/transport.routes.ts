import { Router } from 'express';
import { transportController } from './transport.controller.js';
import { authenticateUser, requireRole } from '../../middleware/auth.middleware.js';
import { PlatformRole } from '@edunexa/shared';

const router = Router();

router.use(authenticateUser);

// Stats
router.get(
  '/stats',
  requireRole(PlatformRole.SCHOOL_ADMIN, PlatformRole.PRINCIPAL, PlatformRole.SUPER_ADMIN),
  transportController.getStats
);

// Vehicles
router.get(
  '/vehicles',
  requireRole(PlatformRole.SCHOOL_ADMIN, PlatformRole.PRINCIPAL, PlatformRole.SUPER_ADMIN, PlatformRole.TEACHER),
  transportController.listVehicles
);
router.post(
  '/vehicles',
  requireRole(PlatformRole.SCHOOL_ADMIN, PlatformRole.PRINCIPAL, PlatformRole.SUPER_ADMIN),
  transportController.createVehicle
);
router.patch(
  '/vehicles/:id',
  requireRole(PlatformRole.SCHOOL_ADMIN, PlatformRole.PRINCIPAL, PlatformRole.SUPER_ADMIN),
  transportController.updateVehicle
);
router.delete(
  '/vehicles/:id',
  requireRole(PlatformRole.SCHOOL_ADMIN, PlatformRole.PRINCIPAL, PlatformRole.SUPER_ADMIN),
  transportController.deleteVehicle
);

// Drivers
router.get(
  '/drivers',
  requireRole(PlatformRole.SCHOOL_ADMIN, PlatformRole.PRINCIPAL, PlatformRole.SUPER_ADMIN),
  transportController.listDrivers
);
router.post(
  '/drivers',
  requireRole(PlatformRole.SCHOOL_ADMIN, PlatformRole.PRINCIPAL, PlatformRole.SUPER_ADMIN),
  transportController.createDriver
);
router.patch(
  '/drivers/:id',
  requireRole(PlatformRole.SCHOOL_ADMIN, PlatformRole.PRINCIPAL, PlatformRole.SUPER_ADMIN),
  transportController.updateDriver
);
router.delete(
  '/drivers/:id',
  requireRole(PlatformRole.SCHOOL_ADMIN, PlatformRole.PRINCIPAL, PlatformRole.SUPER_ADMIN),
  transportController.deleteDriver
);

// Routes
router.get(
  '/routes',
  requireRole(PlatformRole.SCHOOL_ADMIN, PlatformRole.PRINCIPAL, PlatformRole.SUPER_ADMIN, PlatformRole.TEACHER, PlatformRole.STUDENT, PlatformRole.PARENT),
  transportController.listRoutes
);
router.post(
  '/routes',
  requireRole(PlatformRole.SCHOOL_ADMIN, PlatformRole.PRINCIPAL, PlatformRole.SUPER_ADMIN),
  transportController.createRoute
);
router.patch(
  '/routes/:id',
  requireRole(PlatformRole.SCHOOL_ADMIN, PlatformRole.PRINCIPAL, PlatformRole.SUPER_ADMIN),
  transportController.updateRoute
);
router.delete(
  '/routes/:id',
  requireRole(PlatformRole.SCHOOL_ADMIN, PlatformRole.PRINCIPAL, PlatformRole.SUPER_ADMIN),
  transportController.deleteRoute
);

// Allocations
router.get(
  '/allocations',
  requireRole(PlatformRole.SCHOOL_ADMIN, PlatformRole.PRINCIPAL, PlatformRole.SUPER_ADMIN, PlatformRole.TEACHER),
  transportController.listAllocations
);
router.post(
  '/allocations',
  requireRole(PlatformRole.SCHOOL_ADMIN, PlatformRole.PRINCIPAL, PlatformRole.SUPER_ADMIN),
  transportController.allocateStudent
);
router.patch(
  '/allocations/:id/cancel',
  requireRole(PlatformRole.SCHOOL_ADMIN, PlatformRole.PRINCIPAL, PlatformRole.SUPER_ADMIN),
  transportController.cancelAllocation
);

export default router;

