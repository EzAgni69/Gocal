import { Router, Response } from 'express';
import { db, reports, vendors, eq, and } from 'database';
import { authenticate, requireRole, AuthenticatedRequest } from '../middleware/auth';

const router = Router();

/**
 * POST /api/reports
 * Submit a report against a vendor (authenticated users only)
 */
router.post('/', authenticate, async (req: AuthenticatedRequest, res: Response) => {
    try {
        if (!req.user?.id) { res.status(401).json({ error: 'User profile not fully synced' }); return; }
        const { vendorId, reason, comment } = req.body;

        if (!vendorId || !reason) {
            res.status(400).json({ error: 'vendorId and reason are required' });
            return;
        }

        // Verify vendor exists
        const [vendor] = await db.select().from(vendors).where(eq(vendors.id, vendorId)).limit(1);
        if (!vendor) {
            res.status(404).json({ error: 'Vendor not found' });
            return;
        }

        const [report] = await db.insert(reports).values({
            reporterId: req.user!.id!,
            vendorId,
            reason,
            comment,
        }).returning();

        res.status(201).json({ report });
    } catch (error) {
        console.error('Error submitting report:', error);
        res.status(500).json({ error: 'Failed to submit report' });
    }
});

/**
 * GET /api/reports
 * List all reports (ADMIN/SUPER_ADMIN only)
 */
router.get('/', authenticate, requireRole('ADMIN', 'SUPER_ADMIN'), async (req: AuthenticatedRequest, res: Response) => {
    try {
        const { status } = req.query;

        const conditions = [];
        if (status) conditions.push(eq(reports.status, status as any));

        const result = await db.query.reports.findMany({
            where: conditions.length > 0 ? and(...conditions) : undefined,
            with: {
                reporter: { columns: { id: true, name: true, email: true } },
                vendor: { columns: { id: true, name: true, city: true } },
            },
            orderBy: (reports, { desc }) => [desc(reports.createdAt)],
        });

        res.json({ reports: result });
    } catch (error) {
        console.error('Error listing reports:', error);
        res.status(500).json({ error: 'Failed to list reports' });
    }
});

/**
 * PUT /api/reports/:id/resolve
 * Resolve a report (ADMIN/SUPER_ADMIN only)
 * Body: { status: 'RESOLVED' | 'DISMISSED', resolutionNote: string }
 */
router.put('/:id/resolve', authenticate, requireRole('ADMIN', 'SUPER_ADMIN'), async (req: AuthenticatedRequest, res: Response) => {
    try {
        if (!req.user?.id) { res.status(401).json({ error: 'User profile not fully synced' }); return; }
        const reportId = req.params.id;
        const { status, resolutionNote } = req.body;

        if (!status || !['RESOLVED', 'DISMISSED', 'UNDER_REVIEW'].includes(status)) {
            res.status(400).json({ error: 'Valid status required: RESOLVED, DISMISSED, UNDER_REVIEW' });
            return;
        }

        const [updated] = await db.update(reports)
            .set({
                status,
                resolvedBy: req.user!.id!,
                resolutionNote,
                resolvedAt: new Date(),
            })
            .where(eq(reports.id, reportId))
            .returning();

        if (!updated) {
            res.status(404).json({ error: 'Report not found' });
            return;
        }

        res.json({ report: updated });
    } catch (error) {
        console.error('Error resolving report:', error);
        res.status(500).json({ error: 'Failed to resolve report' });
    }
});

export default router;
