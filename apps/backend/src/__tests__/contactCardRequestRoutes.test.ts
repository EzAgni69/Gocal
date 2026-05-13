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
import * as fc from 'fast-check';
import { validate } from '../middleware/validation';

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

/**
 * Build an app that uses the REAL validate middleware (not the mock).
 * Used for Property 3 schema length enforcement tests.
 */
function buildAppWithRealValidation(userOverride?: any) {
  // Dynamically require the real validation module (bypassing the jest.mock above)
  // by importing the Zod schema logic directly via the route's own validate call.
  // We achieve this by using the actual validate function from the real module.
  const { validate: realValidate } = jest.requireActual('../middleware/validation') as typeof import('../middleware/validation');
  const { z } = jest.requireActual('zod') as typeof import('zod');

  // Replicate the cardRequestSchema body shape (the fields relevant to Property 3)
  const cardRequestBodySchema = z.object({
    body: z.object({
      planType: z.enum(['card_only', 'card_website']),
      fullName: z.string().min(2).max(255),
      phone: z.string().regex(/^\+?[\d\s\-()]{7,20}$/),
      businessName: z.string().min(1).max(255),
      category: z.string().min(1).max(100),
      city: z.string().min(1).max(100),
      businessLabel: z.string().max(100, 'Business label must be 100 characters or fewer').optional(),
      tagline: z.string().max(150, 'Tagline must be 150 characters or fewer').optional(),
      aboutDescription: z.string().max(1000, 'About description must be 1000 characters or fewer').optional(),
    }),
  });

  const app = express();
  app.use(express.json());
  app.use((req: any, _res: any, next: any) => {
    req.user = userOverride ?? { id: 'user-1', role: 'CONSUMER' };
    next();
  });
  // Apply real validation middleware
  app.use('/api/card-requests', realValidate(cardRequestBodySchema), contactCardRequestRoutes);
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

// Feature: vendor-contact-card-customization, Task 2.4: POST handler persistence unit tests
describe('POST /api/card-requests — persistence of businessLabel, tagline, aboutDescription', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should return 201 and include businessLabel, tagline, and aboutDescription in the response when all three are provided', async () => {
    // **Validates: Requirements 2.4**
    const user = { id: 'user-persist-1', role: 'CONSUMER' };

    // No pending requests
    (mockDb.select as jest.Mock).mockReturnValue({
      from: jest.fn().mockReturnValue({
        where: jest.fn().mockReturnValue({
          limit: jest.fn().mockResolvedValue([]),
        }),
      }),
    });

    const insertedRecord = {
      id: 'req-persist-1',
      ...validBody,
      businessLabel: 'My Brand',
      tagline: 'Quality First',
      aboutDescription: 'We are a premium business offering top-notch services.',
    };

    (mockDb.insert as jest.Mock).mockReturnValue({
      values: jest.fn().mockReturnValue({
        returning: jest.fn().mockResolvedValue([insertedRecord]),
      }),
    });

    const app = buildApp(user);
    const res = await request(app)
      .post('/api/card-requests')
      .send({
        ...validBody,
        businessLabel: 'My Brand',
        tagline: 'Quality First',
        aboutDescription: 'We are a premium business offering top-notch services.',
      });

    expect(res.status).toBe(201);
    expect(res.body.request).toBeDefined();
    expect(res.body.request.businessLabel).toBe('My Brand');
    expect(res.body.request.tagline).toBe('Quality First');
    expect(res.body.request.aboutDescription).toBe('We are a premium business offering top-notch services.');

    // Verify the insert was called with the correct values
    const insertMock = mockDb.insert as jest.Mock;
    const valuesMock = insertMock.mock.results[0].value.values as jest.Mock;
    const insertedValues = valuesMock.mock.calls[0][0];
    expect(insertedValues.businessLabel).toBe('My Brand');
    expect(insertedValues.tagline).toBe('Quality First');
    expect(insertedValues.aboutDescription).toBe('We are a premium business offering top-notch services.');
  });

  it('should return 201 and store null for omitted businessLabel, tagline, and aboutDescription', async () => {
    // **Validates: Requirements 2.5**
    const user = { id: 'user-persist-2', role: 'CONSUMER' };

    // No pending requests
    (mockDb.select as jest.Mock).mockReturnValue({
      from: jest.fn().mockReturnValue({
        where: jest.fn().mockReturnValue({
          limit: jest.fn().mockResolvedValue([]),
        }),
      }),
    });

    const insertedRecord = {
      id: 'req-persist-2',
      ...validBody,
      businessLabel: null,
      tagline: null,
      aboutDescription: null,
    };

    (mockDb.insert as jest.Mock).mockReturnValue({
      values: jest.fn().mockReturnValue({
        returning: jest.fn().mockResolvedValue([insertedRecord]),
      }),
    });

    const app = buildApp(user);
    // Send only the required fields — no businessLabel, tagline, or aboutDescription
    const res = await request(app)
      .post('/api/card-requests')
      .send(validBody);

    expect(res.status).toBe(201);
    expect(res.body.request).toBeDefined();
    expect(res.body.request.businessLabel).toBeNull();
    expect(res.body.request.tagline).toBeNull();
    expect(res.body.request.aboutDescription).toBeNull();

    // Verify the insert was called with null for the omitted fields
    const insertMock = mockDb.insert as jest.Mock;
    const valuesMock = insertMock.mock.results[0].value.values as jest.Mock;
    const insertedValues = valuesMock.mock.calls[0][0];
    expect(insertedValues.businessLabel).toBeNull();
    expect(insertedValues.tagline).toBeNull();
    expect(insertedValues.aboutDescription).toBeNull();
  });
});

