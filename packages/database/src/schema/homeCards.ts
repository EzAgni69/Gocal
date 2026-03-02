import { pgTable, uuid, integer, boolean, timestamp, index } from 'drizzle-orm/pg-core';
import { vendors } from './vendors';

export const homeCards = pgTable('home_cards', {
    id: uuid('id').defaultRandom().primaryKey(),
    vendorId: uuid('vendor_id').notNull().references(() => vendors.id, { onDelete: 'cascade' }),
    displayOrder: integer('display_order').notNull().default(0),
    isActive: boolean('is_active').notNull().default(true),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
}, (table) => [
    index('idx_home_cards_vendor').on(table.vendorId),
    index('idx_home_cards_active').on(table.isActive),
    index('idx_home_cards_order').on(table.displayOrder),
]);

export type HomeCard = typeof homeCards.$inferSelect;
export type NewHomeCard = typeof homeCards.$inferInsert;
