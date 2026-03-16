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

    console.log("Clearing existing home cards...");
    await db.delete(homeCards);

    console.log("Cleaning up existing vendors with same slugs...");
    const slugs = ["harshil-electrical-boutique", "vinod-premium-plumbing"];
    const { inArray } = require('drizzle-orm');
    await db.delete(vendors).where(inArray(vendors.slug, slugs));

    console.log("Inserting vendors...");
    try {
        const [v1] = await db.insert(vendors).values({
            ownerId: user!.id,
            name: "Harshil's Electrical Boutique",
            slug: "harshil-electrical-boutique",
            city: "Vadodara",
            address: "Shop 12, Crystal Plaza, Akota, Vadodara - 390020",
            phone: "+919714399719",
            email: "contact@harshil-electrical.com",
            coverImageUrl: "https://images.unsplash.com/photo-1621905251189-08b45d6a269e?q=80&w=2069&auto=format&fit=crop",
            shortDescription: "Exclusive lighting solutions and premium electrical fixtures for modern luxury homes.",
            description: "Established in 2010, Harshil's Electrical Boutique has been the cornerstone of luxury lighting in Vadodara. We specialize in imported chandeliers, smart home automation, and energy-efficient LED solutions that redefine elegance.",
            rating: "4.8",
            reviewCount: "124",
            isPremium: true,
            isVerified: true
        }).returning();

        const [v2] = await db.insert(vendors).values({
            ownerId: user!.id,
            name: "Vinod's Premium Plumbing",
            slug: "vinod-premium-plumbing",
            city: "Vadodara",
            address: "Building B, Royal Arcade, Vasna Road, Vadodara - 390007",
            phone: "+919890479109",
            email: "service@vinod-plumbing.in",
            coverImageUrl: "https://images.unsplash.com/photo-1584622650111-993a426fbf0a?q=80&w=2070&auto=format&fit=crop",
            shortDescription: "Expert plumbing services and high-end bath fittings from world-class brands.",
            description: "Vinod's Premium Plumbing brings 15 years of excellence to your doorstep. We provide comprehensive plumbing solutions and represent premium brands like Jaquar, Kohler, and Grohe. Our technicians are certified for luxury villa installations.",
            rating: "4.9",
            reviewCount: "86",
            isPremium: true,
            isVerified: true
        }).returning();

        console.log("Inserting products...");
        
        // Products for Vendor 1 (Electrical)
        await db.insert(require('./schema/products').products).values([
            {
                vendorId: v1.id,
                name: "Crystal Cascade Chandelier",
                description: "A stunning 3-tier crystal chandelier with K9 crystals and gold finish. Perfect for grand living rooms.",
                price: "45000",
                imageUrl: "https://images.unsplash.com/photo-1542382257-80dedb725088?q=80&w=1928&auto=format&fit=crop",
                category: "Lighting",
                inStock: true,
                quantity: "5"
            },
            {
                vendorId: v1.id,
                name: "Smart Ambient LED Strip",
                description: "10-meter RGBIC smart LED strip with app control and music sync capabilities.",
                price: "3500",
                imageUrl: "https://images.unsplash.com/photo-1550009158-9ebf69173e03?q=80&w=2001&auto=format&fit=crop",
                category: "Smart Home",
                inStock: true,
                quantity: "50"
            },
            {
                vendorId: v1.id,
                name: "Modern Matte Black Wall Sconce",
                description: "Minimalist wall lighting with adjustable arm and warm LED bulb included.",
                price: "2800",
                imageUrl: "https://images.unsplash.com/photo-1513506491742-1d60a1f47db7?q=80&w=2070&auto=format&fit=crop",
                category: "Lighting",
                inStock: true,
                quantity: "20"
            }
        ]);

        // Products for Vendor 2 (Plumbing)
        await db.insert(require('./schema/products').products).values([
            {
                vendorId: v2.id,
                name: "Rainfall Shower System",
                description: "12-inch stainless steel rainfall shower head with thermostatic valve and hand shower.",
                price: "18500",
                imageUrl: "https://images.unsplash.com/photo-1584622781564-1d9876a13d00?q=80&w=1964&auto=format&fit=crop",
                category: "Bath Fittings",
                inStock: true,
                quantity: "8"
            },
            {
                vendorId: v2.id,
                name: "Smart Touchless Faucet",
                description: "Infrared sensor-controlled chrome faucet for maximum hygiene and water saving.",
                price: "7200",
                imageUrl: "https://images.unsplash.com/photo-1620629731451-24872242095f?q=80&w=2070&auto=format&fit=crop",
                category: "Kitchen",
                inStock: true,
                quantity: "15"
            },
            {
                vendorId: v2.id,
                name: "Designer Ceramic Washbasin",
                description: "Countertop ceramic basin with gold leaf detailing and scratch-resistant finish.",
                price: "12000",
                imageUrl: "https://images.unsplash.com/photo-1620627284144-846399b1df09?q=80&w=2071&auto=format&fit=crop",
                category: "Sanitaryware",
                inStock: true,
                quantity: "10"
            }
        ]);

        console.log("Inserting home cards...");
        await db.insert(homeCards).values([
            { vendorId: v1.id, displayOrder: 1, isActive: true },
            { vendorId: v2.id, displayOrder: 2, isActive: true }
        ]);

        console.log("Successfully seeded mock home vendors and products!");
        process.exit(0);
    } catch (e) {
        console.error("Error during seed", e);
        process.exit(1);
    }
}

seed();
