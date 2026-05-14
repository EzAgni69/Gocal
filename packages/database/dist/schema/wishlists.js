"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.wishlistItems = exports.wishlists = void 0;
const pg_core_1 = require("drizzle-orm/pg-core");
const users_1 = require("./users");
exports.wishlists = (0, pg_core_1.pgTable)('wishlists', {
    id: (0, pg_core_1.uuid)('id').defaultRandom().primaryKey(),
    userId: (0, pg_core_1.uuid)('user_id').notNull().references(() => users_1.users.id, { onDelete: 'cascade' }),
    name: (0, pg_core_1.varchar)('name', { length: 255 }).notNull().default('My Wishlist'),
    createdAt: (0, pg_core_1.timestamp)('created_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => [
    (0, pg_core_1.index)('idx_wishlists_user').on(table.userId),
]);
exports.wishlistItems = (0, pg_core_1.pgTable)('wishlist_items', {
    id: (0, pg_core_1.uuid)('id').defaultRandom().primaryKey(),
    wishlistId: (0, pg_core_1.uuid)('wishlist_id').notNull().references(() => exports.wishlists.id, { onDelete: 'cascade' }),
    productId: (0, pg_core_1.varchar)('product_id', { length: 255 }).notNull(),
    productData: (0, pg_core_1.jsonb)('product_data'), // Store Mock Product
    quantity: (0, pg_core_1.integer)('quantity').notNull().default(1),
    addedAt: (0, pg_core_1.timestamp)('added_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => [
    (0, pg_core_1.index)('idx_wishlist_items_wishlist').on(table.wishlistId),
]);
