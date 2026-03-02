import { db, sql } from './index';

async function testDistance() {
    try {
        console.log("Testing earth_distance execution...");
        const result = await db.execute(sql`
            SELECT 
                id, 
                name, 
                latitude, 
                longitude,
                earth_distance(
                    ll_to_earth(CAST(latitude AS DOUBLE PRECISION), CAST(longitude AS DOUBLE PRECISION)),
                    ll_to_earth(22.3072, 73.1812)
                ) as test_distance
            FROM vendors
            WHERE latitude IS NOT NULL 
              AND longitude IS NOT NULL
            LIMIT 5;
        `);
        console.dir(result, { depth: null });
        process.exit(0);
    } catch(e) {
        console.error("Test failed", e);
        process.exit(1);
    }
}
testDistance();
