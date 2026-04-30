/**
 * Test script for the opening hours system
 * Run with: npx tsx src/scripts/test-opening-hours.ts
 */

import '../env';
import { db, vendors, eq } from 'database';
import { getOpeningHoursStatus, formatOpeningHours, getAllOpeningHours } from '../utils/openingHours';

async function testOpeningHours() {
    console.log('🕐 Testing Opening Hours System...\n');

    try {
        // 1. Get a test vendor
        const vendor = await db.query.vendors.findFirst({
            columns: { id: true, name: true, openingHours: true },
        });

        if (!vendor) {
            console.log('❌ No vendors found. Please create a vendor first.');
            return;
        }

        console.log(`✅ Found vendor: ${vendor.name}\n`);

        // 2. Check if vendor has opening hours
        if (!vendor.openingHours) {
            console.log('⚠️  Vendor has no opening hours set. Setting default hours...');
            
            const defaultHours = {
                Mon: { open: "09:00", close: "18:00" },
                Tue: { open: "09:00", close: "18:00" },
                Wed: { open: "09:00", close: "18:00" },
                Thu: { open: "09:00", close: "18:00" },
                Fri: { open: "09:00", close: "18:00" },
                Sat: { open: "10:00", close: "16:00" },
                Sun: { closed: true as const }
            };

            await db.update(vendors)
                .set({ openingHours: defaultHours })
                .where(eq(vendors.id, vendor.id));

            vendor.openingHours = defaultHours;
            console.log('✅ Default hours set\n');
        }

        // 3. Display current status
        const status = getOpeningHoursStatus(vendor.openingHours);
        console.log('📍 Current Status:');
        console.log(`   Day: ${status.currentDay}`);
        console.log(`   Open: ${status.isOpen ? '✅ YES' : '❌ NO'}`);
        
        if (status.todayHours) {
            console.log(`   Today's Hours: ${status.todayHours.open} - ${status.todayHours.close}`);
        } else {
            console.log(`   Today's Hours: Closed`);
            if (status.nextOpenDay) {
                console.log(`   Next Open: ${status.nextOpenDay} at ${status.nextOpenTime}`);
            }
        }
        console.log();

        // 4. Display formatted hours
        console.log('📅 Formatted Display:');
        console.log(`   ${formatOpeningHours(vendor.openingHours)}\n`);

        // 5. Display full week schedule
        console.log('📋 Weekly Schedule:');
        const weekSchedule = getAllOpeningHours(vendor.openingHours);
        weekSchedule.forEach(({ day, hours }) => {
            const marker = day === status.currentDay ? '👉' : '  ';
            console.log(`   ${marker} ${day}: ${hours}`);
        });
        console.log();

        // 6. Test different scenarios
        console.log('🧪 Testing Different Scenarios:\n');

        // Scenario 1: 24/7 operation
        const alwaysOpen = {
            Mon: { open: "00:00", close: "23:59" },
            Tue: { open: "00:00", close: "23:59" },
            Wed: { open: "00:00", close: "23:59" },
            Thu: { open: "00:00", close: "23:59" },
            Fri: { open: "00:00", close: "23:59" },
            Sat: { open: "00:00", close: "23:59" },
            Sun: { open: "00:00", close: "23:59" }
        };
        console.log('   Scenario 1: 24/7 Operation');
        console.log(`   Status: ${getOpeningHoursStatus(alwaysOpen).isOpen ? 'Open' : 'Closed'}`);
        console.log(`   Display: ${formatOpeningHours(alwaysOpen)}\n`);

        // Scenario 2: Closed all week
        const alwaysClosed = {
            Mon: { closed: true as const },
            Tue: { closed: true as const },
            Wed: { closed: true as const },
            Thu: { closed: true as const },
            Fri: { closed: true as const },
            Sat: { closed: true as const },
            Sun: { closed: true as const }
        };
        console.log('   Scenario 2: Closed All Week');
        console.log(`   Status: ${getOpeningHoursStatus(alwaysClosed).isOpen ? 'Open' : 'Closed'}`);
        console.log(`   Display: ${formatOpeningHours(alwaysClosed)}\n`);

        // Scenario 3: Weekend only
        const weekendOnly = {
            Mon: { closed: true as const },
            Tue: { closed: true as const },
            Wed: { closed: true as const },
            Thu: { closed: true as const },
            Fri: { closed: true as const },
            Sat: { open: "10:00", close: "20:00" },
            Sun: { open: "10:00", close: "20:00" }
        };
        console.log('   Scenario 3: Weekend Only');
        const weekendStatus = getOpeningHoursStatus(weekendOnly);
        console.log(`   Status: ${weekendStatus.isOpen ? 'Open' : 'Closed'}`);
        console.log(`   Display: ${formatOpeningHours(weekendOnly)}`);
        if (!weekendStatus.isOpen && weekendStatus.nextOpenDay) {
            console.log(`   Next Open: ${weekendStatus.nextOpenDay} at ${weekendStatus.nextOpenTime}`);
        }
        console.log();

        console.log('✅ Opening hours system test completed successfully!');

    } catch (error) {
        console.error('❌ Error testing opening hours:', error);
    } finally {
        process.exit(0);
    }
}

testOpeningHours();
