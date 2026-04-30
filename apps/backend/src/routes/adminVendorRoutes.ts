import { Router, Response } from 'express';
import { authenticate, requireRole, AuthenticatedRequest } from '../middleware/auth';
import { deleteVendorWithDowngrade } from '../services/roleDowngradeService';

const router = Router();

/**
 * DELETE /api/admin/vendors/:id
 * Admin-only endpoint to soft-delete a vendor card and conditionally downgrade the owner's role.
 * Requires ADMIN or SUPER_ADMIN role.
 */
router.delete(
  '/:id',
  authenticate,
  requireRole('ADMIN', 'SUPER_ADMIN'),
  async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const vendorId = req.params.id;
      const adminUserId = req.user!.id!;

      const result = await deleteVendorWithDowngrade(vendorId, adminUserId);

      res.status(200).json({
        vendor: result.vendor,
        roleDowngraded: result.roleDowngraded,
        newRole: result.newRole,
        previousRole: result.previousRole,
      });
    } catch (error: any) {
      if (error?.statusCode === 404) {
        res.status(404).json({ error: 'Vendor not found' });
        return;
      }
      if (error?.statusCode === 409) {
        res.status(409).json({ error: 'Vendor already deleted' });
        return;
      }
      res.status(500).json({ error: 'Failed to delete vendor. Changes rolled back.' });
    }
  }
);

export default router;
