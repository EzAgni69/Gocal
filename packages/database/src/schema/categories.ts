import { pgTable, uuid, varchar, integer, jsonb } from 'drizzle-orm/pg-core';

/**
 * JSONB structure for display_config:
 * {
 *   requiresImage: boolean;
 *   showQuantity: boolean;
 *   showUnit: boolean;
 *   defaultUnit?: string;
 *   showMinOrder: boolean;
 *   showSku: boolean;
 *   showDescription: boolean;
 * }
 */
export const categories = pgTable('categories', {
    id: uuid('id').defaultRandom().primaryKey(),
    name: varchar('name', { length: 100 }).notNull().unique(),
    icon: varchar('icon', { length: 100 }),
    displayConfig: jsonb('display_config').notNull().default({}),
    sortOrder: integer('sort_order').notNull().default(0),
});

export type Category = typeof categories.$inferSelect;
export type NewCategory = typeof categories.$inferInsert;
