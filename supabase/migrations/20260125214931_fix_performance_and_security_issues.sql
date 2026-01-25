/*
  # Fix Performance and Security Issues

  ## Changes Made

  ### 1. Add Missing Foreign Key Indexes
  Foreign key columns need indexes for optimal query performance:
  - `availability_rules.venue_id`
  - `booking_units.bookable_unit_id`
  - `bookings.event_instance_id`
  - `cancellation_policies.venue_id`
  - `event_instances.venue_id`
  - `hold_units.bookable_unit_id`
  - `holds.event_instance_id`

  ### 2. Optimize RLS Policies
  Replace `auth.uid()` with `(select auth.uid())` in all RLS policies to prevent
  re-evaluation for each row, improving query performance at scale.

  ### 3. Secure Function Search Paths
  Add explicit search_path to functions to prevent search_path manipulation attacks.

  ## Notes
  - Unused indexes are kept as they may be needed for future queries
  - Multiple permissive policies are intentional for OR logic (user OR owner access)
  - Leaked password protection must be enabled in Supabase Dashboard under Auth settings
*/

-- =====================================================
-- 1. ADD MISSING FOREIGN KEY INDEXES
-- =====================================================

CREATE INDEX IF NOT EXISTS idx_availability_rules_venue_id 
  ON availability_rules(venue_id);

CREATE INDEX IF NOT EXISTS idx_booking_units_bookable_unit_id 
  ON booking_units(bookable_unit_id);

CREATE INDEX IF NOT EXISTS idx_bookings_event_instance_id 
  ON bookings(event_instance_id);

CREATE INDEX IF NOT EXISTS idx_cancellation_policies_venue_id 
  ON cancellation_policies(venue_id);

CREATE INDEX IF NOT EXISTS idx_event_instances_venue_id 
  ON event_instances(venue_id);

CREATE INDEX IF NOT EXISTS idx_hold_units_bookable_unit_id 
  ON hold_units(bookable_unit_id);

CREATE INDEX IF NOT EXISTS idx_holds_event_instance_id 
  ON holds(event_instance_id);

-- =====================================================
-- 2. OPTIMIZE RLS POLICIES - VENUES TABLE
-- =====================================================

DROP POLICY IF EXISTS "Venue owners can create venues" ON venues;
CREATE POLICY "Venue owners can create venues"
  ON venues FOR INSERT
  TO authenticated
  WITH CHECK (owner_id = (select auth.uid()));

DROP POLICY IF EXISTS "Venue owners can update their venues" ON venues;
CREATE POLICY "Venue owners can update their venues"
  ON venues FOR UPDATE
  TO authenticated
  USING (owner_id = (select auth.uid()))
  WITH CHECK (owner_id = (select auth.uid()));

DROP POLICY IF EXISTS "Venue owners can delete their venues" ON venues;
CREATE POLICY "Venue owners can delete their venues"
  ON venues FOR DELETE
  TO authenticated
  USING (owner_id = (select auth.uid()));

DROP POLICY IF EXISTS "Venue owners can view their own venues" ON venues;
CREATE POLICY "Venue owners can view their own venues"
  ON venues FOR SELECT
  TO authenticated
  USING (owner_id = (select auth.uid()));

-- =====================================================
-- 3. OPTIMIZE RLS POLICIES - AVAILABILITY_RULES TABLE
-- =====================================================

DROP POLICY IF EXISTS "Venue owners can manage their availability rules" ON availability_rules;
CREATE POLICY "Venue owners can manage their availability rules"
  ON availability_rules FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM venues 
      WHERE venues.id = availability_rules.venue_id 
      AND venues.owner_id = (select auth.uid())
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM venues 
      WHERE venues.id = availability_rules.venue_id 
      AND venues.owner_id = (select auth.uid())
    )
  );

-- =====================================================
-- 4. OPTIMIZE RLS POLICIES - BOOKABLE_UNITS TABLE
-- =====================================================

