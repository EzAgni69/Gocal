import { Router, Response } from 'express';
import { db, vendors, products, galleryImages, offers, reviews, tags, vendorTags, homeCards, favorites, wishlistItems, eq, ilike, sql, and, or, isNull, isNotNull, desc, inArray } from 'database';
import { authenticate, requireRole, AuthenticatedRequest } from '../middleware/auth';
import { z } from 'zod';
import { validate } from '../middleware/validation';

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
        const conditions = [isNull(vendors.deletedAt)];
        if (city) conditions.push(eq(vendors.city, city as string));
        if (category) conditions.push(eq(vendors.categoryId, category as string));
        if (search) conditions.push(
            or(
                ilike(vendors.name, `%${search}%`),
                ilike(vendors.city, `%${search}%`),
                ilike(vendors.phone, `%${search}%`),
                ilike(vendors.email, `%${search}%`)
            )!
        );

        // Get total count for pagination
        const totalResult = await db.select({ count: sql<number>`count(*)` })
            .from(vendors)
            .where(conditions.length > 0 ? and(...conditions) : undefined);
        const total = Number(totalResult[0]?.count || 0);

        const result = await db.select().from(vendors)
            .where(conditions.length > 0 ? and(...conditions) : undefined)
            .limit(Number(limit))
            .offset(offset)
            .orderBy(desc(vendors.createdAt));

        res.json({ vendors: result, total, page: Number(page), limit: Number(limit) });
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
            with: { 
                vendor: { 
                    with: { products: true, category: true, galleryImages: true, tags: { with: { tag: true } }, reviews: { with: { user: { columns: { id: true, name: true, avatarUrl: true } } } } } 
                } 
            },
            orderBy: (homeCards, { asc }) => [asc(homeCards.displayOrder)],
        });

        const result = home_cards
            .filter((hc: any) => hc.vendor && !hc.vendor.deletedAt) // Filter out soft-deleted vendors
            .map((hc: any) => ({
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
            where: and(eq(vendors.id, vendorId), isNull(vendors.deletedAt)),
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
 * GET /api/vendors/store/:uuid
 * Get vendor details by websiteUuid for mini-website
 */
router.get('/store/:uuid', async (req: AuthenticatedRequest, res: Response) => {
    try {
        const { uuid } = req.params;

        const vendor = await db.query.vendors.findFirst({
            where: and(eq(vendors.websiteUuid, uuid), isNull(vendors.deletedAt)),
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
            res.status(404).json({ error: 'Store not found' });
            return;
        }

        res.json({ vendor });
    } catch (error) {
        console.error('Error fetching store:', error);
        res.status(500).json({ error: 'Failed to fetch store' });
    }
});

/**
 * POST /api/vendors
 * Create a new vendor (VENDOR role required)
 */

const vendorSchema = z.object({
    body: z.object({
        name: z.string().min(1).max(255),
        description: z.string().optional().nullable(),
        shortDescription: z.string().optional().nullable(),
        city: z.string().min(1).max(100),
        address: z.string().min(1).max(500),
        phone: z.string().max(20).optional().nullable(),
        email: z.string().email().optional().nullable().or(z.literal('')),
        coverImageUrl: z.string().url().optional().nullable().or(z.literal('')),
        categoryId: z.string().uuid().optional().nullable(),
        miniWebsiteConfig: z.any().optional(),
        latitude: z.union([z.number(), z.string()]).optional().nullable(),
        longitude: z.union([z.number(), z.string()]).optional().nullable(),
        googlePlaceId: z.string().optional().nullable(),
        tagsList: z.array(z.string().max(50)).optional(),
        websiteUrl: z.string().url().optional().nullable().or(z.literal('')),
    })
});

router.post('/', authenticate, requireRole('VENDOR', 'SUPER_ADMIN'), validate(vendorSchema), async (req: AuthenticatedRequest, res: Response) => {
    try {
        if (!req.user?.id) { res.status(401).json({ error: 'User profile not fully synced' }); return; }
        const {
            name, description, shortDescription, city, address,
            phone, email, coverImageUrl, categoryId,
            miniWebsiteConfig, latitude, longitude, googlePlaceId,
            tagsList, websiteUrl
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
            websiteUrl,
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

const updateVendorSchema = z.object({
    params: z.object({
        id: z.string().uuid()
    }),
    body: vendorSchema.shape.body.partial()
});

router.put('/:id', authenticate, validate(updateVendorSchema), async (req: AuthenticatedRequest, res: Response) => {
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

        // Ensure miniWebsiteConfig is merged or handled correctly if provided as string
        if (updateData.miniWebsiteConfig && typeof updateData.miniWebsiteConfig === 'string') {
            try {
                updateData.miniWebsiteConfig = JSON.parse(updateData.miniWebsiteConfig);
            } catch (e) {
                console.error('Error parsing miniWebsiteConfig:', e);
            }
        }

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

        if (existing.ownerId !== req.user!.id && req.user!.role !== 'SUPER_ADMIN' && req.user!.role !== 'ADMIN') {
            res.status(403).json({ error: 'You can only delete your own vendor' });
            return;
        }

        await db.update(vendors)
            .set({ deletedAt: new Date() })
            .where(eq(vendors.id, vendorId));

        // Clean up favorites and wishlist items for this vendor
        await db.delete(favorites).where(eq(favorites.vendorId, vendorId));

        const vendorProducts = await db
            .select({ id: products.id })
            .from(products)
            .where(eq(products.vendorId, vendorId));

        if (vendorProducts.length > 0) {
            await db.delete(wishlistItems)
                .where(inArray(wishlistItems.productId, vendorProducts.map(p => p.id)));
        }

        res.json({ message: 'Vendor removed successfully' });
    } catch (error) {
        console.error('Error removing vendor:', error);
        res.status(500).json({ error: 'Failed to remove vendor' });
    }
});

/**
 * POST /api/vendors/:id/restore
 * Restore a soft-deleted vendor (ADMIN/SUPER_ADMIN only)
 */
router.post('/:id/restore', authenticate, requireRole('ADMIN', 'SUPER_ADMIN'), async (req: AuthenticatedRequest, res: Response) => {
    try {
        const vendorId = req.params.id;

        const [existing] = await db.select().from(vendors).where(eq(vendors.id, vendorId)).limit(1);
        if (!existing) {
            res.status(404).json({ error: 'Vendor not found' });
            return;
        }

        await db.update(vendors)
            .set({ deletedAt: null })
            .where(eq(vendors.id, vendorId));

        res.json({ message: 'Vendor restored successfully' });
    } catch (error) {
        console.error('Error restoring vendor:', error);
        res.status(500).json({ error: 'Failed to restore vendor' });
    }
});

/**
 * GALLERY MANAGEMENT
 */

/**
 * POST /api/vendors/:id/gallery
 * Add an image to the vendor's gallery
 */
router.post('/:id/gallery', authenticate, async (req: AuthenticatedRequest, res: Response) => {
    try {
        if (!req.user?.id) { res.status(401).json({ error: 'User profile not fully synced' }); return; }
        const vendorId = req.params.id;
        const { imageUrl, caption, sortOrder } = req.body;

        if (!imageUrl) {
            res.status(400).json({ error: 'imageUrl is required' });
            return;
        }

        // Check ownership
        const [existing] = await db.select().from(vendors).where(eq(vendors.id, vendorId)).limit(1);
        if (!existing) {
            res.status(404).json({ error: 'Vendor not found' });
            return;
        }

        if (existing.ownerId !== req.user!.id && req.user!.role !== 'SUPER_ADMIN') {
            res.status(403).json({ error: 'You can only manage your own gallery' });
            return;
        }

        const [newImage] = await db.insert(galleryImages).values({
            vendorId,
            imageUrl,
            caption,
            sortOrder: sortOrder || 0
        }).returning();

        res.status(201).json({ image: newImage });
    } catch (error) {
        console.error('Error adding gallery image:', error);
        res.status(500).json({ error: 'Failed to add gallery image' });
    }
});

/**
 * PATCH /api/vendors/:id/gallery/:imageId
 * Update gallery image details (caption, sortOrder)
 */
router.patch('/:id/gallery/:imageId', authenticate, async (req: AuthenticatedRequest, res: Response) => {
    try {
        if (!req.user?.id) { res.status(401).json({ error: 'User profile not fully synced' }); return; }
        const { id: vendorId, imageId } = req.params;
        const { caption, sortOrder } = req.body;

        // Check ownership of vendor
        const [existingVendor] = await db.select().from(vendors).where(eq(vendors.id, vendorId)).limit(1);
        if (!existingVendor) {
            res.status(404).json({ error: 'Vendor not found' });
            return;
        }

        if (existingVendor.ownerId !== req.user!.id && req.user!.role !== 'SUPER_ADMIN') {
            res.status(403).json({ error: 'Access denied' });
            return;
        }

        const [updated] = await db.update(galleryImages)
            .set({ caption, sortOrder })
            .where(and(eq(galleryImages.id, imageId), eq(galleryImages.vendorId, vendorId)))
            .returning();

        if (!updated) {
            res.status(404).json({ error: 'Image not found' });
            return;
        }

        res.json({ image: updated });
    } catch (error) {
        console.error('Error updating gallery image:', error);
        res.status(500).json({ error: 'Failed to update gallery image' });
    }
});

/**
 * DELETE /api/vendors/:id/gallery/:imageId
 * Remove an image from the gallery
 */
router.delete('/:id/gallery/:imageId', authenticate, async (req: AuthenticatedRequest, res: Response) => {
    try {
        if (!req.user?.id) { res.status(401).json({ error: 'User profile not fully synced' }); return; }
        const { id: vendorId, imageId } = req.params;

        // Check ownership
        const [existingVendor] = await db.select().from(vendors).where(eq(vendors.id, vendorId)).limit(1);
        if (!existingVendor) {
            res.status(404).json({ error: 'Vendor not found' });
            return;
        }

        if (existingVendor.ownerId !== req.user!.id && req.user!.role !== 'SUPER_ADMIN') {
            res.status(403).json({ error: 'Access denied' });
            return;
        }

        const result = await db.delete(galleryImages)
            .where(and(eq(galleryImages.id, imageId), eq(galleryImages.vendorId, vendorId)))
            .returning();

        if (result.length === 0) {
            res.status(404).json({ error: 'Image not found' });
            return;
        }

        res.json({ message: 'Image removed from gallery' });
    } catch (error) {
        console.error('Error removing gallery image:', error);
        res.status(500).json({ error: 'Failed to remove gallery image' });
    }
});

export default router;
