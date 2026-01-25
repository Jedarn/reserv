/*
  # Unified Reservation Platform Schema

  ## Overview
  Complete database schema for a unified reservation platform supporting restaurants, cafés, hotels, events, and concerts.

  ## New Tables
  
  ### `venues`
  Stores all venue information (restaurants, hotels, event venues, etc.)
  - `id` (uuid, primary key)
  - `name` (text) - venue name
  - `category` (text) - RESTAURANT, CAFE, HOTEL, EVENT, CONCERT
  - `description` (text) - venue description
  - `location` (jsonb) - address, coordinates, city, country
  - `contact` (jsonb) - phone, email, website
  - `images` (jsonb) - array of image URLs
  - `rating` (numeric) - average rating
  - `price_range` (text) - $, $$, $$$, $$$$
  - `amenities` (jsonb) - array of amenities/features
  - `policies` (jsonb) - general policies
  - `owner_id` (uuid) - reference to auth.users
  - `is_active` (boolean) - venue active status
  - `created_at` (timestamptz)
  - `updated_at` (timestamptz)

  ### `availability_rules`
  Operating hours and availability rules for venues
  - `id` (uuid, primary key)
  - `venue_id` (uuid) - reference to venues
  - `day_of_week` (integer) - 0=Sunday, 6=Saturday
  - `open_time` (time) - opening time
  - `close_time` (time) - closing time
  - `slot_duration_minutes` (integer) - for restaurants (e.g., 90 min slots)
  - `advance_booking_days` (integer) - how far ahead can book
  - `min_party_size` (integer)
  - `max_party_size` (integer)
  - `is_active` (boolean)

  ### `bookable_units`
  Inventory that can be reserved (tables, seats, rooms)
  - `id` (uuid, primary key)
  - `venue_id` (uuid) - reference to venues
  - `unit_type` (text) - TABLE, SEAT, ROOM
  - `unit_name` (text) - e.g., "Table 5", "Seat A-12", "Deluxe Room 201"
  - `capacity` (integer) - max occupancy
  - `min_capacity` (integer) - min occupancy (for tables)
  - `section` (text) - optional section/area
  - `position` (jsonb) - coordinates for floor plan {x, y}
  - `price_tier` (text) - STANDARD, PREMIUM, VIP
  - `base_price` (numeric) - base price for the unit
  - `attributes` (jsonb) - wheelchair accessible, window seat, etc.
  - `is_active` (boolean)
  - `created_at` (timestamptz)

  ### `event_instances`
  Specific date/time instances of events or concerts
  - `id` (uuid, primary key)
  - `venue_id` (uuid) - reference to venues
  - `title` (text) - event title
  - `description` (text)
  - `start_time` (timestamptz)
  - `end_time` (timestamptz)
  - `door_open_time` (timestamptz)
  - `total_capacity` (integer)
  - `available_capacity` (integer)
  - `status` (text) - SCHEDULED, ONGOING, COMPLETED, CANCELLED
  - `images` (jsonb)
  - `created_at` (timestamptz)

  ### `holds`
  Temporary locks on bookable units to prevent double booking
  - `id` (uuid, primary key)
  - `user_id` (uuid) - reference to auth.users
  - `venue_id` (uuid) - reference to venues
  - `event_instance_id` (uuid) - optional, for events
  - `hold_type` (text) - RESTAURANT, EVENT, HOTEL
  - `booking_datetime` (timestamptz) - for restaurants (specific reservation time)
  - `check_in_date` (date) - for hotels
  - `check_out_date` (date) - for hotels
  - `party_size` (integer)
  - `expires_at` (timestamptz) - hold expiration (typically 10-15 minutes)
  - `status` (text) - ACTIVE, EXPIRED, CONVERTED, RELEASED
  - `created_at` (timestamptz)

  ### `hold_units`
  Junction table linking holds to specific bookable units
  - `id` (uuid, primary key)
  - `hold_id` (uuid) - reference to holds
  - `bookable_unit_id` (uuid) - reference to bookable_units
  - `created_at` (timestamptz)

  ### `bookings`
  Confirmed reservations
  - `id` (uuid, primary key)
  - `user_id` (uuid) - reference to auth.users
  - `venue_id` (uuid) - reference to venues
  - `event_instance_id` (uuid) - optional, for events
  - `booking_type` (text) - RESTAURANT, EVENT, HOTEL
  - `booking_datetime` (timestamptz) - for restaurants
  - `check_in_date` (date) - for hotels
  - `check_out_date` (date) - for hotels
  - `party_size` (integer)
  - `customer_name` (text)
  - `customer_email` (text)
  - `customer_phone` (text)
  - `special_requests` (text)
  - `status` (text) - CONFIRMED, CHECKED_IN, COMPLETED, CANCELLED, NO_SHOW
  - `total_amount` (numeric)
  - `deposit_amount` (numeric)
  - `payment_status` (text) - PENDING, PAID, REFUNDED
  - `confirmation_code` (text) - unique code for booking
  - `qr_code` (text) - for event tickets
  - `notes` (text) - admin notes
  - `created_at` (timestamptz)
  - `updated_at` (timestamptz)

  ### `booking_units`
  Junction table linking bookings to specific bookable units
  - `id` (uuid, primary key)
  - `booking_id` (uuid) - reference to bookings
  - `bookable_unit_id` (uuid) - reference to bookable_units
  - `created_at` (timestamptz)

  ### `cancellation_policies`
  Cancellation and refund policies
  - `id` (uuid, primary key)
  - `venue_id` (uuid) - reference to venues
  - `policy_name` (text)
  - `hours_before` (integer) - hours before booking to allow cancellation
  - `refund_percentage` (integer) - 0-100
  - `applies_to` (text) - RESTAURANT, EVENT, HOTEL, ALL
  - `description` (text)
  - `is_active` (boolean)
  - `created_at` (timestamptz)

  ## Security
  - Enable RLS on all tables
  - Policies for authenticated users to read public venue data
  - Policies for venue owners to manage their venues
  - Policies for users to manage their own bookings
*/

