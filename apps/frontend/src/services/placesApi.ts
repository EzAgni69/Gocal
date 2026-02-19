const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

export interface GooglePlaceResponse {
    id: string;
    displayName: {
        text: string;
        languageCode: string;
    };
    formattedAddress: string;
    shortFormattedAddress?: string;
    rating?: number;
    userRatingCount?: number;
    nationalPhoneNumber?: string;
    internationalPhoneNumber?: string;
    websiteUri?: string;
    regularOpeningHours?: {
        openNow: boolean;
        weekdayDescriptions: string[];
    };
    primaryType?: string;
    primaryTypeDisplayName?: {
        text: string;
    };
    photoUrl?: string | null;
    location?: {
        latitude: number;
        longitude: number;
    };
}

export interface PlacesSearchResponse {
    places: GooglePlaceResponse[];
    error?: string;
}

export interface PlaceDetailsResponse {
    place: GooglePlaceResponse;
    error?: string;
}

/**
 * Search for places (stores/services) in Vadodara
 */
export async function searchVadodaraPlaces(query: string): Promise<PlacesSearchResponse> {
    try {
        const response = await fetch(
            `${API_BASE_URL}/api/places/search?query=${encodeURIComponent(query)}`
        );

        if (!response.ok) {
            const errorData = await response.json();
            return { places: [], error: errorData.error || 'Failed to fetch places' };
        }

        return await response.json();
    } catch (error) {
        console.error('Error searching places:', error);
        return { places: [], error: 'Network error. Please try again.' };
    }
}

/**
 * Get details for a specific place
 */
export async function getPlaceDetails(placeId: string): Promise<PlaceDetailsResponse | null> {
    try {
        const response = await fetch(`${API_BASE_URL}/api/places/${placeId}`);

        if (!response.ok) {
            const errorData = await response.json();
            console.error('Error fetching place details:', errorData);
            return null;
        }

        return await response.json();
    } catch (error) {
        console.error('Error fetching place details:', error);
        return null;
    }
}
