import { Router } from 'express';
import { AuthController } from '../controllers/auth.controller';
import { authenticate } from '../middleware/auth.middleware';

const router = Router();

/**
 * @route   POST /api/v1/auth/register
 * @desc    Register a new user
 * @access  Public
 */
router.post(
    '/register',
    AuthController.registerValidation,
    AuthController.register
);

/**
 * @route   POST /api/v1/auth/login
 * @desc    Login user and get token
 * @access  Public
 */
router.post('/login', AuthController.loginValidation, AuthController.login);

/**
 * @route   GET /api/v1/auth/me
 * @desc    Get current user profile
 * @access  Private
 */
router.get('/me', authenticate, AuthController.getProfile);

/**
 * @route   POST /api/v1/auth/logout
 * @desc    Logout user (audit log only, token removal is client-side)
 * @access  Private
 */
router.post('/logout', authenticate, AuthController.logout);

export default router;