DROP POLICY IF EXISTS "Venue owners can manage their bookable units" ON bookable_units;
CREATE POLICY "Venue owners can manage their bookable units"
  ON bookable_units FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM venues 
      WHERE venues.id = bookable_units.venue_id 
      AND venues.owner_id = (select auth.uid())
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM venues 
      WHERE venues.id = bookable_units.venue_id 
      AND venues.owner_id = (select auth.uid())
    )
  );

-- =====================================================
-- 5. OPTIMIZE RLS POLICIES - EVENT_INSTANCES TABLE
-- =====================================================

DROP POLICY IF EXISTS "Venue owners can manage their event instances" ON event_instances;
CREATE POLICY "Venue owners can manage their event instances"
  ON event_instances FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM venues 
      WHERE venues.id = event_instances.venue_id 
      AND venues.owner_id = (select auth.uid())
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM venues 
      WHERE venues.id = event_instances.venue_id 
      AND venues.owner_id = (select auth.uid())
    )
  );

-- =====================================================
-- 6. OPTIMIZE RLS POLICIES - HOLDS TABLE
-- =====================================================

DROP POLICY IF EXISTS "Users can create holds" ON holds;
CREATE POLICY "Users can create holds"
  ON holds FOR INSERT
  TO authenticated
  WITH CHECK (user_id = (select auth.uid()));

DROP POLICY IF EXISTS "Users can update their own holds" ON holds;
CREATE POLICY "Users can update their own holds"
  ON holds FOR UPDATE
  TO authenticated
  USING (user_id = (select auth.uid()))
  WITH CHECK (user_id = (select auth.uid()));

DROP POLICY IF EXISTS "Users can view their own holds" ON holds;
CREATE POLICY "Users can view their own holds"
  ON holds FOR SELECT
  TO authenticated
  USING (user_id = (select auth.uid()));

DROP POLICY IF EXISTS "Venue owners can view holds for their venues" ON holds;
CREATE POLICY "Venue owners can view holds for their venues"
  ON holds FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM event_instances ei
      JOIN venues v ON v.id = ei.venue_id
      WHERE ei.id = holds.event_instance_id
      AND v.owner_id = (select auth.uid())
    )
  );

-- =====================================================
-- 7. OPTIMIZE RLS POLICIES - HOLD_UNITS TABLE
-- =====================================================

DROP POLICY IF EXISTS "Users can create hold units for their holds" ON hold_units;
CREATE POLICY "Users can create hold units for their holds"
  ON hold_units FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM holds 
      WHERE holds.id = hold_units.hold_id 
      AND holds.user_id = (select auth.uid())
    )
  );

DROP POLICY IF EXISTS "Users can view their own hold units" ON hold_units;
CREATE POLICY "Users can view their own hold units"
  ON hold_units FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM holds 
      WHERE holds.id = hold_units.hold_id 
      AND holds.user_id = (select auth.uid())
    )
  );

-- =====================================================
-- 8. OPTIMIZE RLS POLICIES - BOOKINGS TABLE
-- =====================================================

DROP POLICY IF EXISTS "Users can create bookings" ON bookings;
CREATE POLICY "Users can create bookings"
  ON bookings FOR INSERT
  TO authenticated
  WITH CHECK (user_id = (select auth.uid()));

DROP POLICY IF EXISTS "Users can update their own bookings" ON bookings;
CREATE POLICY "Users can update their own bookings"
  ON bookings FOR UPDATE
  TO authenticated
  USING (user_id = (select auth.uid()))
  WITH CHECK (user_id = (select auth.uid()));

DROP POLICY IF EXISTS "Users can view their own bookings" ON bookings;
CREATE POLICY "Users can view their own bookings"
  ON bookings FOR SELECT
  TO authenticated
  USING (user_id = (select auth.uid()));

DROP POLICY IF EXISTS "Venue owners can update bookings for their venues" ON bookings;
CREATE POLICY "Venue owners can update bookings for their venues"
  ON bookings FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM event_instances ei
      JOIN venues v ON v.id = ei.venue_id
      WHERE ei.id = bookings.event_instance_id
      AND v.owner_id = (select auth.uid())
    )
  );

