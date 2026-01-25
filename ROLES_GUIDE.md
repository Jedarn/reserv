# Role-Based Access Control Guide

## Overview

The reservation platform now includes a comprehensive role-based access control (RBAC) system with three distinct user roles:

## User Roles

### 1. CUSTOMER (Default)
**Capabilities:**
- Browse and search for venues
- Make reservations at any venue
- View and manage their own bookings
- Cancel their own reservations

**Restrictions:**
- Cannot access venue management features
- Cannot access admin panel
- Cannot create or edit venues

**Menu Access:**
- Home
- My Bookings

---

### 2. MANAGER
**Capabilities:**
- All CUSTOMER capabilities, plus:
- Manage their own venues' bookings
- View customer details for their venues
- Cancel bookings at their venues
- Add/edit/delete tables and seating capacity
- Activate/deactivate tables
- Organize tables by sections

**Restrictions:**
- Can only manage venues they own (venues where owner_id = their user_id)
- Cannot create new venues (admin-only feature)
- Cannot access admin panel
- Cannot view or manage other managers' venues

**Menu Access:**
- Home
- My Bookings
- Manage Venue

**Automatic Upgrade:**
When an admin creates a venue and assigns it to a user (by setting owner_id), that user is automatically upgraded from CUSTOMER to MANAGER role.

---

### 3. ADMIN
**Capabilities:**
- All MANAGER capabilities, plus:
- Create new venues
- Edit any venue
- View all venues in the system
- Delete venues
- Full access to admin panel

**Menu Access:**
- Home
- My Bookings
- Manage Venue
- Admin

---

## How Roles Are Assigned

### New User Registration
1. User signs up with email/password
2. Automatically assigned **CUSTOMER** role
3. Can immediately start making bookings

### Upgrading to MANAGER
**Automatic Upgrade:**
When an admin creates a venue in the Admin panel and assigns an owner_id to a user, that user is automatically upgraded to MANAGER role via database trigger.

**Manual Upgrade (Database Admin Required):**
```sql
UPDATE user_roles
SET role = 'MANAGER', updated_at = now()
WHERE user_id = '<user_id>';
```

### Assigning ADMIN Role
**Database Admin Required:**
Only database administrators can assign ADMIN role:

```sql
-- Make a specific user an admin
UPDATE user_roles
SET role = 'ADMIN', updated_at = now()
WHERE user_id = '<user_id>';

-- Or by email
UPDATE user_roles
SET role = 'ADMIN', updated_at = now()
WHERE user_id = (SELECT id FROM auth.users WHERE email = 'admin@example.com');
```

---

## Security Features

### Database-Level Security (RLS Policies)

**Venues:**
- Managers can only view, edit, and delete their own venues (owner_id = auth.uid())
- Customers can view all active venues but cannot edit
- Admins have full access to all venues

**Bookings:**
- Customers can only view and cancel their own bookings
- Managers can view and cancel bookings for their venues
- Each user can only create bookings for themselves

**Tables (Bookable Units):**
- Managers can only manage tables for their own venues
- Customers can view available tables when booking
- Inactive tables are hidden from booking system

**User Roles:**
- Users can view their own role
- Only admins can modify any user's role
- New users can only create themselves as CUSTOMER

### Application-Level Security

**Route Protection:**
- Admin page redirects non-admins to home
- Manage Venue page redirects customers to home
- VenueForm page redirects non-admins to home

**UI Security:**
- Menu items are hidden based on user role
- Actions are disabled if user lacks permission
- Components check role before rendering protected content

---

## Checking Current Users and Roles

**View all users and their roles:**
```sql
SELECT
  u.email,
  ur.role,
  ur.created_at as role_assigned_at
FROM auth.users u
LEFT JOIN user_roles ur ON u.id = ur.user_id
ORDER BY u.created_at;
```

**View managers and their venues:**
```sql
SELECT
  u.email as manager_email,
  ur.role,
  v.name as venue_name,
  v.category
FROM auth.users u
JOIN user_roles ur ON u.id = ur.user_id
JOIN venues v ON v.owner_id = u.id
WHERE ur.role IN ('MANAGER', 'ADMIN')
ORDER BY u.email;
```

**Count users by role:**
```sql
SELECT role, COUNT(*) as count
FROM user_roles
GROUP BY role
ORDER BY count DESC;
```

---

## Common Scenarios

### Scenario 1: New Restaurant Manager
1. User signs up → Assigned CUSTOMER role
2. Admin creates venue in Admin panel → Sets owner_id to user
3. User automatically upgraded to MANAGER
4. "Manage Venue" menu appears in navigation
5. User can now manage bookings and tables for their restaurant

### Scenario 2: Multi-Venue Manager
1. Manager already owns one venue
2. Admin creates second venue → Sets owner_id to same user
3. User remains MANAGER role
4. In "Manage Venue" page, dropdown shows both venues
5. Manager can switch between venues to manage each one

### Scenario 3: Regular Customer
1. User signs up → Assigned CUSTOMER role
2. Never assigned as venue owner
3. Remains CUSTOMER role
4. Only sees Home and My Bookings
5. Cannot access management features

---

## Best Practices

1. **Least Privilege:** Users start as CUSTOMER and are only upgraded when needed
2. **Automatic Upgrades:** Role changes happen automatically via triggers when venues are assigned
3. **Clear Separation:** Each role has distinct capabilities and UI elements
4. **Database Enforcement:** RLS policies enforce security at the database level
5. **UI Consistency:** Menu items and page access match user permissions

---

## Troubleshooting

**Problem:** User can't see "Manage Venue" menu
- Check if user has MANAGER or ADMIN role
- Verify user is listed as owner_id on at least one venue
- Refresh the page after role change

**Problem:** Manager can't see certain venues
- Managers can only see venues where owner_id = their user_id
- Check the venues table to verify ownership

**Problem:** Need to make someone an admin
- Use SQL to update user_roles table (see "Assigning ADMIN Role" above)
- User must log out and log back in to see changes
