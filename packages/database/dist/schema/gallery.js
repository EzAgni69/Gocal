"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.galleryImages = void 0;
const pg_core_1 = require("drizzle-orm/pg-core");
const vendors_1 = require("./vendors");
exports.galleryImages = (0, pg_core_1.pgTable)('gallery_images', {
    id: (0, pg_core_1.uuid)('id').defaultRandom().primaryKey(),
    vendorId: (0, pg_core_1.uuid)('vendor_id').notNull().references(() => vendors_1.vendors.id, { onDelete: 'cascade' }),
    imageUrl: (0, pg_core_1.text)('image_url').notNull(),
    caption: (0, pg_core_1.varchar)('caption', { length: 255 }),
    sortOrder: (0, pg_core_1.integer)('sort_order').notNull().default(0),
    createdAt: (0, pg_core_1.timestamp)('created_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => [
    (0, pg_core_1.index)('idx_gallery_vendor').on(table.vendorId),
]);
