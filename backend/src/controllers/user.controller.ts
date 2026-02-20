import { Response } from 'express';
import { body, param, query, validationResult } from 'express-validator';
import prisma from '../config/database';
import { AuthService } from '../services/auth.service';
import { AuthRequest } from '../middleware/auth.middleware';

export class UserController {
    /**
     * Get all users with pagination and filtering
     * GET /api/v1/users
     */
    static listValidation = [
        query('page').optional().isInt({ min: 1 }).toInt(),
        query('limit').optional().isInt({ min: 1, max: 100 }).toInt(),
        query('search').optional().isString().trim(),
        query('roleId').optional().isUUID(),
        query('isActive').optional().isBoolean().toBoolean(),
    ];

    static async list(req: AuthRequest, res: Response): Promise<void> {
        try {
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                res.status(400).json({ errors: errors.array() });
                return;
            }

            const page = parseInt((req.query.page as string) || '1');
            const limit = parseInt((req.query.limit as string) || '10');
            const search = req.query.search as string | undefined;
            const roleId = req.query.roleId as string | undefined;
            const isActive = req.query.isActive !== undefined
                ? String(req.query.isActive) === 'true'
                : undefined;

            const skip = (page - 1) * limit;

            // Build where clause
            const where: any = {};

            if (search) {
                where.OR = [
                    { email: { contains: search, mode: 'insensitive' } },
                    { firstName: { contains: search, mode: 'insensitive' } },
                    { lastName: { contains: search, mode: 'insensitive' } },
                ];
            }

            if (roleId) {
                where.roleId = roleId;
            }

            if (isActive !== undefined) {
                where.isActive = isActive;
            }

            const [users, total] = await Promise.all([
                prisma.user.findMany({
                    where,
                    skip,
                    take: limit,
                    select: {
                        id: true,
                        email: true,
                        firstName: true,
                        lastName: true,
                        roleId: true,
                        isActive: true,
                        lastLogin: true,
                        createdAt: true,
                        updatedAt: true,
                        role: {
                            select: {
                                id: true,
                                name: true,
                                description: true,
                            },
                        },
                    },
                    orderBy: { createdAt: 'desc' },
                }),
                prisma.user.count({ where }),
            ]);

            res.json({
                users,
                pagination: {
                    page,
                    limit,
                    total,
                    totalPages: Math.ceil(total / limit),
                },
            });
        } catch (error) {
            console.error('List users error:', error);
            res.status(500).json({ error: 'Failed to fetch users' });
        }
    }

    /**
     * Get user by ID
     * GET /api/v1/users/:id
     */
    static getByIdValidation = [param('id').isUUID()];

    static async getById(req: AuthRequest, res: Response): Promise<void> {
        try {
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                res.status(400).json({ errors: errors.array() });
                return;
            }

            const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;

            const user = await prisma.user.findUnique({
                where: { id },
                select: {
                    id: true,
                    email: true,
                    firstName: true,
                    lastName: true,
                    roleId: true,
                    isActive: true,
                    lastLogin: true,
                    createdAt: true,
                    updatedAt: true,
                    role: {
                        select: {
                            id: true,
                            name: true,
                            description: true,
                            rolePermissions: {
                                include: {
                                    permission: true,
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

            res.json({ user });
        } catch (error) {
            console.error('Get user error:', error);
            res.status(500).json({ error: 'Failed to fetch user' });
        }
    }

    /**
     * Create new user
     * POST /api/v1/users
     */
    static createValidation = [
        body('email').isEmail().withMessage('Valid email is required'),
        body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
        body('firstName').notEmpty().withMessage('First name is required'),
        body('lastName').notEmpty().withMessage('Last name is required'),
        body('roleId').isUUID().withMessage('Valid role ID is required'),
        body('isActive').optional().isBoolean(),
    ];

    static async create(req: AuthRequest, res: Response): Promise<void> {
        try {
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                res.status(400).json({ errors: errors.array() });
                return;
            }

            const { email, password, firstName, lastName, roleId, isActive } = req.body;

            // Check if user already exists
            const existingUser = await prisma.user.findUnique({
                where: { email },
            });

            if (existingUser) {
                res.status(409).json({ error: 'User with this email already exists' });
                return;
            }

            // Hash password
            const passwordHash = await AuthService.hashPassword(password);

            // Create user
            const user = await prisma.user.create({
                data: {
                    email,
                    passwordHash,
                    firstName,
                    lastName,
                    roleId,
                    isActive: isActive !== undefined ? isActive : true,
                },
                select: {
                    id: true,
                    email: true,
                    firstName: true,
                    lastName: true,
                    roleId: true,
                    isActive: true,
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

            // Log audit entry
            await prisma.auditLog.create({
                data: {
                    userId: req.user?.userId || null,
                    action: 'USER_CREATED',
                    resourceType: 'user',
                    resourceId: user.id,
                    details: { email: user.email, createdBy: req.user?.email },
                },
            });

            res.status(201).json({
                message: 'User created successfully',
                user,
            });
        } catch (error) {
            console.error('Create user error:', error);
            res.status(500).json({ error: 'Failed to create user' });
        }
    }

    /**
     * Update user
     * PUT /api/v1/users/:id
     */
    static updateValidation = [
        param('id').isUUID(),
        body('email').optional().isEmail(),
        body('firstName').optional().notEmpty(),
        body('lastName').optional().notEmpty(),
        body('roleId').optional().isUUID(),
        body('isActive').optional().isBoolean(),
    ];

    static async update(req: AuthRequest, res: Response): Promise<void> {
        try {
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                res.status(400).json({ errors: errors.array() });
                return;
            }

            const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
            const { email, firstName, lastName, roleId, isActive } = req.body;

            // Check if user exists
            const existingUser = await prisma.user.findUnique({ where: { id } });
            if (!existingUser) {
                res.status(404).json({ error: 'User not found' });
                return;
            }

            // If email is being changed, check uniqueness
            if (email && email !== existingUser.email) {
                const emailExists = await prisma.user.findUnique({ where: { email } });
                if (emailExists) {
                    res.status(409).json({ error: 'Email already in use' });
                    return;
                }
            }

            // Update user
            const updatedUser = await prisma.user.update({
                where: { id },
                data: {
                    ...(email && { email }),
                    ...(firstName && { firstName }),
                    ...(lastName && { lastName }),
                    ...(roleId && { roleId }),
                    ...(isActive !== undefined && { isActive }),
                },
                select: {
                    id: true,
                    email: true,
                    firstName: true,
                    lastName: true,
                    roleId: true,
                    isActive: true,
                    updatedAt: true,
                    role: {
                        select: {
                            id: true,
                            name: true,
                            description: true,
                        },
                    },
                },
            });

            // Log audit entry
            await prisma.auditLog.create({
                data: {
                    userId: req.user?.userId || null,
                    action: 'USER_UPDATED',
                    resourceType: 'user',
                    resourceId: id,
                    details: { updatedBy: req.user?.email, changes: req.body },
                },
            });

            res.json({
                message: 'User updated successfully',
                user: updatedUser,
            });
        } catch (error) {
            console.error('Update user error:', error);
            res.status(500).json({ error: 'Failed to update user' });
        }
    }

    /**
     * Delete user (soft delete)
     * DELETE /api/v1/users/:id
     */
    static deleteValidation = [param('id').isUUID()];

    static async delete(req: AuthRequest, res: Response): Promise<void> {
        try {
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                res.status(400).json({ errors: errors.array() });
                return;
            }

            const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;

            // Prevent self-deletion
            if (id === req.user?.userId) {
                res.status(400).json({ error: 'Cannot delete your own account' });
                return;
            }

            // Check if user exists
            const user = await prisma.user.findUnique({ where: { id } });
            if (!user) {
                res.status(404).json({ error: 'User not found' });
                return;
            }

            // Soft delete by setting isActive to false
            await prisma.user.update({
                where: { id },
                data: { isActive: false },
            });

            // Log audit entry
            await prisma.auditLog.create({
                data: {
                    userId: req.user?.userId || null,
                    action: 'USER_DELETED',
                    resourceType: 'user',
                    resourceId: id,
                    details: { deletedBy: req.user?.email, email: user.email },
                },
            });

            res.json({ message: 'User deleted successfully' });
        } catch (error) {
            console.error('Delete user error:', error);
            res.status(500).json({ error: 'Failed to delete user' });
        }
    }

    /**
     * Update user password
     * PUT /api/v1/users/:id/password
     */
    static updatePasswordValidation = [
        param('id').isUUID(),
        body('newPassword').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
        body('oldPassword').optional().isString(),
    ];

    static async updatePassword(req: AuthRequest, res: Response): Promise<void> {
        try {
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                res.status(400).json({ errors: errors.array() });
                return;
            }

            const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
            const { newPassword, oldPassword } = req.body;

            const user = await prisma.user.findUnique({ where: { id } });
            if (!user) {
                res.status(404).json({ error: 'User not found' });
                return;
            }

            // If user is updating their own password, verify old password
            if (id === req.user?.userId && oldPassword) {
                const isValid = await AuthService.comparePassword(oldPassword, user.passwordHash);
                if (!isValid) {
                    res.status(401).json({ error: 'Invalid old password' });
                    return;
                }
            }

            // Hash new password
            const passwordHash = await AuthService.hashPassword(newPassword);

            // Update password
            await prisma.user.update({
                where: { id },
                data: { passwordHash },
            });

            // Log audit entry
            await prisma.auditLog.create({
                data: {
                    userId: req.user?.userId || null,
                    action: 'PASSWORD_UPDATED',
                    resourceType: 'user',
                    resourceId: id,
                    details: { updatedBy: req.user?.email },
                },
            });

            res.json({ message: 'Password updated successfully' });
        } catch (error) {
            console.error('Update password error:', error);
            res.status(500).json({ error: 'Failed to update password' });
        }
    }

    /**
     * Assign role to user
     * PUT /api/v1/users/:id/role
     */
    static assignRoleValidation = [
        param('id').isUUID(),
        body('roleId').isUUID().withMessage('Valid role ID is required'),
    ];

    static async assignRole(req: AuthRequest, res: Response): Promise<void> {
        try {
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                res.status(400).json({ errors: errors.array() });
                return;
            }

            const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
            const { roleId } = req.body;

            // Check if user exists
            const user = await prisma.user.findUnique({ where: { id } });
            if (!user) {
                res.status(404).json({ error: 'User not found' });
                return;
            }

            // Check if role exists
            const role = await prisma.role.findUnique({ where: { id: roleId } });
            if (!role) {
                res.status(404).json({ error: 'Role not found' });
                return;
            }

            // Update user role
            const updatedUser = await prisma.user.update({
                where: { id },
                data: { roleId },
                select: {
                    id: true,
                    email: true,
                    firstName: true,
                    lastName: true,
                    roleId: true,
                    role: {
                        select: {
                            id: true,
                            name: true,
                            description: true,
                        },
                    },
                },
            });

            // Log audit entry
            await prisma.auditLog.create({
                data: {
                    userId: req.user?.userId || null,
                    action: 'ROLE_ASSIGNED',
                    resourceType: 'user',
                    resourceId: id,
                    details: {
                        assignedBy: req.user?.email,
                        oldRoleId: user.roleId,
                        newRoleId: roleId,
                        newRoleName: role.name,
                    },
                },
            });

            res.json({
                message: 'Role assigned successfully',
                user: updatedUser,
            });
        } catch (error) {
            console.error('Assign role error:', error);
            res.status(500).json({ error: 'Failed to assign role' });
        }
    }
}
