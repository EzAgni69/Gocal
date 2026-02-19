export enum UserRole {
  CONSUMER = 'CONSUMER',
  VENDOR = 'VENDOR',
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
  websiteUuid?: string;
  products?: Product[];
  gallery?: string[];
  reviews?: Review[];
  verified?: boolean;
  offers?: { title: string; code: string; discount: string }[];
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
}