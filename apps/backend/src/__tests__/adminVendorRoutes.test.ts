import { Router, Response } from 'express';
import { AuthenticatedRequest } from '../middleware/auth';

// Mock the auth middleware
jest.mock('../middleware/auth', () => ({
  authenticate: jest.fn((req: any, res: any, next: any) => next()),
  requireRole: jest.fn((...roles: string[]) => (req: any, res: any, next: any) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        error: 'Insufficient permissions',
        required: roles,
        current: req.user.role,
      });
    }
    next();
  }),
}));

// Mock the roleDowngradeService
jest.mock('../services/roleDowngradeService');

import { deleteVendorWithDowngrade } from '../services/roleDowngradeService';
import { authenticate, requireRole } from '../middleware/auth';

const mockDeleteVendorWithDowngrade = deleteVendorWithDowngrade as jest.MockedFunction<typeof deleteVendorWithDowngrade>;
const mockAuthenticate = authenticate as jest.MockedFunction<typeof authenticate>;
const mockRequireRole = requireRole as jest.MockedFunction<typeof requireRole>;

// Build a minimal express app for testing the route
import express from 'express';
import adminVendorRoutes from '../routes/adminVendorRoutes';

function buildApp(userOverride?: any) {
  const app = express();
  app.use(express.json());

  // Inject user into request before the route
  app.use((req: any, res, next) => {
    req.user = userOverride;
    next();
  });

  app.use('/api/admin/vendors', adminVendorRoutes);
  return app;
}

import request from 'supertest';

const mockVendor = {
  id: 'vendor-uuid-1',
  ownerId: 'owner-uuid-1',
  name: 'Test Vendor',
  deletedAt: new Date(),
};

describe('DELETE /api/admin/vendors/:id', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Authorization', () => {
    it('returns 401 when unauthenticated (no user)', async () => {
      const app = buildApp(undefined);
      const res = await request(app).delete('/api/admin/vendors/vendor-uuid-1');
      expect(res.status).toBe(401);
    });

    it('returns 403 for CONSUMER role', async () => {
      const app = buildApp({ id: 'user-1', role: 'CONSUMER' });
      const res = await request(app).delete('/api/admin/vendors/vendor-uuid-1');
      expect(res.status).toBe(403);
    });

    it('returns 403 for VENDOR role', async () => {
      const app = buildApp({ id: 'user-1', role: 'VENDOR' });
      const res = await request(app).delete('/api/admin/vendors/vendor-uuid-1');
      expect(res.status).toBe(403);
    });
  });

  describe('Successful deletion', () => {
    it('returns 200 with roleDowngraded: true when downgrade occurs', async () => {
      mockDeleteVendorWithDowngrade.mockResolvedValueOnce({
        vendor: mockVendor,
        roleDowngraded: true,
        newRole: 'CONSUMER',
        previousRole: 'VENDOR',
      });

      const app = buildApp({ id: 'admin-1', role: 'ADMIN' });
      const res = await request(app).delete('/api/admin/vendors/vendor-uuid-1');

      expect(res.status).toBe(200);
      expect(res.body.roleDowngraded).toBe(true);
      expect(res.body.newRole).toBe('CONSUMER');
      expect(res.body.previousRole).toBe('VENDOR');
      expect(res.body.vendor).toBeDefined();
    });

    it('returns 200 with roleDowngraded: false when no downgrade occurs', async () => {
      mockDeleteVendorWithDowngrade.mockResolvedValueOnce({
        vendor: mockVendor,
        roleDowngraded: false,
        newRole: 'ADMIN',
        previousRole: 'ADMIN',
      });

      const app = buildApp({ id: 'admin-1', role: 'ADMIN' });
      const res = await request(app).delete('/api/admin/vendors/vendor-uuid-1');

      expect(res.status).toBe(200);
      expect(res.body.roleDowngraded).toBe(false);
    });

    it('passes vendorId and adminUserId to the service', async () => {
      mockDeleteVendorWithDowngrade.mockResolvedValueOnce({
        vendor: mockVendor,
        roleDowngraded: false,
        newRole: 'VENDOR',
        previousRole: 'VENDOR',
      });

      const app = buildApp({ id: 'admin-user-id', role: 'SUPER_ADMIN' });
      await request(app).delete('/api/admin/vendors/some-vendor-id');

      expect(mockDeleteVendorWithDowngrade).toHaveBeenCalledWith('some-vendor-id', 'admin-user-id');
    });
  });

  describe('Error handling', () => {
    it('returns 404 when vendor not found', async () => {
      const err: any = new Error('Vendor not found');
      err.statusCode = 404;
      mockDeleteVendorWithDowngrade.mockRejectedValueOnce(err);

      const app = buildApp({ id: 'admin-1', role: 'ADMIN' });
      const res = await request(app).delete('/api/admin/vendors/missing-id');

      expect(res.status).toBe(404);
      expect(res.body.error).toBe('Vendor not found');
    });

    it('returns 409 when vendor already deleted', async () => {
      const err: any = new Error('Vendor already deleted');
      err.statusCode = 409;
      mockDeleteVendorWithDowngrade.mockRejectedValueOnce(err);

      const app = buildApp({ id: 'admin-1', role: 'ADMIN' });
      const res = await request(app).delete('/api/admin/vendors/deleted-id');

      expect(res.status).toBe(409);
      expect(res.body.error).toBe('Vendor already deleted');
    });

    it('returns 500 for unexpected errors', async () => {
      mockDeleteVendorWithDowngrade.mockRejectedValueOnce(new Error('DB connection lost'));

      const app = buildApp({ id: 'admin-1', role: 'ADMIN' });
      const res = await request(app).delete('/api/admin/vendors/vendor-uuid-1');

      expect(res.status).toBe(500);
      expect(res.body.error).toBe('Failed to delete vendor. Changes rolled back.');
    });
  });
});
