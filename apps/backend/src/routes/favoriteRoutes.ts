import { Router, Response } from 'express';
import { db, favorites, vendors, eq, and } from 'database';
import { authenticate, AuthenticatedRequest } from '../middleware/auth';

const router = Router();

/**
 * GET /api/favorites
 * List current user's favorite vendors
 */
router.get('/', authenticate, async (req: AuthenticatedRequest, res: Response) => {
    try {
        const result = await db.query.favorites.findMany({
            where: eq(favorites.userId, req.user!.id),
            with: {
                vendor: {
                    columns: {
                        id: true, name: true, shortDescription: true, city: true,
                        coverImageUrl: true, rating: true, reviewCount: true,
                        isOpen: true, isPremium: true, isVerified: true,
                    },
                },
            },
            orderBy: (favorites, { desc }) => [desc(favorites.createdAt)],
        });

        res.json({ favorites: result });
    } catch (error) {
        console.error('Error listing favorites:', error);
        res.status(500).json({ error: 'Failed to list favorites' });
    }
});

/**
 * POST /api/favorites/:vendorId
 * Toggle favorite for a vendor
 */
router.post('/:vendorId', authenticate, async (req: AuthenticatedRequest, res: Response) => {
    try {
        const vendorId = req.params.vendorId;

        // Check if already favorited
        const [existing] = await db.select().from(favorites)
            .where(and(
                eq(favorites.userId, req.user!.id),
                eq(favorites.vendorId, vendorId),
            ))
            .limit(1);

        if (existing) {
            // Remove favorite
            await db.delete(favorites).where(eq(favorites.id, existing.id));
            res.json({ favorited: false, message: 'Removed from favorites' });
        } else {
            // Verify vendor exists
            const [vendor] = await db.select().from(vendors).where(eq(vendors.id, vendorId)).limit(1);
            if (!vendor) {
                res.status(404).json({ error: 'Vendor not found' });
                return;
            }

            // Add favorite
            const [fav] = await db.insert(favorites).values({
                userId: req.user!.id,
                vendorId,
            }).returning();

            res.status(201).json({ favorited: true, favorite: fav });
        }
    } catch (error) {
        console.error('Error toggling favorite:', error);
        res.status(500).json({ error: 'Failed to toggle favorite' });
    }
});

export default router;
