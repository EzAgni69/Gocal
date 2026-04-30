# Gocal - B2B Local Business Directory

A comprehensive B2B platform for local businesses in Vadodara with advanced features including opening hours management and customer reviews.

## Recent Updates

### ✨ New Features: Opening Hours & Review System

We've implemented a complete opening hours management system and customer review functionality. See the documentation below for details.

#### Quick Links
- [Features Summary](FEATURES_SUMMARY.md) - Overview of all new features
- [Implementation Notes](IMPLEMENTATION_NOTES.md) - Technical documentation
- [Setup Guide](SETUP_GUIDE.md) - Installation and testing instructions

#### Key Features
- 📅 **Opening Hours Management** - Display business hours with real-time open/closed status
- ⭐ **Review System** - Complete review functionality with ratings and comments
- 🎨 **Enhanced UI** - Beautiful, responsive components for reviews and hours
- 🔒 **Secure** - Authentication, authorization, and data validation
- 📊 **Automatic Ratings** - Vendor ratings update automatically based on reviews

## Getting Started

### Prerequisites
- Node.js 18+
- PostgreSQL database
- npm or yarn

### Installation

1. Clone the repository
2. Install dependencies:
```bash
npm install
```

3. Run the database migration:
```bash
psql -U your_username -d your_database -f packages/database/migrations/add_opening_hours_and_reviews.sql
```

4. Start the development servers:
```bash
# Backend
cd apps/backend
npm run dev

# Frontend (in another terminal)
cd apps/frontend
npm run dev
```

### Testing

Test the new features:
```bash
# Test opening hours
cd apps/backend
npx tsx src/scripts/test-opening-hours.ts

# Test reviews
npx tsx src/scripts/test-reviews.ts
```

## Documentation

- [Requirement Document](Requirement%20Document.md) - Original requirements
- [Features Summary](FEATURES_SUMMARY.md) - Complete feature list
- [Implementation Notes](IMPLEMENTATION_NOTES.md) - Technical details
- [Setup Guide](SETUP_GUIDE.md) - Setup and troubleshooting

## Project Structure

```
.
├── apps/
│   ├── backend/          # Express.js API server
│   │   ├── src/
│   │   │   ├── routes/   # API routes including reviews
│   │   │   ├── utils/    # Opening hours utilities
│   │   │   └── scripts/  # Test scripts
│   │   └── uploads/      # File uploads
│   └── frontend/         # Next.js application
│       └── src/
│           ├── components/  # React components
│           ├── utils/       # Client utilities
│           └── services/    # API services
├── packages/
│   └── database/         # Database schema and migrations
│       ├── src/schema/   # Drizzle ORM schemas
│       └── migrations/   # SQL migrations
└── docs/                 # Documentation
```

## Tech Stack

### Backend
- Node.js + Express
- PostgreSQL + Drizzle ORM
- JWT Authentication
- TypeScript

### Frontend
- Next.js 14
- React 18
- TypeScript
- Tailwind CSS
- Framer Motion

## API Endpoints

### Reviews
- `POST /api/reviews` - Create a review
- `GET /api/reviews/vendor/:vendorId` - Get vendor reviews
- `PUT /api/reviews/:id` - Update review
- `DELETE /api/reviews/:id` - Delete review

### Vendors
- `GET /api/vendors/home` - Get featured vendors
- `GET /api/vendors/:id` - Get vendor details
- `PUT /api/vendors/:id` - Update vendor

See [Implementation Notes](IMPLEMENTATION_NOTES.md) for complete API documentation.

## Contributing

1. Create a feature branch
2. Make your changes
3. Run tests
4. Submit a pull request

## License

Proprietary - All rights reserved

## Support

For questions or issues, please refer to the documentation or contact the development team.
