import { db } from '../packages/database/src/db';
import { users } from '../packages/database/src/schema/users';
import { eq } from 'drizzle-orm';

async function checkUser() {
  const email = 'imgocal@gmail.com';
  const user = await db.select().from(users).where(eq(users.email, email));
  console.log('User found:', JSON.stringify(user, null, 2));
  process.exit(0);
}

checkUser().catch(console.error);
