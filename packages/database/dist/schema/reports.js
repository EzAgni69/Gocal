"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.reports = void 0;
const pg_core_1 = require("drizzle-orm/pg-core");
const users_1 = require("./users");
const vendors_1 = require("./vendors");
const enums_1 = require("./enums");
exports.reports = (0, pg_core_1.pgTable)('reports', {
    id: (0, pg_core_1.uuid)('id').defaultRandom().primaryKey(),
    reporterId: (0, pg_core_1.uuid)('reporter_id').notNull().references(() => users_1.users.id, { onDelete: 'cascade' }),
    vendorId: (0, pg_core_1.uuid)('vendor_id').notNull().references(() => vendors_1.vendors.id, { onDelete: 'cascade' }),
    reason: (0, enums_1.reportReasonEnum)('reason').notNull(),
    comment: (0, pg_core_1.text)('comment'),
    status: (0, enums_1.reportStatusEnum)('status').notNull().default('PENDING'),
    resolvedBy: (0, pg_core_1.uuid)('resolved_by').references(() => users_1.users.id, { onDelete: 'set null' }),
    resolutionNote: (0, pg_core_1.text)('resolution_note'),
    createdAt: (0, pg_core_1.timestamp)('created_at', { withTimezone: true }).notNull().defaultNow(),
    resolvedAt: (0, pg_core_1.timestamp)('resolved_at', { withTimezone: true }),
}, (table) => [
    (0, pg_core_1.index)('idx_reports_vendor').on(table.vendorId),
    (0, pg_core_1.index)('idx_reports_status').on(table.status),
    (0, pg_core_1.index)('idx_reports_reporter').on(table.reporterId),
]);
