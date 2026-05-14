"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.favorites = void 0;
const pg_core_1 = require("drizzle-orm/pg-core");
const users_1 = require("./users");
exports.favorites = (0, pg_core_1.pgTable)('favorites', {
    id: (0, pg_core_1.uuid)('id').defaultRandom().primaryKey(),
    userId: (0, pg_core_1.uuid)('user_id').notNull().references(() => users_1.users.id, { onDelete: 'cascade' }),
    vendorId: (0, pg_core_1.varchar)('vendor_id', { length: 255 }).notNull(),
    placeData: (0, pg_core_1.jsonb)('place_data'), // Store GooglePlaceResponse or Mock Vendor
    createdAt: (0, pg_core_1.timestamp)('created_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => [
    (0, pg_core_1.uniqueIndex)('idx_favorites_user_vendor').on(table.userId, table.vendorId),
]);