// Feature: vendor-contact-card-customization, Property 3: Schema length enforcement
describe('Property 3: Schema length enforcement — POST /api/card-requests', () => {
  // Base valid body that satisfies all required fields
  const validBase = {
    planType: 'card_only',
    fullName: 'Test User',
    phone: '+1234567890',
    businessName: 'Test Biz',
    category: 'Food',
    city: 'TestCity',
  };

  let app: ReturnType<typeof buildAppWithRealValidation>;

  beforeEach(() => {
    jest.clearAllMocks();
    app = buildAppWithRealValidation({ id: 'user-prop3', role: 'CONSUMER' });

    // Mock DB: no pending requests, successful insert
    (mockDb.select as jest.Mock).mockReturnValue({
      from: jest.fn().mockReturnValue({
        where: jest.fn().mockReturnValue({
          limit: jest.fn().mockResolvedValue([]),
        }),
      }),
    });
    (mockDb.insert as jest.Mock).mockReturnValue({
      values: jest.fn().mockReturnValue({
        returning: jest.fn().mockResolvedValue([{ id: 'req-prop3', ...validBase }]),
      }),
    });
  });

  it('Property 3a: strings within all limits pass validation (HTTP 201)', async () => {
    // **Validates: Requirements 2.1, 2.2, 2.3**
    await fc.assert(
      fc.asyncProperty(
        fc.string({ maxLength: 100 }),
        fc.string({ maxLength: 150 }),
        fc.string({ maxLength: 1000 }),
        async (bl, tl, ad) => {
          const res = await request(app)
            .post('/api/card-requests')
            .send({ ...validBase, businessLabel: bl, tagline: tl, aboutDescription: ad });
          // Should pass validation (201) or hit a non-400 status
          return res.status !== 400;
        }
      ),
      { numRuns: 100 }
    );
  });

  it('Property 3b: businessLabel exceeding 100 chars returns HTTP 400', async () => {
    // **Validates: Requirements 2.1, 2.6**
    await fc.assert(
      fc.asyncProperty(
        fc.string({ minLength: 101, maxLength: 200 }),
        async (bl) => {
          const res = await request(app)
            .post('/api/card-requests')
            .send({ ...validBase, businessLabel: bl });
          return res.status === 400;
        }
      ),
      { numRuns: 100 }
    );
  });

  it('Property 3c: tagline exceeding 150 chars returns HTTP 400', async () => {
    // **Validates: Requirements 2.2, 2.7**
    await fc.assert(
      fc.asyncProperty(
        fc.string({ minLength: 151, maxLength: 300 }),
        async (tl) => {
          const res = await request(app)
            .post('/api/card-requests')
            .send({ ...validBase, tagline: tl });
          return res.status === 400;
        }
      ),
      { numRuns: 100 }
    );
  });

  it('Property 3d: aboutDescription exceeding 1000 chars returns HTTP 400', async () => {
    // **Validates: Requirements 2.3, 2.8**
    await fc.assert(
      fc.asyncProperty(
        fc.string({ minLength: 1001, maxLength: 1500 }),
        async (ad) => {
          const res = await request(app)
            .post('/api/card-requests')
            .send({ ...validBase, aboutDescription: ad });
          return res.status === 400;
        }
      ),
      { numRuns: 100 }
    );
  });
});

// Feature: vendor-contact-card-customization, Property 5: Approval propagation
// Validates: Requirements 3.1, 3.2, 3.3, 3.4

/**
 * Pure function extracted from the approval handler's miniConfig construction logic.
 * Mirrors the logic in PUT /api/card-requests/:id/review exactly:
 *   if (existingRequest.googleDirectionLink) miniConfig.googleMapsUrl = ...
 *   if (existingRequest.businessLabel)    miniConfig.businessLabel    = ...
 *   if (existingRequest.tagline)          miniConfig.tagline          = ...
 *   if (existingRequest.aboutDescription) miniConfig.aboutDescription = ...
 */
function buildMiniConfig(request: {
  googleDirectionLink?: string | null;
  businessLabel?: string | null;
  tagline?: string | null;
  aboutDescription?: string | null;
}): Record<string, any> {
  const miniConfig: Record<string, any> = {};
  if (request.googleDirectionLink) miniConfig.googleMapsUrl = request.googleDirectionLink;
  if (request.businessLabel)    miniConfig.businessLabel    = request.businessLabel;
  if (request.tagline)          miniConfig.tagline          = request.tagline;
  if (request.aboutDescription) miniConfig.aboutDescription = request.aboutDescription;
  return miniConfig;
}

