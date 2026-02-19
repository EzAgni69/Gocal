import { pgTable, uuid, text, timestamp, index } from 'drizzle-orm/pg-core';
import { users } from './users';
import { vendors } from './vendors';
import { reportReasonEnum, reportStatusEnum } from './enums';

export const reports = pgTable('reports', {
    id: uuid('id').defaultRandom().primaryKey(),
    reporterId: uuid('reporter_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
    vendorId: uuid('vendor_id').notNull().references(() => vendors.id, { onDelete: 'cascade' }),
    reason: reportReasonEnum('reason').notNull(),
    comment: text('comment'),
    status: reportStatusEnum('status').notNull().default('PENDING'),
    resolvedBy: uuid('resolved_by').references(() => users.id, { onDelete: 'set null' }),
    resolutionNote: text('resolution_note'),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    resolvedAt: timestamp('resolved_at', { withTimezone: true }),
}, (table) => [
    index('idx_reports_vendor').on(table.vendorId),
    index('idx_reports_status').on(table.status),
    index('idx_reports_reporter').on(table.reporterId),
]);

export type Report = typeof reports.$inferSelect;
export type NewReport = typeof reports.$inferInsert;
