import { pgTable, uuid, varchar, text, decimal, boolean, integer, timestamp, index } from 'drizzle-orm/pg-core';
import { vendors } from './vendors';

export const products = pgTable('products', {
    id: uuid('id').defaultRandom().primaryKey(),
    vendorId: uuid('vendor_id').notNull().references(() => vendors.id, { onDelete: 'cascade' }),
    name: varchar('name', { length: 255 }).notNull(),
    description: text('description'),
    price: decimal('price', { precision: 12, scale: 2 }).notNull(),
    imageUrl: text('image_url'),
    category: varchar('category', { length: 100 }),
    quantity: decimal('quantity', { precision: 10, scale: 2 }),
    unit: varchar('unit', { length: 20 }),
    minOrderQty: decimal('min_order_qty', { precision: 10, scale: 2 }),
    inStock: boolean('in_stock').notNull().default(true),
    sku: varchar('sku', { length: 100 }),
    sortOrder: integer('sort_order').notNull().default(0),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => [
    index('idx_products_vendor').on(table.vendorId),
    index('idx_products_category').on(table.category),
]);

export type Product = typeof products.$inferSelect;
export type NewProduct = typeof products.$inferInsert;
