import { Request, Response, NextFunction } from 'express';
import { AuthService } from '../services/auth.service';
import prisma from '../config/database';

export interface AuthRequest extends Request {
    user?: {
        userId: string;
        email: string;
        roleId: string;
    };
}

/**
 * Middleware to verify JWT token and attach user info to request
 */
export const authenticate = async (
    req: AuthRequest,
    res: Response,
    next: NextFunction
): Promise<void> => {
    try {
        const token = AuthService.extractTokenFromHeader(req.headers.authorization);

        if (!token) {
            res.status(401).json({ error: 'No token provided' });
            return;
        }

        const decoded = AuthService.verifyToken(token);

        // Verify user still exists and is active
        const user = await prisma.user.findUnique({
            where: { id: decoded.userId },
            select: { id: true, email: true, roleId: true, isActive: true },
        });

        if (!user || !user.isActive) {
            res.status(401).json({ error: 'User not found or inactive' });
            return;
        }

        // Attach user info to request
        req.user = {
            userId: user.id,
            email: user.email,
            roleId: user.roleId,
        };

        next();
    } catch (error) {
        res.status(401).json({ error: 'Invalid or expired token' });
    }
};

/**
 * Middleware to check if user has specific permission
 */
export const authorize = (resource: string, action: string) => {
    return async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
        try {
            if (!req.user) {
                res.status(401).json({ error: 'Not authenticated' });
                return;
            }

            // Check if user's role has the required permission
            const rolePermission = await prisma.rolePermission.findFirst({
                where: {
                    roleId: req.user.roleId,
                    permission: {
                        resource,
                        action,
                    },
                },
            });

            if (!rolePermission) {
                res.status(403).json({ error: 'Insufficient permissions' });
                return;
            }

            next();
        } catch (error) {
            res.status(500).json({ error: 'Authorization check failed' });
        }
    };
};
