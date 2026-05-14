import { db, sql } from './index';

async function check() {
    try {
        const result = await db.execute(sql`SELECT extname FROM pg_extension WHERE extname = 'postgis'`) as any;
        if (result.length > 0) {
            console.log("PostGIS is installed!");
        } else {
            console.log("PostGIS is NOT installed.");
        }
        process.exit(0);
    } catch (e) {
        console.error("Error", e);
        process.exit(1);
    }
}
check();
