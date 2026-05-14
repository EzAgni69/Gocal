import { Pool } from "@neondatabase/serverless";
import * as schema from "./schema";
export declare const db: import("drizzle-orm/neon-serverless").NeonDatabase<typeof schema> & {
    $client: Pool;
};
export type Database = typeof db;
export declare const migrationClient: Pool;
