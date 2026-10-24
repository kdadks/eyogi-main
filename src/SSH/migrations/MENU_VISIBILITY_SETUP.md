# Menu Visibility Feature - Setup & Usage Guide

## Overview

This feature allows super admins to control which menu items are visible in the admin portal sidebar for different roles. You can grant a role permission to access a function while keeping the menu item hidden, or show the menu item for easy access.

## Problem Solved

Previously, when a super admin granted user management permissions to a business_admin, the business_admin could perform user management operations but couldn't see the "Users" menu option in the admin portal sidebar. This feature solves that disconnect by allowing menu visibility to be controlled independently.

## Database Changes

### Migration File

Run the migration file: `add_menu_visibility_to_permissions.sql`

This migration:
1. Adds a `menu_visible` column to the `role_permissions` table (default: `true`)
2. Creates an index for better query performance
3. Adds a SQL function `check_menu_visibility(role, resource, action)` for easy visibility checks

### To Apply Migration

1. Open Supabase SQL Editor
2. Run the SQL file: `src/SSH/migrations/add_menu_visibility_to_permissions.sql`
3. Verify the column was added:
   ```sql
   SELECT column_name, data_type, column_default
   FROM information_schema.columns
   WHERE table_name = 'role_permissions' AND column_name = 'menu_visible';
   ```

## How It Works

### Architecture

1. **Database Layer**: `role_permissions` table now has `menu_visible` boolean column
2. **API Layer**: New functions in `lib/api/permissions.ts` handle menu visibility queries
3. **Hook Layer**: `usePermissions` hook loads and caches menu visibility for current user's role
4. **UI Layer**:
   - `AdminPermissionManagement` provides toggles to control menu visibility per permission
   - `AdminSidebar` filters menu items based on both permissions AND menu visibility

### Data Flow

```
Super Admin Sets Permission & Menu Visibility
    ↓
Saved to role_permissions table (permission_id, role, menu_visible)
    ↓
User Logs In
    ↓
usePermissions hook loads menu visibility map for user's role
    ↓
AdminSidebar filters navigation items
    ↓
Only visible menu items are shown
```

## Usage Instructions

### For Super Admins

1. **Navigate to Permissions Tab**
   - Log in as super admin
   - Go to Admin Portal → Permissions

2. **Select a Role**
   - Choose the role you want to configure (e.g., business_admin, teacher)

3. **Grant Permissions**
   - Toggle permissions ON/OFF for the selected role
   - When you enable a permission, a "Show in Menu" toggle appears

4. **Control Menu Visibility**
   - Use the "Show in Menu" toggle to control if the menu item appears in the sidebar
   - Eye icon (👁️) = Menu visible
   - Eye-off icon = Menu hidden

5. **Save Changes**
   - Click "Save Changes" to persist your configuration

### Example Scenarios

#### Scenario 1: Grant User Management to Business Admin with Menu Visible
```
1. Select "business_admin" role
2. Toggle ON "Users - Read" permission
3. Ensure "Show in Menu" is toggled ON
4. Save Changes
5. Result: Business admin sees "Users" menu item and can access user management
```

#### Scenario 2: Grant Permission but Hide Menu Item
```
1. Select "teacher" role
2. Toggle ON "Analytics - Read" permission
3. Toggle OFF "Show in Menu"
4. Save Changes
5. Result: Teacher has analytics permission (can access via direct URL) but doesn't see it in menu
```

## Build & Deploy Instructions

### Development Build

```bash
# Navigate to SSH app directory
cd src/SSH

# Install dependencies (if not already installed)
yarn install

# Run development server
yarn dev
```

### Production Build

```bash
# Build the application
yarn build

# Test the production build locally
yarn preview
```

### SSH Server Build (if applicable)

```bash
# Build for SSH deployment
yarn build:ssh

# Or use the specific build command from package.json
```

### Deployment Checklist

- [ ] Run the database migration
- [ ] Build the application
- [ ] Test with different roles (super_admin, admin, business_admin, teacher)
- [ ] Verify menu visibility changes reflect immediately after role permission updates
- [ ] Check that super_admin and admin always see all menu items
- [ ] Confirm that menu visibility toggles only appear for granted permissions

