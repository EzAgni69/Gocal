import { db } from './db';
import * as schema from './schema';
import { sql } from 'drizzle-orm';

async function viewData() {
    console.log('--- Database Summary ---');
    
    // List all tables from the schema
    const tables = Object.keys(schema).filter(key => key !== 'default');
    
    for (const tableName of tables) {
        try {
            // @ts-ignore - dynamic table access
            const table = (schema as any)[tableName];
            if (table && typeof table === 'object' && '_' in table) {
                const results = await db.select().from(table).limit(5);
                console.log(`\nTable: ${tableName} (${results.length} recent entries)`);
                if (results.length > 0) {
                    console.table(results);
                } else {
                    console.log(' (Empty)');
                }
            }
        } catch (e) {
            // Skip non-table exports
        }
    }
    
    process.exit(0);
}

viewData().catch(err => {
    console.error('Error viewing data:', err);
    process.exit(1);
});
