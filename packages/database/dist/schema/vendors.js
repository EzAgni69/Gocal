"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.vendors = void 0;
const pg_core_1 = require("drizzle-orm/pg-core");
const users_1 = require("./users");
const categories_1 = require("./categories");
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
exports.vendors = (0, pg_core_1.pgTable)('vendors', {
    id: (0, pg_core_1.uuid)('id').defaultRandom().primaryKey(),
    ownerId: (0, pg_core_1.uuid)('owner_id').notNull().references(() => users_1.users.id, { onDelete: 'cascade' }),
    name: (0, pg_core_1.varchar)('name', { length: 255 }).notNull(),
    slug: (0, pg_core_1.varchar)('slug', { length: 255 }).notNull().unique(),
    description: (0, pg_core_1.text)('description'),
    shortDescription: (0, pg_core_1.varchar)('short_description', { length: 500 }),
    categoryId: (0, pg_core_1.uuid)('category_id').references(() => categories_1.categories.id, { onDelete: 'set null' }),
    city: (0, pg_core_1.varchar)('city', { length: 100 }).notNull(),
    address: (0, pg_core_1.text)('address').notNull(),
    phone: (0, pg_core_1.varchar)('phone', { length: 20 }),
    email: (0, pg_core_1.varchar)('email', { length: 255 }),
    coverImageUrl: (0, pg_core_1.text)('cover_image_url'),
    websiteUuid: (0, pg_core_1.uuid)('website_uuid').defaultRandom().unique(),
    isOpen: (0, pg_core_1.boolean)('is_open').notNull().default(true),
    isPremium: (0, pg_core_1.boolean)('is_premium').notNull().default(false),
    planType: (0, pg_core_1.varchar)('plan_type', { length: 50 }).notNull().default('card_website'),
    isVerified: (0, pg_core_1.boolean)('is_verified').notNull().default(false),
    rating: (0, pg_core_1.decimal)('rating', { precision: 2, scale: 1 }).notNull().default('0.0'),
    reviewCount: (0, pg_core_1.decimal)('review_count', { precision: 10, scale: 0 }).notNull().default('0'),
    // Opening hours per day: { Mon: { open: "09:00", close: "21:00", closed?: false }, ... } or { Mon: { closed: true }, ... }
    openingHours: (0, pg_core_1.jsonb)('opening_hours').$type(),
    miniWebsiteConfig: (0, pg_core_1.jsonb)('mini_website_config').notNull().default({}),
    websiteUrl: (0, pg_core_1.text)('website_url'),
    // PostGIS: stored as longitude, latitude (SRID 4326)
    // Use raw SQL for geography type since Drizzle doesn't natively support PostGIS
    longitude: (0, pg_core_1.decimal)('longitude', { precision: 11, scale: 8 }),
    latitude: (0, pg_core_1.decimal)('latitude', { precision: 10, scale: 8 }),
    googlePlaceId: (0, pg_core_1.varchar)('google_place_id', { length: 255 }),
    createdAt: (0, pg_core_1.timestamp)('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: (0, pg_core_1.timestamp)('updated_at', { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
    deletedAt: (0, pg_core_1.timestamp)('deleted_at', { withTimezone: true }),
}, (table) => [
    (0, pg_core_1.index)('idx_vendors_city').on(table.city),
    (0, pg_core_1.index)('idx_vendors_category').on(table.categoryId),
    (0, pg_core_1.index)('idx_vendors_owner').on(table.ownerId),
    (0, pg_core_1.index)('idx_vendors_google_place').on(table.googlePlaceId),
]);
