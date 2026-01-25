# ReserveHub - Unified Reservation Platform

A comprehensive reservation and ticketing platform for restaurants, cafés, hotels, events, and concerts.

## Features

### Customer Features
- Browse venues across multiple categories (Restaurants, Cafés, Hotels, Events, Concerts)
- Search and filter by location, category, price range, and more
- View detailed venue information with images and amenities
- Make reservations with real-time availability checking
- Hold mechanism prevents double-booking (10-minute holds)
- View and manage bookings
- Cancel reservations (subject to cancellation policies)

### Admin/Venue Owner Features
- Create and manage venues
- Add and manage bookable units (tables, seats, rooms)
- View all bookings for owned venues
- Set availability rules and operating hours
- Configure venue details, pricing, and amenities

## Technology Stack

- **Frontend**: React with TypeScript
- **Styling**: Tailwind CSS
- **Database**: Supabase (PostgreSQL)
- **Authentication**: Supabase Auth
- **Icons**: Lucide React

## Database Schema

### Core Tables
- `venues` - Store all venue information
- `bookable_units` - Tables, seats, or rooms that can be reserved
- `availability_rules` - Operating hours and booking rules
- `holds` - Temporary locks on units (10-minute expiration)
- `bookings` - Confirmed reservations
- `event_instances` - Specific event dates/times (for events/concerts)
- `cancellation_policies` - Refund and cancellation rules

### Security
- Row Level Security (RLS) enabled on all tables
- Users can only view their own bookings and holds
- Venue owners can manage their own venues and view related bookings
- Public venues are visible to all users

## Getting Started

### Prerequisites
- Node.js 18+ installed
- Supabase account and project

### Environment Setup

The `.env` file should already contain your Supabase credentials:
- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`

### Running the Application

1. Install dependencies (if not already installed):
```bash
npm install
```

2. Start the development server:
```bash
npm run dev
```

The application will be available at the URL shown in the terminal.

### Adding Sample Data

To test the platform, you'll need to:

1. **Create an account**: Sign up through the application
2. **Create a venue**: Navigate to Admin → Add Venue
3. **Add tables**: After creating a restaurant/café, add tables in the venue edit page
4. **Set availability rules**: Use the SQL query below in your Supabase dashboard

#### Sample Availability Rules SQL

Run this in your Supabase SQL Editor (replace `YOUR_VENUE_ID` with your actual venue ID):

```sql
-- Add availability rules for a restaurant (Monday-Friday)
INSERT INTO availability_rules (venue_id, day_of_week, open_time, close_time, slot_duration_minutes, advance_booking_days, min_party_size, max_party_size, is_active)
VALUES
  ('YOUR_VENUE_ID', 1, '11:00:00', '22:00:00', 90, 30, 1, 12, true),
  ('YOUR_VENUE_ID', 2, '11:00:00', '22:00:00', 90, 30, 1, 12, true),
  ('YOUR_VENUE_ID', 3, '11:00:00', '22:00:00', 90, 30, 1, 12, true),
  ('YOUR_VENUE_ID', 4, '11:00:00', '22:00:00', 90, 30, 1, 12, true),
  ('YOUR_VENUE_ID', 5, '11:00:00', '23:00:00', 90, 30, 1, 12, true);

-- Weekend hours (Saturday-Sunday)
INSERT INTO availability_rules (venue_id, day_of_week, open_time, close_time, slot_duration_minutes, advance_booking_days, min_party_size, max_party_size, is_active)
VALUES
  ('YOUR_VENUE_ID', 6, '10:00:00', '23:00:00', 90, 30, 1, 12, true),
  ('YOUR_VENUE_ID', 0, '10:00:00', '23:00:00', 90, 30, 1, 12, true);
```

## User Flows

### Making a Restaurant Reservation

1. Browse venues on the home page
2. Click on a restaurant to view details
3. Select date, time, and party size
4. Click "Continue to Booking"
5. Select available table(s) - creates a 10-minute hold
6. Fill in contact information and special requests
7. Confirm booking
8. Receive confirmation with unique code

### Managing Venues (Admin)

1. Sign in to your account
2. Navigate to Admin dashboard
3. Click "Add Venue" to create a new venue
4. Fill in venue details (name, category, location, contact, etc.)
5. Save the venue
6. Edit the venue to add tables/inventory
7. Add availability rules via SQL (or future UI)
8. Venue becomes bookable by customers

## Key Features Explained

### Hold Mechanism
When a customer selects tables/seats, a 10-minute hold is created. This prevents other users from booking the same units during the checkout process. Holds automatically expire after 10 minutes if not converted to a booking.

### Availability Checking
The system checks for conflicts by:
1. Querying existing bookings for the selected time slot
2. Checking active holds that haven't expired
3. Filtering out unavailable units
4. Showing only units that can accommodate the party size

### Booking Confirmation
Each confirmed booking receives:
- Unique 8-character confirmation code
- Timestamp of creation
- Customer contact details
- Special requests
- Status tracking (CONFIRMED, CHECKED_IN, COMPLETED, CANCELLED, NO_SHOW)

## Future Enhancements (Planned)

- Email notifications via Supabase Edge Functions
- Interactive seat maps for events/concerts
- Hotel room booking with date ranges
- Payment integration
- QR code tickets for events
- Staff check-in tools
- Advanced analytics and reporting
- Calendar integration
- SMS reminders
- Review and rating system

## Development Scripts

```bash
# Start development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview

# Type checking
npm run typecheck

# Linting
npm run lint
```

## Architecture Notes

### Anti-Double-Booking Strategy
1. PostgreSQL transactions ensure atomic operations
2. Hold mechanism with expiration timestamps
3. Row-level locks during booking creation
4. Availability queries check both bookings and active holds
5. Status updates mark holds as CONVERTED when booking confirmed

### Scalability Considerations
- Database indexes on frequently queried fields
- Efficient RLS policies
- Optimistic UI updates with rollback on error
- Future: Redis for caching and real-time hold coordination

## Support

For issues or questions about the platform:
1. Check this guide for common setup steps
2. Review database schema and RLS policies
3. Inspect browser console for frontend errors
4. Check Supabase dashboard for database errors

---

Built with React, TypeScript, Tailwind CSS, and Supabase
