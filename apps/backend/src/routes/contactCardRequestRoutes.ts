import { Router, Response } from 'express';
import { db, contactCardRequests, users, vendors, categories, homeCards, products, galleryImages, eq, and } from 'database';
import { authenticate, requireRole, AuthenticatedRequest } from '../middleware/auth';
import { logger } from '../config/logger';
import { z } from 'zod';
import { validate } from '../middleware/validation';

// ---------------------------------------------------------------------------
// Zod validation schema for POST /api/card-requests
// ---------------------------------------------------------------------------
const draftProductSchema = z.object({
    name: z.string().min(1, 'Product name is required').max(255),
    price: z.number().min(0, 'Price must be 0 or greater'),
    quantity: z.number().min(0).optional(),
    unit: z.string().max(20).optional(),
    category: z.string().max(100).optional(),
    imageUrl: z.string().url('Invalid image URL').optional().or(z.literal('')),
    description: z.string().max(500).optional(),
});

const openingHoursEntrySchema = z.object({
    open: z.string().regex(/^\d{2}:\d{2}$/, 'Time format must be HH:MM'),
    close: z.string().regex(/^\d{2}:\d{2}$/, 'Time format must be HH:MM'),
    closed: z.boolean().optional(),
});

const cardRequestSchema = z.object({
    body: z.object({
        planType: z.enum(['card_only', 'card_website']),
        fullName: z.string().min(2, 'Full name is required').max(255),
        phone: z
            .string()
            .regex(/^\+?[\d\s\-()]{7,20}$/, 'Phone number format is invalid. Must be 7–20 digits.'),
        email: z.string().email('Invalid email address').optional().or(z.literal('').transform(() => undefined)),
        businessName: z.string().min(1, 'Business name is required').max(255),
        category: z.string().min(1, 'Category is required').max(100),
        city: z.string().min(1, 'City is required').max(100),
        address: z.string().max(500).optional(),
        shortDescription: z.string().max(200).optional(),
        fullDescription: z.string().max(2000).optional(),
        subscriptionPlan: z.enum(['1_year', '2_year', '3_year']).optional(),
        // New fields
        openingHours: z.record(z.string(), openingHoursEntrySchema).optional(),
        pincode: z.string().max(10).optional(),
        googleDirectionLink: z.string().url('Invalid URL').optional().or(z.literal('').transform(() => undefined)),
        logoUrl: z.string().url('Invalid logo URL').optional().or(z.literal('').transform(() => undefined)),
        mainPhotoUrl: z.string().url('Invalid photo URL').optional().or(z.literal('').transform(() => undefined)),
        mainPhotoDescription: z.string().max(500).optional(),
        galleryUrls: z.array(z.string().url('Invalid gallery URL')).max(6, 'Maximum 6 gallery images').optional(),
        draftProducts: z
            .array(draftProductSchema)
            .max(20, 'You can add at most 20 products')
            .optional(),
        businessLabel: z.string().max(100, 'Business label must be 100 characters or fewer').optional(),
        tagline: z.string().max(150, 'Tagline must be 150 characters or fewer').optional(),
        aboutDescription: z.string().max(1000, 'About description must be 1000 characters or fewer').optional(),
        qrCodeUrl: z.string().url('Invalid QR code URL').optional().or(z.literal('').transform(() => undefined)),
    }),
});

const router = Router();

/**
 * POST /api/card-requests
 * Submit a new contact card request (authenticated users only)
 */
