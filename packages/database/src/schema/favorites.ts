import { pgTable, uuid, timestamp, uniqueIndex, varchar, jsonb } from 'drizzle-orm/pg-core';
import { users } from './users';

export const favorites = pgTable('favorites', {
    id: uuid('id').defaultRandom().primaryKey(),
    userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
    vendorId: varchar('vendor_id', { length: 255 }).notNull(),
    placeData: jsonb('place_data'), // Store GooglePlaceResponse or Mock Vendor
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => [
    uniqueIndex('idx_favorites_user_vendor').on(table.userId, table.vendorId),
]);

export type Favorite = typeof favorites.$inferSelect;
export type NewFavorite = typeof favorites.$inferInsert;
