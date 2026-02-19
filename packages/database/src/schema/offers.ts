import { pgTable, uuid, varchar, text, date, boolean, index } from 'drizzle-orm/pg-core';
import { vendors } from './vendors';

export const offers = pgTable('offers', {
    id: uuid('id').defaultRandom().primaryKey(),
    vendorId: uuid('vendor_id').notNull().references(() => vendors.id, { onDelete: 'cascade' }),
    title: varchar('title', { length: 255 }).notNull(),
    code: varchar('code', { length: 50 }),
    discount: varchar('discount', { length: 100 }).notNull(),
    validFrom: date('valid_from'),
    validUntil: date('valid_until'),
    isActive: boolean('is_active').notNull().default(true),
}, (table) => [
    index('idx_offers_vendor').on(table.vendorId),
]);

export type Offer = typeof offers.$inferSelect;
export type NewOffer = typeof offers.$inferInsert;
