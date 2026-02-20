import { Router } from 'express';
import savedFilterController from '../controllers/saved-filter.controller';
import { authenticate } from '../middleware/auth.middleware';

const router = Router();

router.use(authenticate);

/**
 * @route   GET /api/v1/saved-filters?entity=...
 * @desc    Get user's saved filters
 * @access  Private
 */
router.get('/', savedFilterController.getFilters.bind(savedFilterController));

/**
 * @route   POST /api/v1/saved-filters
 * @desc    Create a saved filter
 * @access  Private
 */
router.post('/', savedFilterController.createFilter.bind(savedFilterController));

/**
 * @route   PUT /api/v1/saved-filters/:id
 * @desc    Update a saved filter
 * @access  Private
 */
router.put('/:id', savedFilterController.updateFilter.bind(savedFilterController));

/**
 * @route   DELETE /api/v1/saved-filters/:id
 * @desc    Delete a saved filter
 * @access  Private
 */
router.delete('/:id', savedFilterController.deleteFilter.bind(savedFilterController));

export default router;
