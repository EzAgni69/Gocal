import { pgTable, uuid, varchar, text, boolean, timestamp, index } from 'drizzle-orm/pg-core';
import { vendors } from './vendors';
import { adTypeEnum } from './enums';

export const ads = pgTable('ads', {
    id: uuid('id').defaultRandom().primaryKey(),
    vendorId: uuid('vendor_id').references(() => vendors.id, { onDelete: 'set null' }),
    title: varchar('title', { length: 255 }).notNull(),
    content: text('content'),
    imageUrl: text('image_url'),
    targetUrl: text('target_url'),
    type: adTypeEnum('type').notNull().default('SYSTEM'),
    isActive: boolean('is_active').notNull().default(true),
    startsAt: timestamp('starts_at', { withTimezone: true }),
    endsAt: timestamp('ends_at', { withTimezone: true }),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => [
    index('idx_ads_type').on(table.type),
    index('idx_ads_active').on(table.isActive),
]);

export type Ad = typeof ads.$inferSelect;
export type NewAd = typeof ads.$inferInsert;
