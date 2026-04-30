# Setup Guide: Opening Hours & Review System

## Quick Start

### 1. Run Database Migration

Apply the database changes:

```bash
# Option 1: Using psql
psql -U your_username -d your_database -f packages/database/migrations/add_opening_hours_and_reviews.sql

# Option 2: Using your database client
# Copy and execute the SQL from packages/database/migrations/add_opening_hours_and_reviews.sql
```

### 2. Rebuild Database Package

```bash
cd packages/database
npm run build
```

### 3. Restart Backend Server

```bash
cd apps/backend
npm run dev
```

### 4. Restart Frontend Server

```bash
cd apps/frontend
npm run dev
```

## Testing the Implementation

### Test Opening Hours

```bash
cd apps/backend
npx tsx src/scripts/test-opening-hours.ts
```

This will:
- Find a test vendor
- Display current opening status
- Show formatted hours
- Display weekly schedule
- Test various scenarios (24/7, closed, weekend-only)

### Test Review System

```bash
cd apps/backend
npx tsx src/scripts/test-reviews.ts
```

This will:
- Find a test vendor and user
- Create a test review
- Update vendor rating
- Display all reviews for the vendor

## API Endpoints

### Reviews

#### Create Review
```bash
POST /api/reviews
Authorization: Bearer <token>
Content-Type: application/json

{
  "vendorId": "vendor-uuid",
  "rating": 5,
  "comment": "Great service!"
}
```

#### Get Vendor Reviews
```bash
GET /api/reviews/vendor/:vendorId
```

#### Update Review
```bash
PUT /api/reviews/:reviewId
Authorization: Bearer <token>
Content-Type: application/json

{
  "rating": 4,
  "comment": "Updated review"
}
```

#### Delete Review
```bash
DELETE /api/reviews/:reviewId
Authorization: Bearer <token>
```

## Frontend Usage

### Display Opening Hours

```typescript
import { formatOpeningHours, getAllOpeningHours } from '@/utils/openingHours';

// In your component
const todayHours = formatOpeningHours(vendor.openingHours);
// Output: "10:00 AM - 9:00 PM" or "Closed today"

const weekSchedule = getAllOpeningHours(vendor.openingHours);
// Returns array with all days
```

### Submit a Review

The review modal is integrated into the ContactCardModal component. Users can:
1. Click "Write a Review" button
2. Select a rating (1-5 stars)
3. Optionally add a comment
4. Submit the review

The vendor's rating and review count are automatically updated.

## Database Schema

### Opening Hours Structure

```json
{
  "Mon": { "open": "09:00", "close": "18:00" },
  "Tue": { "open": "09:00", "close": "18:00" },
  "Wed": { "open": "09:00", "close": "18:00" },
  "Thu": { "open": "09:00", "close": "18:00" },
  "Fri": { "open": "09:00", "close": "18:00" },
  "Sat": { "open": "10:00", "close": "16:00" },
  "Sun": { "closed": true }
}
```

### Reviews Table

- `id` - UUID primary key
- `user_id` - Foreign key to users table
- `vendor_id` - Foreign key to vendors table
- `rating` - Integer (1-5)
- `comment` - Text (optional)
- `created_at` - Timestamp
- `updated_at` - Timestamp

Constraints:
- Unique index on (user_id, vendor_id) - one review per user per vendor
- Check constraint: rating between 1 and 5

## Troubleshooting

### Migration Fails

If the migration fails, check:
1. Database connection is working
2. You have proper permissions
3. Tables exist (vendors, reviews, users)

### Reviews Not Showing

1. Check if reviews are being fetched:
```bash
curl http://localhost:3001/api/reviews/vendor/<vendor-id>
```

2. Check browser console for errors
3. Verify authentication token is valid

### Opening Hours Not Displaying

1. Check if vendor has opening hours set:
```sql
SELECT id, name, opening_hours FROM vendors WHERE id = 'vendor-id';
```

2. If null, set default hours:
```sql
UPDATE vendors 
SET opening_hours = '{
  "Mon": {"open": "10:00", "close": "21:00"},
  "Tue": {"open": "10:00", "close": "21:00"},
  "Wed": {"open": "10:00", "close": "21:00"},
  "Thu": {"open": "10:00", "close": "21:00"},
  "Fri": {"open": "10:00", "close": "21:00"},
  "Sat": {"open": "10:00", "close": "21:00"},
  "Sun": {"open": "10:00", "close": "18:00"}
}'::jsonb
WHERE id = 'vendor-id';
```

## Next Steps

1. **Admin Panel**: Add UI for vendors to manage their opening hours
2. **Review Moderation**: Add admin tools to moderate reviews
3. **Review Photos**: Allow users to upload photos with reviews
4. **Special Hours**: Support for holidays and special events
5. **Review Responses**: Allow vendors to respond to reviews

## Support

For issues or questions:
1. Check the IMPLEMENTATION_NOTES.md for detailed documentation
2. Review the test scripts for usage examples
3. Check the API routes for endpoint details
