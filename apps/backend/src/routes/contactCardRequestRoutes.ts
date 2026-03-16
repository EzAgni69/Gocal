import { Router, Response } from 'express';
import { db, contactCardRequests, users, vendors, categories, homeCards, eq, and } from 'database';
import { authenticate, requireRole, AuthenticatedRequest } from '../middleware/auth';

const router = Router();

/**
 * POST /api/card-requests
 * Submit a new contact card request (authenticated users only)
 */
router.post('/', authenticate, async (req: AuthenticatedRequest, res: Response) => {
    const fs = require('fs');
    const log = (msg: string) => {
        const timestampedMsg = new Date().toISOString() + ' ' + msg;
        console.log('[DEBUG LOG]', timestampedMsg);
        try { fs.appendFileSync('/Users/agni/Developer/Vanij/backend-debug.txt', timestampedMsg + '\n'); } catch(e){
            console.error('Failed to write to debug file:', e);
        }
    };
    log('POST /api/card-requests received');

    try {
        log('Authenticated User: ' + (req.user ? JSON.stringify(req.user) : 'UNDEFINED'));
        
        let userId = req.user?.id;
        if (!userId) {
            log('No database user ID found in request, attempting to find first user for debugging');
            try {
                const dbUsers = await db.select({ id: users.id }).from(users).limit(1);
                if (dbUsers.length > 0) {
                    userId = dbUsers[0].id;
                    log('Mocked userId: ' + userId);
                } else {
                    log('CRITICAL: No users found in database even for mocking');
                }
            } catch (dbErr) {
                log('DB Error during user mock: ' + (dbErr as Error).message);
            }
        }

        const {
            planType, fullName, phone, email,
            businessName, category, city, address,
            shortDescription, fullDescription, subscriptionPlan
        } = req.body;
        log('Request Body: ' + JSON.stringify(req.body));

        // Validate required fields
        const missingFields = [];
        if (!planType) missingFields.push('planType');
        if (!fullName) missingFields.push('fullName');
        if (!phone) missingFields.push('phone');
        if (!businessName) missingFields.push('businessName');
        if (!category) missingFields.push('category');
        if (!city) missingFields.push('city');

        if (missingFields.length > 0) {
            log('Validation failed. Missing fields: ' + missingFields.join(', '));
            res.status(400).json({ error: 'Missing required fields', missingFields });
            return;
        }

        log('Checking for existing status for requesterId: ' + userId);
        
        // 1. Prevent active vendors from submitting new requests
        if (req.user?.role === 'VENDOR') {
            log('User is already an active VENDOR. Blocking request.');
            res.status(403).json({ error: 'You are already an active vendor. Use the dashboard to manage your listing.' });
            return;
        }

        // 2. Check for PENDING requests
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
            log('Found existing pending request ID: ' + existingPending[0].id);
            res.status(409).json({ error: 'You already have a pending request.' });
            return;
        }

        log('Attempting to insert new contactCardRequest into database...');
        const [newRequest] = await db.insert(contactCardRequests).values({
            requesterId: userId!,
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
        }).returning();

        if (newRequest) {
            log('Insert successful! Created Request ID: ' + newRequest.id);
            res.status(201).json({ request: newRequest });
        } else {
            log('Insert returned no result (unexpected)');
            res.status(500).json({ error: 'Failed to create request record' });
        }
    } catch (error: any) {
        log('EXCEPTION CAUGHT in POST /api/card-requests: ' + (error.stack || error.message || String(error)));
        console.error('Full insertion error:', error);
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

        // Update the request
        const [updatedRequest] = await db.update(contactCardRequests)
            .set({
                status,
                rejectionReason: status === 'REJECTED' ? rejectionReason : null,
                rejectionNote: status === 'REJECTED' ? (rejectionNote || null) : null,
                reviewedBy: req.user.id,
                reviewedAt: new Date(),
            })
            .where(eq(contactCardRequests.id, requestId))
            .returning();

        // On approval: auto-create vendor and upgrade user role
        if (status === 'APPROVED') {
            try {
                // Generate slug from business name
                const slug = existingRequest.businessName
                    .toLowerCase()
                    .replace(/[^a-z0-9]+/g, '-')
                    .replace(/^-|-$/g, '');

                // Find category ID if possible
                let categoryId: string | null = null;
                const dbCategory = await db.query.categories.findFirst({
                    where: eq(categories.name, existingRequest.category)
                });
                if (dbCategory) {
                    categoryId = dbCategory.id;
                }

                // Create vendor from request data
                const [newVendor] = await db.insert(vendors).values({
                    ownerId: existingRequest.requesterId,
                    name: existingRequest.businessName,
                    slug: slug + '-' + Date.now().toString(36), // Ensure uniqueness
                    description: existingRequest.fullDescription || existingRequest.shortDescription || '',
                    shortDescription: existingRequest.shortDescription || '',
                    categoryId,
                    city: existingRequest.city,
                    address: existingRequest.address || existingRequest.city,
                    phone: existingRequest.phone,
                    email: existingRequest.email || '',
                    isPremium: existingRequest.planType === 'card_website',
                    planType: existingRequest.planType,
                    isVerified: true, // Auto-verify on admin approval
                    miniWebsiteConfig: {},
                }).returning();

                // Add to Home Cards automatically
                await db.insert(homeCards).values({
                    vendorId: newVendor.id,
                    displayOrder: 100, // Default to a higher number
                    isActive: true,
                });

                // Upgrade user role to VENDOR
                await db.update(users)
                    .set({ role: 'VENDOR' })
                    .where(eq(users.id, existingRequest.requesterId));

                res.json({
                    request: updatedRequest,
                    vendor: newVendor,
                    message: 'Request approved. Vendor created and user role upgraded to VENDOR.'
                });
            } catch (vendorError) {
                console.error('Error creating vendor from approved request:', vendorError);
                // Revert the request status if vendor creation fails
                await db.update(contactCardRequests)
                    .set({ status: 'PENDING', reviewedBy: null, reviewedAt: null })
                    .where(eq(contactCardRequests.id, requestId));

                res.status(500).json({ error: 'Request was approved but vendor creation failed. The request has been reverted to PENDING.' });
            }
        } else {
            // Rejected
            res.json({
                request: updatedRequest,
                message: 'Request rejected.'
            });
        }
    } catch (error) {
        console.error('Error reviewing card request:', error);
        res.status(500).json({ error: 'Failed to review card request' });
    }
});

export default router;
