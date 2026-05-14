import { drizzle } from "drizzle-orm/neon-http";
import { neon } from "@neondatabase/serverless";
import { config } from "dotenv";
import * as schema from "./schema";

// Load environment variables
config({ path: "../../apps/backend/.env" }); // Try monorepo path
config({ path: ".env" }); // Fallback

const connectionString = process.env.DATABASE_URL || process.env.POSTGRES_URL;

if (!connectionString) {
    throw new Error("DATABASE_URL is not set");
}

const sql = neon(connectionString);
export const db = drizzle(sql, { schema });

export type Database = typeof db;
export const migrationClient = null; // For compatibility with index.ts exports

