import { Router, Response } from 'express';
import { db, wishlists, wishlistItems, eq, and } from 'database';
import { authenticate, AuthenticatedRequest } from '../middleware/auth';
import { logger } from '../config/logger';

const router = Router();

/**
 * GET /api/wishlists
 * List current user's wishlists
 */
router.get('/', authenticate, async (req: AuthenticatedRequest, res: Response) => {
    try {
        if (!req.user?.id) { res.status(401).json({ error: 'User profile not fully synced' }); return; }

        const result = await db.query.wishlists.findMany({
            where: eq(wishlists.userId, req.user!.id),
            with: {
                items: true,
            },
            orderBy: (wishlists, { desc }) => [desc(wishlists.createdAt)],
        });

        res.json({ wishlists: result });
    } catch (error) {
        logger.error('Error listing wishlists:', { error });
        res.status(500).json({ error: 'Failed to list wishlists' });
    }
});

/**
 * POST /api/wishlists
 * Create a new wishlist
 */
router.post('/', authenticate, async (req: AuthenticatedRequest, res: Response) => {
    try {
        if (!req.user?.id) { res.status(401).json({ error: 'User profile not fully synced' }); return; }

        const { name = 'My Wishlist' } = req.body;

        const [wishlist] = await db.insert(wishlists).values({
            userId: req.user!.id,
            name,
        }).returning();

        res.status(201).json({ wishlist });
    } catch (error) {
        logger.error('Error creating wishlist:', { error });
        res.status(500).json({ error: 'Failed to create wishlist' });
    }
});

/**
 * POST /api/wishlists/:id/items
 * Add a product to a wishlist
 */
router.post('/:id/items', authenticate, async (req: AuthenticatedRequest, res: Response) => {
    try {
        if (!req.user?.id) { res.status(401).json({ error: 'User profile not fully synced' }); return; }

        const wishlistId = req.params.id;
        const { productId, productData, quantity = 1 } = req.body;

        if (!productId) {
            res.status(400).json({ error: 'productId is required' });
            return;
        }

        // Verify wishlist ownership
        const [wishlist] = await db.select().from(wishlists)
            .where(eq(wishlists.id, wishlistId)).limit(1);

        if (!wishlist || wishlist.userId !== req.user!.id) {
            res.status(404).json({ error: 'Wishlist not found' });
            return;
        }

        const [item] = await db.insert(wishlistItems).values({
            wishlistId,
            productId,
            productData: productData || null,
            quantity,
        }).returning();

        res.status(201).json({ item });
    } catch (error) {
        logger.error('Error adding to wishlist:', { error });
        res.status(500).json({ error: 'Failed to add to wishlist' });
    }
});

/**
 * DELETE /api/wishlists/:id/products/:productId
 * Remove an item from a wishlist by productId
 */
router.delete('/:id/products/:productId', authenticate, async (req: AuthenticatedRequest, res: Response) => {
    try {
        if (!req.user?.id) { res.status(401).json({ error: 'User profile not fully synced' }); return; }

        const { id: wishlistId, productId } = req.params;

        // Verify wishlist ownership
        const [wishlist] = await db.select().from(wishlists)
            .where(eq(wishlists.id, wishlistId)).limit(1);

        if (!wishlist || wishlist.userId !== req.user!.id) {
            res.status(404).json({ error: 'Wishlist not found' });
            return;
        }

        await db.delete(wishlistItems).where(
            and(
                eq(wishlistItems.wishlistId, wishlistId),
                eq(wishlistItems.productId, productId)
            )
        );
        res.json({ message: 'Item removed from wishlist' });
    } catch (error) {
        logger.error('Error removing from wishlist:', { error });
        res.status(500).json({ error: 'Failed to remove from wishlist' });
    }
});

/**
 * GET /api/wishlists/:id/whatsapp
 * Generate WhatsApp message for a wishlist
 */
router.get('/:id/whatsapp', authenticate, async (req: AuthenticatedRequest, res: Response) => {
    try {
        if (!req.user?.id) { res.status(401).json({ error: 'User profile not fully synced' }); return; }

        const wishlistId = req.params.id;

        const wishlist = await db.query.wishlists.findFirst({
            where: eq(wishlists.id, wishlistId),
            with: {
                items: true,
            },
        });

        if (!wishlist || wishlist.userId !== req.user!.id) {
            res.status(404).json({ error: 'Wishlist not found' });
            return;
        }

        // Group items by vendor
        const vendorGroups: Record<string, { vendorName: string; phone: string | null; items: string[] }> = {};

        for (const item of wishlist.items) {
            // MOCK_VENDORS product structure isn't relational, it's just raw data
            // We assume frontend or MOCK_VENDORS gives vendor details inside productData
            const pData = item.productData as any;
            const vendorId = pData?.vendorId || 'unknown';
            if (!vendorGroups[vendorId]) {
                vendorGroups[vendorId] = {
                    vendorName: pData?.vendorName || 'Unknown Vendor',
                    phone: pData?.vendorPhone || null,
                    items: [],
                };
            }
            vendorGroups[vendorId].items.push(
                `• ${pData?.name || 'Product'} (Qty: ${item.quantity}) - ₹${pData?.price || 0}`
            );
        }

        // Generate WhatsApp messages per vendor
        const messages = Object.entries(vendorGroups).map(([vendorId, group]) => {
            const message = `Hi ${group.vendorName}! 🛍️\n\nI'm interested in the following products:\n\n${group.items.join('\n')}\n\nPlease share availability and details.\n\n— Sent via gocal.co`;
            const encodedMessage = encodeURIComponent(message);
            const phone = group.phone?.replace(/[^0-9]/g, '') || '';

            return {
                vendorId,
                vendorName: group.vendorName,
                message,
                whatsappUrl: phone ? `https://wa.me/${phone}?text=${encodedMessage}` : null,
            };
        });

        res.json({ messages });
    } catch (error) {
        logger.error('Error generating WhatsApp message:', { error });
        res.status(500).json({ error: 'Failed to generate WhatsApp message' });
    }
});

export default router;
