import { db, contactCardRequests } from './src/db';
import { desc } from 'drizzle-orm';

async function verify() {
  try {
    const res = await db.select().from(contactCardRequests).limit(1);
    console.log('Query successful, table exists.', res);
    process.exit(0);
  } catch (err) {
    console.error('Table does not exist or query failed:', err);
    process.exit(1);
  }
}

verify();
