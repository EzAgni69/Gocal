/**
 * Tests for POST /api/card-requests
 * Task 4.1 — regression guard after removing VENDOR-role block
 */

// Mock the database
jest.mock('database', () => ({
  db: {
    select: jest.fn(),
    insert: jest.fn(),
  },
  contactCardRequests: {},
  users: {},
  vendors: {},
  categories: {},
  homeCards: {},
  products: {},
  galleryImages: {},
  eq: jest.fn(),
  and: jest.fn(),
}));

// Mock auth middleware
jest.mock('../middleware/auth', () => ({
  authenticate: jest.fn((req: any, res: any, next: any) => next()),
  requireRole: jest.fn((...roles: string[]) => (req: any, res: any, next: any) => next()),
}));

// Mock validation middleware — pass through
jest.mock('../middleware/validation', () => ({
  validate: jest.fn(() => (req: any, res: any, next: any) => next()),
}));

// Mock logger
jest.mock('../config/logger', () => ({
  logger: {
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
    debug: jest.fn(),
  },
}));

import express from 'express';
import request from 'supertest';
import { db, eq, and } from 'database';
import contactCardRequestRoutes from '../routes/contactCardRequestRoutes';

const mockDb = db as jest.Mocked<typeof db>;

function buildApp(userOverride?: any) {
  const app = express();
  app.use(express.json());
  app.use((req: any, _res: any, next: any) => {
    req.user = userOverride;
    next();
  });
  app.use('/api/card-requests', contactCardRequestRoutes);
  return app;
}

const validBody = {
  planType: 'card_only',
  fullName: 'Test User',
  phone: '+1234567890',
  businessName: 'Test Biz',
  category: 'Food',
  city: 'TestCity',
};

describe('POST /api/card-requests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should return 201 for a VENDOR-role user with no pending request (no longer blocked)', async () => {
    const vendorUser = { id: 'user-vendor-1', role: 'VENDOR' };

    // No pending requests
    (mockDb.select as jest.Mock).mockReturnValue({
      from: jest.fn().mockReturnValue({
        where: jest.fn().mockReturnValue({
          limit: jest.fn().mockResolvedValue([]),
        }),
      }),
    });

    // Successful insert
    (mockDb.insert as jest.Mock).mockReturnValue({
      values: jest.fn().mockReturnValue({
        returning: jest.fn().mockResolvedValue([{ id: 'req-1', ...validBody }]),
      }),
    });

    const app = buildApp(vendorUser);
    const res = await request(app).post('/api/card-requests').send(validBody);

    expect(res.status).toBe(201);
    expect(res.body.request).toBeDefined();
  });

  it('should return 409 for any user with an existing PENDING request', async () => {
    const consumerUser = { id: 'user-consumer-1', role: 'CONSUMER' };

    // Existing pending request found
    (mockDb.select as jest.Mock).mockReturnValue({
      from: jest.fn().mockReturnValue({
        where: jest.fn().mockReturnValue({
          limit: jest.fn().mockResolvedValue([{ id: 'existing-req', status: 'PENDING' }]),
        }),
      }),
    });

    const app = buildApp(consumerUser);
    const res = await request(app).post('/api/card-requests').send(validBody);

    expect(res.status).toBe(409);
    expect(res.body.error).toMatch(/pending/i);
  });

  it('should return 409 for a VENDOR-role user with an existing PENDING request', async () => {
    const vendorUser = { id: 'user-vendor-2', role: 'VENDOR' };

    // Existing pending request found
    (mockDb.select as jest.Mock).mockReturnValue({
      from: jest.fn().mockReturnValue({
        where: jest.fn().mockReturnValue({
          limit: jest.fn().mockResolvedValue([{ id: 'existing-req', status: 'PENDING' }]),
        }),
      }),
    });

    const app = buildApp(vendorUser);
    const res = await request(app).post('/api/card-requests').send(validBody);

    expect(res.status).toBe(409);
    expect(res.body.error).toMatch(/pending/i);
  });
});
