import { pgTable, uuid, varchar, text, timestamp, index } from 'drizzle-orm/pg-core';
import { users } from './users';
import { cardRequestStatusEnum, cardRequestRejectionReasonEnum } from './enums';

export const contactCardRequests = pgTable('contact_card_requests', {
    id: uuid('id').defaultRandom().primaryKey(),
    requesterId: uuid('requester_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
    status: cardRequestStatusEnum('status').notNull().default('PENDING'),
    rejectionReason: cardRequestRejectionReasonEnum('rejection_reason'),
    rejectionNote: text('rejection_note'),
    reviewedBy: uuid('reviewed_by').references(() => users.id, { onDelete: 'set null' }),
    reviewedAt: timestamp('reviewed_at', { withTimezone: true }),

    // Plan info
    planType: varchar('plan_type', { length: 50 }).notNull(), // 'card_only' | 'card_website'

    // Personal details
    fullName: varchar('full_name', { length: 255 }).notNull(),
    phone: varchar('phone', { length: 20 }).notNull(),
    email: varchar('email', { length: 255 }),

    // Business details
    businessName: varchar('business_name', { length: 255 }).notNull(),
    category: varchar('category', { length: 100 }).notNull(),
    city: varchar('city', { length: 100 }).notNull(),
    address: text('address'),
    shortDescription: varchar('short_description', { length: 500 }),

    // Website details (only for card_website plan)
    fullDescription: text('full_description'),
    subscriptionPlan: varchar('subscription_plan', { length: 20 }), // '1_year', '2_year', '3_year'

    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
}, (table) => [
    index('idx_card_requests_requester').on(table.requesterId),
    index('idx_card_requests_status').on(table.status),
]);

export type ContactCardRequest = typeof contactCardRequests.$inferSelect;
export type NewContactCardRequest = typeof contactCardRequests.$inferInsert;
