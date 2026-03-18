import { Request, Response } from 'express';
import { body, validationResult } from 'express-validator';
import prisma from '../config/database';
import { AuthService } from '../services/auth.service';

export class AuthController {
    /**
     * Register a new user
     * POST /api/v1/auth/register
     */
    static registerValidation = [
        body('email').isEmail().withMessage('Valid email is required'),
        body('password')
            .isLength({ min: 6 })
            .withMessage('Password must be at least 6 characters'),
        body('firstName').notEmpty().withMessage('First name is required'),
        body('lastName').notEmpty().withMessage('Last name is required'),
        body('roleId').optional().isUUID().withMessage('Valid role ID required'),
    ];

    static async register(req: Request, res: Response): Promise<void> {
        try {
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                res.status(400).json({ errors: errors.array() });
                return;
            }

            const { email, password, firstName, lastName, roleId } = req.body;

            // Check if user already exists
            const existingUser = await prisma.user.findUnique({
                where: { email },
            });

            if (existingUser) {
                res.status(409).json({ error: 'User with this email already exists' });
                return;
            }

            // Get default role (Technicien) if no role specified
            let finalRoleId = roleId;
            if (!finalRoleId) {
                const defaultRole = await prisma.role.findUnique({
                    where: { name: 'Technicien' },
                });
                if (!defaultRole) {
                    res.status(500).json({ error: 'Default role not found' });
                    return;
                }
                finalRoleId = defaultRole.id;
            }

            // Hash password and create user
            const passwordHash = await AuthService.hashPassword(password);

            const user = await prisma.user.create({
                data: {
                    email,
                    passwordHash,
                    firstName,
                    lastName,
                    roleId: finalRoleId,
                    isActive: true,
                },
                select: {
                    id: true,
                    email: true,
                    firstName: true,
                    lastName: true,
                    roleId: true,
                    isActive: true,
                    canEdit: true,
                    allowedSecteurs: true,
                    createdAt: true,
                    role: {
                        select: {
                            id: true,
                            name: true,
                            description: true,
                        },
                    },
                },
            });

            // Generate token
            const token = AuthService.generateToken(user as any);

            // Log audit entry
            await prisma.auditLog.create({
                data: {
                    userId: user.id,
                    action: 'USER_REGISTERED',
                    resourceType: 'user',
                    resourceId: user.id,
                    details: { email: user.email },
                },
            });

            res.status(201).json({
                message: 'User registered successfully',
                token,
                user,
            });
        } catch (error) {
            console.error('Registration error:', error);
            res.status(500).json({ error: 'Failed to register user' });
        }
    }

    /**
     * Login user
     * POST /api/v1/auth/login
     */
    static loginValidation = [
        body('email').isEmail().withMessage('Valid email is required'),
        body('password').notEmpty().withMessage('Password is required'),
    ];

    static async login(req: Request, res: Response): Promise<void> {
        try {
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                res.status(400).json({ errors: errors.array() });
                return;
            }

            const { email, password } = req.body;

            // Find user
            const user = await prisma.user.findUnique({
                where: { email },
                include: {
                    role: {
                        select: {
                            id: true,
                            name: true,
                            description: true,
                            rolePermissions: {
                                include: {
                                    permission: {
                                        select: {
                                            resource: true,
                                            action: true,
                                        },
                                    },
                                },
                            },
                        },
                    },
                },
            });

            if (!user) {
                res.status(401).json({ error: 'Invalid email or password' });
                return;
            }

            if (!user.isActive) {
                res.status(403).json({ error: 'Account is inactive' });
                return;
            }

            // Verify password
            const isPasswordValid = await AuthService.comparePassword(
                password,
                user.passwordHash
            );

            if (!isPasswordValid) {
                res.status(401).json({ error: 'Invalid email or password' });
                return;
            }

            // Update last login
            await prisma.user.update({
                where: { id: user.id },
                data: { lastLogin: new Date() },
            });

            // Generate token
            const token = AuthService.generateToken(user);

            // Log audit entry
            await prisma.auditLog.create({
                data: {
                    userId: user.id,
                    action: 'USER_LOGIN',
                    resourceType: 'user',
                    resourceId: user.id,
                    ipAddress: req.ip,
                    userAgent: req.get('user-agent'),
                },
            });

            // Return user without password hash, with flattened permissions
            const { passwordHash: _removed, ...userWithoutPassword } = user;

            // Flatten permissions from role.rolePermissions
            const permissions = user.role.rolePermissions.map((rp: any) => ({
                resource: rp.permission.resource,
                action: rp.permission.action,
            }));

            // Remove rolePermissions from role object to keep response clean
            const { rolePermissions: _rp, ...cleanRole } = user.role;

            res.json({
                message: 'Login successful',
                token,
                user: {
                    ...userWithoutPassword,
                    role: cleanRole,
                    permissions,
                },
            });
        } catch (error) {
            console.error('Login error:', error);
            res.status(500).json({ error: 'Failed to login' });
        }
    }

    /**
     * Get current user profile
     * GET /api/v1/auth/me
     */
    static async getProfile(req: Request, res: Response): Promise<void> {
        try {
            const userId = (req as any).user?.userId;

            if (!userId) {
                res.status(401).json({ error: 'Not authenticated' });
                return;
            }

            const user = await prisma.user.findUnique({
                where: { id: userId },
                select: {
                    id: true,
                    email: true,
                    firstName: true,
                    lastName: true,
                    roleId: true,
                    isActive: true,
                    canEdit: true,
                    allowedSecteurs: true,
                    lastLogin: true,
                    createdAt: true,
                    updatedAt: true,
                    role: {
                        select: {
                            id: true,
                            name: true,
                            description: true,
                            rolePermissions: {
                                select: {
                                    permission: {
                                        select: {
                                            resource: true,
                                            action: true,
                                        },
                                    },
                                },
                            },
                        },
                    },
                },
            });

            if (!user) {
                res.status(404).json({ error: 'User not found' });
                return;
            }

            // Flatten permissions
            const permissions = user.role.rolePermissions.map((rp: any) => ({
                resource: rp.permission.resource,
                action: rp.permission.action,
            }));

            const { rolePermissions: _rp, ...cleanRole } = user.role;

            res.json({
                user: {
                    ...user,
                    role: cleanRole,
                    permissions,
                },
            });
        } catch (error) {
            console.error('Profile fetch error:', error);
            res.status(500).json({ error: 'Failed to fetch profile' });
        }
    }

    /**
     * Logout (client-side token removal, optional audit log)
     * POST /api/v1/auth/logout
     */
    static async logout(req: Request, res: Response): Promise<void> {
        try {
            const userId = (req as any).user?.userId;

            if (userId) {
                // Log audit entry
                await prisma.auditLog.create({
                    data: {
                        userId,
                        action: 'USER_LOGOUT',
                        resourceType: 'user',
                        resourceId: userId,
                        ipAddress: req.ip,
                        userAgent: req.get('user-agent'),
                    },
                });
            }

            res.json({ message: 'Logout successful' });
        } catch (error) {
            console.error('Logout error:', error);
            res.status(500).json({ error: 'Failed to logout' });
        }
    }
}
