import postgres from 'postgres';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../../../apps/backend/.env') });

const connectionString = process.env.DATABASE_URL || 'postgresql://postgres:password@localhost:5434/vanij_db';

console.log('Connecting to:', connectionString.replace(/:[^:@]+@/, ':****@'));

const sql = postgres(connectionString);

async function test() {
  try {
    const result = await sql`SELECT column_name, is_nullable, column_default FROM information_schema.columns WHERE table_name = 'users'`;
    console.log('Columns in users:');
    console.table(result);
  } catch (err) {
    console.error('Connection failed:', err);
  } finally {
    await sql.end();
    process.exit(0);
  }
}

test();
