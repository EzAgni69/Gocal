// Feature: vendor-contact-card-customization, Property 11: Dashboard validation enforcement

// Mock the database
jest.mock('database', () => ({
  db: {
    select: jest.fn(),
    insert: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    query: {
      vendors: {
        findFirst: jest.fn(),
      },
    },
  },
  vendors: {},
  products: {},
  galleryImages: {},
  offers: {},
  reviews: {},
  tags: {},
  vendorTags: {},
  homeCards: {},
  favorites: {},
  wishlistItems: {},
  eq: jest.fn(),
  ilike: jest.fn(),
  sql: jest.fn(),
  and: jest.fn(),
  or: jest.fn(),
  isNull: jest.fn(),
  isNotNull: jest.fn(),
  desc: jest.fn(),
  inArray: jest.fn(),
}));

// Mock auth middleware — authenticate passes through, requireRole passes through
jest.mock('../middleware/auth', () => ({
  authenticate: jest.fn((req: any, res: any, next: any) => next()),
  requireRole: jest.fn((...roles: string[]) => (req: any, res: any, next: any) => next()),
}));

// Mock validation middleware — pass through (we test inline validation, not Zod schema)
jest.mock('../middleware/validation', () => ({
  validate: jest.fn(() => (req: any, res: any, next: any) => next()),
}));

import express from 'express';
import request from 'supertest';
import { db } from 'database';
import vendorRoutes from '../routes/vendorRoutes';
import * as fc from 'fast-check';

const mockDb = db as jest.Mocked<typeof db>;

// A fixed vendor UUID used across tests
const VENDOR_ID = 'a1b2c3d4-e5f6-7890-abcd-ef1234567890';
const OWNER_ID = 'owner-uuid-1234-5678-abcd-ef1234567890';

/**
 * Build a minimal Express app that mounts vendorRoutes.
 * The user is injected before the route so that authenticate (mocked to call next())
 * still has req.user available.
 */
function buildApp(userOverride?: any) {
  const app = express();
  app.use(express.json());
  app.use((req: any, _res: any, next: any) => {
    req.user = userOverride ?? { id: OWNER_ID, role: 'VENDOR' };
    next();
  });
  app.use('/api/vendors', vendorRoutes);
  return app;
}

/**
 * Set up the DB mock so that the ownership check in PUT /:id succeeds:
 * - db.select().from().where().limit(1) returns a vendor owned by OWNER_ID
 * - db.update().set().where().returning() returns the updated vendor
 */
function setupSuccessfulDbMocks(vendorId = VENDOR_ID, ownerId = OWNER_ID) {
  const mockVendor = {
    id: vendorId,
    ownerId,
    name: 'Test Vendor',
    slug: 'test-vendor',
    city: 'TestCity',
    address: '123 Test St',
    miniWebsiteConfig: {},
    deletedAt: null,
  };

  // db.select().from().where().limit(1) — ownership check
  (mockDb.select as jest.Mock).mockReturnValue({
    from: jest.fn().mockReturnValue({
      where: jest.fn().mockReturnValue({
        limit: jest.fn().mockResolvedValue([mockVendor]),
      }),
    }),
  });

  // db.update().set().where().returning() — the actual update
  (mockDb.update as jest.Mock).mockReturnValue({
    set: jest.fn().mockReturnValue({
      where: jest.fn().mockReturnValue({
        returning: jest.fn().mockResolvedValue([{ ...mockVendor, miniWebsiteConfig: {} }]),
      }),
    }),
  });

  // db.delete().where() — tag cleanup
  (mockDb.delete as jest.Mock).mockReturnValue({
    where: jest.fn().mockResolvedValue([]),
  });
}

// ---------------------------------------------------------------------------
// Property 11: Dashboard validation enforcement
// Validates: Requirements 5.4, 5.5, 5.6
// ---------------------------------------------------------------------------