router.post('/', authenticate, validate(cardRequestSchema), async (req: AuthenticatedRequest, res: Response) => {
    logger.info('POST /api/card-requests received');

    try {
        logger.debug(`Authenticated User: ${req.user ? JSON.stringify(req.user) : 'UNDEFINED'}`);
        
        const userId = req.user?.id;
        if (!userId) {
            logger.error('No database user ID found in request');
            res.status(401).json({ error: 'User profile not fully synced' });
            return;
        }

        const {
            planType, fullName, phone, email,
            businessName, category, city, address,
            shortDescription, fullDescription, subscriptionPlan,
            draftProducts,
            openingHours, pincode, googleDirectionLink,
            logoUrl, mainPhotoUrl, mainPhotoDescription, galleryUrls,
            businessLabel, tagline, aboutDescription, qrCodeUrl
        } = req.body;
        logger.debug(`Request Body (excl. products): ${JSON.stringify({ planType, fullName, phone, businessName, category, city })}`);

        logger.debug(`Checking for existing status for requesterId: ${userId}`);
        
        // Check for PENDING requests
        const existingPending = await db.select()
            .from(contactCardRequests)
            .where(
                and(
                    eq(contactCardRequests.requesterId, userId!),
                    eq(contactCardRequests.status, 'PENDING')
                )
            )
            .limit(1);
        
        if (existingPending.length > 0) {
            logger.info(`Found existing pending request ID: ${existingPending[0].id}`);
            res.status(409).json({ error: 'You already have a pending request.' });
            return;
        }

        // Sanitise products: filter out empty-name rows that may come from the UI
        const sanitisedProducts = Array.isArray(draftProducts)
            ? draftProducts.filter((p: any) => p?.name?.trim())
            : undefined;

        logger.info('Attempting to insert new contactCardRequest into database...');
        const [newRequest] = await db.insert(contactCardRequests).values({
            requesterId: userId,
            planType: planType as 'card_only' | 'card_website',
            fullName,
            phone,
            email: email || null,
            businessName,
            category,
            city,
            address: address || null,
            shortDescription: shortDescription || null,
            fullDescription: fullDescription || null,
            subscriptionPlan: subscriptionPlan || null,
            draftProducts: sanitisedProducts?.length ? sanitisedProducts : null,
            // New fields
            openingHours: openingHours || null,
            pincode: pincode || null,
            googleDirectionLink: googleDirectionLink || null,
            logoUrl: logoUrl || null,
            mainPhotoUrl: mainPhotoUrl || null,
            mainPhotoDescription: mainPhotoDescription || null,
            galleryUrls: Array.isArray(galleryUrls) && galleryUrls.length > 0 ? galleryUrls : null,
            businessLabel: businessLabel || null,
            tagline: tagline || null,
            aboutDescription: aboutDescription || null,
            qrCodeUrl: qrCodeUrl || null,
        }).returning();

        if (newRequest) {
            logger.info(`Insert successful! Created Request ID: ${newRequest.id}`);
            res.status(201).json({ request: newRequest });
        } else {
            logger.error('Insert returned no result (unexpected)');
            res.status(500).json({ error: 'Failed to create request record' });
        }
    } catch (error: any) {
        logger.error(`EXCEPTION CAUGHT in POST /api/card-requests: ${error.message}`, { stack: error.stack });
        res.status(500).json({ 
            error: 'Failed to submit card request', 
            detail: error.message || String(error),
            code: error.code || 'UNKNOWN_ERROR'
        });
    }
});


/**
 * GET /api/card-requests/mine
 * Get the current user's own card requests
 */
router.get('/mine', authenticate, async (req: AuthenticatedRequest, res: Response) => {
    try {
        if (!req.user?.id) {
            res.status(401).json({ error: 'User profile not fully synced' });
            return;
        }

        const requests = await db.select()
            .from(contactCardRequests)
            .where(eq(contactCardRequests.requesterId, req.user.id))
            .orderBy(contactCardRequests.createdAt);

        res.json({ requests });
    } catch (error) {
        console.error('Error fetching user card requests:', error);
        res.status(500).json({ error: 'Failed to fetch your card requests' });
    }
});

/**
 * GET /api/card-requests
 * List all card requests (ADMIN/SUPER_ADMIN only)
 * Optional query: ?status=PENDING|APPROVED|REJECTED
 */
router.get('/', authenticate, requireRole('ADMIN', 'SUPER_ADMIN'), async (req: AuthenticatedRequest, res: Response) => {
    try {
        const { status } = req.query;

        const conditions = [];
        if (status && ['PENDING', 'APPROVED', 'REJECTED'].includes(status as string)) {
            conditions.push(eq(contactCardRequests.status, status as 'PENDING' | 'APPROVED' | 'REJECTED'));
        }

        const result = await db.query.contactCardRequests.findMany({
            where: conditions.length > 0 ? and(...conditions) : undefined,
            with: {
                requester: { columns: { id: true, name: true, email: true, phone: true } },
            },
            orderBy: (contactCardRequests, { desc }) => [desc(contactCardRequests.createdAt)],
        });

        res.json({ requests: result });
    } catch (error) {
        console.error('Error listing card requests:', error);
        res.status(500).json({ error: 'Failed to list card requests' });
    }
});

