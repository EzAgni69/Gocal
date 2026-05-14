"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.translations = void 0;
const pg_core_1 = require("drizzle-orm/pg-core");
const cuid2_1 = require("@paralleldrive/cuid2");
exports.translations = (0, pg_core_1.pgTable)('translations', {
    id: (0, pg_core_1.varchar)('id', { length: 128 }).primaryKey().$defaultFn(() => (0, cuid2_1.createId)()),
    sourceHash: (0, pg_core_1.varchar)('source_hash', { length: 255 }).notNull(),
    sourceText: (0, pg_core_1.text)('source_text').notNull(),
    targetLang: (0, pg_core_1.varchar)('target_lang', { length: 10 }).notNull(),
    translatedText: (0, pg_core_1.text)('translated_text').notNull(),
    createdAt: (0, pg_core_1.timestamp)('created_at').defaultNow().notNull(),
});
