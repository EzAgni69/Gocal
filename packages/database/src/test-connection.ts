/**
 * Test script to verify database connection and PostGIS support.
 * Run with: npx tsx src/test-connection.ts
 */
import dotenv from 'dotenv';

// Load env from backend
dotenv.config({ path: '../../apps/backend/.env' });

import { db } from './db';
import { sql } from 'drizzle-orm';

async function testConnection() {
    console.log('🔌 Testing database connection...\n');

    try {
        // Test basic connectivity
        const result: any = await db.execute(sql`SELECT NOW() as current_time, version() as pg_version`);
        console.log('✅ Connected to PostgreSQL');
        const rows = result.rows || result;
        console.log(`   Time: ${rows[0]?.current_time}`);
        console.log(`   Version: ${rows[0]?.pg_version?.split(' ').slice(0, 2).join(' ')}\n`);

        // Test PostGIS
        try {
            const postgis: any = await db.execute(sql`SELECT PostGIS_Version() as postgis_version`);
            const postgisRows = postgis.rows || postgis;
            console.log(`✅ PostGIS enabled: v${postgisRows[0]?.postgis_version}`);
        } catch {
            console.log('⚠️  PostGIS not enabled. Run: CREATE EXTENSION IF NOT EXISTS postgis;');
        }

        // List existing tables
        const tablesResult: any = await db.execute(sql`
            SELECT table_name FROM information_schema.tables
            WHERE table_schema = 'public'
            ORDER BY table_name
        `);
        const tables = tablesResult.rows || tablesResult;
        console.log(`\n📋 Tables in database: ${tables.length}`);
        tables.forEach((t: any) => console.log(`   - ${t.table_name}`));

        console.log('\n✅ Database connection test passed!');
    } catch (error: any) {
        console.error('❌ Connection failed:', error.message);
        console.error('\n💡 Make sure PostgreSQL is running and DATABASE_URL is set correctly:');
        console.error('   DATABASE_URL=postgresql://user:pass@localhost:5432/vanij_db');
    }

    process.exit(0);
}

testConnection();
