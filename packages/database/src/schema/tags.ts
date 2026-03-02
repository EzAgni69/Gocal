import { pgTable, uuid, varchar, timestamp, index, primaryKey } from 'drizzle-orm/pg-core';
import { vendors } from './vendors';

export const tags = pgTable('tags', {
    id: uuid('id').defaultRandom().primaryKey(),
    name: varchar('name', { length: 100 }).notNull().unique(),
    slug: varchar('slug', { length: 100 }).notNull().unique(),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
});

export const vendorTags = pgTable('vendor_tags', {
    vendorId: uuid('vendor_id').notNull().references(() => vendors.id, { onDelete: 'cascade' }),
    tagId: uuid('tag_id').notNull().references(() => tags.id, { onDelete: 'cascade' }),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => [
    primaryKey({ columns: [table.vendorId, table.tagId] }),
    index('idx_vendor_tags_vendor').on(table.vendorId),
    index('idx_vendor_tags_tag').on(table.tagId),
]);

export type Tag = typeof tags.$inferSelect;
export type NewTag = typeof tags.$inferInsert;
export type VendorTag = typeof vendorTags.$inferSelect;
export type NewVendorTag = typeof vendorTags.$inferInsert;
