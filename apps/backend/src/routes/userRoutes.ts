import { Router, Response } from 'express';
import { db } from 'database';
import { users } from 'database/src/schema/users';
import { authenticate, requireRole, AuthenticatedRequest } from '../middleware/auth';
import { authAdmin } from '../config/firebase';

const router = Router();

/**
 * POST /api/users
 * Admin route to create a user in both Firebase and Postgres simultaneously.
 */
router.post('/', authenticate, requireRole('ADMIN', 'SUPER_ADMIN'), async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
        const { email, password, name, phone, role } = req.body;

        if (!email || !password) {
            res.status(400).json({ error: 'Email and password are required' });
            return;
        }

        // 1. Create user in Firebase
        const firebaseUser = await authAdmin.createUser({
            email,
            password,
            displayName: name || email.split('@')[0],
            phoneNumber: phone || undefined,
        });

        // 2. Set custom claims if a role is provided
        const userRole = role || 'CONSUMER';
        await authAdmin.setCustomUserClaims(firebaseUser.uid, { role: userRole });

        // 3. Create user in Postgres Database
        const newUsers = await db.insert(users).values({
            firebaseUid: firebaseUser.uid,
            email: email,
            name: name || email.split('@')[0],
            phone: phone || null,
            role: userRole,
            preferredLanguage: 'en',
        }).returning();

        const dbUser = newUsers[0];

        res.status(201).json({
            message: 'User created successfully',
            user: {
                id: dbUser.id,
                firebaseUid: dbUser.firebaseUid,
                email: dbUser.email,
                name: dbUser.name,
                role: dbUser.role,
                phone: dbUser.phone,
            }
        });
    } catch (error: any) {
        console.error('Error creating user:', error);
        
        // Return a clean error if Firebase fails (like email already exists)
        if (error.code && error.code.startsWith('auth/')) {
             res.status(400).json({ error: error.message });
             return;
        }

        res.status(500).json({ error: 'Failed to create user' });
    }
});

export default router;
