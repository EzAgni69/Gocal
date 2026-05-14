import postgres from 'postgres';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../../../apps/backend/.env') });

const connectionString = process.env.DATABASE_URL || 'postgresql://postgres:password@localhost:5434/vanij_db';

console.log('Connecting to:', connectionString.replace(/:[^:@]+@/, ':****@'));

const sql = postgres(connectionString);

async function test() {
  try {
    const result = await sql`SELECT table_name FROM information_schema.tables WHERE table_schema = 'public'`;
    console.log('Tables found:');
    console.table(result);
  } catch (err) {
    console.error('Connection failed:', err);
  } finally {
    await sql.end();
    process.exit(0);
  }
}

test();
