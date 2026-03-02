import { auth } from '../config/firebase';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

interface RequestOptions extends RequestInit {
    // Add any custom options here if needed in the future
}

/**
 * A wrapper around the native fetch API that automatically
 * appends the Firebase ID token to the Authorization header
 * if a user is currently signed in.
 */
export async function apiClient(endpoint: string, options: RequestOptions = {}): Promise<Response> {
    const headers = new Headers(options.headers || {});
    
    // Attempt to get the current Firebase user's ID token
    try {
        const currentUser = auth.currentUser;
        if (currentUser) {
            const token = await currentUser.getIdToken();
            if (token) {
                headers.set('Authorization', `Bearer ${token}`);
            }
        }
    } catch (error) {
        console.error('Failed to retrieve Firebase ID token for API request', error);
        // Continue without token - let the backend handle the 401 if it's a protected route
    }

    // Default to JSON Content-Type if body is present and no Content-Type is set
    // Note: Don't set this blindly if using FormData
    if (options.body && typeof options.body === 'string' && !headers.has('Content-Type')) {
        headers.set('Content-Type', 'application/json');
    }

    const config: RequestInit = {
        ...options,
        headers,
    };

    // Build the full URL
    const isAbsoluteUrl = endpoint.startsWith('http://') || endpoint.startsWith('https://');
    const url = isAbsoluteUrl ? endpoint : `${API_BASE_URL}${endpoint.startsWith('/') ? endpoint : `/${endpoint}`}`;

    const response = await fetch(url, config);
    return response;
}
