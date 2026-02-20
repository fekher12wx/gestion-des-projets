import { Response } from 'express';
import { query, validationResult } from 'express-validator';
import prisma from '../config/database';
import { AuthRequest } from '../middleware/auth.middleware';

export class RoleController {
    /**
     * Get all roles
     * GET /api/v1/roles
     */
    static listValidation = [
        query('includePermissions').optional().isBoolean().toBoolean(),
    ];

    static async list(req: AuthRequest, res: Response): Promise<void> {
        try {
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                res.status(400).json({ errors: errors.array() });
                return;
            }

            const includePermissions = req.query.includePermissions === 'true';

            const roles = await prisma.role.findMany({
                select: {
                    id: true,
                    name: true,
                    description: true,
                    createdAt: true,
                    ...(includePermissions && {
                        rolePermissions: {
                            include: {
                                permission: true,
                            },
                        },
                    }),
                },
                orderBy: { name: 'asc' },
            });

            res.json({ roles });
        } catch (error) {
            console.error('List roles error:', error);
            res.status(500).json({ error: 'Failed to fetch roles' });
        }
    }

    /**
     * Get role by ID
     * GET /api/v1/roles/:id
     */
    static async getById(req: AuthRequest, res: Response): Promise<void> {
        try {
            const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;

            const role = await prisma.role.findUnique({
                where: { id },
                include: {
                    rolePermissions: {
                        include: {
                            permission: true,
                        },
                    },
                },
            });

            if (!role) {
                res.status(404).json({ error: 'Role not found' });
                return;
            }

            res.json({ role });
        } catch (error) {
            console.error('Get role error:', error);
            res.status(500).json({ error: 'Failed to fetch role' });
        }
    }
}
