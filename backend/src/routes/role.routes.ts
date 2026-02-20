import { Router } from 'express';
import { RoleController } from '../controllers/role.controller';
import { authenticate, authorize } from '../middleware/auth.middleware';

const router = Router();

// All routes require authentication
router.use(authenticate);

/**
 * @route   GET /api/v1/roles
 * @desc    Get all roles
 * @access  Private (Authenticated users)
 */
router.get(
    '/',
    authorize('users', 'read'), // Same permission as user management
    RoleController.listValidation,
    RoleController.list
);

/**
 * @route   GET /api/v1/roles/:id
 * @desc    Get role by ID
 * @access  Private (Authenticated users)
 */
router.get(
    '/:id',
    authorize('users', 'read'),
    RoleController.getById
);

export default router;
