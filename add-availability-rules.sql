-- Quick script to add availability rules to a venue
-- This makes your venue bookable by adding operating hours

-- STEP 1: Find your venue ID
-- Run this query and copy the ID of the venue you want to configure:
SELECT id, name, category FROM venues WHERE owner_id = auth.uid();

-- STEP 2: Replace 'YOUR_VENUE_ID' below with the actual ID from Step 1

-- Option A: Standard Restaurant Hours (Monday-Sunday, 11 AM - 10 PM)
INSERT INTO availability_rules (
  venue_id,
  day_of_week,
  open_time,
  close_time,
  slot_duration_minutes,
  advance_booking_days,
  min_party_size,
  max_party_size,
  is_active
)
VALUES
  -- Monday
  ('YOUR_VENUE_ID', 1, '11:00:00', '22:00:00', 90, 30, 1, 12, true),
  -- Tuesday
  ('YOUR_VENUE_ID', 2, '11:00:00', '22:00:00', 90, 30, 1, 12, true),
  -- Wednesday
  ('YOUR_VENUE_ID', 3, '11:00:00', '22:00:00', 90, 30, 1, 12, true),
  -- Thursday
  ('YOUR_VENUE_ID', 4, '11:00:00', '22:00:00', 90, 30, 1, 12, true),
  -- Friday
  ('YOUR_VENUE_ID', 5, '11:00:00', '23:00:00', 90, 30, 1, 12, true),
  -- Saturday
  ('YOUR_VENUE_ID', 6, '10:00:00', '23:00:00', 90, 30, 1, 12, true),
  -- Sunday
  ('YOUR_VENUE_ID', 0, '10:00:00', '22:00:00', 90, 30, 1, 12, true);

-- Option B: Lunch & Dinner Service (Closed 3-5 PM)
-- Uncomment if you want split shifts instead:

/*
-- Lunch Service (11 AM - 3 PM)
INSERT INTO availability_rules (venue_id, day_of_week, open_time, close_time, slot_duration_minutes, advance_booking_days, min_party_size, max_party_size, is_active)
VALUES
  ('YOUR_VENUE_ID', 1, '11:00:00', '15:00:00', 90, 30, 1, 12, true),
  ('YOUR_VENUE_ID', 2, '11:00:00', '15:00:00', 90, 30, 1, 12, true),
  ('YOUR_VENUE_ID', 3, '11:00:00', '15:00:00', 90, 30, 1, 12, true),
  ('YOUR_VENUE_ID', 4, '11:00:00', '15:00:00', 90, 30, 1, 12, true),
  ('YOUR_VENUE_ID', 5, '11:00:00', '15:00:00', 90, 30, 1, 12, true),
  ('YOUR_VENUE_ID', 6, '11:00:00', '15:00:00', 90, 30, 1, 12, true),
  ('YOUR_VENUE_ID', 0, '11:00:00', '15:00:00', 90, 30, 1, 12, true);

-- Dinner Service (5 PM - 10 PM)
INSERT INTO availability_rules (venue_id, day_of_week, open_time, close_time, slot_duration_minutes, advance_booking_days, min_party_size, max_party_size, is_active)
VALUES
  ('YOUR_VENUE_ID', 1, '17:00:00', '22:00:00', 90, 30, 1, 12, true),
  ('YOUR_VENUE_ID', 2, '17:00:00', '22:00:00', 90, 30, 1, 12, true),
  ('YOUR_VENUE_ID', 3, '17:00:00', '22:00:00', 90, 30, 1, 12, true),
  ('YOUR_VENUE_ID', 4, '17:00:00', '22:00:00', 90, 30, 1, 12, true),
  ('YOUR_VENUE_ID', 5, '17:00:00', '23:00:00', 90, 30, 1, 12, true),
  ('YOUR_VENUE_ID', 6, '17:00:00', '23:00:00', 90, 30, 1, 12, true),
  ('YOUR_VENUE_ID', 0, '17:00:00', '22:00:00', 90, 30, 1, 12, true);
*/

-- Option C: Café Hours (7 AM - 6 PM, 7 days a week)
-- Uncomment for café schedule:

/*
INSERT INTO availability_rules (venue_id, day_of_week, open_time, close_time, slot_duration_minutes, advance_booking_days, min_party_size, max_party_size, is_active)
VALUES
  ('YOUR_VENUE_ID', 0, '07:00:00', '18:00:00', 60, 14, 1, 8, true),
  ('YOUR_VENUE_ID', 1, '07:00:00', '18:00:00', 60, 14, 1, 8, true),
  ('YOUR_VENUE_ID', 2, '07:00:00', '18:00:00', 60, 14, 1, 8, true),
  ('YOUR_VENUE_ID', 3, '07:00:00', '18:00:00', 60, 14, 1, 8, true),
  ('YOUR_VENUE_ID', 4, '07:00:00', '18:00:00', 60, 14, 1, 8, true),
  ('YOUR_VENUE_ID', 5, '07:00:00', '19:00:00', 60, 14, 1, 8, true),
  ('YOUR_VENUE_ID', 6, '08:00:00', '19:00:00', 60, 14, 1, 8, true);
*/

-- PARAMETER EXPLANATIONS:
-- day_of_week: 0=Sunday, 1=Monday, 2=Tuesday, 3=Wednesday, 4=Thursday, 5=Friday, 6=Saturday
-- open_time: Opening time in 24-hour format (HH:MM:SS)
-- close_time: Closing time in 24-hour format (HH:MM:SS)
-- slot_duration_minutes: How long each reservation slot lasts (typically 60-120 minutes)
-- advance_booking_days: How many days in advance customers can book (e.g., 30 = 1 month)
-- min_party_size: Minimum number of guests (typically 1)
-- max_party_size: Maximum number of guests (adjust based on your venue)
-- is_active: true = rule is active, false = disabled

-- After running this script, your venue will show available time slots for bookings!

-- To verify it worked, run:
-- SELECT * FROM availability_rules WHERE venue_id = 'YOUR_VENUE_ID';
