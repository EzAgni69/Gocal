import { Router, Response } from 'express';
import { db, vendors, products, galleryImages, offers, reviews, eq, ilike, sql, and } from 'database';
import { authenticate, requireRole, AuthenticatedRequest } from '../middleware/auth';

const router = Router();

/**
 * GET /api/vendors
 * List vendors with optional filters: city, category, search query
 */
router.get('/', async (req: AuthenticatedRequest, res: Response) => {
    try {
        const { city, category, search, page = '1', limit = '20' } = req.query;
        const offset = (Number(page) - 1) * Number(limit);

        let query = db.select().from(vendors);

        const conditions = [];
        if (city) conditions.push(eq(vendors.city, city as string));
        if (search) conditions.push(ilike(vendors.name, `%${search}%`));

        const result = await db.select().from(vendors)
            .where(conditions.length > 0 ? and(...conditions) : undefined)
            .limit(Number(limit))
            .offset(offset)
            .orderBy(vendors.isPremium, vendors.rating);

        res.json({ vendors: result, page: Number(page), limit: Number(limit) });
    } catch (error) {
        console.error('Error listing vendors:', error);
        res.status(500).json({ error: 'Failed to list vendors' });
    }
});

/**
 * GET /api/vendors/nearby
 * Find vendors within a radius using PostGIS
 * Query params: lat, lng, radius (meters, default 2000)
 */
router.get('/nearby', async (req: AuthenticatedRequest, res: Response) => {
    try {
        const { lat, lng, radius = '2000' } = req.query;

        if (!lat || !lng) {
            res.status(400).json({ error: 'lat and lng query params are required' });
            return;
        }

        // PostGIS proximity query using raw SQL
        const result = await db.execute(sql`
            SELECT *,
                (6371000 * acos(
                    cos(radians(${Number(lat)})) *
                    cos(radians(CAST(latitude AS DOUBLE PRECISION))) *
                    cos(radians(CAST(longitude AS DOUBLE PRECISION)) - radians(${Number(lng)})) +
                    sin(radians(${Number(lat)})) *
                    sin(radians(CAST(latitude AS DOUBLE PRECISION)))
                )) AS distance_meters
            FROM vendors
            WHERE latitude IS NOT NULL
                AND longitude IS NOT NULL
                AND (6371000 * acos(
                    cos(radians(${Number(lat)})) *
                    cos(radians(CAST(latitude AS DOUBLE PRECISION))) *
                    cos(radians(CAST(longitude AS DOUBLE PRECISION)) - radians(${Number(lng)})) +
                    sin(radians(${Number(lat)})) *
                    sin(radians(CAST(latitude AS DOUBLE PRECISION)))
                )) <= ${Number(radius)}
            ORDER BY distance_meters ASC
        `);

        res.json({ vendors: result, radius: Number(radius) });
    } catch (error) {
        console.error('Error finding nearby vendors:', error);
        res.status(500).json({ error: 'Failed to find nearby vendors' });
    }
});

/**
 * GET /api/vendors/:id
 * Get vendor details with products, gallery, offers, reviews
 */
router.get('/:id', async (req: AuthenticatedRequest, res: Response) => {
    try {
        const vendorId = req.params.id;

        const vendor = await db.query.vendors.findFirst({
            where: eq(vendors.id, vendorId),
            with: {
                products: true,
                galleryImages: true,
                offers: true,
                reviews: {
                    with: { user: { columns: { id: true, name: true, avatarUrl: true } } },
                },
                category: true,
            },
        });

        if (!vendor) {
            res.status(404).json({ error: 'Vendor not found' });
            return;
        }

        res.json({ vendor });
    } catch (error) {
        console.error('Error fetching vendor:', error);
        res.status(500).json({ error: 'Failed to fetch vendor' });
    }
});

/**
 * POST /api/vendors
 * Create a new vendor (VENDOR role required)
 */
router.post('/', authenticate, requireRole('VENDOR', 'SUPER_ADMIN'), async (req: AuthenticatedRequest, res: Response) => {
    try {
        const {
            name, description, shortDescription, city, address,
            phone, email, coverImageUrl, categoryId,
            miniWebsiteConfig, latitude, longitude, googlePlaceId,
        } = req.body;

        if (!name || !city || !address) {
            res.status(400).json({ error: 'Name, city, and address are required' });
            return;
        }

        // Generate slug from name
        const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

        const [newVendor] = await db.insert(vendors).values({
            ownerId: req.user!.id,
            name,
            slug,
            description,
            shortDescription,
            city,
            address,
            phone,
            email,
            coverImageUrl,
            categoryId,
            miniWebsiteConfig: miniWebsiteConfig || {},
            latitude: latitude?.toString(),
            longitude: longitude?.toString(),
            googlePlaceId,
        }).returning();

        res.status(201).json({ vendor: newVendor });
    } catch (error) {
        console.error('Error creating vendor:', error);
        res.status(500).json({ error: 'Failed to create vendor' });
    }
});

/**
 * PUT /api/vendors/:id
 * Update a vendor (owner or SUPER_ADMIN only)
 */
router.put('/:id', authenticate, async (req: AuthenticatedRequest, res: Response) => {
    try {
        const vendorId = req.params.id;

        // Check ownership
        const [existing] = await db.select().from(vendors).where(eq(vendors.id, vendorId)).limit(1);
        if (!existing) {
            res.status(404).json({ error: 'Vendor not found' });
            return;
        }

        if (existing.ownerId !== req.user!.id && req.user!.role !== 'SUPER_ADMIN') {
            res.status(403).json({ error: 'You can only edit your own vendor' });
            return;
        }

        const [updated] = await db.update(vendors)
            .set(req.body)
            .where(eq(vendors.id, vendorId))
            .returning();

        res.json({ vendor: updated });
    } catch (error) {
        console.error('Error updating vendor:', error);
        res.status(500).json({ error: 'Failed to update vendor' });
    }
});

/**
 * DELETE /api/vendors/:id
 * Delete a vendor (owner or SUPER_ADMIN only)
 */
router.delete('/:id', authenticate, async (req: AuthenticatedRequest, res: Response) => {
    try {
        const vendorId = req.params.id;

        const [existing] = await db.select().from(vendors).where(eq(vendors.id, vendorId)).limit(1);
        if (!existing) {
            res.status(404).json({ error: 'Vendor not found' });
            return;
        }

        if (existing.ownerId !== req.user!.id && req.user!.role !== 'SUPER_ADMIN') {
            res.status(403).json({ error: 'You can only delete your own vendor' });
            return;
        }

        await db.delete(vendors).where(eq(vendors.id, vendorId));
        res.json({ message: 'Vendor deleted successfully' });
    } catch (error) {
        console.error('Error deleting vendor:', error);
        res.status(500).json({ error: 'Failed to delete vendor' });
    }
});

export default router;
