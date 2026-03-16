export enum UserRole {
  CONSUMER = 'CONSUMER',
  VENDOR = 'VENDOR',
  ADMIN = 'ADMIN',
  SUPER_ADMIN = 'SUPER_ADMIN'
}

export type Language = 'en' | 'hi' | 'gu';

export interface Product {
    id: string;
    name: string;
    price: number;
    image?: string;           // Optional - not all vendors need images
    description?: string;     // Optional for simple listings
    category: string;
    quantity?: number;        // For bulk items (fruits, grains, etc.)
    unit?: string;            // kg, pieces, liters, dozen, etc.
    minOrderQty?: number;     // Minimum order quantity
    inStock?: boolean;        // Availability status
    sku?: string;             // Stock keeping unit for inventory
    vendorId?: string;
    vendorName?: string;
    vendorPhone?: string;
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

export interface Review {
  id: string;
  user: string;
  rating: number;
  comment: string;
}

export interface GalleryImage {
    id: string;
    vendorId: string;
    imageUrl: string;
    caption?: string | null;
    sortOrder: number;
}

export interface MiniWebsiteConfig {
    operatingHours?: { [day: string]: { open: string; close: string; closed?: boolean } };
    socialLinks?: { 
        whatsapp?: string; 
        instagram?: string; 
        facebook?: string; 
        youtube?: string; 
        twitter?: string 
    };
    googleMapsUrl?: string;
    customSections?: Array<{ title: string; content: string }>;
    theme?: { primaryColor?: string; accentColor?: string };
}

export interface Vendor {
  id: string;
  name: string;
  description: string;
  shortDescription: string;
  city: string;
  category: string;
  address: string;
  phone: string;
  email: string;
  coverImage: string;
  isOpen: boolean;
  rating: number;
  reviewCount: number;
  isPremium: boolean;
  planType?: 'card_only' | 'card_website';
  websiteUuid?: string;
  products?: Product[];
  galleryImages?: GalleryImage[];
  reviews?: Review[];
  verified?: boolean;
  offers?: { title: string; code: string; discount: string }[];
  miniWebsiteConfig?: MiniWebsiteConfig;
  websiteUrl?: string;
}

export interface AnalyticsData {
  name: string;
  visits: number;
  clicks: number;
  favorites: number;
}

export interface Report {
  id: string;
  vendorName: string;
  vendorId: string;
  reason: 'Fraud' | 'Spam' | 'Incorrect Info';
  status: 'Pending' | 'Resolved' | 'Dismissed';
  reportedBy: string;
}

export interface User {
  id: string;
  name: string;
  email: string;
  phone?: string;
  avatar?: string;
  role?: string;
}

export type CardRequestStatus = 'PENDING' | 'APPROVED' | 'REJECTED';
export type CardRequestRejectionReason = 'INCOMPLETE_INFO' | 'DUPLICATE' | 'INAPPROPRIATE' | 'INVALID_BUSINESS' | 'OTHER';

export interface ContactCardRequest {
  id: string;
  requesterId: string;
  status: CardRequestStatus;
  rejectionReason?: CardRequestRejectionReason | null;
  rejectionNote?: string | null;
  reviewedBy?: string | null;
  reviewedAt?: string | null;
  planType: 'card_only' | 'card_website';
  fullName: string;
  phone: string;
  email?: string | null;
  businessName: string;
  category: string;
  city: string;
  address?: string | null;
  shortDescription?: string | null;
  fullDescription?: string | null;
  subscriptionPlan?: '1_year' | '2_year' | '3_year' | null;
  createdAt: string;
  updatedAt: string;
  requester?: { id: string; name: string; email: string; phone?: string; avatarUrl?: string };
}