import * as schema from "./schema";
export declare const db: import("drizzle-orm/neon-http").NeonHttpDatabase<typeof schema> & {
    $client: import("@neondatabase/serverless").NeonQueryFunction<false, false>;
};
export type Database = typeof db;
export declare const migrationClient: null;
