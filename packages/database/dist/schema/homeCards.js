"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.homeCards = void 0;
const pg_core_1 = require("drizzle-orm/pg-core");
const vendors_1 = require("./vendors");
exports.homeCards = (0, pg_core_1.pgTable)('home_cards', {
    id: (0, pg_core_1.uuid)('id').defaultRandom().primaryKey(),
    vendorId: (0, pg_core_1.uuid)('vendor_id').notNull().references(() => vendors_1.vendors.id, { onDelete: 'cascade' }),
    displayOrder: (0, pg_core_1.integer)('display_order').notNull().default(0),
    isActive: (0, pg_core_1.boolean)('is_active').notNull().default(true),
    createdAt: (0, pg_core_1.timestamp)('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: (0, pg_core_1.timestamp)('updated_at', { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
}, (table) => [
    (0, pg_core_1.index)('idx_home_cards_vendor').on(table.vendorId),
    (0, pg_core_1.index)('idx_home_cards_active').on(table.isActive),
    (0, pg_core_1.index)('idx_home_cards_order').on(table.displayOrder),
]);
