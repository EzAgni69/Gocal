import { writeFileSync } from 'fs';

process.env.DATABASE_URL = 'postgresql://postgres:password@localhost:5434/vanij_db';

import { db } from './src/db';
import { contactCardRequests } from './src/schema/contactCardRequests';
import { users } from './src/schema/users';
import { eq } from 'drizzle-orm';

async function testInsert() {
    try {
        const [user] = await db.select().from(users).limit(1);
        if (!user) {
            writeFileSync('/Users/agni/Developer/Vanij/packages/database/db-test-error.txt', 'No users found to test with.');
            process.exit(0);
        }

        const [newRequest] = await db.insert(contactCardRequests).values({
            requesterId: user.id,
            planType: 'card_only',
            fullName: 'Test User',
            phone: '1234567890',
            businessName: 'Test Business',
            category: 'Other',
            city: 'Test City',
        }).returning();

        writeFileSync('/Users/agni/Developer/Vanij/packages/database/db-test-success.json', JSON.stringify(newRequest, null, 2));

        // Clean up
        await db.delete(contactCardRequests).where(eq(contactCardRequests.id, newRequest.id));
    } catch (e: any) {
        writeFileSync('/Users/agni/Developer/Vanij/packages/database/db-test-error.txt', String(e?.stack || e));
    }
    process.exit(0);
}

testInsert();
