"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.contactCardRequests = void 0;
const pg_core_1 = require("drizzle-orm/pg-core");
const users_1 = require("./users");
const enums_1 = require("./enums");
exports.contactCardRequests = (0, pg_core_1.pgTable)('contact_card_requests', {
    id: (0, pg_core_1.uuid)('id').defaultRandom().primaryKey(),
    requesterId: (0, pg_core_1.uuid)('requester_id').notNull().references(() => users_1.users.id, { onDelete: 'cascade' }),
    status: (0, enums_1.cardRequestStatusEnum)('status').notNull().default('PENDING'),
    rejectionReason: (0, enums_1.cardRequestRejectionReasonEnum)('rejection_reason'),
    rejectionNote: (0, pg_core_1.text)('rejection_note'),
    reviewedBy: (0, pg_core_1.uuid)('reviewed_by').references(() => users_1.users.id, { onDelete: 'set null' }),
    reviewedAt: (0, pg_core_1.timestamp)('reviewed_at', { withTimezone: true }),
    // Plan info
    planType: (0, pg_core_1.varchar)('plan_type', { length: 50 }).notNull(), // 'card_only' | 'card_website'
    // Personal details
    fullName: (0, pg_core_1.varchar)('full_name', { length: 255 }).notNull(),
    phone: (0, pg_core_1.varchar)('phone', { length: 20 }).notNull(),
    email: (0, pg_core_1.varchar)('email', { length: 255 }),
    // Business details
    businessName: (0, pg_core_1.varchar)('business_name', { length: 255 }).notNull(),
    category: (0, pg_core_1.varchar)('category', { length: 100 }).notNull(),
    city: (0, pg_core_1.varchar)('city', { length: 100 }).notNull(),
    address: (0, pg_core_1.text)('address'),
    shortDescription: (0, pg_core_1.varchar)('short_description', { length: 500 }),
    // Website details (only for card_website plan)
    fullDescription: (0, pg_core_1.text)('full_description'),
    subscriptionPlan: (0, pg_core_1.varchar)('subscription_plan', { length: 20 }), // '1_year', '2_year', '3_year'
    // Opening hours per day: { Mon: { open: "09:00", close: "21:00", closed?: false }, ... } or { Mon: { closed: true }, ... }
    openingHours: (0, pg_core_1.jsonb)('opening_hours').$type(),
    // Location extras
    pincode: (0, pg_core_1.varchar)('pincode', { length: 10 }),
    googleDirectionLink: (0, pg_core_1.text)('google_direction_link'),
    // Media uploads
    logoUrl: (0, pg_core_1.text)('logo_url'),
    mainPhotoUrl: (0, pg_core_1.text)('main_photo_url'),
    mainPhotoDescription: (0, pg_core_1.text)('main_photo_description'),
    galleryUrls: (0, pg_core_1.jsonb)('gallery_urls').$type(),
    // Optional initial product catalog (draft, ingested to products table on approval)
    draftProducts: (0, pg_core_1.jsonb)('draft_products').$type(),
    // Customizable Mini Website copy (optional, vendor-supplied)
    businessLabel: (0, pg_core_1.varchar)('business_label', { length: 100 }),
    tagline: (0, pg_core_1.varchar)('tagline', { length: 150 }),
    aboutDescription: (0, pg_core_1.text)('about_description'),
    // Payment QR code (optional, uploaded by vendor during request)
    qrCodeUrl: (0, pg_core_1.text)('qr_code_url'),
    createdAt: (0, pg_core_1.timestamp)('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: (0, pg_core_1.timestamp)('updated_at', { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
}, (table) => [
    (0, pg_core_1.index)('idx_card_requests_requester').on(table.requesterId),
    (0, pg_core_1.index)('idx_card_requests_status').on(table.status),
]);
