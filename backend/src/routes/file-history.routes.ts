import { Router } from 'express';
import { FileHistoryController } from '../controllers/file-history.controller';
import { authenticate } from '../middleware/auth.middleware';

const router = Router();

// All file history routes require authentication
router.use(authenticate);

/**
 * Get all history (admin view)
 * GET /api/v1/file-history
 */
router.get(
    '/',
    FileHistoryController.getAllHistoryValidation,
    FileHistoryController.getAllHistory
);

export default router;
