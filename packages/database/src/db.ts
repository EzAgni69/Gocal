import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from './schema';

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
    throw new Error(
        'DATABASE_URL environment variable is not set. ' +
        'Set it to your PostgreSQL connection string, e.g.: ' +
        'postgresql://user:pass@localhost:5432/vanij_db'
    );
}

// Connection pool for queries
const queryClient = postgres(connectionString);

// Drizzle ORM instance with schema for relational queries
export const db = drizzle(queryClient, { schema });

// Export for migration scripts that need the raw client
export const migrationClient = postgres(connectionString, { max: 1 });

export type Database = typeof db;
