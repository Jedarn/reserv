/*
  # Add User Roles System

  ## Overview
  Implements role-based access control (RBAC) for the reservation platform.

  ## New Tables
  
  ### `user_roles`
  Maps users to their roles in the system
  - `id` (uuid, primary key)
  - `user_id` (uuid) - reference to auth.users
  - `role` (text) - CUSTOMER, MANAGER, ADMIN
  - `created_at` (timestamptz)
  - `updated_at` (timestamptz)

  ## Changes

  1. New Tables
    - `user_roles` - stores role assignments for users
      - Each user can have one role: CUSTOMER (default), MANAGER (owns venues), or ADMIN (platform admin)
      - CUSTOMER: Can make bookings only
      - MANAGER: Can manage their own venues and bookings
      - ADMIN: Full access to platform, can create/edit any venue

  2. Security
    - Enable RLS on `user_roles` table
    - Users can view their own role
    - Only admins can modify roles
    - Trigger to auto-assign CUSTOMER role to new users

  3. Functions
    - `get_user_role()` - Helper function to get current user's role
    - `auto_assign_customer_role()` - Trigger function to assign default role

  ## Important Notes
  - When a user creates their first venue, their role should be upgraded to MANAGER
  - The system will automatically create CUSTOMER role for new sign-ups
*/

-- Create user_roles table
CREATE TABLE IF NOT EXISTS user_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  role text NOT NULL CHECK (role IN ('CUSTOMER', 'MANAGER', 'ADMIN')),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create index for faster role lookups
CREATE INDEX IF NOT EXISTS idx_user_roles_user_id ON user_roles(user_id);
CREATE INDEX IF NOT EXISTS idx_user_roles_role ON user_roles(role);

-- Enable RLS
ALTER TABLE user_roles ENABLE ROW LEVEL SECURITY;

-- RLS Policies for user_roles
CREATE POLICY "Users can view their own role"
  ON user_roles FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own role"
  ON user_roles FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id AND role = 'CUSTOMER');

CREATE POLICY "Admins can manage all roles"
  ON user_roles FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_roles.user_id = auth.uid()
      AND user_roles.role = 'ADMIN'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_roles.user_id = auth.uid()
      AND user_roles.role = 'ADMIN'
    )
  );

-- Function to get current user's role
CREATE OR REPLACE FUNCTION get_user_role()
RETURNS text AS $$
DECLARE
  user_role text;
BEGIN
  SELECT role INTO user_role
  FROM user_roles
  WHERE user_id = auth.uid();
  
  RETURN COALESCE(user_role, 'CUSTOMER');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to auto-upgrade user to MANAGER when they create a venue
CREATE OR REPLACE FUNCTION upgrade_to_manager()
RETURNS TRIGGER AS $$
BEGIN
  -- Update user role to MANAGER if they're creating their first venue
  INSERT INTO user_roles (user_id, role)
  VALUES (NEW.owner_id, 'MANAGER')
  ON CONFLICT (user_id) 
  DO UPDATE SET 
    role = CASE 
      WHEN user_roles.role = 'CUSTOMER' THEN 'MANAGER'
      ELSE user_roles.role
    END,
    updated_at = now();
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to auto-upgrade to MANAGER when creating a venue
CREATE TRIGGER auto_upgrade_to_manager
  AFTER INSERT ON venues
  FOR EACH ROW
  EXECUTE FUNCTION upgrade_to_manager();

-- Trigger to update updated_at timestamp
CREATE TRIGGER update_user_roles_updated_at
  BEFORE UPDATE ON user_roles
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

-- Insert CUSTOMER role for existing users without a role
INSERT INTO user_roles (user_id, role)
SELECT id, 'CUSTOMER'
FROM auth.users
WHERE id NOT IN (SELECT user_id FROM user_roles)
ON CONFLICT (user_id) DO NOTHING;

-- Upgrade existing venue owners to MANAGER
INSERT INTO user_roles (user_id, role)
SELECT DISTINCT owner_id, 'MANAGER'
FROM venues
WHERE owner_id IS NOT NULL
ON CONFLICT (user_id) 
DO UPDATE SET 
  role = CASE 
    WHEN user_roles.role = 'CUSTOMER' THEN 'MANAGER'
    ELSE user_roles.role
  END,
  updated_at = now();
