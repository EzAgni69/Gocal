import { drizzle as drizzleHttp, NeonHttpDatabase } from 'drizzle-orm/neon-http';
import { drizzle as drizzlePg, PostgresJsDatabase } from 'drizzle-orm/postgres-js';
import { neon } from '@neondatabase/serverless';
import postgres from 'postgres';
import * as schema from './schema';

const connectionString = process.env.DATABASE_URL || process.env.POSTGRES_URL || 'postgresql://postgres:password@localhost:5434/vanij_db';

const isNeon = connectionString.includes('neon.tech');

/**
 * Stable Database Client Singleton
 */
const globalForDb = global as unknown as {
    db: any | undefined;
};

function createDb() {
    if (isNeon) {
        const client = neon(connectionString);
        return drizzleHttp(client, { schema });
    } else {
        const queryClient = postgres(connectionString, {
            max: process.env.DB_MAX_CONNECTIONS ? parseInt(process.env.DB_MAX_CONNECTIONS) : undefined,
            onnotice: () => { },
        });
        return drizzlePg(queryClient, { schema });
    }
}

export const db = (globalForDb.db as ReturnType<typeof createDb>) ?? createDb();

if (process.env.NODE_ENV !== 'production') {
    globalForDb.db = db;
}

// Export for migration scripts
export const migrationClient = isNeon ? null : postgres(connectionString, { max: 1 });

export type Database = ReturnType<typeof createDb>;
