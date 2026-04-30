import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from './schema';

// Use a singleton pattern to prevent multiple connection pools being created
// msespecially important during Hot Module Replacement (HMR) in development
const connectionString = process.env.DATABASE_URL || 'postgresql://postgres:password@localhost:5434/vanij_db';

/**
 * Stable Database Client Singleton
 */
const globalForDb = global as unknown as {
    conn: postgres.Sql | undefined;
};

const queryClient = globalForDb.conn ?? postgres(connectionString, {
    max: process.env.DB_MAX_CONNECTIONS ? parseInt(process.env.DB_MAX_CONNECTIONS) : undefined,
    onnotice: () => { }, // Suppress notices for cleaner logs
});

if (process.env.NODE_ENV !== 'production') globalForDb.conn = queryClient;

export const db = drizzle(queryClient, { schema });

// Export for migration scripts that need the raw client (limited to 1 connection)
export const migrationClient = postgres(connectionString, { max: 1 });

export type Database = typeof db;