DROP POLICY IF EXISTS "Venue owners can view bookings for their venues" ON bookings;
CREATE POLICY "Venue owners can view bookings for their venues"
  ON bookings FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM event_instances ei
      JOIN venues v ON v.id = ei.venue_id
      WHERE ei.id = bookings.event_instance_id
      AND v.owner_id = (select auth.uid())
    )
  );

-- =====================================================
-- 9. OPTIMIZE RLS POLICIES - BOOKING_UNITS TABLE
-- =====================================================

DROP POLICY IF EXISTS "Users can create booking units for their bookings" ON booking_units;
CREATE POLICY "Users can create booking units for their bookings"
  ON booking_units FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM bookings 
      WHERE bookings.id = booking_units.booking_id 
      AND bookings.user_id = (select auth.uid())
    )
  );

DROP POLICY IF EXISTS "Users can view their own booking units" ON booking_units;
CREATE POLICY "Users can view their own booking units"
  ON booking_units FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM bookings 
      WHERE bookings.id = booking_units.booking_id 
      AND bookings.user_id = (select auth.uid())
    )
  );

DROP POLICY IF EXISTS "Venue owners can view booking units for their venues" ON booking_units;
CREATE POLICY "Venue owners can view booking units for their venues"
  ON booking_units FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM bookings b
      JOIN event_instances ei ON ei.id = b.event_instance_id
      JOIN venues v ON v.id = ei.venue_id
      WHERE b.id = booking_units.booking_id
      AND v.owner_id = (select auth.uid())
    )
  );

-- =====================================================
-- 10. OPTIMIZE RLS POLICIES - CANCELLATION_POLICIES TABLE
-- =====================================================

DROP POLICY IF EXISTS "Venue owners can manage their cancellation policies" ON cancellation_policies;
CREATE POLICY "Venue owners can manage their cancellation policies"
  ON cancellation_policies FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM venues 
      WHERE venues.id = cancellation_policies.venue_id 
      AND venues.owner_id = (select auth.uid())
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM venues 
      WHERE venues.id = cancellation_policies.venue_id 
      AND venues.owner_id = (select auth.uid())
    )
  );

-- =====================================================
-- 11. OPTIMIZE RLS POLICIES - USER_ROLES TABLE
-- =====================================================

DROP POLICY IF EXISTS "Users can insert their own role" ON user_roles;
CREATE POLICY "Users can insert their own role"
  ON user_roles FOR INSERT
  TO authenticated
  WITH CHECK (user_id = (select auth.uid()) AND role = 'USER');

DROP POLICY IF EXISTS "Users can view their own role" ON user_roles;
CREATE POLICY "Users can view their own role"
  ON user_roles FOR SELECT
  TO authenticated
  USING (user_id = (select auth.uid()));

DROP POLICY IF EXISTS "Admins can manage all roles" ON user_roles;
CREATE POLICY "Admins can manage all roles"
  ON user_roles FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_roles 
      WHERE user_roles.user_id = (select auth.uid()) 
      AND user_roles.role = 'ADMIN'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_roles 
      WHERE user_roles.user_id = (select auth.uid()) 
      AND user_roles.role = 'ADMIN'
    )
  );

-- =====================================================
-- 12. SECURE FUNCTION SEARCH PATHS
-- =====================================================

CREATE OR REPLACE FUNCTION upgrade_to_manager(target_user_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  UPDATE user_roles 
  SET role = 'MANAGER' 
  WHERE user_id = target_user_id;
END;
$$;

CREATE OR REPLACE FUNCTION generate_confirmation_code()
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  chars text := 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  result text := '';
  i integer;
BEGIN
  FOR i IN 1..8 LOOP
    result := result || substr(chars, floor(random() * length(chars) + 1)::integer, 1);
  END LOOP;
  RETURN result;
END;
$$;

CREATE OR REPLACE FUNCTION set_confirmation_code()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  IF NEW.confirmation_code IS NULL THEN
    NEW.confirmation_code := generate_confirmation_code();
  END IF;
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION get_user_role(user_id uuid)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  user_role text;
BEGIN
  SELECT role INTO user_role
  FROM user_roles
  WHERE user_roles.user_id = get_user_role.user_id;
  
  RETURN COALESCE(user_role, 'USER');
END;
$$;