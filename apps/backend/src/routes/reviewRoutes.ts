import { Router, Response } from 'express';
import { db, reviews, vendors, eq, desc, sql } from 'database';
import { authenticate, AuthenticatedRequest } from '../middleware/auth';
import { z } from 'zod';
import { logger } from '../config/logger';

const router = Router();

const createReviewSchema = z.object({
    vendorId: z.string().uuid(),
    rating: z.number().int().min(1).max(5),
    comment: z.string().min(1).max(1000).optional(),
});

/**
 * POST /api/reviews
 * Create a new review for a vendor
 */
router.post('/', authenticate, async (req: AuthenticatedRequest, res: Response) => {
    try {
        if (!req.user?.id) {
            res.status(401).json({ error: 'Unauthorized' });
            return;
        }

        const validation = createReviewSchema.safeParse(req.body);
        if (!validation.success) {
            res.status(400).json({ error: 'Invalid input', details: (validation.error as any).errors });
            return;
        }

        const { vendorId, rating, comment } = validation.data;

        // Check if vendor exists
        const vendor = await db.query.vendors.findFirst({
            where: eq(vendors.id, vendorId),
        });

        if (!vendor) {
            res.status(404).json({ error: 'Vendor not found' });
            return;
        }

        // Check if user already reviewed this vendor
        const existingReview = await db.query.reviews.findFirst({
            where: sql`${reviews.userId} = ${req.user.id} AND ${reviews.vendorId} = ${vendorId}`,
        });

        if (existingReview) {
            res.status(409).json({ error: 'You have already reviewed this vendor' });
            return;
        }

        // Create the review
        const [newReview] = await db.insert(reviews).values({
            userId: req.user.id,
            vendorId,
            rating,
            comment: comment || null,
        }).returning();

        // Update vendor rating and review count
        const allReviews = await db.query.reviews.findMany({
            where: eq(reviews.vendorId, vendorId),
        });

        const avgRating = allReviews.reduce((sum: number, r: any) => sum + r.rating, 0) / allReviews.length;
        const reviewCount = allReviews.length;

        await db.update(vendors)
            .set({
                rating: avgRating.toFixed(1),
                reviewCount: reviewCount.toString(),
            })
            .where(eq(vendors.id, vendorId));

        // Fetch the review with user info
        const reviewWithUser = await db.query.reviews.findFirst({
            where: eq(reviews.id, newReview.id),
            with: {
                user: {
                    columns: { id: true, name: true, avatarUrl: true },
                },
            },
        });

        res.status(201).json({ review: reviewWithUser });
    } catch (error) {
        logger.error('Error creating review:', error);
        res.status(500).json({ error: 'Failed to create review' });
    }
});

/**
 * GET /api/reviews/vendor/:vendorId
 * Get all reviews for a vendor
 */
router.get('/vendor/:vendorId', async (req: AuthenticatedRequest, res: Response) => {
    try {
        const { vendorId } = req.params;

        const vendorReviews = await db.query.reviews.findMany({
            where: eq(reviews.vendorId, vendorId),
            with: {
                user: {
                    columns: { id: true, name: true, avatarUrl: true },
                },
            },
            orderBy: [desc(reviews.createdAt)],
        });

        res.json({ reviews: vendorReviews });
    } catch (error) {
        logger.error('Error fetching reviews:', error);
        res.status(500).json({ error: 'Failed to fetch reviews' });
    }
});

/**
 * PUT /api/reviews/:id
 * Update a review (only by the review author)
 */
router.put('/:id', authenticate, async (req: AuthenticatedRequest, res: Response) => {
    try {
        if (!req.user?.id) {
            res.status(401).json({ error: 'Unauthorized' });
            return;
        }

        const { id } = req.params;
        const validation = z.object({
            rating: z.number().int().min(1).max(5).optional(),
            comment: z.string().min(1).max(1000).optional(),
        }).safeParse(req.body);

        if (!validation.success) {
            res.status(400).json({ error: 'Invalid input', details: (validation.error as any).errors });
            return;
        }

        const review = await db.query.reviews.findFirst({
            where: eq(reviews.id, id),
        });

        if (!review) {
            res.status(404).json({ error: 'Review not found' });
            return;
        }

        if (review.userId !== req.user.id) {
            res.status(403).json({ error: 'You can only edit your own reviews' });
            return;
        }

        const [updatedReview] = await db.update(reviews)
            .set({
                ...validation.data,
                updatedAt: new Date(),
            })
            .where(eq(reviews.id, id))
            .returning();

        // Recalculate vendor rating
        const allReviews = await db.query.reviews.findMany({
            where: eq(reviews.vendorId, review.vendorId),
        });

        const avgRating = allReviews.reduce((sum: number, r: any) => sum + r.rating, 0) / allReviews.length;

        await db.update(vendors)
            .set({ rating: avgRating.toFixed(1) })
            .where(eq(vendors.id, review.vendorId));

        res.json({ review: updatedReview });
    } catch (error) {
        logger.error('Error updating review:', error);
        res.status(500).json({ error: 'Failed to update review' });
    }
});

/**
 * DELETE /api/reviews/:id
 * Delete a review (only by the review author)
 */
router.delete('/:id', authenticate, async (req: AuthenticatedRequest, res: Response) => {
    try {
        if (!req.user?.id) {
            res.status(401).json({ error: 'Unauthorized' });
            return;
        }

        const { id } = req.params;

        const review = await db.query.reviews.findFirst({
            where: eq(reviews.id, id),
        });

        if (!review) {
            res.status(404).json({ error: 'Review not found' });
            return;
        }

        if (review.userId !== req.user.id) {
            res.status(403).json({ error: 'You can only delete your own reviews' });
            return;
        }

        await db.delete(reviews).where(eq(reviews.id, id));

        // Recalculate vendor rating and count
        const allReviews = await db.query.reviews.findMany({
            where: eq(reviews.vendorId, review.vendorId),
        });

        if (allReviews.length > 0) {
            const avgRating = allReviews.reduce((sum: number, r: any) => sum + r.rating, 0) / allReviews.length;
            await db.update(vendors)
                .set({
                    rating: avgRating.toFixed(1),
                    reviewCount: allReviews.length.toString(),
                })
                .where(eq(vendors.id, review.vendorId));
        } else {
            await db.update(vendors)
                .set({ rating: '0.0', reviewCount: '0' })
                .where(eq(vendors.id, review.vendorId));
        }

        res.json({ message: 'Review deleted successfully' });
    } catch (error) {
        logger.error('Error deleting review:', error);
        res.status(500).json({ error: 'Failed to delete review' });
    }
});

export default router;