## Testing

### Manual Testing Steps

1. **As Super Admin:**
   ```
   ✓ Can see all menu items
   ✓ Can access Permission Management
   ✓ Can toggle permissions and menu visibility for all roles
   ✓ Changes save successfully
   ```

2. **As Business Admin (with Users permission + menu visible):**
   ```
   ✓ Can see "Users" menu item
   ✓ Can access user management
   ✓ Menu item appears after permission granted
   ```

3. **As Business Admin (with Users permission + menu hidden):**
   ```
   ✓ Cannot see "Users" menu item in sidebar
   ✓ Can still access /admin/users via direct URL (if they know it)
   ```

4. **As Teacher:**
   ```
   ✓ Only sees menu items configured for teacher role
   ✓ Menu visibility respects database settings
   ```

### Testing Queries

```sql
-- Check menu visibility for a specific role
SELECT
  rp.role,
  p.name,
  p.resource,
  p.action,
  rp.menu_visible
FROM role_permissions rp
JOIN permissions p ON p.id = rp.permission_id
WHERE rp.role = 'business_admin'
ORDER BY p.resource, p.action;

-- Test the menu visibility function
SELECT check_menu_visibility('business_admin', 'users', 'read');

-- See all role permissions with menu visibility
SELECT
  rp.role,
  COUNT(*) as total_permissions,
  SUM(CASE WHEN rp.menu_visible THEN 1 ELSE 0 END) as visible_in_menu,
  SUM(CASE WHEN NOT rp.menu_visible THEN 1 ELSE 0 END) as hidden_from_menu
FROM role_permissions rp
GROUP BY rp.role
ORDER BY rp.role;
```

## Technical Details

### Modified Files

1. **Database:**
   - `migrations/add_menu_visibility_to_permissions.sql` - New migration

2. **Components:**
   - `components/admin/AdminPermissionManagement.tsx` - Added menu visibility UI
   - `components/admin/AdminSidebar.tsx` - Added menu visibility filtering

3. **Hooks:**
   - `hooks/usePermissions.ts` - Added `canShowInMenu()` function and menu visibility loading

4. **API:**
   - `lib/api/permissions.ts` - Added menu visibility functions

### New Functions

#### `usePermissions` Hook
- `canShowInMenu(resource, action)` - Check if menu item should be visible

#### Permissions API
- `getMenuVisibilityForRole(role)` - Get all menu visibility settings for a role
- `checkMenuVisibility(role, resource, action)` - Check specific menu visibility
- `updateMenuVisibility(role, permissionId, menuVisible)` - Update menu visibility

### State Management

Menu visibility is loaded once when the user logs in and cached in the `usePermissions` hook. This prevents unnecessary database queries on every render.

## Troubleshooting

### Menu items not appearing after granting permission

1. Check that `menu_visible` is set to `true`:
   ```sql
   SELECT * FROM role_permissions
   WHERE role = 'your_role' AND permission_id = 'permission_id';
   ```

2. Verify the user logged out and logged back in (menu visibility is loaded on login)

3. Check browser console for any errors

### Menu visibility toggle not saving

1. Verify you're logged in as super_admin or admin
2. Check network tab for failed API calls
3. Verify database permissions for role_permissions table

### Admin/Super Admin not seeing all menus

This should never happen. Check:
1. User role is correctly set in profiles table
2. `getUserRole()` returns 'admin' or 'super_admin'
3. No JavaScript errors in console

## Database Schema

### role_permissions table structure

```sql
CREATE TABLE role_permissions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  role TEXT NOT NULL,
  permission_id UUID NOT NULL REFERENCES permissions(id),
  menu_visible BOOLEAN DEFAULT true,  -- NEW COLUMN
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

## Future Enhancements

Possible improvements:
- Bulk menu visibility operations
- Menu visibility presets (templates for common roles)
- Menu item ordering/grouping configuration
- Custom menu labels per role
- Menu visibility history/audit log

## Support

For issues or questions:
1. Check this documentation
2. Review the code comments in modified files
3. Test with the provided SQL queries
4. Check Supabase logs for database errors
