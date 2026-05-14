"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.offers = void 0;
const pg_core_1 = require("drizzle-orm/pg-core");
const vendors_1 = require("./vendors");
exports.offers = (0, pg_core_1.pgTable)('offers', {
    id: (0, pg_core_1.uuid)('id').defaultRandom().primaryKey(),
    vendorId: (0, pg_core_1.uuid)('vendor_id').notNull().references(() => vendors_1.vendors.id, { onDelete: 'cascade' }),
    title: (0, pg_core_1.varchar)('title', { length: 255 }).notNull(),
    code: (0, pg_core_1.varchar)('code', { length: 50 }),
    discount: (0, pg_core_1.varchar)('discount', { length: 100 }).notNull(),
    validFrom: (0, pg_core_1.date)('valid_from'),
    validUntil: (0, pg_core_1.date)('valid_until'),
    isActive: (0, pg_core_1.boolean)('is_active').notNull().default(true),
}, (table) => [
    (0, pg_core_1.index)('idx_offers_vendor').on(table.vendorId),
]);
