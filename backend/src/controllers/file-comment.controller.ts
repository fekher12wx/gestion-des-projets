import { Response } from 'express';
import { body, param, query, validationResult } from 'express-validator';
import prisma from '../config/database';
import { AuthRequest } from '../middleware/auth.middleware';
import alertService from '../services/alert.service';

export class FileCommentController {
    /**
     * Get comments for a specific POI file
     * GET /api/v1/poi-files/:id/comments
     */
    static getCommentsValidation = [
        param('id').isUUID().withMessage('Invalid POI file ID'),
        query('includeInternal').optional().isBoolean().toBoolean(),
    ];

    static async getComments(req: AuthRequest, res: Response): Promise<void> {
        try {
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                res.status(400).json({ errors: errors.array() });
                return;
            }

            const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
            const includeInternal = req.query.includeInternal !== undefined
                ? String(req.query.includeInternal) === 'true'
                : true;

            // Build where clause
            const where: any = { poiFileId: id };

            // Filter internal comments based on user permissions
            // For now, show all if includeInternal is true
            if (!includeInternal) {
                where.isInternal = false;
            }

            const comments = await prisma.fileComment.findMany({
                where,
                include: {
                    user: {
                        select: {
                            id: true,
                            firstName: true,
                            lastName: true,
                            email: true,
                        },
                    },
                },
                orderBy: {
                    createdAt: 'desc',
                },
            });

            res.json({ comments });
        } catch (error) {
            console.error('Get comments error:', error);
            res.status(500).json({ error: 'Failed to retrieve comments' });
        }
    }

    /**
     * Create a new comment
     * POST /api/v1/poi-files/:id/comments
     */
    static createCommentValidation = [
        param('id').isUUID().withMessage('Invalid POI file ID'),
        body('comment').trim().notEmpty().withMessage('Comment is required'),
        body('isInternal').optional().isBoolean().withMessage('isInternal must be a boolean'),
    ];

    static async createComment(req: AuthRequest, res: Response): Promise<void> {
        try {
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                res.status(400).json({ errors: errors.array() });
                return;
            }

            const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
            const { comment, isInternal = true } = req.body;

            // Verify POI file exists
            const poiFile = await prisma.poiFile.findUnique({ where: { id } });
            if (!poiFile) {
                res.status(404).json({ error: 'POI file not found' });
                return;
            }

            // Create comment
            const newComment = await prisma.fileComment.create({
                data: {
                    poiFileId: id,
                    userId: req.user!.userId,
                    comment,
                    isInternal,
                },
                include: {
                    user: {
                        select: {
                            id: true,
                            firstName: true,
                            lastName: true,
                            email: true,
                        },
                    },
                },
            });

            res.status(201).json(newComment);

            // Notify assigned users about the new comment (fire-and-forget)
            alertService.notifyCommentAdded(id, req.user!.userId).catch(err =>
                console.error('Failed to send comment notification:', err)
            );
        } catch (error) {
            console.error('Create comment error:', error);
            res.status(500).json({ error: 'Failed to create comment' });
        }
    }

    /**
     * Update a comment
     * PUT /api/v1/comments/:id
     */
    static updateCommentValidation = [
        param('id').isUUID().withMessage('Invalid comment ID'),
        body('comment').trim().notEmpty().withMessage('Comment is required'),
    ];

    static async updateComment(req: AuthRequest, res: Response): Promise<void> {
        try {
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                res.status(400).json({ errors: errors.array() });
                return;
            }

            const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
            const { comment } = req.body;

            // Check if comment exists and user owns it
            const existingComment = await prisma.fileComment.findUnique({ where: { id } });
            if (!existingComment) {
                res.status(404).json({ error: 'Comment not found' });
                return;
            }

            // Only comment author can update (add admin check if needed)
            if (existingComment.userId !== req.user!.userId) {
                res.status(403).json({ error: 'Not authorized to update this comment' });
                return;
            }

            // Update comment
            const updatedComment = await prisma.fileComment.update({
                where: { id },
                data: { comment },
                include: {
                    user: {
                        select: {
                            id: true,
                            firstName: true,
                            lastName: true,
                            email: true,
                        },
                    },
                },
            });

            res.json(updatedComment);
        } catch (error) {
            console.error('Update comment error:', error);
            res.status(500).json({ error: 'Failed to update comment' });
        }
    }

    /**
     * Delete a comment
     * DELETE /api/v1/comments/:id
     */
    static deleteCommentValidation = [
        param('id').isUUID().withMessage('Invalid comment ID'),
    ];

    static async deleteComment(req: AuthRequest, res: Response): Promise<void> {
        try {
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                res.status(400).json({ errors: errors.array() });
                return;
            }

            const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;

            // Check if comment exists and user owns it
            const existingComment = await prisma.fileComment.findUnique({ where: { id } });
            if (!existingComment) {
                res.status(404).json({ error: 'Comment not found' });
                return;
            }

            // Only comment author can delete (add admin check if needed)
            if (existingComment.userId !== req.user!.userId) {
                res.status(403).json({ error: 'Not authorized to delete this comment' });
                return;
            }

            // Delete comment
            await prisma.fileComment.delete({ where: { id } });

            res.json({ message: 'Comment deleted successfully' });
        } catch (error) {
            console.error('Delete comment error:', error);
            res.status(500).json({ error: 'Failed to delete comment' });
        }
    }
}
