import { db, sql } from './index';

async function check() {
    try {
        console.log("Trying to enable postgis...");
        await db.execute(sql`CREATE EXTENSION IF NOT EXISTS postgis;`);
        console.log("Successfully enabled postgis!");
    } catch (e) {
        console.error("Failed to enable postgis:", e.message);
        
        try {
            console.log("\nTrying to enable earthdistance...");
            await db.execute(sql`CREATE EXTENSION IF NOT EXISTS cube;`);
            await db.execute(sql`CREATE EXTENSION IF NOT EXISTS earthdistance;`);
            console.log("Successfully enabled earthdistance!");
        } catch (e2) {
            console.error("Failed to enable earthdistance:", e2.message);
        }
    }
    process.exit(0);
}
check();
