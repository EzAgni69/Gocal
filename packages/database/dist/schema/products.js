"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.products = void 0;
const pg_core_1 = require("drizzle-orm/pg-core");
const vendors_1 = require("./vendors");
exports.products = (0, pg_core_1.pgTable)('products', {
    id: (0, pg_core_1.uuid)('id').defaultRandom().primaryKey(),
    vendorId: (0, pg_core_1.uuid)('vendor_id').notNull().references(() => vendors_1.vendors.id, { onDelete: 'cascade' }),
    name: (0, pg_core_1.varchar)('name', { length: 255 }).notNull(),
    description: (0, pg_core_1.text)('description'),
    price: (0, pg_core_1.decimal)('price', { precision: 12, scale: 2 }).notNull(),
    imageUrl: (0, pg_core_1.text)('image_url'),
    category: (0, pg_core_1.varchar)('category', { length: 100 }),
    quantity: (0, pg_core_1.decimal)('quantity', { precision: 10, scale: 2 }),
    unit: (0, pg_core_1.varchar)('unit', { length: 20 }),
    minOrderQty: (0, pg_core_1.decimal)('min_order_qty', { precision: 10, scale: 2 }),
    inStock: (0, pg_core_1.boolean)('in_stock').notNull().default(true),
    sku: (0, pg_core_1.varchar)('sku', { length: 100 }),
    sortOrder: (0, pg_core_1.integer)('sort_order').notNull().default(0),
    createdAt: (0, pg_core_1.timestamp)('created_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => [
    (0, pg_core_1.index)('idx_products_vendor').on(table.vendorId),
    (0, pg_core_1.index)('idx_products_category').on(table.category),
]);
