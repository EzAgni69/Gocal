import { apiClient } from './apiClient';
import { Vendor, BackendVendor, Product, GalleryImage } from '../types';
import { getOpeningHoursStatus } from '../utils/openingHours';

/**
 * Utility to map backend vendor to frontend Vendor type
 */
function mapVendor(v: BackendVendor): Vendor {
    // Derive isOpen dynamically from opening_hours if available,
    // otherwise fall back to the stored boolean from the backend.
    const isOpen = v.openingHours
        ? getOpeningHoursStatus(v.openingHours).isOpen
        : (v.isOpen ?? false);

    return {
        id: v.id,
        name: v.name,
        shortDescription: v.shortDescription || '',
        description: v.description || '',
        city: v.city || '',
        category: typeof v.category === 'string' ? v.category : v.category?.name || 'Local Store',
        address: v.address || '',
        phone: v.phone || '',
        email: v.email || '',
        coverImage: v.coverImageUrl || 'https://images.unsplash.com/photo-1604719312566-8912e9227c6a?w=400&q=80',
        isOpen,
        rating: typeof v.rating === 'string' ? parseFloat(v.rating) || 0 : (typeof v.rating === 'number' ? v.rating : 0),
        reviewCount: typeof v.reviewCount === 'string' ? parseInt(v.reviewCount) || 0 : (typeof v.reviewCount === 'number' ? v.reviewCount : 0),
        isPremium: v.isPremium ?? false,
        planType: v.planType,
        websiteUuid: v.websiteUuid,
        openingHours: v.openingHours,
        verified: v.isVerified ?? false,
        products: v.products?.map((p: Partial<Product> & { imageUrl?: string; price?: string | number }) => ({
            ...p,
            id: p.id || '',
            name: p.name || '',
            category: p.category || '',
            price: typeof p.price === 'string' ? parseFloat(p.price) || 0 : (p.price || 0),
            image: p.imageUrl // Map backend imageUrl to frontend image
        })) as Product[],
        galleryImages: v.galleryImages,
        reviews: v.reviews,
        offers: v.offers,
        miniWebsiteConfig: v.miniWebsiteConfig,
        websiteUrl: v.websiteUrl,
        createdAt: v.createdAt,
    };
}

/**
 * Fetches vendors marked for the home screen
 */
export async function fetchHomeVendors(): Promise<Vendor[]> {
    const response = await apiClient('/api/vendors/home');
    if (!response.ok) {
        throw new Error('Failed to fetch home vendors');
    }

    const data = await response.json();
    return data.vendors.map(mapVendor);
}

/**
 * Fetches all vendors (ADMIN/SUPER_ADMIN only)
 */
export async function fetchVendors(page = 1, limit = 20, search = ''): Promise<{ vendors: Vendor[], pagination: { total: number, page: number, totalPages: number } }> {
    const params = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString(),
    });
    if (search) params.append('search', search);

    const response = await apiClient(`/api/vendors?${params.toString()}`);
    if (!response.ok) {
        throw new Error('Failed to fetch vendors');
    }

    const data = await response.json();
    return {
        vendors: data.vendors.map(mapVendor),
        pagination: {
            total: data.total || 0,
            page: data.page,
            totalPages: Math.ceil((data.total || 0) / data.limit)
        }
    };
}

/**
 * Updates a vendor's details
 */
export async function updateVendor(vendorId: string, updateData: Partial<Vendor>): Promise<Vendor> {
    // Map frontend fields back to backend names if necessary
    const backendData: Record<string, unknown> = { ...updateData };
    if (updateData.coverImage) {
        backendData.coverImageUrl = updateData.coverImage;
        delete backendData.coverImage;
    }
    
    const response = await apiClient(`/api/vendors/${vendorId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(backendData),
    });

    if (!response.ok) {
        const err = await response.json();
        throw new Error(err.error || 'Failed to update vendor');
    }

    const data = await response.json();
    return mapVendor(data.vendor);
}

/**
 * Adds an image to the vendor's gallery
 */
export async function addGalleryImage(vendorId: string, imageUrl: string, caption?: string, sortOrder?: number): Promise<{ message?: string; id?: string; image: GalleryImage }> {
    const response = await apiClient(`/api/vendors/${vendorId}/gallery`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ imageUrl, caption, sortOrder }),
    });

    if (!response.ok) {
        const err = await response.json();
        throw new Error(err.error || 'Failed to add gallery image');
    }

    return response.json();
}

/**
 * Updates a gallery image's details
 */
export async function updateGalleryImage(vendorId: string, imageId: string, caption?: string, sortOrder?: number): Promise<{ message?: string; id?: string }> {
    const response = await apiClient(`/api/vendors/${vendorId}/gallery/${imageId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ caption, sortOrder }),
    });

    if (!response.ok) {
        const err = await response.json();
        throw new Error(err.error || 'Failed to update gallery image');
    }

    return response.json();
}

/**
 * Removes an image from the gallery
 */
export async function removeGalleryImage(vendorId: string, imageId: string): Promise<void> {
    const response = await apiClient(`/api/vendors/${vendorId}/gallery/${imageId}`, {
        method: 'DELETE',
    });

    if (!response.ok) {
        const err = await response.json();
        throw new Error(err.error || 'Failed to remove gallery image');
    }
}

/**
 * Removes a vendor (soft delete)
 */
export async function removeVendor(vendorId: string): Promise<void> {
    const response = await apiClient(`/api/vendors/${vendorId}`, {
        method: 'DELETE',
    });

    if (!response.ok) {
        const err = await response.json();
        throw new Error(err.error || 'Failed to remove vendor');
    }
}

/**
 * Admin-only: soft-deletes a vendor card and conditionally downgrades the owner's role.
 * Returns roleDowngraded flag and newRole if a downgrade occurred.
 */
export async function deleteAdminVendor(vendorId: string): Promise<{ vendor: any; roleDowngraded: boolean; newRole?: string }> {
    const response = await apiClient(`/api/admin/vendors/${vendorId}`, {
        method: 'DELETE',
    });

    if (!response.ok) {
        const err = await response.json();
        throw new Error(err.error || 'Failed to delete vendor');
    }

    return response.json();
}

/**
 * Restores a soft-deleted vendor
 */
export async function restoreVendor(vendorId: string): Promise<void> {
    const response = await apiClient(`/api/vendors/${vendorId}/restore`, {
        method: 'POST',
    });

    if (!response.ok) {
        const err = await response.json();
        throw new Error(err.error || 'Failed to restore vendor');
    }
}

/**
 * Fetches vendor details by websiteUuid for mini-website
 */
export async function fetchVendorByUuid(uuid: string): Promise<Vendor> {
    const response = await apiClient(`/api/vendors/store/${uuid}`);
    if (!response.ok) {
        throw new Error('Store not found');
    }

    const data = await response.json();
    return mapVendor(data.vendor);
}
