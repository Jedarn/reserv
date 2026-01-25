-- Sample Data for ReserveHub Platform
-- Run this in Supabase SQL Editor after creating your account
-- IMPORTANT: Replace 'YOUR_USER_ID' with your actual auth.users ID

-- You can get your user ID by running: SELECT id FROM auth.users WHERE email = 'your-email@example.com';

-- Sample Restaurants
INSERT INTO venues (name, category, description, location, contact, images, rating, price_range, amenities, owner_id, is_active)
VALUES
  (
    'The Elegant Bistro',
    'RESTAURANT',
    'A sophisticated dining experience featuring contemporary European cuisine with locally sourced ingredients. Our chef brings over 20 years of culinary expertise to every plate.',
    '{"city": "New York", "address": "123 Park Avenue", "country": "USA", "coordinates": {"lat": 40.7589, "lng": -73.9851}}'::jsonb,
    '{"phone": "+1 (212) 555-0100", "email": "info@elegantbistro.com", "website": "https://elegantbistro.com"}'::jsonb,
    '["https://images.pexels.com/photos/262978/pexels-photo-262978.jpeg"]'::jsonb,
    4.7,
    '$$$',
    '["WiFi", "Wheelchair Accessible", "Outdoor Seating", "Bar", "Private Dining"]'::jsonb,
    'YOUR_USER_ID',
    true
  ),
  (
    'Bella Italia',
    'RESTAURANT',
    'Authentic Italian restaurant bringing the flavors of Rome to your table. Family recipes passed down through generations.',
    '{"city": "Boston", "address": "456 Hanover Street", "country": "USA"}'::jsonb,
    '{"phone": "+1 (617) 555-0200", "email": "hello@bellaitalia.com"}'::jsonb,
    '["https://images.pexels.com/photos/1581384/pexels-photo-1581384.jpeg"]'::jsonb,
    4.5,
    '$$',
    '["WiFi", "Outdoor Seating", "Wine Bar", "Family Friendly"]'::jsonb,
    'YOUR_USER_ID',
    true
  );

-- Sample Cafés
INSERT INTO venues (name, category, description, location, contact, images, rating, price_range, amenities, owner_id, is_active)
VALUES
  (
    'Artisan Coffee House',
    'CAFE',
    'Specialty coffee roasted in-house. A cozy space perfect for remote work or catching up with friends.',
    '{"city": "San Francisco", "address": "789 Valencia Street", "country": "USA"}'::jsonb,
    '{"phone": "+1 (415) 555-0300", "email": "info@artisancoffee.com"}'::jsonb,
    '["https://images.pexels.com/photos/1307698/pexels-photo-1307698.jpeg"]'::jsonb,
    4.8,
    '$',
    '["WiFi", "Power Outlets", "Vegan Options", "Outdoor Seating"]'::jsonb,
    'YOUR_USER_ID',
    true
  );

-- Sample Hotels
INSERT INTO venues (name, category, description, location, contact, images, rating, price_range, amenities, owner_id, is_active)
VALUES
  (
    'Grand Plaza Hotel',
    'HOTEL',
    'Luxury accommodations in the heart of downtown. Featuring world-class amenities and exceptional service.',
    '{"city": "Chicago", "address": "100 Michigan Avenue", "country": "USA"}'::jsonb,
    '{"phone": "+1 (312) 555-0400", "email": "reservations@grandplaza.com", "website": "https://grandplaza.com"}'::jsonb,
    '["https://images.pexels.com/photos/258154/pexels-photo-258154.jpeg"]'::jsonb,
    4.6,
    '$$$$',
    '["WiFi", "Pool", "Gym", "Spa", "Restaurant", "Room Service", "Parking", "Concierge"]'::jsonb,
    'YOUR_USER_ID',
    true
  );

-- To add tables for The Elegant Bistro, first get the venue_id:
-- SELECT id FROM venues WHERE name = 'The Elegant Bistro';
-- Then run this (replace VENUE_ID_HERE):

/*
INSERT INTO bookable_units (venue_id, unit_type, unit_name, capacity, min_capacity, section, is_active)
VALUES
  ('VENUE_ID_HERE', 'TABLE', 'Table 1', 4, 2, 'Main Dining', true),
  ('VENUE_ID_HERE', 'TABLE', 'Table 2', 4, 2, 'Main Dining', true),
  ('VENUE_ID_HERE', 'TABLE', 'Table 3', 2, 1, 'Main Dining', true),
  ('VENUE_ID_HERE', 'TABLE', 'Table 4', 2, 1, 'Main Dining', true),
  ('VENUE_ID_HERE', 'TABLE', 'Table 5', 6, 4, 'Main Dining', true),
  ('VENUE_ID_HERE', 'TABLE', 'Table 6', 6, 4, 'Main Dining', true),
  ('VENUE_ID_HERE', 'TABLE', 'Table 7', 8, 6, 'Private Room', true),
  ('VENUE_ID_HERE', 'TABLE', 'Booth 1', 4, 2, 'Bar Area', true),
  ('VENUE_ID_HERE', 'TABLE', 'Booth 2', 4, 2, 'Bar Area', true);
*/

-- Add availability rules for The Elegant Bistro
-- (Replace VENUE_ID_HERE with the actual venue ID)

/*
-- Monday to Thursday (11 AM - 10 PM)
INSERT INTO availability_rules (venue_id, day_of_week, open_time, close_time, slot_duration_minutes, advance_booking_days, min_party_size, max_party_size, is_active)
VALUES
  ('VENUE_ID_HERE', 1, '11:00:00', '22:00:00', 90, 30, 1, 12, true),
  ('VENUE_ID_HERE', 2, '11:00:00', '22:00:00', 90, 30, 1, 12, true),
  ('VENUE_ID_HERE', 3, '11:00:00', '22:00:00', 90, 30, 1, 12, true),
  ('VENUE_ID_HERE', 4, '11:00:00', '22:00:00', 90, 30, 1, 12, true);

-- Friday (11 AM - 11 PM)
INSERT INTO availability_rules (venue_id, day_of_week, open_time, close_time, slot_duration_minutes, advance_booking_days, min_party_size, max_party_size, is_active)
VALUES
  ('VENUE_ID_HERE', 5, '11:00:00', '23:00:00', 90, 30, 1, 12, true);

-- Saturday (10 AM - 11 PM)
INSERT INTO availability_rules (venue_id, day_of_week, open_time, close_time, slot_duration_minutes, advance_booking_days, min_party_size, max_party_size, is_active)
VALUES
  ('VENUE_ID_HERE', 6, '10:00:00', '23:00:00', 90, 30, 1, 12, true);

-- Sunday (10 AM - 9 PM)
INSERT INTO availability_rules (venue_id, day_of_week, open_time, close_time, slot_duration_minutes, advance_booking_days, min_party_size, max_party_size, is_active)
VALUES
  ('VENUE_ID_HERE', 0, '10:00:00', '21:00:00', 90, 30, 1, 12, true);
*/

-- How to use this file:
-- 1. Create an account in the ReserveHub application
-- 2. Get your user ID by running: SELECT id FROM auth.users WHERE email = 'your-email@example.com';
-- 3. Replace all 'YOUR_USER_ID' with your actual user ID
-- 4. Run the INSERT statements for venues
-- 5. Get the venue IDs: SELECT id, name FROM venues WHERE owner_id = 'YOUR_USER_ID';
-- 6. Uncomment and update the bookable_units and availability_rules sections
-- 7. Replace VENUE_ID_HERE with the actual venue IDs
-- 8. Run the remaining INSERT statements
