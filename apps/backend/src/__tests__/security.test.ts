import request from 'supertest';
import { app } from '../index';
import { logger } from '../config/logger';

// Mock logger to keep test output clean
jest.mock('../config/logger', () => ({
  logger: {
    info: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
  },
}));

describe('Security Hardening Tests', () => {
  
  describe('Helmet Security Headers', () => {
    it('should have security headers injected by Helmet', async () => {
      const response = await request(app).get('/');
      
      expect(response.headers).toHaveProperty('content-security-policy');
      expect(response.headers).toHaveProperty('x-frame-options', 'SAMEORIGIN');
      expect(response.headers).toHaveProperty('x-content-type-options', 'nosniff');
      expect(response.headers).toHaveProperty('referrer-policy', 'no-referrer');
      expect(response.headers).toHaveProperty('strict-transport-security');
      expect(response.headers).not.toHaveProperty('x-powered-by');
    });
  });

  describe('Zod Input Validation', () => {
    it('should reject search with missing query', async () => {
      const response = await request(app).get('/api/places/search');
      expect(response.status).toBe(400);
      expect(response.body.error).toBe('Validation failed');
    });

    it('should reject invalid pincode format', async () => {
      const response = await request(app).get('/api/places/search?query=food&pincode=123');
      
      try {
        expect(response.status).toBe(400);
        expect(response.body.details).toBeDefined();
        // Zod regex error message usually contains "Invalid" or custom message
        expect(JSON.stringify(response.body.details)).toMatch(/regex|invalid/i);
      } catch (e) {
        console.log('Failing Response Status:', response.status);
        console.log('Failing Response Body:', JSON.stringify(response.body, null, 2));
        throw e;
      }
    });

    it('should reject invalid lat/lng format', async () => {
      const response = await request(app).get('/api/places/search?query=food&lat=abc');
      expect(response.status).toBe(400);
      expect(response.body.error).toBe('Validation failed');
    });
  });

  describe('Rate Limiting', () => {
    it('should respect auth-specific rate limits', async () => {
        // Auth sync is limited to 15 per IP.
        for (let i = 0; i < 15; i++) {
          const res = await request(app).post('/api/auth/sync').send({});
          // Should be 401 (missing auth) but not 429
          expect(res.status).not.toBe(429);
        }
        const response = await request(app).post('/api/auth/sync').send({});
        expect(response.status).toBe(429);
        expect(response.body.error).toMatch(/Too many authentication attempts/);
    });

    it('should respect endpoint-specific rate limits for search', async () => {
      // The search endpoint is limited to 20 requests per 15 minutes.
      // We've already used some in the validation tests above (3 requests).
      // So we need about 18 more.
      
      for (let i = 0; i < 20; i++) {
        const res = await request(app).get('/api/places/search?query=test');
        if (res.status === 429) break; // Already triggered
      }
      
      const response = await request(app).get('/api/places/search?query=test');
      expect(response.status).toBe(429);
      expect(response.body.error).toMatch(/Too many search requests/);
    }, 30000);
  });
});
