"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.users = void 0;
const pg_core_1 = require("drizzle-orm/pg-core");
const enums_1 = require("./enums");
exports.users = (0, pg_core_1.pgTable)('users', {
    id: (0, pg_core_1.uuid)('id').defaultRandom().primaryKey(),
    email: (0, pg_core_1.varchar)('email', { length: 255 }).notNull().unique(),
    firebaseUid: (0, pg_core_1.varchar)('firebase_uid', { length: 128 }).unique(),
    name: (0, pg_core_1.varchar)('name', { length: 255 }).notNull(),
    phone: (0, pg_core_1.varchar)('phone', { length: 20 }),
    avatarUrl: (0, pg_core_1.text)('avatar_url'),
    role: (0, enums_1.userRoleEnum)('role').notNull().default('CONSUMER'),
    preferredLanguage: (0, enums_1.languageEnum)('preferred_language').notNull().default('en'),
    isActive: (0, pg_core_1.boolean)('is_active').notNull().default(true),
    createdAt: (0, pg_core_1.timestamp)('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: (0, pg_core_1.timestamp)('updated_at', { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
});
