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
 * Search for places (stores/services) in Vadodara city
 */
export async function searchVadodaraPlaces(query: string): Promise<PlacesSearchResult> {
    if (!API_KEY) {
        return { places: [], error: 'Google Places API key not configured' };
    }

    try {
        const requestBody = {
            textQuery: `${query} in Vadodara, Gujarat, India`,
            locationBias: {
                circle: {
                    center: VADODARA_LOCATION,
                    radius: VADODARA_RADIUS,
                },
            },
            maxResultCount: 20,
            languageCode: 'en',
        };

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
