import { Request, Response } from 'express';
import alertService from '../services/alert.service';
import { AlertType } from '@prisma/client';

export class AlertController {
    /**
     * GET /api/alerts
     * Get user's alerts with optional filtering and pagination
     */
    async getUserAlerts(req: Request, res: Response): Promise<void> {
        try {
            const userId = (req as any).user.userId;
            const {
                isRead,
                type,
                limit,
                offset,
            } = req.query;

            const filters: any = {};
            if (isRead !== undefined) filters.isRead = isRead === 'true';
            if (type) filters.type = type as AlertType;
            if (limit) filters.limit = parseInt(limit as string, 10);
            if (offset) filters.offset = parseInt(offset as string, 10);

            const result = await alertService.getUserAlerts(userId, filters);

            res.json(result);
        } catch (error: any) {
            console.error('Get user alerts error:', error);
            res.status(500).json({
                message: 'Failed to fetch alerts',
                error: error.message,
            });
        }
    }

    /**
     * GET /api/alerts/unread-count
     * Get count of unread alerts for the user
     */
    async getUnreadCount(req: Request, res: Response): Promise<void> {
        try {
            const userId = (req as any).user.userId;

            const count = await alertService.getUnreadCount(userId);

            res.json({ count });
        } catch (error: any) {
            console.error('Get unread count error:', error);
            res.status(500).json({
                message: 'Failed to fetch unread count',
                error: error.message,
            });
        }
    }

    /**
     * PUT /api/alerts/:id/read
     * Mark a specific alert as read
     */
    async markAsRead(req: Request, res: Response): Promise<void> {
        try {
            const userId = (req as any).user.userId;
            const { id } = req.params;

            const alert = await alertService.markAsRead(id as string, userId);

            res.json({
                message: 'Alert marked as read',
                alert,
            });
        } catch (error: any) {
            console.error('Mark as read error:', error);
            if (error.message.includes('not found')) {
                res.status(404).json({ message: error.message });
            } else {
                res.status(500).json({
                    message: 'Failed to mark alert as read',
                    error: error.message,
                });
            }
        }
    }

    /**
     * PUT /api/alerts/mark-all-read
     * Mark all user's alerts as read
     */
    async markAllAsRead(req: Request, res: Response): Promise<void> {
        try {
            const userId = (req as any).user.userId;

            const count = await alertService.markAllAsRead(userId);

            res.json({
                message: `${count} alert(s) marked as read`,
                count,
            });
        } catch (error: any) {
            console.error('Mark all as read error:', error);
            res.status(500).json({
                message: 'Failed to mark all alerts as read',
                error: error.message,
            });
        }
    }

    /**
     * DELETE /api/alerts/:id
     * Delete a specific alert
     */
    async deleteAlert(req: Request, res: Response): Promise<void> {
        try {
            const userId = (req as any).user.userId;
            const { id } = req.params;

            await alertService.deleteAlert(id as string, userId);

            res.json({
                message: 'Alert deleted successfully',
            });
        } catch (error: any) {
            console.error('Delete alert error:', error);
            if (error.message.includes('not found')) {
                res.status(404).json({ message: error.message });
            } else {
                res.status(500).json({
                    message: 'Failed to delete alert',
                    error: error.message,
                });
            }
        }
    }
}

export default new AlertController();
