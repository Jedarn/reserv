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
4. **Set availability rules**: This is REQUIRED to enable bookings

#### Adding Availability Rules (REQUIRED)

**Without availability rules, the time selection will be disabled and customers cannot make bookings.**

The easiest way to add availability rules is to use the `add-availability-rules.sql` file:

1. Open your Supabase project dashboard
2. Go to SQL Editor
3. Open the `add-availability-rules.sql` file in this project
4. Find your venue ID by running:
   ```sql
   SELECT id, name FROM venues WHERE owner_id = auth.uid();
   ```
5. Copy your venue ID
6. In the `add-availability-rules.sql` file, replace `YOUR_VENUE_ID` with your actual venue ID
7. Choose one of the preset schedules (Restaurant, Café, or custom)
8. Run the INSERT statements

The file includes three common schedules:
- **Standard Restaurant**: 11 AM - 10 PM daily (later on weekends)
- **Lunch & Dinner**: Split shifts with a break between services
- **Café Hours**: 7 AM - 6 PM daily

After adding availability rules, refresh your venue page and you'll see available time slots!

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

## Troubleshooting

### Time Selection is Disabled / Grayed Out

**Problem**: The time dropdown is disabled and shows "Select a date first" or "Closed on this day"

**Solution**: This happens when:
1. **No availability rules exist**: You must add availability rules to your venue using the `add-availability-rules.sql` script
2. **Venue is closed on selected day**: The venue has no availability rules for that specific day of the week
3. **No date selected**: Select a date first before choosing a time

To fix: Run the availability rules SQL script in your Supabase dashboard (see "Adding Availability Rules" section above)

### Cannot See Any Venues

**Problem**: Home page shows "No venues found"

**Solution**:
1. Make sure you've created at least one venue via Admin → Add Venue
2. Ensure the venue's `is_active` field is set to `true`
3. Sign out and sign back in to refresh your session

### Booking Shows "No tables available"

**Problem**: When trying to book, all tables show as unavailable

**Solution**:
1. Make sure you've added tables to your venue (Admin → Edit Venue → Tables Management)
2. Check that tables are marked as `is_active = true`
3. Verify there are no conflicting bookings or active holds for that time slot
4. Try a different time slot or date

### Cannot Access Admin Dashboard

**Problem**: Admin link is not showing or not accessible

**Solution**:
1. Make sure you're signed in
2. The Admin link only appears for authenticated users
3. Sign out and sign back in to refresh authentication state

## Support

For issues or questions about the platform:
1. Check this troubleshooting section first
2. Review database schema and RLS policies in Supabase dashboard
3. Inspect browser console for frontend errors
4. Check Supabase dashboard for database errors
5. Verify environment variables are correctly set

---

Built with React, TypeScript, Tailwind CSS, and Supabase