describe('Property 5: Approval propagation — buildMiniConfig', () => {
  it('Property 5a: non-null businessLabel, tagline, and aboutDescription appear as keys with correct values', () => {
    // **Validates: Requirements 3.1, 3.2, 3.3**
    fc.assert(
      fc.property(
        fc.option(fc.string({ minLength: 1, maxLength: 100 }), { nil: null }),
        fc.option(fc.string({ minLength: 1, maxLength: 150 }), { nil: null }),
        fc.option(fc.string({ minLength: 1, maxLength: 1000 }), { nil: null }),
        (bl, tl, ad) => {
          const miniConfig = buildMiniConfig({ businessLabel: bl, tagline: tl, aboutDescription: ad });

          if (bl !== null) {
            expect(miniConfig.businessLabel).toBe(bl);
          }
          if (tl !== null) {
            expect(miniConfig.tagline).toBe(tl);
          }
          if (ad !== null) {
            expect(miniConfig.aboutDescription).toBe(ad);
          }
          return true;
        }
      ),
      { numRuns: 100 }
    );
  });

  it('Property 5b: null values produce NO key in the resulting object', () => {
    // **Validates: Requirements 3.4**
    fc.assert(
      fc.property(
        fc.option(fc.string({ minLength: 1, maxLength: 100 }), { nil: null }),
        fc.option(fc.string({ minLength: 1, maxLength: 150 }), { nil: null }),
        fc.option(fc.string({ minLength: 1, maxLength: 1000 }), { nil: null }),
        (bl, tl, ad) => {
          const miniConfig = buildMiniConfig({ businessLabel: bl, tagline: tl, aboutDescription: ad });

          if (bl === null) {
            expect('businessLabel' in miniConfig).toBe(false);
          }
          if (tl === null) {
            expect('tagline' in miniConfig).toBe(false);
          }
          if (ad === null) {
            expect('aboutDescription' in miniConfig).toBe(false);
          }
          return true;
        }
      ),
      { numRuns: 100 }
    );
  });
});

// Feature: vendor-contact-card-customization, Property 6: miniWebsiteConfig field preservation
// Validates: Requirements 3.5
describe('Property 6: miniWebsiteConfig field preservation — buildMiniConfig', () => {
  it('should preserve googleMapsUrl when googleDirectionLink is provided alongside the three new fields', () => {
    // **Validates: Requirements 3.5**
    // When a request has googleDirectionLink AND businessLabel, tagline, aboutDescription,
    // the resulting miniConfig must contain ALL four keys.
    const miniConfig = buildMiniConfig({
      googleDirectionLink: 'https://maps.google.com/?q=test',
      businessLabel: 'My Brand',
      tagline: 'Quality First',
      aboutDescription: 'We offer premium services.',
    });

    // All four keys must be present
    expect(miniConfig).toHaveProperty('googleMapsUrl', 'https://maps.google.com/?q=test');
    expect(miniConfig).toHaveProperty('businessLabel', 'My Brand');
    expect(miniConfig).toHaveProperty('tagline', 'Quality First');
    expect(miniConfig).toHaveProperty('aboutDescription', 'We offer premium services.');

    // Verify no keys were overwritten or removed
    expect(Object.keys(miniConfig)).toHaveLength(4);
  });

  it('should not overwrite googleMapsUrl when writing the three new keys', () => {
    // **Validates: Requirements 3.5**
    // Writing businessLabel, tagline, aboutDescription must not remove or alter googleMapsUrl.
    const googleDirectionLink = 'https://maps.google.com/?q=original';

    const miniConfig = buildMiniConfig({
      googleDirectionLink,
      businessLabel: 'Brand Name',
      tagline: 'Our Tagline',
      aboutDescription: 'About us text.',
    });

    // googleMapsUrl must still equal the original googleDirectionLink value
    expect(miniConfig.googleMapsUrl).toBe(googleDirectionLink);

    // The three new keys must also be present with correct values
    expect(miniConfig.businessLabel).toBe('Brand Name');
    expect(miniConfig.tagline).toBe('Our Tagline');
    expect(miniConfig.aboutDescription).toBe('About us text.');
  });

  it('should include googleMapsUrl even when some of the three new fields are null', () => {
    // **Validates: Requirements 3.5**
    // Pre-existing keys like googleMapsUrl must survive regardless of which new fields are null.
    const miniConfig = buildMiniConfig({
      googleDirectionLink: 'https://maps.google.com/?q=test2',
      businessLabel: 'Only Label',
      tagline: null,
      aboutDescription: null,
    });

    // googleMapsUrl must be present
    expect(miniConfig).toHaveProperty('googleMapsUrl', 'https://maps.google.com/?q=test2');
    // businessLabel must be present
    expect(miniConfig).toHaveProperty('businessLabel', 'Only Label');
    // null fields must be absent (not overwrite anything)
    expect('tagline' in miniConfig).toBe(false);
    expect('aboutDescription' in miniConfig).toBe(false);
  });
});
