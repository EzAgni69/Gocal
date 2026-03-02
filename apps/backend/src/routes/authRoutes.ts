import { Router, Response } from 'express';
import { db } from 'database';
import { users } from 'database/src/schema/users';
import { eq } from 'drizzle-orm';
import { authenticate, AuthenticatedRequest } from '../middleware/auth';

const router = Router();

/**
 * POST /api/auth/sync
 * Syncs the authenticated Firebase user with the Postgres Database
 */
router.post('/sync', authenticate, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
        const firebaseUser = req.user;

        if (!firebaseUser || !firebaseUser.uid) {
            res.status(401).json({ error: 'Unauthorized: No valid user payload' });
            return;
        }

        const { uid, email, name, phone, picture } = firebaseUser;

        // Check if user already exists in DB
        const existingUsers = await db.select().from(users).where(eq(users.firebaseUid, uid)).limit(1);
        let dbUser = existingUsers[0];

        if (!dbUser && email) {
            // Fallback check by email (in case they existed before Firebase migration)
            const usersByEmail = await db.select().from(users).where(eq(users.email, email)).limit(1);
            if (usersByEmail.length > 0) {
                // Link the existing user to Firebase
                const updatedUsers = await db.update(users)
                    .set({ firebaseUid: uid })
                    .where(eq(users.email, email))
                    .returning();
                dbUser = updatedUsers[0];
            }
        }

        if (!dbUser) {
            // Create a new user in Postgres
            const newUsers = await db.insert(users).values({
                firebaseUid: uid,
                email: email || '',
                name: name || email?.split('@')[0] || 'Unknown User',
                phone: phone || null,
                avatarUrl: picture || null,
                role: 'CONSUMER', // Default role
                preferredLanguage: 'en',
            }).returning();
            dbUser = newUsers[0];
        }

        if (!dbUser.isActive) {
            res.status(403).json({ error: 'Account is deactivated' });
            return;
        }

        res.status(200).json({
            user: {
                id: dbUser.id,
                firebaseUid: dbUser.firebaseUid,
                email: dbUser.email,
                name: dbUser.name,
                role: dbUser.role,
                phone: dbUser.phone,
                avatarUrl: dbUser.avatarUrl,
                preferredLanguage: dbUser.preferredLanguage,
            }
        });
    } catch (error) {
        console.error('Sync error:', error);
        res.status(500).json({ error: 'Failed to sync user data' });
    }
});

export default router;
