import { Router, Response } from 'express';
import { db, favorites, eq, and } from 'database';
import { authenticate, AuthenticatedRequest } from '../middleware/auth';

const router = Router();

/**
 * GET /api/favorites
 * List current user's favorite vendors
 */
router.get('/', authenticate, async (req: AuthenticatedRequest, res: Response) => {
    try {
        if (!req.user?.id) {
            res.status(401).json({ error: 'User profile not fully synced' });
            return;
        }

        const result = await db.query.favorites.findMany({
            where: eq(favorites.userId, req.user!.id),
            orderBy: (t: any, { desc }: any) => [desc(t.createdAt)],
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
        if (!req.user?.id) {
            res.status(401).json({ error: 'User profile not fully synced' });
            return;
        }

        const vendorId = req.params.vendorId;
        const { placeData } = req.body; // Accept the GooglePlaceResponse metadata

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
            // Add favorite with metadata JSON
            const [fav] = await db.insert(favorites).values({
                userId: req.user!.id,
                vendorId,
                placeData: placeData || null,
            }).returning();

            res.status(201).json({ favorited: true, favorite: fav });
        }
    } catch (error) {
        console.error('Error toggling favorite:', error);
        res.status(500).json({ error: 'Failed to toggle favorite' });
    }
});

export default router;
