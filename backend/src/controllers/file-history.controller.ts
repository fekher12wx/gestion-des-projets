import { Response } from 'express';
import { param, query, validationResult } from 'express-validator';
import prisma from '../config/database';
import { AuthRequest } from '../middleware/auth.middleware';

export class FileHistoryController {
    /**
     * Get history for a specific POI file
     * GET /api/v1/poi-files/:id/history
     */
    static getHistoryValidation = [
        param('id').isUUID().withMessage('Invalid POI file ID'),
        query('page').optional().isInt({ min: 1 }).toInt(),
        query('limit').optional().isInt({ min: 1, max: 100 }).toInt(),
        query('action').optional().isString(),
    ];

    static async getFileHistory(req: AuthRequest, res: Response): Promise<void> {
        try {
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                res.status(400).json({ errors: errors.array() });
                return;
            }

            const { id } = req.params;
            const page = parseInt((req.query.page as string) || '1');
            const limit = parseInt((req.query.limit as string) || '50');
            const action = req.query.action as string | undefined;
            const skip = (page - 1) * limit;

            // Build where clause
            const where: any = { poiFileId: id };
            if (action) {
                where.action = action;
            }

            const [history, total] = await Promise.all([
                prisma.fileHistory.findMany({
                    where,
                    skip,
                    take: limit,
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
                }),
                prisma.fileHistory.count({ where }),
            ]);

            res.json({
                history,
                pagination: {
                    page,
                    limit,
                    total,
                    totalPages: Math.ceil(total / limit),
                },
            });
        } catch (error) {
            console.error('Get file history error:', error);
            res.status(500).json({ error: 'Failed to retrieve file history' });
        }
    }

    /**
     * Get all history (for admin/audit purposes)
     * GET /api/v1/file-history
     */
    static getAllHistoryValidation = [
        query('page').optional().isInt({ min: 1 }).toInt(),
        query('limit').optional().isInt({ min: 1, max: 100 }).toInt(),
        query('userId').optional().isUUID(),
        query('poiFileId').optional().isUUID(),
        query('action').optional().isString(),
        query('startDate').optional().isISO8601(),
        query('endDate').optional().isISO8601(),
    ];

    static async getAllHistory(req: AuthRequest, res: Response): Promise<void> {
        try {
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                res.status(400).json({ errors: errors.array() });
                return;
            }

            const page = parseInt((req.query.page as string) || '1');
            const limit = parseInt((req.query.limit as string) || '20');
            const userId = req.query.userId as string | undefined;
            const poiFileId = req.query.poiFileId as string | undefined;
            const action = req.query.action as string | undefined;
            const startDate = req.query.startDate as string | undefined;
            const endDate = req.query.endDate as string | undefined;
            const skip = (page - 1) * limit;

            // Build where clause
            const where: any = {};
            if (userId) where.userId = userId;
            if (poiFileId) where.poiFileId = poiFileId;
            if (action) where.action = action;
            if (startDate || endDate) {
                where.createdAt = {};
                if (startDate) where.createdAt.gte = new Date(startDate);
                if (endDate) where.createdAt.lte = new Date(endDate);
            }

            const [history, total] = await Promise.all([
                prisma.fileHistory.findMany({
                    where,
                    skip,
                    take: limit,
                    include: {
                        user: {
                            select: {
                                id: true,
                                firstName: true,
                                lastName: true,
                                email: true,
                            },
                        },
                        poiFile: {
                            select: {
                                id: true,
                                fileNumber: true,
                            },
                        },
                    },
                    orderBy: {
                        createdAt: 'desc',
                    },
                }),
                prisma.fileHistory.count({ where }),
            ]);

            res.json({
                history,
                pagination: {
                    page,
                    limit,
                    total,
                    totalPages: Math.ceil(total / limit),
                },
            });
        } catch (error) {
            console.error('Get all history error:', error);
            res.status(500).json({ error: 'Failed to retrieve history' });
        }
    }

    /**
     * Helper function to log file history
     * This is called from other controllers when changes are made
     */
    static async logHistory(
        poiFileId: string,
        userId: string,
        action: string,
        description?: string,
        oldValues?: any,
        newValues?: any
    ): Promise<void> {
        try {
            await prisma.fileHistory.create({
                data: {
                    poiFileId,
                    userId,
                    action,
                    description,
                    oldValues: oldValues ? oldValues : null,
                    newValues: newValues ? newValues : null,
                },
            });
        } catch (error) {
            console.error('Log history error:', error);
            // Don't throw error - history logging should not break the main operation
        }
    }
}
