import { drizzle } from "drizzle-orm/neon-serverless";
import { Pool, neonConfig } from "@neondatabase/serverless";
import ws from "ws";
import { config } from "dotenv";
import * as schema from "./schema";

// Load environment variables
config({ path: "../../apps/backend/.env" }); // Try monorepo path
config({ path: ".env" }); // Fallback

// Required for neon serverless pool in Node.js
neonConfig.webSocketConstructor = ws;

const connectionString = process.env.DATABASE_URL || process.env.POSTGRES_URL;

if (!connectionString) {
    throw new Error("DATABASE_URL is not set");
}

const pool = new Pool({ connectionString });
export const db = drizzle(pool, { schema });

export type Database = typeof db;
export const migrationClient = pool;
