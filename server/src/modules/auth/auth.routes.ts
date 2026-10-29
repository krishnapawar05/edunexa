import { Router } from 'express';
import { authController } from './auth.controller.js';
import { authenticateUser, authRateLimiter } from '../../middleware/auth.middleware.js';
import { validateRequest } from '../../middleware/validate.js';
import { LoginRequestSchema } from '@edunexa/shared';

const router = Router();

// Public Authentication Endpoints
router.post('/login', authRateLimiter, validateRequest({ body: LoginRequestSchema }), (req, res, next) => {
  authController.login(req, res, next);
});

// Account Activation Endpoints (Public)
router.get('/invitations/verify/:token', authRateLimiter, (req, res, next) => {
  authController.verifyInvitation(req, res, next);
});

router.post('/invitations/activate', authRateLimiter, (req, res, next) => {
  authController.activateAccount(req, res, next);
});

// Authenticated Session Endpoints
router.get('/me', authenticateUser, (req, res, next) => {
  authController.getCurrentUser(req, res, next);
});

router.post('/switch-context', authenticateUser, (req, res, next) => {
  authController.switchContext(req, res, next);
});

router.post('/logout', authenticateUser, (req, res, next) => {
  authController.logout(req, res, next);
});

export default router;
