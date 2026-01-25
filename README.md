# ReserveHub - Unified Reservation Platform

A comprehensive, production-ready reservation and ticketing platform that allows customers to discover and book restaurants, cafés, hotels, events, and concerts all in one place.

## Overview

ReserveHub is a unified reservation platform built for MVP v1, focusing on restaurant and café reservations with a complete booking flow, hold mechanism, and admin portal for venue management.

### Key Features

**For Customers:**
- Browse and search venues across multiple categories
- Filter by location, category, and price range
- View detailed venue information with images and amenities
- Real-time availability checking
- 10-minute hold mechanism to prevent double-booking
- Complete booking with confirmation codes
- Manage and cancel reservations

**For Venue Owners:**
- Create and manage multiple venues
- Add and manage tables/inventory
- View all bookings for owned venues
- Set availability rules and operating hours
- Track booking statistics

## Tech Stack

- **Frontend**: React 18 with TypeScript
- **Styling**: Tailwind CSS
- **Database**: Supabase (PostgreSQL)
- **Authentication**: Supabase Auth (email/password)
- **Icons**: Lucide React
- **Build Tool**: Vite

## Architecture Highlights

### Database Design
- Comprehensive schema with 9+ tables
- Row Level Security (RLS) enabled on all tables
- Atomic operations to prevent double-booking
- Support for multiple venue categories and booking types

### Hold Mechanism
- Creates temporary 10-minute locks on selected units
- Prevents race conditions during checkout
- Automatic expiration with countdown timer
- Status tracking: ACTIVE, EXPIRED, CONVERTED, RELEASED

### Availability Engine
- Real-time conflict checking
- Considers both confirmed bookings and active holds
- Configurable time slots and party size rules
- Day-of-week based operating hours

## Quick Start

### Prerequisites
- Node.js 18+
- Supabase account with a project

### Setup

1. Clone the repository and install dependencies:
```bash
npm install
```

2. Environment variables are pre-configured in `.env`:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`

3. The database schema is already created via Supabase migration

4. Start the development server:
```bash
npm run dev
```

### Initial Data Setup

1. Create an account through the application
2. Navigate to Admin → Add Venue
3. Create your first venue with details
4. Add tables in the venue edit page
5. Add availability rules via SQL (see `sample-data.sql`)

See `SETUP_GUIDE.md` for detailed instructions.

## Project Structure

```
src/
├── components/
│   └── Layout.tsx              # Main navigation and layout
├── contexts/
│   └── AuthContext.tsx         # Authentication state management
├── lib/
│   └── supabase.ts            # Supabase client configuration
├── pages/
│   ├── Admin.tsx              # Venue management dashboard
│   ├── Booking.tsx            # Booking flow with hold creation
│   ├── BookingConfirmation.tsx # Success page
│   ├── Home.tsx               # Venue browsing and search
│   ├── Login.tsx              # Authentication page
│   ├── MyBookings.tsx         # User's booking list
│   ├── VenueDetail.tsx        # Venue information and reservation form
│   └── VenueForm.tsx          # Create/edit venue and tables
├── types/
│   └── index.ts               # TypeScript type definitions
├── App.tsx                    # Main app with routing
└── main.tsx                   # App entry point
```

## Database Schema

### Core Tables
- `venues` - Restaurant, café, hotel, event venue information
- `bookable_units` - Tables, seats, rooms (inventory)
- `availability_rules` - Operating hours and booking constraints
- `holds` - Temporary reservations with expiration
- `bookings` - Confirmed reservations
- `booking_units` - Junction table linking bookings to units
- `hold_units` - Junction table linking holds to units
- `event_instances` - Specific event dates (for future use)
- `cancellation_policies` - Refund and cancellation rules

### Security
All tables have Row Level Security (RLS) enabled with policies:
- Users can view their own bookings and holds
- Venue owners can manage their venues and view related bookings
- Public venues are visible to all authenticated and anonymous users

## User Flows

### Customer Booking Flow
1. Browse venues → Select venue → View details
2. Choose date, time, and party size
3. View available tables and select
4. Hold created (10-minute countdown starts)
5. Enter contact information and special requests
6. Confirm booking → Receive confirmation code

### Admin Venue Management
1. Sign in → Navigate to Admin
2. Create venue with all details
3. Add tables/inventory to venue
4. Configure availability rules (via SQL currently)
5. Monitor bookings and manage reservations

## API Integration Points

The application uses Supabase client for all database operations:
- Real-time availability queries
- Transactional booking creation
- Automatic hold expiration
- RLS-protected data access

## Future Enhancements

### Planned for MVP v2
- Interactive floor plans for table selection
- Event seat maps with section/row/seat selection
- QR code generation for event tickets
- Email notifications
- Check-in scanning

### Planned for MVP v3
- Hotel room reservations with date ranges
- Rate plans and dynamic pricing
- Payment integration (Stripe)
- Cancellation and refund processing
- Advanced analytics dashboard

## Development

### Available Scripts

```bash
npm run dev          # Start development server
npm run build        # Build for production
npm run preview      # Preview production build
npm run typecheck    # Run TypeScript type checking
npm run lint         # Run ESLint
```

### Code Quality
- TypeScript for type safety
- ESLint for code quality
- Tailwind CSS for consistent styling
- Component-based architecture
- Separation of concerns

## Performance Considerations

- Efficient database queries with proper indexes
- Optimistic UI updates
- Lazy loading of components
- Minimal bundle size with Vite
- RLS policies optimized for read performance

## Security

- Row Level Security on all tables
- Authenticated routes protected
- No sensitive data in client code
- Supabase handles all auth tokens securely
- Input validation on all forms

## Deployment

The application is ready for deployment:

1. Build the production bundle:
```bash
npm run build
```

2. Deploy the `dist` folder to any static hosting:
   - Vercel
   - Netlify
   - Cloudflare Pages
   - AWS S3 + CloudFront

3. Ensure environment variables are set in your hosting provider

## Contributing

This is a production-ready MVP focused on:
- Clean, maintainable code
- Type safety with TypeScript
- Comprehensive RLS policies
- User-friendly interfaces
- Robust booking logic

## License

MIT

---

Built with React, TypeScript, Tailwind CSS, and Supabase
