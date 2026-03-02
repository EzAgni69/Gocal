import { pgTable, uuid, varchar, integer, timestamp, index, jsonb } from 'drizzle-orm/pg-core';
import { users } from './users';

export const wishlists = pgTable('wishlists', {
    id: uuid('id').defaultRandom().primaryKey(),
    userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
    name: varchar('name', { length: 255 }).notNull().default('My Wishlist'),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => [
    index('idx_wishlists_user').on(table.userId),
]);

export const wishlistItems = pgTable('wishlist_items', {
    id: uuid('id').defaultRandom().primaryKey(),
    wishlistId: uuid('wishlist_id').notNull().references(() => wishlists.id, { onDelete: 'cascade' }),
    productId: varchar('product_id', { length: 255 }).notNull(),
    productData: jsonb('product_data'), // Store Mock Product
    quantity: integer('quantity').notNull().default(1),
    addedAt: timestamp('added_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => [
    index('idx_wishlist_items_wishlist').on(table.wishlistId),
]);

export type Wishlist = typeof wishlists.$inferSelect;
export type NewWishlist = typeof wishlists.$inferInsert;
export type WishlistItem = typeof wishlistItems.$inferSelect;
export type NewWishlistItem = typeof wishlistItems.$inferInsert;
