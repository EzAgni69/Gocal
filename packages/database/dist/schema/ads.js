"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ads = void 0;
const pg_core_1 = require("drizzle-orm/pg-core");
const vendors_1 = require("./vendors");
const enums_1 = require("./enums");
exports.ads = (0, pg_core_1.pgTable)('ads', {
    id: (0, pg_core_1.uuid)('id').defaultRandom().primaryKey(),
    vendorId: (0, pg_core_1.uuid)('vendor_id').references(() => vendors_1.vendors.id, { onDelete: 'set null' }),
    title: (0, pg_core_1.varchar)('title', { length: 255 }).notNull(),
    content: (0, pg_core_1.text)('content'),
    imageUrl: (0, pg_core_1.text)('image_url'),
    targetUrl: (0, pg_core_1.text)('target_url'),
    type: (0, enums_1.adTypeEnum)('type').notNull().default('SYSTEM'),
    isActive: (0, pg_core_1.boolean)('is_active').notNull().default(true),
    startsAt: (0, pg_core_1.timestamp)('starts_at', { withTimezone: true }),
    endsAt: (0, pg_core_1.timestamp)('ends_at', { withTimezone: true }),
    createdAt: (0, pg_core_1.timestamp)('created_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => [
    (0, pg_core_1.index)('idx_ads_type').on(table.type),
    (0, pg_core_1.index)('idx_ads_active').on(table.isActive),
]);
