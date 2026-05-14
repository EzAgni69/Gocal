"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.reviews = void 0;
const pg_core_1 = require("drizzle-orm/pg-core");
const drizzle_orm_1 = require("drizzle-orm");
const users_1 = require("./users");
const vendors_1 = require("./vendors");
exports.reviews = (0, pg_core_1.pgTable)('reviews', {
    id: (0, pg_core_1.uuid)('id').defaultRandom().primaryKey(),
    userId: (0, pg_core_1.uuid)('user_id').notNull().references(() => users_1.users.id, { onDelete: 'cascade' }),
    vendorId: (0, pg_core_1.uuid)('vendor_id').notNull().references(() => vendors_1.vendors.id, { onDelete: 'cascade' }),
    rating: (0, pg_core_1.integer)('rating').notNull(),
    comment: (0, pg_core_1.text)('comment'),
    createdAt: (0, pg_core_1.timestamp)('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: (0, pg_core_1.timestamp)('updated_at', { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
}, (table) => [
    (0, pg_core_1.uniqueIndex)('idx_reviews_user_vendor').on(table.userId, table.vendorId),
    (0, pg_core_1.index)('idx_reviews_vendor').on(table.vendorId),
    (0, pg_core_1.index)('idx_reviews_user').on(table.userId),
    (0, pg_core_1.check)('rating_check', (0, drizzle_orm_1.sql) `${table.rating} >= 1 AND ${table.rating} <= 5`),
]);
