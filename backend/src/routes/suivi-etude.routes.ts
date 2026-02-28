import { Router } from 'express';
import suiviEtudeController from '../controllers/suivi-etude.controller';
import { authenticate } from '../middleware/auth.middleware';

const router = Router();

// All routes require authentication
router.use(authenticate);

/**
 * @route   GET /api/v1/suivi-etudes
 * @desc    Get all sector rows + computed totals
 * @access  Private
 */
router.get('/', suiviEtudeController.list.bind(suiviEtudeController));

/**
 * @route   POST /api/v1/suivi-etudes
 * @desc    Create a new sector row
 * @access  Private
 */
router.post('/', suiviEtudeController.create.bind(suiviEtudeController));

/**
 * @route   PUT /api/v1/suivi-etudes/:id/columns
 * @desc    Update column config for a sector
 * @access  Private
 */
router.put('/:id/columns', suiviEtudeController.updateColumns.bind(suiviEtudeController));

/**
 * @route   PUT /api/v1/suivi-etudes/:id
 * @desc    Update a sector row
 * @access  Private
 */
router.put('/:id', suiviEtudeController.update.bind(suiviEtudeController));

/**
 * @route   DELETE /api/v1/suivi-etudes/:id
 * @desc    Delete a sector row
 * @access  Private
 */
router.delete('/:id', suiviEtudeController.delete.bind(suiviEtudeController));

export default router;
