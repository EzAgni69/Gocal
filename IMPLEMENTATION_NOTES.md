# Opening Hours & Review System Implementation

## Overview
This implementation adds proper opening hours management and a complete review system to the Gocal platform.

## Features Implemented

### 1. Opening Hours System

#### Database Changes
- Added `opening_hours` JSONB column to `vendors` table
- Structure: `{ "Mon": { "open": "10:00", "close": "21:00", "closed": false }, ... }`
- Migration file: `packages/database/migrations/add_opening_hours_and_reviews.sql`

#### Backend
- **Utility Functions** (`apps/backend/src/utils/openingHours.ts`):
  - `getOpeningHoursStatus()` - Determines if vendor is currently open
  - `formatOpeningHours()` - Formats hours for display
  - `getAllOpeningHours()` - Returns full week schedule
  - `findNextOpenDay()` - Finds next available opening time

#### Frontend
- **Utility Functions** (`apps/frontend/src/utils/openingHours.ts`):
  - Same functionality as backend for client-side calculations
  - `formatTime()` - Converts 24h to 12h format (e.g., "14:00" → "2:00 PM")
  
- **UI Updates**:
  - Directory component shows current day's hours
  - Contact card modal displays today's hours with "View All" option
  - Expandable weekly schedule view
  - Current day highlighted in weekly view

### 2. Review System

#### Database Changes
- Enhanced `reviews` table with:
  - `updated_at` timestamp column
  - Additional indexes for performance (`idx_reviews_vendor`, `idx_reviews_user`)
  - Constraint: One review per user per vendor

#### Backend API (`apps/backend/src/routes/reviewRoutes.ts`)

**Endpoints:**

1. **POST /api/reviews**
   - Create a new review
   - Auth required
   - Body: `{ vendorId, rating (1-5), comment? }`
   - Auto-updates vendor rating and review count

2. **GET /api/reviews/vendor/:vendorId**
   - Get all reviews for a vendor
   - Returns reviews with user info
   - Sorted by newest first

3. **PUT /api/reviews/:id**
   - Update own review
   - Auth required (must be review author)
   - Body: `{ rating?, comment? }`
   - Recalculates vendor rating

4. **DELETE /api/reviews/:id**
   - Delete own review
   - Auth required (must be review author)
   - Recalculates vendor rating and count

#### Frontend Components

1. **ReviewModal** (`apps/frontend/src/components/ReviewModal.tsx`)
   - Modal for submitting reviews
   - Interactive 5-star rating selector
   - Optional comment field (max 1000 chars)
   - Character counter
   - Error handling

2. **ReviewsList** (`apps/frontend/src/components/ReviewsList.tsx`)
   - Displays all reviews for a vendor
   - Shows user avatar, name, rating, and comment
   - Relative timestamps (e.g., "2 days ago")
   - Empty state when no reviews

3. **ContactCardModal Updates**
   - Integrated ReviewsList component
   - "Write a Review" button
   - Opens ReviewModal on click
   - Real-time review list updates after submission

### 3. Type System Updates

**New Types** (`apps/frontend/src/types.ts`):
```typescript
interface Review {
  id: string;
  userId: string;
  vendorId: string;
  rating: number;
  comment?: string | null;
  createdAt: string;
  updatedAt: string;
  user?: {
    id: string;
    name: string;
    avatarUrl?: string | null;
  };
}

interface OpeningHours {
  [day: string]: { 
    open: string; 
    close: string; 
    closed?: boolean 
  };
}
```

## Database Migration

To apply the changes, run:

```bash
# Connect to your database and run:
psql -U your_user -d your_database -f packages/database/migrations/add_opening_hours_and_reviews.sql
```

Or use your preferred database migration tool.

## Usage Examples