-- Create venues table
CREATE TABLE IF NOT EXISTS venues (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  category text NOT NULL CHECK (category IN ('RESTAURANT', 'CAFE', 'HOTEL', 'EVENT', 'CONCERT')),
  description text,
  location jsonb DEFAULT '{}',
  contact jsonb DEFAULT '{}',
  images jsonb DEFAULT '[]',
  rating numeric(3,2) DEFAULT 0,
  price_range text CHECK (price_range IN ('$', '$$', '$$$', '$$$$')),
  amenities jsonb DEFAULT '[]',
  policies jsonb DEFAULT '{}',
  owner_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create availability_rules table
CREATE TABLE IF NOT EXISTS availability_rules (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  venue_id uuid REFERENCES venues(id) ON DELETE CASCADE NOT NULL,
  day_of_week integer CHECK (day_of_week >= 0 AND day_of_week <= 6),
  open_time time NOT NULL,
  close_time time NOT NULL,
  slot_duration_minutes integer DEFAULT 90,
  advance_booking_days integer DEFAULT 30,
  min_party_size integer DEFAULT 1,
  max_party_size integer DEFAULT 20,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

-- Create bookable_units table
CREATE TABLE IF NOT EXISTS bookable_units (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  venue_id uuid REFERENCES venues(id) ON DELETE CASCADE NOT NULL,
  unit_type text NOT NULL CHECK (unit_type IN ('TABLE', 'SEAT', 'ROOM')),
  unit_name text NOT NULL,
  capacity integer NOT NULL DEFAULT 1,
  min_capacity integer DEFAULT 1,
  section text,
  position jsonb DEFAULT '{}',
  price_tier text DEFAULT 'STANDARD' CHECK (price_tier IN ('STANDARD', 'PREMIUM', 'VIP')),
  base_price numeric(10,2) DEFAULT 0,
  attributes jsonb DEFAULT '{}',
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

-- Create event_instances table
CREATE TABLE IF NOT EXISTS event_instances (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  venue_id uuid REFERENCES venues(id) ON DELETE CASCADE NOT NULL,
  title text NOT NULL,
  description text,
  start_time timestamptz NOT NULL,
  end_time timestamptz NOT NULL,
  door_open_time timestamptz,
  total_capacity integer DEFAULT 0,
  available_capacity integer DEFAULT 0,
  status text DEFAULT 'SCHEDULED' CHECK (status IN ('SCHEDULED', 'ONGOING', 'COMPLETED', 'CANCELLED')),
  images jsonb DEFAULT '[]',
  created_at timestamptz DEFAULT now()
);

-- Create holds table
CREATE TABLE IF NOT EXISTS holds (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  venue_id uuid REFERENCES venues(id) ON DELETE CASCADE NOT NULL,
  event_instance_id uuid REFERENCES event_instances(id) ON DELETE CASCADE,
  hold_type text NOT NULL CHECK (hold_type IN ('RESTAURANT', 'EVENT', 'HOTEL')),
  booking_datetime timestamptz,
  check_in_date date,
  check_out_date date,
  party_size integer NOT NULL,
  expires_at timestamptz NOT NULL,
  status text DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE', 'EXPIRED', 'CONVERTED', 'RELEASED')),
  created_at timestamptz DEFAULT now()
);

-- Create hold_units junction table
CREATE TABLE IF NOT EXISTS hold_units (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  hold_id uuid REFERENCES holds(id) ON DELETE CASCADE NOT NULL,
  bookable_unit_id uuid REFERENCES bookable_units(id) ON DELETE CASCADE NOT NULL,
  created_at timestamptz DEFAULT now(),
  UNIQUE(hold_id, bookable_unit_id)
);

-- Create bookings table
CREATE TABLE IF NOT EXISTS bookings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  venue_id uuid REFERENCES venues(id) ON DELETE CASCADE NOT NULL,
  event_instance_id uuid REFERENCES event_instances(id) ON DELETE CASCADE,
  booking_type text NOT NULL CHECK (booking_type IN ('RESTAURANT', 'EVENT', 'HOTEL')),
  booking_datetime timestamptz,
  check_in_date date,
  check_out_date date,
  party_size integer NOT NULL,
  customer_name text NOT NULL,
  customer_email text NOT NULL,
  customer_phone text,
  special_requests text,
  status text DEFAULT 'CONFIRMED' CHECK (status IN ('CONFIRMED', 'CHECKED_IN', 'COMPLETED', 'CANCELLED', 'NO_SHOW')),
  total_amount numeric(10,2) DEFAULT 0,
  deposit_amount numeric(10,2) DEFAULT 0,
  payment_status text DEFAULT 'PENDING' CHECK (payment_status IN ('PENDING', 'PAID', 'REFUNDED')),
  confirmation_code text UNIQUE NOT NULL,
  qr_code text,
  notes text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create booking_units junction table
CREATE TABLE IF NOT EXISTS booking_units (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id uuid REFERENCES bookings(id) ON DELETE CASCADE NOT NULL,
  bookable_unit_id uuid REFERENCES bookable_units(id) ON DELETE CASCADE NOT NULL,
  created_at timestamptz DEFAULT now(),
  UNIQUE(booking_id, bookable_unit_id)
);

-- Create cancellation_policies table
CREATE TABLE IF NOT EXISTS cancellation_policies (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  venue_id uuid REFERENCES venues(id) ON DELETE CASCADE NOT NULL,
  policy_name text NOT NULL,
  hours_before integer NOT NULL,
  refund_percentage integer CHECK (refund_percentage >= 0 AND refund_percentage <= 100),
  applies_to text CHECK (applies_to IN ('RESTAURANT', 'EVENT', 'HOTEL', 'ALL')),
  description text,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_venues_category ON venues(category);
CREATE INDEX IF NOT EXISTS idx_venues_owner ON venues(owner_id);
CREATE INDEX IF NOT EXISTS idx_venues_active ON venues(is_active);
CREATE INDEX IF NOT EXISTS idx_bookable_units_venue ON bookable_units(venue_id);
CREATE INDEX IF NOT EXISTS idx_bookable_units_type ON bookable_units(unit_type);
CREATE INDEX IF NOT EXISTS idx_holds_user ON holds(user_id);
CREATE INDEX IF NOT EXISTS idx_holds_venue ON holds(venue_id);
CREATE INDEX IF NOT EXISTS idx_holds_status ON holds(status);
CREATE INDEX IF NOT EXISTS idx_holds_expires ON holds(expires_at);
CREATE INDEX IF NOT EXISTS idx_bookings_user ON bookings(user_id);
CREATE INDEX IF NOT EXISTS idx_bookings_venue ON bookings(venue_id);
CREATE INDEX IF NOT EXISTS idx_bookings_status ON bookings(status);
CREATE INDEX IF NOT EXISTS idx_bookings_datetime ON bookings(booking_datetime);
CREATE INDEX IF NOT EXISTS idx_bookings_confirmation ON bookings(confirmation_code);

-- Enable Row Level Security
ALTER TABLE venues ENABLE ROW LEVEL SECURITY;
ALTER TABLE availability_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE bookable_units ENABLE ROW LEVEL SECURITY;
ALTER TABLE event_instances ENABLE ROW LEVEL SECURITY;
ALTER TABLE holds ENABLE ROW LEVEL SECURITY;
ALTER TABLE hold_units ENABLE ROW LEVEL SECURITY;
ALTER TABLE bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE booking_units ENABLE ROW LEVEL SECURITY;
ALTER TABLE cancellation_policies ENABLE ROW LEVEL SECURITY;

-- RLS Policies for venues
CREATE POLICY "Anyone can view active venues"
  ON venues FOR SELECT
  TO authenticated, anon
  USING (is_active = true);

CREATE POLICY "Venue owners can view their own venues"
  ON venues FOR SELECT
  TO authenticated
  USING (auth.uid() = owner_id);

CREATE POLICY "Venue owners can create venues"
  ON venues FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = owner_id);

CREATE POLICY "Venue owners can update their venues"
  ON venues FOR UPDATE
  TO authenticated
  USING (auth.uid() = owner_id)
  WITH CHECK (auth.uid() = owner_id);

CREATE POLICY "Venue owners can delete their venues"
  ON venues FOR DELETE
  TO authenticated
  USING (auth.uid() = owner_id);

-- RLS Policies for availability_rules
CREATE POLICY "Anyone can view availability rules for active venues"
  ON availability_rules FOR SELECT
  TO authenticated, anon
  USING (
    EXISTS (
      SELECT 1 FROM venues
      WHERE venues.id = availability_rules.venue_id
      AND venues.is_active = true
    )
  );

CREATE POLICY "Venue owners can manage their availability rules"
  ON availability_rules FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM venues
      WHERE venues.id = availability_rules.venue_id
      AND venues.owner_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM venues
      WHERE venues.id = availability_rules.venue_id
      AND venues.owner_id = auth.uid()
    )
  );

-- RLS Policies for bookable_units
CREATE POLICY "Anyone can view active bookable units"
  ON bookable_units FOR SELECT
  TO authenticated, anon
  USING (
    is_active = true AND
    EXISTS (
      SELECT 1 FROM venues
      WHERE venues.id = bookable_units.venue_id
      AND venues.is_active = true
    )
  );

CREATE POLICY "Venue owners can manage their bookable units"
  ON bookable_units FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM venues
      WHERE venues.id = bookable_units.venue_id
      AND venues.owner_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM venues
      WHERE venues.id = bookable_units.venue_id
      AND venues.owner_id = auth.uid()
    )
  );

