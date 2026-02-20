import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';

interface User {
    id: string;
    email: string;
    roleId: string;
    passwordHash: string;
}

interface TokenPayload {
    userId: string;
    email: string;
    roleId: string;
}

export class AuthService {
    private static readonly JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';
    private static readonly JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d';
    private static readonly BCRYPT_ROUNDS = parseInt(process.env.BCRYPT_ROUNDS || '10');

    /**
     * Generate JWT token for authenticated user
     */
    static generateToken(user: User): string {
        const payload: TokenPayload = {
            userId: user.id,
            email: user.email,
            roleId: user.roleId,
        };

        return jwt.sign(payload, this.JWT_SECRET, {
            expiresIn: this.JWT_EXPIRES_IN,
        } as jwt.SignOptions);
    }

    /**
     * Verify and decode JWT token
     */
    static verifyToken(token: string): TokenPayload {
        try {
            return jwt.verify(token, this.JWT_SECRET) as TokenPayload;
        } catch (error) {
            throw new Error('Invalid or expired token');
        }
    }

    /**
     * Hash password using bcrypt
     */
    static async hashPassword(password: string): Promise<string> {
        return bcrypt.hash(password, this.BCRYPT_ROUNDS);
    }

    /**
     * Compare password with hashed password
     */
    static async comparePassword(password: string, hash: string): Promise<boolean> {
        return bcrypt.compare(password, hash);
    }

    /**
     * Extract token from Authorization header
     */
    static extractTokenFromHeader(authHeader: string | undefined): string | null {
        if (!authHeader) {
            return null;
        }

        const parts = authHeader.split(' ');
        if (parts.length !== 2 || parts[0] !== 'Bearer') {
            return null;
        }

        return parts[1];
    }
}
