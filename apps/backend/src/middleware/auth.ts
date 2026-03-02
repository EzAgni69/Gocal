import { Request, Response, NextFunction } from 'express';
import { authAdmin } from '../config/firebase';
import { db } from 'database';
import { users } from 'database/src/schema/users';
import { eq } from 'drizzle-orm';

export interface AuthenticatedRequest extends Request {
    user?: {
        id?: string; // Postgres ID
        uid: string; // Firebase UID
        email: string;
        name?: string;
        picture?: string;
        phone?: string;
        role: string;
        [key: string]: any;
    };
}

/**
 * Verify Firebase ID token and attach user to request
 */
export async function authenticate(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        res.status(401).json({ error: 'Authentication required' });
        return;
    }

    const token = authHeader.split(' ')[1];

    try {
        const decodedToken = await authAdmin.verifyIdToken(token);
        
        let dbUserId: string | undefined;
        let dbUserRole: string | undefined;

        try {
            const dbUsers = await db.select().from(users).where(eq(users.firebaseUid, decodedToken.uid)).limit(1);
            if (dbUsers.length > 0) {
                dbUserId = dbUsers[0].id;
                dbUserRole = dbUsers[0].role;
            }
        } catch (dbError) {
            console.error('Error fetching Postgres user in auth middleware:', dbError);
        }

        req.user = {
            id: dbUserId,
            uid: decodedToken.uid,
            email: decodedToken.email || '',
            name: decodedToken.name,
            picture: decodedToken.picture,
            phone: decodedToken.phone_number,
            role: dbUserRole || decodedToken.role || 'CONSUMER', // Custom claim for role, defaulting to CONSUMER
        };
        
        next();
    } catch (error) {
        console.error('Error verifying Firebase token:', error);
        res.status(401).json({ error: 'Invalid or expired token' });
    }
}

/**
 * Role-based access control middleware
 * Usage: requireRole('ADMIN', 'SUPER_ADMIN')
 */
export function requireRole(...allowedRoles: string[]) {
    return (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
        if (!req.user) {
            res.status(401).json({ error: 'Authentication required' });
            return;
        }

        if (!allowedRoles.includes(req.user.role)) {
            res.status(403).json({
                error: 'Insufficient permissions',
                required: allowedRoles,
                current: req.user.role,
            });
            return;
        }

        next();
    };
}
