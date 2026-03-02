import dotenv from 'dotenv';

dotenv.config();

const API_KEY = process.env.GOOGLE_PLACES_API_KEY;
const BASE_URL = 'https://places.googleapis.com/v1/places';

// Vadodara city coordinates and bounds
const VADODARA_LOCATION = {
    latitude: 22.3072,
    longitude: 73.1812,
};

const VADODARA_RADIUS = 15000; // 15km radius to cover most of Vadodara city

export interface GooglePlace {
    id: string;
    displayName: {
        text: string;
        languageCode: string;
    };
    formattedAddress: string;
    rating?: number;
    userRatingCount?: number;
    nationalPhoneNumber?: string;
    internationalPhoneNumber?: string;
    websiteUri?: string;
    regularOpeningHours?: {
        openNow: boolean;
        weekdayDescriptions: string[];
    };
    photos?: Array<{
        name: string;
        widthPx: number;
        heightPx: number;
    }>;
    primaryType?: string;
    primaryTypeDisplayName?: {
        text: string;
    };
    shortFormattedAddress?: string;
    location?: {
        latitude: number;
        longitude: number;
    };
}

export interface PlacesSearchResult {
    places: GooglePlace[];
    error?: string;
}

export interface PlaceDetailsResult {
    place: GooglePlace | null;
    error?: string;
}

/**
 * Convert PIN code to geographic coordinates using Google Places API
 */
export async function geocodePincode(pincode: string): Promise<{ latitude: number; longitude: number } | null> {
    if (!API_KEY) return null;

    try {
        const requestBody = {
            textQuery: `${pincode}, Vadodara, Gujarat, India`,
            maxResultCount: 1,
            languageCode: 'en',
        };

        const response = await fetch(`${BASE_URL}:searchText`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-Goog-Api-Key': API_KEY,
                'X-Goog-FieldMask': 'places.location',
            },
            body: JSON.stringify(requestBody),
        });

        const data = await response.json();
        if (data.places && data.places.length > 0 && data.places[0].location) {
            console.log(`[Pincode Geocoding] Resolved ${pincode} to Lat: ${data.places[0].location.latitude}, Lng: ${data.places[0].location.longitude}`);
            return {
                latitude: data.places[0].location.latitude,
                longitude: data.places[0].location.longitude
            };
        }
        return null;
    } catch (error) {
        console.error('Error finding pincode location:', error);
        return null;
    }
}

/**
 * Search for places (stores/services) in Vadodara city or by specific coordinates
 */
export async function searchVadodaraPlaces(query: string, lat?: number, lng?: number): Promise<PlacesSearchResult> {
    if (!API_KEY) {
        return { places: [], error: 'Google Places API key not configured' };
    }

    try {
        const hasLocation = lat !== undefined && lng !== undefined;
        let requestBody: any = {
            textQuery: hasLocation ? query : `${query} in Vadodara, Gujarat, India`,
            maxResultCount: 20,
            languageCode: 'en',
        };

        if (hasLocation) {
            // 1 degree of latitude is ~111km -> 5km is ~0.045
            // 1 degree of longitude at ~22 lat is ~103km -> 5km is ~0.048
            const latDelta = 0.045;
            const lngDelta = 0.048;

            // If location is provided, search within a bounding box and sort by distance
            requestBody.locationRestriction = {
                rectangle: {
                    low: { 
                        latitude: lat - latDelta, 
                        longitude: lng - lngDelta 
                    },
                    high: { 
                        latitude: lat + latDelta, 
                        longitude: lng + lngDelta 
                    }
                },
            };
            requestBody.rankPreference = 'DISTANCE';
        } else {
            // Apply Vadodara center bias if there is NO location provided
            requestBody.locationBias = {
                circle: {
                    center: { 
                        latitude: VADODARA_LOCATION.latitude, 
                        longitude: VADODARA_LOCATION.longitude 
                    },
                    radius: VADODARA_RADIUS,
                },
            };
        }

        console.log(`[Places API] Request Body:`, JSON.stringify(requestBody, null, 2));

        const response = await fetch(`${BASE_URL}:searchText`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-Goog-Api-Key': API_KEY,
                'X-Goog-FieldMask': [
                    'places.id',
                    'places.displayName',
                    'places.formattedAddress',
                    'places.shortFormattedAddress',
                    'places.rating',
                    'places.userRatingCount',
                    'places.nationalPhoneNumber',
                    'places.internationalPhoneNumber',
                    'places.websiteUri',
                    'places.regularOpeningHours',
                    'places.photos',
                    'places.primaryType',
                    'places.primaryTypeDisplayName',
                    'places.location',
                ].join(','),
            },
            body: JSON.stringify(requestBody),
        });

        if (!response.ok) {
            const errorData = await response.json();
            console.error('Google Places API error:', errorData);
            return { places: [], error: `API Error: ${response.status}` };
        }

        const data = await response.json();
        console.log(`[Places API] Returned ${data.places?.length || 0} places.`);
        return { places: data.places || [] };
    } catch (error) {
        console.error('Error fetching places:', error);
        return { places: [], error: 'Failed to fetch places' };
    }
}

/**
 * Get detailed information about a specific place
 */
export async function getPlaceDetails(placeId: string): Promise<PlaceDetailsResult> {
    if (!API_KEY) {
        return { place: null, error: 'Google Places API key not configured' };
    }

    try {
        const response = await fetch(`${BASE_URL}/${placeId}`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'X-Goog-Api-Key': API_KEY,
                'X-Goog-FieldMask': [
                    'id',
                    'displayName',
                    'formattedAddress',
                    'shortFormattedAddress',
                    'rating',
                    'userRatingCount',
                    'nationalPhoneNumber',
                    'internationalPhoneNumber',
                    'websiteUri',
                    'regularOpeningHours',
                    'photos',
                    'primaryType',
                    'primaryTypeDisplayName',
                    'location',
                ].join(','),
            },
        });

        if (!response.ok) {
            const errorData = await response.json();
            console.error('Google Places API error:', errorData);
            return { place: null, error: `API Error: ${response.status}` };
        }

        const data = await response.json();
        return { place: data };
    } catch (error) {
        console.error('Error fetching place details:', error);
        return { place: null, error: 'Failed to fetch place details' };
    }
}

/**
 * Get photo URL for a Google Place photo reference
 */
export function getPhotoUrl(photoName: string, maxWidth: number = 400): string {
    if (!API_KEY) return '';
    return `https://places.googleapis.com/v1/${photoName}/media?maxWidthPx=${maxWidth}&key=${API_KEY}`;
}
