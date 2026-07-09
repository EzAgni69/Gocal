import express from 'express';
import request from 'supertest';
import authRoutes from '../routes/authRoutes';

// Mock database
const mockSelect = jest.fn();
const mockFrom = jest.fn();
const mockWhere = jest.fn();
const mockLimit = jest.fn();
const mockInsert = jest.fn();
const mockValues = jest.fn();
const mockReturning = jest.fn();
const mockUpdate = jest.fn();
const mockSet = jest.fn();

jest.mock('database', () => ({
  db: {
    select: () => ({
      from: (table: any) => ({
        where: (condition: any) => ({
          limit: (n: number) => mockLimit(),
        }),
      }),
    }),
    insert: (table: any) => ({
      values: (vals: any) => ({
        returning: () => mockReturning(vals),
      }),
    }),
    update: (table: any) => ({
      set: (vals: any) => ({
        where: (condition: any) => ({
          returning: () => mockReturning(vals),
        }),
      }),
    }),
  },
  users: {
    firebaseUid: 'firebase_uid',
    email: 'email',
    phone: 'phone',
  },
  eq: jest.fn((field, val) => ({ field, val })),
}));

// Mock rate limit so unit tests don't get throttled
jest.mock('express-rate-limit', () => jest.fn(() => (req: any, res: any, next: any) => next()));

// Mock auth middleware to control req.user in tests
let mockReqUser: any = null;
jest.mock('../middleware/auth', () => ({
  authenticate: jest.fn((req: any, res: any, next: any) => {
    if (!mockReqUser) {
      res.status(401).json({ error: 'Authentication required' });
      return;
    }
    req.user = mockReqUser;
    next();
  }),
}));

describe('Authentication Routes & Secure Sync Tests', () => {
  let app: express.Application;

  beforeEach(() => {
    jest.clearAllMocks();
    mockReqUser = null;
    app = express();
    app.use(express.json());
    app.use('/api/auth', authRoutes);
  });

  describe('POST /api/auth/sync Security & Edge Cases', () => {
    it('should reject request when unauthenticated (missing/invalid Bearer token)', async () => {
      mockReqUser = null;
      const res = await request(app).post('/api/auth/sync');
      expect(res.status).toBe(401);
      expect(res.body.error).toBe('Authentication required');
    });

    it('should sync and create a new user with email + password successfully', async () => {
      mockReqUser = {
        uid: 'firebase-uid-101',
        email: 'testuser@gocal.co',
        name: 'Test User',
        phone: '+919876543210',
        picture: 'https://avatar.url',
      };

      // No existing user found by uid, email, or phone
      mockLimit.mockResolvedValueOnce([]); // by uid
      mockLimit.mockResolvedValueOnce([]); // by email
      mockLimit.mockResolvedValueOnce([]); // by phone

      // Mock insert returning new user
      mockReturning.mockImplementation((vals: any) => [
        {
          id: 'postgres-uuid-101',
          firebaseUid: 'firebase-uid-101',
          email: vals.email,
          name: vals.name,
          role: 'CONSUMER',
          phone: vals.phone,
          avatarUrl: vals.avatarUrl,
          preferredLanguage: 'en',
          isActive: true,
        },
      ]);

      const res = await request(app).post('/api/auth/sync');
      expect(res.status).toBe(200);
      expect(res.body.user).toEqual({
        id: 'postgres-uuid-101',
        firebaseUid: 'firebase-uid-101',
        email: 'testuser@gocal.co',
        name: 'Test User',
        role: 'CONSUMER',
        phone: '+919876543210',
        avatarUrl: 'https://avatar.url',
        preferredLanguage: 'en',
      });
    });

    it('should correctly sync a phone-only user (email is optional/null)', async () => {
      mockReqUser = {
        uid: 'firebase-phone-uid-202',
        email: null, // Phone-only user has no email
        name: null,
        phone: '+919999988888',
      };

      mockLimit.mockResolvedValueOnce([]); // by uid
      mockLimit.mockResolvedValueOnce([]); // by phone

      mockReturning.mockImplementation((vals: any) => [
        {
          id: 'postgres-uuid-202',
          firebaseUid: 'firebase-phone-uid-202',
          email: vals.email, // should be null
          name: vals.name,
          role: 'CONSUMER',
          phone: vals.phone,
          avatarUrl: null,
          preferredLanguage: 'en',
          isActive: true,
        },
      ]);

      const res = await request(app).post('/api/auth/sync');
      expect(res.status).toBe(200);
      expect(res.body.user.email).toBeNull();
      expect(res.body.user.phone).toBe('+919999988888');
      expect(res.body.user.name).toBe('+919999988888'); // fallback name is phone
    });

    it('should reject a deactivated account with 403 Forbidden', async () => {
      mockReqUser = {
        uid: 'firebase-uid-deactivated',
        email: 'disabled@gocal.co',
      };

      // Existing user found, but isActive = false
      mockLimit.mockResolvedValueOnce([
        {
          id: 'postgres-uuid-999',
          firebaseUid: 'firebase-uid-deactivated',
          email: 'disabled@gocal.co',
          role: 'CONSUMER',
          isActive: false, // DEACTIVATED
        },
      ]);

      const res = await request(app).post('/api/auth/sync');
      expect(res.status).toBe(403);
      expect(res.body.error).toBe('Account is deactivated');
    });
  });
});
