-- Assign ADMIN role to a user by email
-- Replace 'your-email@example.com' with the actual email address

-- Option 1: By email address
UPDATE user_roles
SET role = 'ADMIN', updated_at = now()
WHERE user_id = (
  SELECT id FROM auth.users
  WHERE email = 'jedarnori@gmail.com'  -- Replace with actual email
);

-- Option 2: By user ID (if you know it)
-- UPDATE user_roles
-- SET role = 'ADMIN', updated_at = now()
-- WHERE user_id = 'user-uuid-here';

-- Verify the change
SELECT
  u.email,
  ur.role,
  ur.updated_at
FROM auth.users u
JOIN user_roles ur ON u.id = ur.user_id
WHERE u.email = 'jedarnori@gmail.com';  -- Replace with actual email
