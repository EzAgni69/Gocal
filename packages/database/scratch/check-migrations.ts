import { db } from '../src/db';
import { sql } from 'drizzle-orm';

async function run() {
    try {
        console.log("Checking columns in 'contact_card_requests'...");
        const columns: any = await db.execute(sql`
            SELECT column_name, data_type 
            FROM information_schema.columns 
            WHERE table_name = 'contact_card_requests';
        `);
        const colRows = columns.rows || columns;
        console.log("Columns found:", JSON.stringify(colRows, null, 2));

        console.log("\nChecking migrations in 'drizzle.__drizzle_migrations'...");
        const migrations: any = await db.execute(sql`
            SELECT id, hash, created_at 
            FROM drizzle.__drizzle_migrations;
        `);
        const migRows = migrations.rows || migrations;
        console.log("Migrations found in DB:", JSON.stringify(migRows, null, 2));
    } catch (e: any) {
        console.error("Error occurred:", e.message);
    }
    process.exit(0);
}

run();
