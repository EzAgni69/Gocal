import { db } from './db';
import { users } from './schema/users';
import { eq } from 'drizzle-orm';

async function main() {
  const email = 'mehtanishant1030@gmail.com';
  console.log(`Updating role for ${email} to SUPER_ADMIN...`);
  
  try {
    const updatedUsers = await db.update(users)
      .set({ role: 'SUPER_ADMIN' })
      .where(eq(users.email, email))
      .returning();
      
    if (updatedUsers.length > 0) {
      console.log('Successfully updated user:', updatedUsers[0].email, 'New Role:', updatedUsers[0].role);
    } else {
      console.log('User not found with email:', email);
    }
  } catch (error) {
    console.error('Error updating user:', error);
  }
  
  process.exit(0);
}

main();
