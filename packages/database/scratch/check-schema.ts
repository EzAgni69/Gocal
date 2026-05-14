import { db } from '../src/db';
import { sql } from 'drizzle-orm';
import { writeFileSync } from 'fs';
import { resolve } from 'path';

async function checkSchema() {
    const outputPath = resolve(import.meta.dirname || '.', 'check-schema-result.txt');
    try {
        const result = await db.execute(sql`
            SELECT column_name 
            FROM information_schema.columns 
            WHERE table_name = 'contact_card_requests' 
            AND column_name = 'business_label'
        `);
        writeFileSync(outputPath, JSON.stringify(result, null, 2));
        console.log('Result:', JSON.stringify(result));
    } catch (e: any) {
        writeFileSync(outputPath, 'ERROR: ' + e.message + '\n' + e.stack);
        console.error('Error:', e.message);
    }
    process.exit(0);
}

checkSchema();
