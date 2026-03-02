import { Router, Response } from 'express';
import { db, vendors, products, galleryImages, offers, reviews, tags, vendorTags, homeCards, eq, ilike, sql, and } from 'database';
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
 * GET /api/vendors/home
 * Get vendors marked for the home screen
 */
router.get('/home', async (req: AuthenticatedRequest, res: Response) => {
    try {
        const home_cards = await db.query.homeCards.findMany({
            where: eq(homeCards.isActive, true),
            with: { vendor: { with: { products: true, category: true, galleryImages: true, tags: { with: { tag: true } } } } },
            orderBy: (homeCards, { asc }) => [asc(homeCards.displayOrder)],
        });

        const result = home_cards.map((hc: any) => ({
            ...hc.vendor,
            tags: hc.vendor.tags?.map((vt: any) => vt.tag) || []
        }));
        res.json({ vendors: result });
    } catch (error) {
        console.error('Error fetching home vendors:', error);
        res.status(500).json({ error: 'Failed to fetch home vendors' });
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

        // PostGIS (Earthdistance) proximity query using raw SQL
        // This leverages the idx_vendors_location GiST index for fast nearest-neighbor filtering
        const result = await db.execute(sql`
            SELECT *,
                earth_distance(
                    ll_to_earth(CAST(latitude AS DOUBLE PRECISION), CAST(longitude AS DOUBLE PRECISION)),
                    ll_to_earth(${Number(lat)}, ${Number(lng)})
                ) AS distance_meters
            FROM vendors
            WHERE latitude IS NOT NULL
                AND longitude IS NOT NULL
                AND ll_to_earth(CAST(latitude AS DOUBLE PRECISION), CAST(longitude AS DOUBLE PRECISION)) 
                    <@ earth_box(ll_to_earth(${Number(lat)}, ${Number(lng)}), ${Number(radius)})
                AND earth_distance(
                    ll_to_earth(CAST(latitude AS DOUBLE PRECISION), CAST(longitude AS DOUBLE PRECISION)),
                    ll_to_earth(${Number(lat)}, ${Number(lng)})
                ) <= ${Number(radius)}
            ORDER BY 
                ll_to_earth(CAST(latitude AS DOUBLE PRECISION), CAST(longitude AS DOUBLE PRECISION)) 
                <-> ll_to_earth(${Number(lat)}, ${Number(lng)}) ASC
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
        if (!req.user?.id) { res.status(401).json({ error: 'User profile not fully synced' }); return; }
        const {
            name, description, shortDescription, city, address,
            phone, email, coverImageUrl, categoryId,
            miniWebsiteConfig, latitude, longitude, googlePlaceId,
            tagsList
        } = req.body;

        if (!name || !city || !address) {
            res.status(400).json({ error: 'Name, city, and address are required' });
            return;
        }

        // Generate slug from name
        const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

        const [newVendor] = await db.insert(vendors).values({
            ownerId: req.user!.id!,
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

        // Handle tags
        if (tagsList && Array.isArray(tagsList)) {
            for (const tagName of tagsList) {
                const tagSlug = tagName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
                if (!tagSlug) continue;

                let [existingTag] = await db.select().from(tags).where(eq(tags.slug, tagSlug));
                if (!existingTag) {
                    try {
                        [existingTag] = await db.insert(tags).values({ name: tagName, slug: tagSlug }).returning();
                    } catch (e) {
                        [existingTag] = await db.select().from(tags).where(eq(tags.slug, tagSlug));
                    }
                }
                
                if (existingTag) {
                    try {
                        await db.insert(vendorTags).values({ vendorId: newVendor.id, tagId: existingTag.id });
                    } catch (e) { } // Ignore conflicts
                }
            }
        }

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
        if (!req.user?.id) { res.status(401).json({ error: 'User profile not fully synced' }); return; }
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

        const { tagsList, ...updateData } = req.body;

        const [updated] = await db.update(vendors)
            .set(updateData)
            .where(eq(vendors.id, vendorId))
            .returning();

        // Handle tags update
        if (tagsList && Array.isArray(tagsList)) {
            // Clear existing tags
            await db.delete(vendorTags).where(eq(vendorTags.vendorId, vendorId));
            for (const tagName of tagsList) {
                const tagSlug = tagName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
                if (!tagSlug) continue;

                let [existingTag] = await db.select().from(tags).where(eq(tags.slug, tagSlug));
                if (!existingTag) {
                    try {
                        [existingTag] = await db.insert(tags).values({ name: tagName, slug: tagSlug }).returning();
                    } catch (e) {
                        [existingTag] = await db.select().from(tags).where(eq(tags.slug, tagSlug));
                    }
                }
                
                if (existingTag) {
                    try {
                        await db.insert(vendorTags).values({ vendorId: updated.id, tagId: existingTag.id });
                    } catch (e) { }
                }
            }
        }

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
        if (!req.user?.id) { res.status(401).json({ error: 'User profile not fully synced' }); return; }
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
