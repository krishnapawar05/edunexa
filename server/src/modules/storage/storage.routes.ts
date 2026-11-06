import { Router } from 'express';
import { storageController } from './storage.controller.js';
import { authenticateUser } from '../../middleware/auth.middleware.js';

const router = Router();

// 1. Upload File (Authenticated)
router.post('/upload', authenticateUser, (req, res, next) => {
  storageController.uploadFile(req, res, next);
});

// 2. Stream File (Supports public files without auth, requires auth for secure files)
// We use a custom wrapper to check auth if bearer header is present
router.get('/files/:id', (req, res, next) => {
  if (req.headers.authorization) {
    authenticateUser(req, res, () => storageController.getFile(req, res, next));
  } else {
    storageController.getFile(req, res, next);
  }
});

// 3. File Metadata
router.get('/files/:id/meta', authenticateUser, (req, res, next) => {
  storageController.getFileMetadata(req, res, next);
});

// 4. List Files (Authenticated)
router.get('/files', authenticateUser, (req, res, next) => {
  storageController.listFiles(req, res, next);
});

// 5. Delete File (Authenticated)
router.delete('/files/:id', authenticateUser, (req, res, next) => {
  storageController.deleteFile(req, res, next);
});

export default router;

