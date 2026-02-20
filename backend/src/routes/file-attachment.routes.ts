import { Router } from 'express';
import { FileAttachmentController } from '../controllers/file-attachment.controller';
import { authenticate, authorize } from '../middleware/auth.middleware';

const router = Router();

// All routes require authentication
router.use(authenticate);

/**
 * Download attachment
 * GET /api/v1/attachments/:id/download
 */
router.get(
    '/:id/download',
    authorize('poi_files', 'read'),
    FileAttachmentController.downloadAttachmentValidation,
    FileAttachmentController.downloadAttachment
);

/**
 * Delete attachment
 * DELETE /api/v1/attachments/:id
 */
router.delete(
    '/:id',
    authorize('poi_files', 'delete'),
    FileAttachmentController.deleteAttachmentValidation,
    FileAttachmentController.deleteAttachment
);

export default router;
