import { Router } from 'express';
import { searchPlaces, getDetails } from '../controllers/placesController';

const router = Router();

// Search for places in Vadodara
// GET /api/places/search?query=restaurants
router.get('/search', searchPlaces);

// Get details for a specific place
// GET /api/places/:placeId
router.get('/:placeId', getDetails);

export default router;
