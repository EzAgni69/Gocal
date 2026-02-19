// Database package - vanij.co
export { db, migrationClient } from './db';
export type { Database } from './db';
export * from './schema';

// Re-export drizzle-orm operators to avoid duplicate package issues
export { eq, ne, gt, gte, lt, lte, and, or, not, ilike, like, sql, asc, desc, inArray, isNull, isNotNull } from 'drizzle-orm';

