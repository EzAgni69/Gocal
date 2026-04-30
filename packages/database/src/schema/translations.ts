import { pgTable, text, timestamp, varchar } from 'drizzle-orm/pg-core';
import { createId } from '@paralleldrive/cuid2';

export const translations = pgTable('translations', {
    id: varchar('id', { length: 128 }).primaryKey().$defaultFn(() => createId()),
    sourceHash: varchar('source_hash', { length: 255 }).notNull(),
    sourceText: text('source_text').notNull(),
    targetLang: varchar('target_lang', { length: 10 }).notNull(),
    translatedText: text('translated_text').notNull(),
    createdAt: timestamp('created_at').defaultNow().notNull(),
});
