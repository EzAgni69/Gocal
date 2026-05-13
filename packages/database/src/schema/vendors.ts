import { pgTable, uuid, varchar, text, boolean, decimal, jsonb, timestamp, index } from 'drizzle-orm/pg-core';
import { sql } from 'drizzle-orm';
import { users } from './users';
import { categories } from './categories';

/**
 * JSONB structure for mini_website_config:
 * {
 *   socialLinks?: { whatsapp?: string; instagram?: string; facebook?: string; youtube?: string; twitter?: string; linkedin?: string; tiktok?: string };
 *   googleMapsUrl?: string;
 *   customSections?: Array<{ title: string; content: string }>;
 *   theme?: { 
 *     primaryColor?: string; 
 *     accentColor?: string; 
 *     backgroundColor?: string;
 *     fontFamily?: string;
 *     buttonStyle?: 'solid' | 'outline' | 'rounded' | 'sharp';
 *     cardLayout?: 'compact' | 'split' | 'expanded';
 *     cardTheme?: 'minimal' | 'elegant' | 'bold';
 *   };
 *   businessLabel?: string;
 *   tagline?: string;
 *   aboutDescription?: string;
 *   qrCodeUrl?: string;  // URL of the vendor's payment QR code image (e.g. UPI, PhonePe, Google Pay)
 * }
 */
export const vendors = pgTable('vendors', {
    id: uuid('id').defaultRandom().primaryKey(),
    ownerId: uuid('owner_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
    name: varchar('name', { length: 255 }).notNull(),
    slug: varchar('slug', { length: 255 }).notNull().unique(),
    description: text('description'),
    shortDescription: varchar('short_description', { length: 500 }),
    categoryId: uuid('category_id').references(() => categories.id, { onDelete: 'set null' }),
    city: varchar('city', { length: 100 }).notNull(),
    address: text('address').notNull(),
    phone: varchar('phone', { length: 20 }),
    email: varchar('email', { length: 255 }),
    coverImageUrl: text('cover_image_url'),
    websiteUuid: uuid('website_uuid').defaultRandom().unique(),
    isOpen: boolean('is_open').notNull().default(true),
    isPremium: boolean('is_premium').notNull().default(false),
    planType: varchar('plan_type', { length: 50 }).notNull().default('card_website'),
    isVerified: boolean('is_verified').notNull().default(false),
    rating: decimal('rating', { precision: 2, scale: 1 }).notNull().default('0.0'),
    reviewCount: decimal('review_count', { precision: 10, scale: 0 }).notNull().default('0'),
    // Opening hours per day: { Mon: { open: "09:00", close: "21:00", closed?: false }, ... } or { Mon: { closed: true }, ... }
    openingHours: jsonb('opening_hours').$type<{
        [day: string]: { open: string; close: string; closed?: boolean } | { closed: true };
    }>(),
    miniWebsiteConfig: jsonb('mini_website_config').notNull().default({}),
    websiteUrl: text('website_url'),
    // PostGIS: stored as longitude, latitude (SRID 4326)
    // Use raw SQL for geography type since Drizzle doesn't natively support PostGIS
    longitude: decimal('longitude', { precision: 11, scale: 8 }),
    latitude: decimal('latitude', { precision: 10, scale: 8 }),
    googlePlaceId: varchar('google_place_id', { length: 255 }),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
    deletedAt: timestamp('deleted_at', { withTimezone: true }),
}, (table) => [
    index('idx_vendors_city').on(table.city),
    index('idx_vendors_category').on(table.categoryId),
    index('idx_vendors_owner').on(table.ownerId),
    index('idx_vendors_google_place').on(table.googlePlaceId),
]);

export type Vendor = typeof vendors.$inferSelect;
export type NewVendor = typeof vendors.$inferInsert;
