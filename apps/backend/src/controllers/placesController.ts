import { Request, Response } from 'express';
import { searchVadodaraPlaces, getPlaceDetails, getPhotoUrl, geocodePincode } from '../services/placesService';

/**
 * Search for places in Vadodara
 * GET /api/places/search?query=restaurants
 */
export async function searchPlaces(req: Request, res: Response) {
    const query = req.query.query as string;
    const pincode = req.query.pincode as string;
    let lat = req.query.lat ? parseFloat(req.query.lat as string) : undefined;
    let lng = req.query.lng ? parseFloat(req.query.lng as string) : undefined;

    if (!query) {
        return res.status(400).json({ error: 'Query parameter is required' });
    }

    if (pincode && (lat === undefined || lng === undefined)) {
        const coords = await geocodePincode(pincode);
        if (coords) {
            lat = coords.latitude;
            lng = coords.longitude;
        }
    }

    const result = await searchVadodaraPlaces(query, lat, lng);

    if (result.error) {
        return res.status(500).json({ error: result.error });
    }

    // Transform places to include photo URLs
    const placesWithPhotos = result.places.map((place) => ({
        ...place,
        photoUrl: place.photos?.[0] ? getPhotoUrl(place.photos[0].name) : null,
    }));

    return res.json({ places: placesWithPhotos });
}

/**
 * Get details for a specific place
 * GET /api/places/:placeId
 */
export async function getDetails(req: Request, res: Response) {
    const { placeId } = req.params;

    if (!placeId) {
        return res.status(400).json({ error: 'Place ID is required' });
    }

    const result = await getPlaceDetails(placeId);

    if (result.error) {
        return res.status(500).json({ error: result.error });
    }

    if (!result.place) {
        return res.status(404).json({ error: 'Place not found' });
    }

    // Add photo URL if available
    const placeWithPhoto = {
        ...result.place,
        photoUrl: result.place.photos?.[0] ? getPhotoUrl(result.place.photos[0].name) : null,
    };

    return res.json({ place: placeWithPhoto });
}
