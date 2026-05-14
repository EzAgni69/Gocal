"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.vendorTags = exports.tags = void 0;
const pg_core_1 = require("drizzle-orm/pg-core");
const vendors_1 = require("./vendors");
exports.tags = (0, pg_core_1.pgTable)('tags', {
    id: (0, pg_core_1.uuid)('id').defaultRandom().primaryKey(),
    name: (0, pg_core_1.varchar)('name', { length: 100 }).notNull().unique(),
    slug: (0, pg_core_1.varchar)('slug', { length: 100 }).notNull().unique(),
    createdAt: (0, pg_core_1.timestamp)('created_at', { withTimezone: true }).notNull().defaultNow(),
});
exports.vendorTags = (0, pg_core_1.pgTable)('vendor_tags', {
    vendorId: (0, pg_core_1.uuid)('vendor_id').notNull().references(() => vendors_1.vendors.id, { onDelete: 'cascade' }),
    tagId: (0, pg_core_1.uuid)('tag_id').notNull().references(() => exports.tags.id, { onDelete: 'cascade' }),
    createdAt: (0, pg_core_1.timestamp)('created_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => [
    (0, pg_core_1.primaryKey)({ columns: [table.vendorId, table.tagId] }),
    (0, pg_core_1.index)('idx_vendor_tags_vendor').on(table.vendorId),
    (0, pg_core_1.index)('idx_vendor_tags_tag').on(table.tagId),
]);
