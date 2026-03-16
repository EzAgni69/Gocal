import { Router, Response } from 'express';
import { db } from 'database';
import { users } from 'database/src/schema/users';
import { vendors } from 'database/src/schema/vendors';
import { ilike, or, and, eq, count, desc, sql } from 'drizzle-orm';
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

/**
 * GET /api/users
 * Super Admin route to get all users with filtering and pagination
 */
router.get('/', authenticate, requireRole('ADMIN', 'SUPER_ADMIN'), async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
        const page = parseInt(req.query.page as string) || 1;
        const limit = parseInt(req.query.limit as string) || 20;
        const search = req.query.search as string || '';
        const role = req.query.role as string || '';
        const isActiveStr = req.query.isActive as string || '';
        const offset = (page - 1) * limit;

        const baseQuery = db.select({
            id: users.id,
            email: users.email,
            name: users.name,
            phone: users.phone,
            role: users.role,
            isActive: users.isActive,
            createdAt: users.createdAt,
            vendorName: sql<string>`string_agg(${vendors.name}, ', ')`.as('vendor_name')
        })
        .from(users)
        .leftJoin(vendors, eq(users.id, vendors.ownerId))
        .groupBy(users.id);

        let conditions: any[] = [];
        
        if (search) {
            const searchPattern = `%${search}%`;
            conditions.push(or(
                ilike(users.name, searchPattern),
                ilike(users.email, searchPattern),
                ilike(users.phone, searchPattern),
                ilike(vendors.name, searchPattern)
            ));
        }

        if (role) {
            conditions.push(eq(users.role, role as any));
        }

        if (isActiveStr !== '') {
            conditions.push(eq(users.isActive, isActiveStr === 'true'));
        }

        if (conditions.length > 0) {
            baseQuery.where(and(...conditions));
        }

        const userList = await baseQuery
            .orderBy(desc(users.createdAt))
            .limit(limit)
            .offset(offset);

        // Get total count using distinct to prevent duplicates in count
        const countQuery = db.select({ count: sql<number>`count(distinct ${users.id})` })
            .from(users)
            .leftJoin(vendors, eq(users.id, vendors.ownerId));
            
        if (conditions.length > 0) {
            countQuery.where(and(...conditions));
        }
        
        const totalResult = await countQuery;
        const total = Number(totalResult[0].count);

        res.json({
            users: userList,
            pagination: {
                total,
                page,
                limit,
                totalPages: Math.ceil(total / limit)
            }
        });
    } catch (error) {
        console.error('Error fetching users:', error);
        res.status(500).json({ error: 'Failed to fetch users' });
    }
});

/**
 * PUT /api/users/:id/role
 * Super Admin route to update a user's role
 */
router.put('/:id/role', authenticate, requireRole('ADMIN', 'SUPER_ADMIN'), async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
        const userId = req.params.id;
        const { role } = req.body;

        if (!role) {
            res.status(400).json({ error: 'Role is required' });
            return;
        }

        // Validate role against enum
        const validRoles = ['CONSUMER', 'VENDOR', 'ADMIN', 'SUPER_ADMIN'];
        if (!validRoles.includes(role)) {
            res.status(400).json({ error: 'Invalid role' });
            return;
        }

        // 1. Get user to find Firebase UID
        const existingUsers = await db.select().from(users).where(eq(users.id, userId));
        if (existingUsers.length === 0) {
            res.status(404).json({ error: 'User not found' });
            return;
        }
        
        const user = existingUsers[0];

        // 2. Update Firebase Custom Claims
        if (user.firebaseUid) {
            await authAdmin.setCustomUserClaims(user.firebaseUid, { role });
        }

        // 3. Update Postgres
        const updatedUsers = await db.update(users)
            .set({ role: role as any })
            .where(eq(users.id, userId))
            .returning();

        res.json({
            message: 'User role updated successfully',
            user: {
                id: updatedUsers[0].id,
                email: updatedUsers[0].email,
                role: updatedUsers[0].role
            }
        });
    } catch (error) {
        console.error('Error updating user role:', error);
        res.status(500).json({ error: 'Failed to update user role' });
    }
});

export default router;
