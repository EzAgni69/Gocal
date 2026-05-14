"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.categories = void 0;
const pg_core_1 = require("drizzle-orm/pg-core");
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
exports.categories = (0, pg_core_1.pgTable)('categories', {
    id: (0, pg_core_1.uuid)('id').defaultRandom().primaryKey(),
    name: (0, pg_core_1.varchar)('name', { length: 100 }).notNull().unique(),
    icon: (0, pg_core_1.varchar)('icon', { length: 100 }),
    displayConfig: (0, pg_core_1.jsonb)('display_config').notNull().default({}),
    sortOrder: (0, pg_core_1.integer)('sort_order').notNull().default(0),
});
