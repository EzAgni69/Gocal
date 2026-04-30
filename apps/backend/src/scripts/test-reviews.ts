/**
 * Test script for the review system
 * Run with: npx tsx src/scripts/test-reviews.ts
 */

import '../env';
import { db, vendors, reviews, users, eq } from 'database';

async function testReviewSystem() {
    console.log('🧪 Testing Review System...\n');

    try {
        // 1. Get a test vendor
        const vendor = await db.query.vendors.findFirst({
            columns: { id: true, name: true, rating: true, reviewCount: true },
        });

        if (!vendor) {
            console.log('❌ No vendors found. Please create a vendor first.');
            return;
        }

        console.log(`✅ Found vendor: ${vendor.name}`);
        console.log(`   Current rating: ${vendor.rating} (${vendor.reviewCount} reviews)\n`);

        // 2. Get a test user
        const user = await db.query.users.findFirst({
            columns: { id: true, name: true, email: true },
        });

        if (!user) {
            console.log('❌ No users found. Please create a user first.');
            return;
        }

        console.log(`✅ Found user: ${user.name} (${user.email})\n`);

        // 3. Check for existing review
        const existingReview = await db.query.reviews.findFirst({
            where: (reviews, { and, eq }) => and(
                eq(reviews.userId, user.id),
                eq(reviews.vendorId, vendor.id)
            ),
        });

        if (existingReview) {
            console.log('⚠️  User already has a review for this vendor');
            console.log(`   Rating: ${existingReview.rating}/5`);
            console.log(`   Comment: ${existingReview.comment || 'No comment'}\n`);
            return;
        }

        // 4. Create a test review
        console.log('📝 Creating test review...');
        const [newReview] = await db.insert(reviews).values({
            userId: user.id,
            vendorId: vendor.id,
            rating: 5,
            comment: 'Excellent service! Highly recommended. This is a test review.',
        }).returning();

        console.log(`✅ Review created: ${newReview.id}`);
        console.log(`   Rating: ${newReview.rating}/5`);
        console.log(`   Comment: ${newReview.comment}\n`);

        // 5. Calculate new vendor rating
        const allReviews = await db.query.reviews.findMany({
            where: eq(reviews.vendorId, vendor.id),
        });

        const avgRating = allReviews.reduce((sum, r) => sum + r.rating, 0) / allReviews.length;
        const reviewCount = allReviews.length;

        console.log('📊 Updating vendor rating...');
        await db.update(vendors)
            .set({
                rating: avgRating.toFixed(1),
                reviewCount: reviewCount.toString(),
            })
            .where(eq(vendors.id, vendor.id));

        console.log(`✅ Vendor rating updated: ${avgRating.toFixed(1)} (${reviewCount} reviews)\n`);

        // 6. Fetch and display all reviews for this vendor
        console.log('📋 All reviews for this vendor:');
        const vendorReviews = await db.query.reviews.findMany({
            where: eq(reviews.vendorId, vendor.id),
            with: {
                user: {
                    columns: { id: true, name: true, email: true },
                },
            },
        });

        vendorReviews.forEach((review, index) => {
            console.log(`\n   ${index + 1}. ${review.user.name}`);
            console.log(`      Rating: ${'⭐'.repeat(review.rating)}`);
            console.log(`      Comment: ${review.comment || 'No comment'}`);
            console.log(`      Date: ${review.createdAt.toLocaleDateString()}`);
        });

        console.log('\n✅ Review system test completed successfully!');

    } catch (error) {
        console.error('❌ Error testing review system:', error);
    } finally {
        process.exit(0);
    }
}

testReviewSystem();
