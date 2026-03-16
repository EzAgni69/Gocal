import { apiClient } from './apiClient';

export interface User {
    id: string;
    email: string;
    name: string;
    phone: string | null;
    role: string;
    isActive: boolean;
    createdAt: string;
    vendorName: string | null;
}

export interface Pagination {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
}

export interface FetchUsersResponse {
    users: User[];
    pagination: Pagination;
}

/**
 * Fetches users with search and pagination (SUPER_ADMIN only)
 */
export async function fetchUsers(
    page = 1, 
    limit = 20, 
    search = '', 
    role = '', 
    isActive?: boolean
): Promise<FetchUsersResponse> {
    const params = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString(),
    });
    
    if (search) {
        params.append('search', search);
    }

    if (role) {
        params.append('role', role);
    }

    if (isActive !== undefined) {
        params.append('isActive', isActive.toString());
    }

    const response = await apiClient(`/api/users?${params.toString()}`);
    if (!response.ok) {
        throw new Error('Failed to fetch users');
    }

    return await response.json();
}

/**
 * Updates a user's role (SUPER_ADMIN only)
 */
export async function updateUserRole(userId: string, role: string): Promise<User> {
    const response = await apiClient(`/api/users/${userId}/role`, {
        method: 'PUT',
        body: JSON.stringify({ role }),
    });

    if (!response.ok) {
        throw new Error('Failed to update user role');
    }

    const data = await response.json();
    return data.user;
}
