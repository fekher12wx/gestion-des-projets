import { Router } from 'express';
import preferenceController from '../controllers/preference.controller';
import { authenticate } from '../middleware/auth.middleware';

const router = Router();

router.use(authenticate);

/**
 * @route   GET /api/v1/preferences
 * @desc    Get user preferences
 * @access  Private
 */
router.get('/', preferenceController.getPreferences.bind(preferenceController));

/**
 * @route   PUT /api/v1/preferences
 * @desc    Update user preferences
 * @access  Private
 */
router.put('/', preferenceController.updatePreferences.bind(preferenceController));

export default router;
