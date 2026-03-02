import * as dotenv from 'dotenv';
dotenv.config({ path: '../../apps/backend/.env' });

import { db } from './src/db';
import { sql } from 'drizzle-orm';
import * as fs from 'fs';

async function check() {
    try {
        const res = await db.execute(sql`
            SELECT table_name 
            FROM information_schema.tables 
            WHERE table_schema = 'public';
        `);
        const tables = res.map(row => row.table_name).join(', ');
        fs.writeFileSync('tables-out.txt', 'Tables: ' + tables);
        
        // Also check if home_cards exists
        if (tables.includes('home_cards')) {
            const hc = await db.execute(sql`SELECT count(*) FROM home_cards`);
            fs.appendFileSync('tables-out.txt', '\nhome_cards count: ' + hc[0].count);
        } else {
            fs.appendFileSync('tables-out.txt', '\nhome_cards table DOES NOT EXIST.');
        }
        
        // Also check vendors count
        const v = await db.execute(sql`SELECT count(*) FROM vendors`);
        fs.appendFileSync('tables-out.txt', '\nvendors count: ' + v[0].count);
        fs.appendFileSync('tables-out.txt', '\nScript completed successfully.');
    } catch (e: any) {
        fs.writeFileSync('tables-out.txt', 'Error: ' + String(e) + '\nStack: ' + e.stack);
    }
    process.exit(0);
}

check().catch(console.error);