/**
 * GET /api/card-requests/:id
 * Get a single card request detail (ADMIN/SUPER_ADMIN only)
 */
router.get('/:id', authenticate, requireRole('ADMIN', 'SUPER_ADMIN'), async (req: AuthenticatedRequest, res: Response) => {
    try {
        const requestId = req.params.id;

        const request = await db.query.contactCardRequests.findFirst({
            where: eq(contactCardRequests.id, requestId),
            with: {
                requester: { columns: { id: true, name: true, email: true, phone: true, avatarUrl: true } },
            },
        });

        if (!request) {
            res.status(404).json({ error: 'Card request not found' });
            return;
        }

        res.json({ request });
    } catch (error) {
        console.error('Error fetching card request:', error);
        res.status(500).json({ error: 'Failed to fetch card request' });
    }
});

/**
 * PUT /api/card-requests/:id/review
 * Approve or reject a card request (ADMIN/SUPER_ADMIN only)
 * Body: { status: 'APPROVED' | 'REJECTED', rejectionReason?, rejectionNote? }
 * 
 * On APPROVED: auto-creates a vendor from the request data and upgrades user role to VENDOR.
 */
router.put('/:id/review', authenticate, requireRole('ADMIN', 'SUPER_ADMIN'), async (req: AuthenticatedRequest, res: Response) => {
    try {
        if (!req.user?.id) {
            res.status(401).json({ error: 'User profile not fully synced' });
            return;
        }

        const requestId = req.params.id;
        const { status, rejectionReason, rejectionNote } = req.body;

        // Validate status
        if (!status || !['APPROVED', 'REJECTED'].includes(status)) {
            res.status(400).json({ error: 'status must be "APPROVED" or "REJECTED"' });
            return;
        }

        // If rejecting, require a reason
        if (status === 'REJECTED') {
            const validReasons = ['INCOMPLETE_INFO', 'DUPLICATE', 'INAPPROPRIATE', 'INVALID_BUSINESS', 'OTHER'];
            if (!rejectionReason || !validReasons.includes(rejectionReason)) {
                res.status(400).json({
                    error: 'rejectionReason is required when rejecting',
                    validReasons
                });
                return;
            }
        }

        // Fetch the existing request
        const [existingRequest] = await db.select()
            .from(contactCardRequests)
            .where(eq(contactCardRequests.id, requestId))
            .limit(1);

        if (!existingRequest) {
            res.status(404).json({ error: 'Card request not found' });
            return;
        }

        // Prevent re-reviewing already reviewed requests
        if (existingRequest.status !== 'PENDING') {
            res.status(409).json({
                error: `This request has already been ${existingRequest.status.toLowerCase()}.`,
                currentStatus: existingRequest.status
            });
            return;
        }

        // On approval: auto-create vendor and upgrade user role
        if (status === 'APPROVED') {
            try {
                let newVendorResult: any = null;
                await db.transaction(async (tx) => {
                    // Update the request
                    await tx.update(contactCardRequests)
                        .set({
                            status,
                            rejectionReason: null,
                            rejectionNote: null,
                            reviewedBy: req.user!.id,
                            reviewedAt: new Date(),
                        })
                        .where(eq(contactCardRequests.id, requestId));

                    // Generate slug from business name
                    const slug = existingRequest.businessName
                        .toLowerCase()
                        .replace(/[^a-z0-9]+/g, '-')
                        .replace(/^-|-$/g, '');

                    // Find category ID if possible
                    let categoryId: string | null = null;
                    const dbCategory = await tx.query.categories.findFirst({
                        where: eq(categories.name, existingRequest.category)
                    });
                    if (dbCategory) {
                        categoryId = dbCategory.id;
                    }

                    // Build miniWebsiteConfig from request data
                    const miniConfig: Record<string, any> = {};
                    if (existingRequest.googleDirectionLink) miniConfig.googleMapsUrl = existingRequest.googleDirectionLink;
                    if (existingRequest.businessLabel)    miniConfig.businessLabel    = existingRequest.businessLabel;
                    if (existingRequest.tagline)          miniConfig.tagline          = existingRequest.tagline;
                    if (existingRequest.aboutDescription) miniConfig.aboutDescription = existingRequest.aboutDescription;
                    if (existingRequest.qrCodeUrl)        miniConfig.qrCodeUrl        = existingRequest.qrCodeUrl;

                    // Create vendor from request data
                    const [newVendor] = await tx.insert(vendors).values({
                        ownerId: existingRequest.requesterId,
                        name: existingRequest.businessName,
                        slug: slug + '-' + Date.now().toString(36), // Ensure uniqueness
                        description: existingRequest.fullDescription || existingRequest.shortDescription || '',
                        shortDescription: existingRequest.shortDescription || '',
                        categoryId,
                        city: existingRequest.city,
                        address: existingRequest.pincode
                            ? `${existingRequest.address || existingRequest.city} - ${existingRequest.pincode}`
                            : existingRequest.address || existingRequest.city,
                        phone: existingRequest.phone,
                        email: existingRequest.email || '',
                        coverImageUrl: existingRequest.logoUrl || existingRequest.mainPhotoUrl || null,
                        isPremium: existingRequest.planType === 'card_website',
                        planType: existingRequest.planType,
                        isVerified: true, // Auto-verify on admin approval
                        openingHours: existingRequest.openingHours || null,
                        miniWebsiteConfig: miniConfig,
                    }).returning();

                    newVendorResult = newVendor;

                    // Seed initial products from draftProducts if provided
                    if (Array.isArray(existingRequest.draftProducts) && existingRequest.draftProducts.length > 0) {
                        const productRows = (existingRequest.draftProducts as Array<{
                            name: string;
                            price: number;
                            quantity?: number;
                            unit?: string;
                            category?: string;
                            imageUrl?: string;
                            description?: string;
                        }>)
                            .filter(p => p?.name?.trim())
                            .map((p, idx) => ({
                                vendorId: newVendor.id,
                                name: p.name.trim(),
                                description: p.description || null,
                                price: String(p.price),
                                imageUrl: p.imageUrl || null,
                                category: p.category || null,
                                quantity: p.quantity != null ? String(p.quantity) : null,
                                unit: p.unit || null,
                                sortOrder: idx,
                                inStock: true,
                            }));
                        if (productRows.length > 0) {
                            await tx.insert(products).values(productRows);
                            logger.info(`Seeded ${productRows.length} products for vendor ${newVendor.id}`);
                        }
                    }

                    // Seed gallery images from galleryUrls
                    if (Array.isArray(existingRequest.galleryUrls) && existingRequest.galleryUrls.length > 0) {
                        const galleryRows = existingRequest.galleryUrls.map((url: string, idx: number) => ({
                            vendorId: newVendor.id,
                            imageUrl: url,
                            sortOrder: idx,
                        }));
                        await tx.insert(galleryImages).values(galleryRows);
                        logger.info(`Seeded ${galleryRows.length} gallery images for vendor ${newVendor.id}`);
                    }

                    // Add to Home Cards automatically
                    await tx.insert(homeCards).values({
                        vendorId: newVendor.id,
                        displayOrder: 100, // Default to a higher number
                        isActive: true,
                    });

                    // Upgrade user role to VENDOR only if they are a regular consumer
                    const [requester] = await tx.select({ role: users.role }).from(users).where(eq(users.id, existingRequest.requesterId)).limit(1);
                    if (requester && requester.role === 'CONSUMER') {
                        await tx.update(users)
                            .set({ role: 'VENDOR' })
                            .where(eq(users.id, existingRequest.requesterId));
                    }
                });

                res.json({
                    request: { ...existingRequest, status: 'APPROVED', reviewedBy: req.user!.id },
                    vendor: newVendorResult,
                    message: 'Request approved. Vendor created and user role upgraded to VENDOR.'
                });
            } catch (error) {
                logger.error('Transaction failed during request approval:', { error });
                res.status(500).json({ error: 'Failed to process approval. Changes rolled back.' });
            }
        } else {
            // Rejected
            const [updatedRequest] = await db.update(contactCardRequests)
                .set({
                    status,
                    rejectionReason,
                    rejectionNote: rejectionNote || null,
                    reviewedBy: req.user.id,
                    reviewedAt: new Date(),
                })
                .where(eq(contactCardRequests.id, requestId))
                .returning();

            res.json({
                request: updatedRequest,
                message: 'Request rejected.'
            });
        }
    } catch (error) {
        if (error instanceof Error) {
            logger.error(`Error reviewing card request: ${error.message}`, { stack: error.stack });
        } else {
            logger.error(`Error reviewing card request: ${String(error)}`);
        }
        res.status(500).json({ error: 'Failed to review card request' });
    }
});

export default router;
