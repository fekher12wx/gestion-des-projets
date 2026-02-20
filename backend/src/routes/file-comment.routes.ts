import { Router } from 'express';
import { FileCommentController } from '../controllers/file-comment.controller';
import { authenticate, authorize } from '../middleware/auth.middleware';

const router = Router();

// All routes require authentication
router.use(authenticate);

/**
 * Update a comment
 * PUT /api/v1/comments/:id
 */
router.put(
    '/:id',
    authorize('poi_files', 'update'),
    FileCommentController.updateCommentValidation,
    FileCommentController.updateComment
);

/**
 * Delete a comment
 * DELETE /api/v1/comments/:id
 */
router.delete(
    '/:id',
    authorize('poi_files', 'delete'),
    FileCommentController.deleteCommentValidation,
    FileCommentController.deleteComment
);

export default router;