-- RLS Policies for event_instances
CREATE POLICY "Anyone can view scheduled event instances"
  ON event_instances FOR SELECT
  TO authenticated, anon
  USING (status = 'SCHEDULED' OR status = 'ONGOING');

CREATE POLICY "Venue owners can manage their event instances"
  ON event_instances FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM venues
      WHERE venues.id = event_instances.venue_id
      AND venues.owner_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM venues
      WHERE venues.id = event_instances.venue_id
      AND venues.owner_id = auth.uid()
    )
  );

-- RLS Policies for holds
CREATE POLICY "Users can view their own holds"
  ON holds FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create holds"
  ON holds FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own holds"
  ON holds FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Venue owners can view holds for their venues"
  ON holds FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM venues
      WHERE venues.id = holds.venue_id
      AND venues.owner_id = auth.uid()
    )
  );

-- RLS Policies for hold_units
CREATE POLICY "Users can view their own hold units"
  ON hold_units FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM holds
      WHERE holds.id = hold_units.hold_id
      AND holds.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create hold units for their holds"
  ON hold_units FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM holds
      WHERE holds.id = hold_units.hold_id
      AND holds.user_id = auth.uid()
    )
  );

-- RLS Policies for bookings
CREATE POLICY "Users can view their own bookings"
  ON bookings FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create bookings"
  ON bookings FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own bookings"
  ON bookings FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Venue owners can view bookings for their venues"
  ON bookings FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM venues
      WHERE venues.id = bookings.venue_id
      AND venues.owner_id = auth.uid()
    )
  );