### Setting Opening Hours (Backend)
```typescript
await db.update(vendors)
  .set({
    openingHours: {
      Mon: { open: "09:00", close: "18:00" },
      Tue: { open: "09:00", close: "18:00" },
      Wed: { open: "09:00", close: "18:00" },
      Thu: { open: "09:00", close: "18:00" },
      Fri: { open: "09:00", close: "18:00" },
      Sat: { open: "10:00", close: "16:00" },
      Sun: { closed: true }
    }
  })
  .where(eq(vendors.id, vendorId));
```

### Submitting a Review (Frontend)
```typescript
const response = await fetch('/api/reviews', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`,
  },
  body: JSON.stringify({
    vendorId: 'vendor-uuid',
    rating: 5,
    comment: 'Great service!'
  }),
});
```

### Displaying Opening Hours (Frontend)
```typescript
import { formatOpeningHours, getAllOpeningHours } from '@/utils/openingHours';

// Show today's hours
const todayHours = formatOpeningHours(vendor.openingHours);
// Output: "10:00 AM - 9:00 PM" or "Closed today"

// Show full week
const weekSchedule = getAllOpeningHours(vendor.openingHours);
// Returns array with all days and their hours
```

## Security Considerations

1. **Review System**:
   - Users can only edit/delete their own reviews
   - One review per user per vendor (enforced by unique index)
   - Rating must be between 1-5 (enforced by check constraint)
   - Comment length limited to 1000 characters

2. **Authentication**:
   - All review mutations require authentication
   - JWT token validation on backend
   - User ID extracted from token, not request body

## Performance Optimizations

1. **Database Indexes**:
   - `idx_reviews_vendor` - Fast vendor review lookups
   - `idx_reviews_user` - Fast user review lookups
   - Unique index on (userId, vendorId) prevents duplicates

2. **Frontend**:
   - Reviews cached in component state
   - Opening hours calculated client-side
   - Optimistic UI updates

## Future Enhancements

1. **Opening Hours**:
   - Special hours for holidays
   - Temporary closures
   - Break times (e.g., lunch break)
   - Multiple time slots per day

2. **Reviews**:
   - Review photos
   - Helpful/unhelpful voting
   - Review responses from vendors
   - Review moderation system
   - Verified purchase badges

3. **Analytics**:
   - Track review submission rates
   - Monitor rating trends over time
   - Identify peak business hours from reviews

## Testing

To test the implementation:

1. **Opening Hours**:
   - Check display at different times of day
   - Verify "Open Now" badge accuracy
   - Test weekly schedule view

2. **Reviews**:
   - Submit a review as authenticated user
   - Try submitting duplicate review (should fail)
   - Edit your own review
   - Try editing someone else's review (should fail)
   - Delete your review
   - Verify vendor rating updates correctly

## Files Modified/Created

### Backend
- ✅ `packages/database/src/schema/vendors.ts` - Added openingHours field
- ✅ `packages/database/src/schema/reviews.ts` - Enhanced with indexes
- ✅ `packages/database/migrations/add_opening_hours_and_reviews.sql` - Migration
- ✅ `apps/backend/src/routes/reviewRoutes.ts` - New review API
- ✅ `apps/backend/src/utils/openingHours.ts` - Opening hours utilities
- ✅ `apps/backend/src/index.ts` - Added review routes

### Frontend
- ✅ `apps/frontend/src/types.ts` - Updated types
- ✅ `apps/frontend/src/utils/openingHours.ts` - Client-side utilities
- ✅ `apps/frontend/src/components/ReviewModal.tsx` - New component
- ✅ `apps/frontend/src/components/ReviewsList.tsx` - New component
- ✅ `apps/frontend/src/components/ContactCardModal.tsx` - Enhanced with reviews
- ✅ `apps/frontend/src/components/Directory.tsx` - Shows opening hours
- ✅ `apps/frontend/src/services/vendorService.ts` - Maps openingHours

## Notes

- Default opening hours set to Mon-Sat 10:00-21:00, Sun 10:00-18:00
- All times stored in 24-hour format (HH:MM)
- Timezone handling should be added for multi-region support
- Review ratings automatically update vendor's aggregate rating