describe('Property 11: Dashboard validation enforcement — PUT /api/vendors/:id', () => {
  const app = buildApp({ id: OWNER_ID, role: 'VENDOR' });

  beforeEach(() => {
    jest.clearAllMocks();
    setupSuccessfulDbMocks();
  });

  // -------------------------------------------------------------------------
  // businessLabel
  // -------------------------------------------------------------------------

  it('Property 11a: businessLabel exceeding 100 characters returns HTTP 400', async () => {
    // **Validates: Requirements 5.4**
    await fc.assert(
      fc.asyncProperty(
        fc.string({ minLength: 101, maxLength: 200 }),
        async (businessLabel) => {
          setupSuccessfulDbMocks();
          const res = await request(app)
            .put(`/api/vendors/${VENDOR_ID}`)
            .send({ miniWebsiteConfig: { businessLabel } });
          return res.status === 400;
        }
      ),
      { numRuns: 100 }
    );
  });

  it('Property 11b: businessLabel within 100 characters does not return HTTP 400', async () => {
    // **Validates: Requirements 5.4**
    await fc.assert(
      fc.asyncProperty(
        fc.string({ minLength: 0, maxLength: 100 }),
        async (businessLabel) => {
          setupSuccessfulDbMocks();
          const res = await request(app)
            .put(`/api/vendors/${VENDOR_ID}`)
            .send({ miniWebsiteConfig: { businessLabel } });
          return res.status !== 400;
        }
      ),
      { numRuns: 100 }
    );
  });

  // -------------------------------------------------------------------------
  // tagline
  // -------------------------------------------------------------------------

  it('Property 11c: tagline exceeding 150 characters returns HTTP 400', async () => {
    // **Validates: Requirements 5.5**
    await fc.assert(
      fc.asyncProperty(
        fc.string({ minLength: 151, maxLength: 300 }),
        async (tagline) => {
          setupSuccessfulDbMocks();
          const res = await request(app)
            .put(`/api/vendors/${VENDOR_ID}`)
            .send({ miniWebsiteConfig: { tagline } });
          return res.status === 400;
        }
      ),
      { numRuns: 100 }
    );
  });

  it('Property 11d: tagline within 150 characters does not return HTTP 400', async () => {
    // **Validates: Requirements 5.5**
    await fc.assert(
      fc.asyncProperty(
        fc.string({ minLength: 0, maxLength: 150 }),
        async (tagline) => {
          setupSuccessfulDbMocks();
          const res = await request(app)
            .put(`/api/vendors/${VENDOR_ID}`)
            .send({ miniWebsiteConfig: { tagline } });
          return res.status !== 400;
        }
      ),
      { numRuns: 100 }
    );
  });

  // -------------------------------------------------------------------------
  // aboutDescription
  // -------------------------------------------------------------------------

  it('Property 11e: aboutDescription exceeding 1000 characters returns HTTP 400', async () => {
    // **Validates: Requirements 5.6**
    await fc.assert(
      fc.asyncProperty(
        fc.string({ minLength: 1001, maxLength: 1500 }),
        async (aboutDescription) => {
          setupSuccessfulDbMocks();
          const res = await request(app)
            .put(`/api/vendors/${VENDOR_ID}`)
            .send({ miniWebsiteConfig: { aboutDescription } });
          return res.status === 400;
        }
      ),
      { numRuns: 100 }
    );
  });

  it('Property 11f: aboutDescription within 1000 characters does not return HTTP 400', async () => {
    // **Validates: Requirements 5.6**
    await fc.assert(
      fc.asyncProperty(
        fc.string({ minLength: 0, maxLength: 1000 }),
        async (aboutDescription) => {
          setupSuccessfulDbMocks();
          const res = await request(app)
            .put(`/api/vendors/${VENDOR_ID}`)
            .send({ miniWebsiteConfig: { aboutDescription } });
          return res.status !== 400;
        }
      ),
      { numRuns: 100 }
    );
  });
});

// ---------------------------------------------------------------------------
// Task 5.1: Unit tests for vendor PUT qrCodeUrl validation
// Validates: Requirements 6.8, 6.9
// ---------------------------------------------------------------------------

describe('Task 5.1: qrCodeUrl validation — PUT /api/vendors/:id', () => {
  const app = buildApp({ id: OWNER_ID, role: 'VENDOR' });

  beforeEach(() => {
    jest.clearAllMocks();
    setupSuccessfulDbMocks();
  });

  it('valid qrCodeUrl returns 200 and is persisted', async () => {
    // **Validates: Requirements 6.8**
    const res = await request(app)
      .put(`/api/vendors/${VENDOR_ID}`)
      .send({ miniWebsiteConfig: { qrCodeUrl: 'https://example.com/qr.png' } });
    expect(res.status).toBe(200);
  });

  it('invalid qrCodeUrl (non-URL string) returns 400 with descriptive error', async () => {
    // **Validates: Requirements 6.9**
    const res = await request(app)
      .put(`/api/vendors/${VENDOR_ID}`)
      .send({ miniWebsiteConfig: { qrCodeUrl: 'not-a-valid-url' } });
    expect(res.status).toBe(400);
    expect(res.body.error).toBe('qrCodeUrl must be a valid URL');
  });

  it('qrCodeUrl: null returns 200 (removal is allowed)', async () => {
    // **Validates: Requirements 6.8** — null means removal, should not be rejected
    const res = await request(app)
      .put(`/api/vendors/${VENDOR_ID}`)
      .send({ miniWebsiteConfig: { qrCodeUrl: null } });
    expect(res.status).toBe(200);
  });

  it('qrCodeUrl absent (undefined) returns 200', async () => {
    // **Validates: Requirements 6.8** — omitting qrCodeUrl entirely is fine
    const res = await request(app)
      .put(`/api/vendors/${VENDOR_ID}`)
      .send({ miniWebsiteConfig: { businessLabel: 'My Shop' } });
    expect(res.status).toBe(200);
  });

  it('qrCodeUrl as empty string returns 400', async () => {
    // **Validates: Requirements 6.9** — empty string is not a valid URL
    const res = await request(app)
      .put(`/api/vendors/${VENDOR_ID}`)
      .send({ miniWebsiteConfig: { qrCodeUrl: '' } });
    expect(res.status).toBe(400);
    expect(res.body.error).toBe('qrCodeUrl must be a valid URL');
  });
});
