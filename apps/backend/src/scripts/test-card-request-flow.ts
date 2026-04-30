/**
 * Test script for contact card request flow with new fields
 * Run with: npx tsx src/scripts/test-card-request-flow.ts
 */

import dotenv from 'dotenv';
// Load env from backend
dotenv.config({ path: '../../apps/backend/.env' });

import { db, contactCardRequests } from 'database';

async function testCardRequestFlow() {
  console.log('🧪 Testing Contact Card Request Flow with New Fields\n');

  try {
    // Fetch a sample request to verify schema
    const requests = await db.select().from(contactCardRequests).limit(1);
    
    if (requests.length > 0) {
      const request = requests[0];
      console.log('✅ Sample Request Found:');
      console.log('   ID:', request.id);
      console.log('   Business:', request.businessName);
      console.log('   Status:', request.status);
      console.log('\n📋 New Fields:');
      console.log('   Opening Hours:', request.openingHours ? 'Set' : 'Not set');
      console.log('   Pincode:', request.pincode || 'Not set');
      console.log('   Google Direction Link:', request.googleDirectionLink || 'Not set');
      console.log('   Logo URL:', request.logoUrl || 'Not set');
      console.log('   Main Photo URL:', request.mainPhotoUrl || 'Not set');
      console.log('   Main Photo Description:', request.mainPhotoDescription || 'Not set');
      console.log('   Gallery URLs:', request.galleryUrls ? `${(request.galleryUrls as string[]).length} images` : 'Not set');
    } else {
      console.log('ℹ️  No requests found in database yet');
      console.log('   Submit a request through the frontend to test the flow');
    }

    console.log('\n✅ Database schema verification complete!');
    console.log('\n📝 Next Steps:');
    console.log('   1. Start the backend: npm run dev (in apps/backend)');
    console.log('   2. Start the frontend: npm run dev (in apps/frontend)');
    console.log('   3. Navigate to /request-card');
    console.log('   4. Fill out the form with new fields:');
    console.log('      - Phone with +91 prefix');
    console.log('      - Pincode in business info');
    console.log('      - Opening hours for each day');
    console.log('      - Google Maps direction link');
    console.log('      - Upload logo, main photo, and gallery images');
    console.log('   5. Submit and verify in admin panel');

  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }

  process.exit(0);
}

testCardRequestFlow();
