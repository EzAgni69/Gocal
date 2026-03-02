import * as dotenv from 'dotenv';
dotenv.config({ path: '../../apps/backend/.env' });

import { db } from './db';
import { vendors, homeCards } from './schema';

async function seed() {
    console.log("Locating owner user...");
    let user = await db.query.users.findFirst();
    if (!user) {
        console.log("No users found. Creating a dummy user just for the sake of the mock vendors...");
        const [newUser] = await db.insert(require('./schema').users).values({
            email: "dummy_admin_seed@example.com",
            role: "SUPER_ADMIN",
            name: "Dummy System Admin",
            firebaseUid: "dummy-firebase-uid-seed"
        }).returning();
        user = newUser;
    }

    console.log("Inserting vendors...");
    try {
        const [v1] = await db.insert(vendors).values({
            ownerId: user!.id,
            name: "Electrician - Harshil Solanki",
            slug: "electrician-harshil-solanki-test",
            city: "Vadodara",
            address: "Pin Code: 391760, Vadodara",
            coverImageUrl: "/elc.jpg"
        }).returning();

        const [v2] = await db.insert(vendors).values({
            ownerId: user!.id,
            name: "Plumber - Vinod bhai",
            slug: "plumber-vinod-bhai-test",
            city: "Vadodara",
            address: "Pin Code: 391760, Vadodara",
            coverImageUrl: "https://images.unsplash.com/photo-1585704032915-c3400ca199e7?q=80&w=2070&auto=format&fit=crop"
        }).returning();

        console.log("Inserting home cards...");
        await db.insert(homeCards).values([
            { vendorId: v1.id, displayOrder: 1, isActive: true },
            { vendorId: v2.id, displayOrder: 2, isActive: true }
        ]);

        console.log("Successfully seeded mock home vendors!");
        process.exit(0);
    } catch (e) {
        console.error("Error during seed", e);
        process.exit(1);
    }
}

seed();
