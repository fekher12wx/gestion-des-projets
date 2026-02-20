import { Router } from 'express';
import { PoiFileController } from '../controllers/poi-file.controller';
import { FileHistoryController } from '../controllers/file-history.controller';
import { FileCommentController } from '../controllers/file-comment.controller';
import { FileAttachmentController } from '../controllers/file-attachment.controller';
import { authenticate, authorize } from '../middleware/auth.middleware';
import { upload, handleUploadError } from '../middleware/upload.middleware';

const router = Router();

// All routes require authentication
router.use(authenticate);

/**
 * @route   GET /api/v1/poi-files
 * @desc    Get all POI files with pagination and filtering
 * @access  Private (All authenticated users can read)
 */
router.get(
    '/',
    authorize('poi_files', 'read'),
    PoiFileController.listValidation,
    PoiFileController.list
);

/**
 * @route   GET /api/v1/poi-files/:id
 * @desc    Get POI file by ID
 * @access  Private (All authenticated users can read)
 */
router.get(
    '/:id',
    authorize('poi_files', 'read'),
    PoiFileController.getByIdValidation,
    PoiFileController.getById
);

/**
 * @route   POST /api/v1/poi-files
 * @desc    Create new POI file
 * @access  Private (Manager, Admin)
 */
router.post(
    '/',
    authorize('poi_files', 'create'),
    PoiFileController.createValidation,
    PoiFileController.create
);

/**
 * @route   PUT /api/v1/poi-files/:id
 * @desc    Update POI file
 * @access  Private (Manager, Admin, assigned users)
 */
router.put(
    '/:id',
    authorize('poi_files', 'update'),
    PoiFileController.updateValidation,
    PoiFileController.update
);

/**
 * @route   DELETE /api/v1/poi-files/:id
 * @desc    Delete POI file
 * @access  Private (Admin only)
 */
router.delete(
    '/:id',
    authorize('poi_files', 'delete'),
    PoiFileController.deleteValidation,
    PoiFileController.delete
);

/**
 * @route   GET /api/v1/poi-files/:id/history
 * @desc    Get history for a specific POI file
 * @access  Private (All authenticated users can read)
 */
router.get(
    '/:id/history',
    authorize('poi_files', 'read'),
    FileHistoryController.getHistoryValidation,
    FileHistoryController.getFileHistory
);

/**
 * @route   PUT /api/v1/poi-files/:id/advance-stage
 * @desc    Advance POI file to next stage
 * @access  Private (Manager, Admin, assigned users)
 */
router.put(
    '/:id/advance-stage',
    authorize('poi_files', 'update'),
    PoiFileController.advanceStage
);

/**
 * @route   GET /api/v1/poi-files/:id/comments
 * @desc    Get comments for a POI file
 * @access  Private
 */
router.get(
    '/:id/comments',
    authorize('poi_files', 'read'),
    FileCommentController.getCommentsValidation,
    FileCommentController.getComments
);

/**
 * @route   POST /api/v1/poi-files/:id/comments
 * @desc    Add comment to POI file
 * @access  Private
 */
router.post(
    '/:id/comments',
    authorize('poi_files', 'create'),
    FileCommentController.createCommentValidation,
    FileCommentController.createComment
);

/**
 * @route   GET /api/v1/poi-files/:id/attachments
 * @desc    Get attachments for a POI file
 * @access  Private
 */
router.get(
    '/:id/attachments',
    authorize('poi_files', 'read'),
    FileAttachmentController.getAttachmentsValidation,
    FileAttachmentController.getAttachments
);

/**
 * @route   POST /api/v1/poi-files/:id/attachments
 * @desc    Upload attachment to POI file
 * @access  Private
 */
router.post(
    '/:id/attachments',
    authorize('poi_files', 'create'),
    upload.single('file'),
    handleUploadError,
    FileAttachmentController.uploadAttachmentValidation,
    FileAttachmentController.uploadAttachment
);

export default router;
