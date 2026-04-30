import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import { z } from 'zod';
import { validate } from '../middleware/validation';
import { searchPlaces, getDetails } from '../controllers/placesController';

const router = Router();

// Stricter rate limit for search endpoint (expensive operation)
const searchLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 20, // max 20 search requests per 15 min per IP
    standardHeaders: true,
    legacyHeaders: false,
    message: { error: 'Too many search requests. Please try again later.' }
});

const searchSchema = z.object({
  query: z.object({
    query: z.string().min(1).max(100),
    pincode: z.string().regex(/^\d{6}$/).optional(),
    lat: z.string().regex(/^-?\d+(\.\d+)?$/).optional(),
    lng: z.string().regex(/^-?\d+(\.\d+)?$/).optional(),
  })
});

// Search for places in Vadodara
// GET /api/places/search?query=restaurants
router.get('/search', searchLimiter, validate(searchSchema), searchPlaces);

const detailsSchema = z.object({
  params: z.object({
    placeId: z.string().min(1).max(200)
  })
});

// Get details for a specific place
// GET /api/places/:placeId
router.get('/:placeId', validate(detailsSchema), getDetails);

export default router;
