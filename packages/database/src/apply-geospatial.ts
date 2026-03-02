import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import { sql } from 'drizzle-orm';
import * as schema from './schema';
import dotenv from 'dotenv';
dotenv.config();

const connectionString = process.env.DATABASE_URL || 'postgresql://postgres:password@localhost:5434/vanij_db';

const migrationClient = postgres(connectionString, { max: 1 });
const db = drizzle(migrationClient, { schema });

async function applyGeospatial() {
    try {
        console.log("Applying Earthdistance Extensions...");
        await db.execute(sql`CREATE EXTENSION IF NOT EXISTS cube;`);
        await db.execute(sql`CREATE EXTENSION IF NOT EXISTS earthdistance;`);
        
        console.log("Extensions applied successfully.");

        console.log("Creating GiST index on vendors for location queries...");
        // Casting longitude and latitude on the fly for the index.
        await db.execute(sql`
            CREATE INDEX IF NOT EXISTS idx_vendors_location 
            ON vendors USING gist (ll_to_earth(CAST(latitude AS DOUBLE PRECISION), CAST(longitude AS DOUBLE PRECISION)));
        `);
        console.log("Index idx_vendors_location created successfully.");
        
        process.exit(0);
    } catch (e) {
        console.error("Failed to apply geospatial setups:", e);
        process.exit(1);
    }
}

applyGeospatial(); 
