import { Router } from 'express';
import { UserController } from '../controllers/user.controller';
import { authenticate, authorize } from '../middleware/auth.middleware';

const router = Router();

// All routes require authentication
router.use(authenticate);

/**
 * @route   GET /api/v1/users
 * @desc    Get all users with pagination and filtering
 * @access  Private (Admin only)
 */
router.get(
    '/',
    authorize('users', 'read'),
    UserController.listValidation,
    UserController.list
);

/**
 * @route   GET /api/v1/users/:id
 * @desc    Get user by ID
 * @access  Private (Admin only)
 */
router.get(
    '/:id',
    authorize('users', 'read'),
    UserController.getByIdValidation,
    UserController.getById
);

/**
 * @route   POST /api/v1/users
 * @desc    Create new user
 * @access  Private (Admin only)
 */
router.post(
    '/',
    authorize('users', 'create'),
    UserController.createValidation,
    UserController.create
);

/**
 * @route   PUT /api/v1/users/:id
 * @desc    Update user
 * @access  Private (Admin only)
 */
router.put(
    '/:id',
    authorize('users', 'update'),
    UserController.updateValidation,
    UserController.update
);

/**
 * @route   DELETE /api/v1/users/:id
 * @desc    Delete user (soft delete)
 * @access  Private (Admin only)
 */
router.delete(
    '/:id',
    authorize('users', 'delete'),
    UserController.deleteValidation,
    UserController.delete
);

/**
 * @route   PUT /api/v1/users/:id/password
 * @desc    Update user password
 * @access  Private (Own account or Admin)
 */
router.put(
    '/:id/password',
    UserController.updatePasswordValidation,
    UserController.updatePassword
);

/**
 * @route   PUT /api/v1/users/:id/role
 * @desc    Assign role to user
 * @access  Private (Admin only)
 */
router.put(
    '/:id/role',
    authorize('users', 'update'),
    UserController.assignRoleValidation,
    UserController.assignRole
);

export default router;
