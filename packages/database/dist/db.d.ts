import { NeonHttpDatabase } from 'drizzle-orm/neon-http';
import { PostgresJsDatabase } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from './schema';
declare function createDb(): (PostgresJsDatabase<typeof schema> & {
    $client: postgres.Sql<{}>;
}) | (NeonHttpDatabase<typeof schema> & {
    $client: import("@neondatabase/serverless").NeonQueryFunction<false, false>;
});
export declare const db: (PostgresJsDatabase<typeof schema> & {
    $client: postgres.Sql<{}>;
}) | (NeonHttpDatabase<typeof schema> & {
    $client: import("@neondatabase/serverless").NeonQueryFunction<false, false>;
});
export declare const migrationClient: postgres.Sql<{}> | null;
export type Database = ReturnType<typeof createDb>;
export {};
