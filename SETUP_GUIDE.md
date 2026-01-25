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
3. **Edit your venue**: Click "Edit" on your newly created venue
4. **Set operating hours**: Scroll to the "Operating Hours" section and configure your schedule (REQUIRED)
5. **Add tables**: Scroll to "Tables Management" and add tables for your restaurant/café

#### Setting Operating Hours (REQUIRED)

**Without operating hours configured, the time selection will be disabled and customers cannot make bookings.**

To configure your venue's operating hours:

1. Go to **Admin → Edit Venue** (click the Edit button on your venue)
2. Scroll down to the **Operating Hours** section
3. For each day of the week:
   - Check the box to mark the day as open
   - Set opening and closing times
   - Configure slot duration (how long each reservation lasts, e.g., 90 minutes)
   - Set advance booking days (how far ahead customers can book, e.g., 30 days)
   - Set minimum and maximum party sizes
4. Use **"Copy to All Open Days"** to apply the same settings to all checked days
5. Click **"Save Operating Hours"**

**Example Settings:**
- Open Time: 11:00 AM
- Close Time: 10:00 PM
- Slot Duration: 90 minutes (typical for restaurants)
- Advance Booking Days: 30 days
- Min Party Size: 1
- Max Party Size: 12

Once saved, your venue will immediately show available time slots for bookings!

#### Alternative: SQL Method

If you prefer, you can still use the `add-availability-rules.sql` file with SQL queries in your Supabase dashboard, but the UI method above is much easier.

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
