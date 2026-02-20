import { Router } from 'express';
import searchController from '../controllers/search.controller';
import { authenticate } from '../middleware/auth.middleware';

const router = Router();

router.use(authenticate);

/**
 * @route   GET /api/v1/search?q=...&limit=5
 * @desc    Global search across all entities
 * @access  Private
 */
router.get('/', searchController.search.bind(searchController));

export default router;
