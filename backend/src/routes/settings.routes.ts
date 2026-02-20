import { Router } from 'express';
import settingsController from '../controllers/settings.controller';
import { authenticate, authorize } from '../middleware/auth.middleware';

const router = Router();

router.use(authenticate);

/**
 * @route   GET /api/v1/settings
 * @desc    Get all system settings (admin only)
 * @access  Private/Admin
 */
router.get('/', authorize('settings', 'read'), settingsController.getAllSettings.bind(settingsController));

/**
 * @route   GET /api/v1/settings/group/:group
 * @desc    Get settings by group (admin only)
 * @access  Private/Admin
 */
router.get('/group/:group', authorize('settings', 'read'), settingsController.getSettingsByGroup.bind(settingsController));

/**
 * @route   PUT /api/v1/settings/:key
 * @desc    Update a system setting (admin only)
 * @access  Private/Admin
 */
router.put('/:key', authorize('settings', 'update'), settingsController.updateSetting.bind(settingsController));

export default router;
