export enum UserRole {
    CONSUMER = 'CONSUMER',
    VENDOR = 'VENDOR',
    ADMIN = 'ADMIN',
    SUPER_ADMIN = 'SUPER_ADMIN',
}

export type Language = 'en' | 'hi' | 'gu';

export type ReportReason = 'FRAUD' | 'SPAM' | 'INCORRECT_INFO' | 'OFFENSIVE';
export type ReportStatus = 'PENDING' | 'UNDER_REVIEW' | 'RESOLVED' | 'DISMISSED';

export interface MiniWebsiteConfig {
    operatingHours?: {
        [day: string]: { open: string; close: string; closed?: boolean };
    };
    socialLinks?: {
        whatsapp?: string;
        instagram?: string;
        facebook?: string;
        youtube?: string;
        twitter?: string;
    };
    googleMapsUrl?: string;
    customSections?: Array<{
        title: string;
        content: string;
    }>;
    theme?: {
        primaryColor?: string;
        accentColor?: string;
    };
}

export interface VendorCategoryConfig {
    requiresImage: boolean;
    showQuantity: boolean;
    showUnit: boolean;
    defaultUnit?: string;
    showMinOrder: boolean;
    showSku: boolean;
    showDescription: boolean;
}

export interface Vendor {
    id: string;
    ownerId: string;
    name: string;
    slug: string;
    description?: string;
    shortDescription?: string;
    categoryId?: string;
    city: string;
    address: string;
    phone?: string;
    email?: string;
    coverImageUrl?: string;
    websiteUuid?: string;
    isOpen: boolean;
    isPremium: boolean;
    isVerified: boolean;
    rating: string;
    reviewCount: string;
    miniWebsiteConfig: MiniWebsiteConfig;
    longitude?: string;
    latitude?: string;
    googlePlaceId?: string;
    products?: Product[];
    gallery?: string[];
    reviews?: Review[];
    offers?: Offer[];
}

export interface Product {
    id: string;
    vendorId: string;
    name: string;
    description?: string;
    price: string;
    imageUrl?: string;
    category?: string;
    quantity?: string;
    unit?: string;
    minOrderQty?: string;
    inStock: boolean;
    sku?: string;
    sortOrder: number;
}

export interface Review {
    id: string;
    userId: string;
    vendorId: string;
    rating: number;
    comment?: string;
    createdAt: Date;
    user?: { id: string; name: string; avatarUrl?: string };
}

export interface Offer {
    id: string;
    vendorId: string;
    title: string;
    code?: string;
    discount: string;
    validFrom?: string;
    validUntil?: string;
    isActive: boolean;
}

export interface Report {
    id: string;
    reporterId: string;
    vendorId: string;
    reason: ReportReason;
    comment?: string;
    status: ReportStatus;
    resolvedBy?: string;
    resolutionNote?: string;
    createdAt: Date;
    resolvedAt?: Date;
}

export interface User {
    id: string;
    email: string;
    name: string;
    phone?: string;
    avatarUrl?: string;
    role: UserRole;
    preferredLanguage: Language;
    isActive: boolean;
}

export interface AnalyticsData {
    name: string;
    visits: number;
    clicks: number;
    favorites: number;
}

export interface AdminReport {
    totalVendors: number;
    totalRevenue: number;
    flaggedContent: number;
}