CREATE POLICY "Venue owners can update bookings for their venues"
  ON bookings FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM venues
      WHERE venues.id = bookings.venue_id
      AND venues.owner_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM venues
      WHERE venues.id = bookings.venue_id
      AND venues.owner_id = auth.uid()
    )
  );

-- RLS Policies for booking_units
CREATE POLICY "Users can view their own booking units"
  ON booking_units FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM bookings
      WHERE bookings.id = booking_units.booking_id
      AND bookings.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create booking units for their bookings"
  ON booking_units FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM bookings
      WHERE bookings.id = booking_units.booking_id
      AND bookings.user_id = auth.uid()
    )
  );

CREATE POLICY "Venue owners can view booking units for their venues"
  ON booking_units FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM bookings
      JOIN venues ON venues.id = bookings.venue_id
      WHERE bookings.id = booking_units.booking_id
      AND venues.owner_id = auth.uid()
    )
  );

-- RLS Policies for cancellation_policies
CREATE POLICY "Anyone can view active cancellation policies"
  ON cancellation_policies FOR SELECT
  TO authenticated, anon
  USING (
    is_active = true AND
    EXISTS (
      SELECT 1 FROM venues
      WHERE venues.id = cancellation_policies.venue_id
      AND venues.is_active = true
    )
  );

CREATE POLICY "Venue owners can manage their cancellation policies"
  ON cancellation_policies FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM venues
      WHERE venues.id = cancellation_policies.venue_id
      AND venues.owner_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM venues
      WHERE venues.id = cancellation_policies.venue_id
      AND venues.owner_id = auth.uid()
    )
  );

-- Function to generate confirmation code
CREATE OR REPLACE FUNCTION generate_confirmation_code()
RETURNS text AS $$
DECLARE
  chars text := 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  result text := '';
  i integer;
BEGIN
  FOR i IN 1..8 LOOP
    result := result || substr(chars, floor(random() * length(chars) + 1)::integer, 1);
  END LOOP;
  RETURN result;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-generate confirmation code
CREATE OR REPLACE FUNCTION set_confirmation_code()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.confirmation_code IS NULL OR NEW.confirmation_code = '' THEN
    NEW.confirmation_code := generate_confirmation_code();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER ensure_confirmation_code
  BEFORE INSERT ON bookings
  FOR EACH ROW
  EXECUTE FUNCTION set_confirmation_code();

-- Trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_venues_updated_at
  BEFORE UPDATE ON venues
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_bookings_updated_at
  BEFORE UPDATE ON bookings
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();