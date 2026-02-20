import { Router } from 'express';
import alertController from '../controllers/alert.controller';
import { authenticate } from '../middleware/auth.middleware';

const router = Router();

// All routes require authentication
router.use(authenticate);

/**
 * @route   GET /api/alerts
 * @desc    Get user's alerts with optional filtering
 * @access  Private
 * @query   isRead (optional) - Filter by read status
 * @query   type (optional) - Filter by alert type
 * @query   limit (optional) - Number of alerts to fetch (default: 20)
 * @query   offset (optional) - Pagination offset (default: 0)
 */
router.get('/', alertController.getUserAlerts.bind(alertController));

/**
 * @route   GET /api/alerts/unread-count
 * @desc    Get count of unread alerts
 * @access  Private
 */
router.get('/unread-count', alertController.getUnreadCount.bind(alertController));

/**
 * @route   PUT /api/alerts/:id/read
 * @desc    Mark a specific alert as read
 * @access  Private
 */
router.put('/:id/read', alertController.markAsRead.bind(alertController));

/**
 * @route   PUT /api/alerts/mark-all-read
 * @desc    Mark all user's alerts as read
 * @access  Private
 */
router.put('/mark-all-read', alertController.markAllAsRead.bind(alertController));

/**
 * @route   DELETE /api/alerts/:id
 * @desc    Delete a specific alert
 * @access  Private
 */
router.delete('/:id', alertController.deleteAlert.bind(alertController));

export default router;
