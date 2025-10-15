# RLS (Row Level Security) Scripts

This directory contains scripts to check and enable Row Level Security (RLS) on all Supabase tables for the SSH (Student School Hub) application.

## Prerequisites

- Node.js and npm installed
- Supabase project set up
- Environment variables configured in `.env` file:
  - `VITE_SUPABASE_URL`
  - `VITE_SUPABASE_SERVICE_ROLE_KEY`

## Scripts Overview

### 1. `check-rls-status.ts`

**Purpose:** Checks the current RLS status of all tables in your Supabase database.

**Usage:**
```bash
cd src/SSH
npx tsx scripts/check-rls-status.ts
```

**Output:**
- Lists all tables with their RLS enabled/disabled status
- Provides a summary of how many tables have RLS enabled
- Highlights tables that need RLS enabled

### 2. `generate-rls-script.ts`

**Purpose:** Generates a comprehensive SQL script to enable RLS on all tables with appropriate policies.

**Usage:**
```bash
cd src/SSH
npx tsx scripts/generate-rls-script.ts
```

**Output:**
- Creates `migrations/enable_rls_all_tables.sql`
- Contains SQL statements to:
  - Enable RLS on all tables
  - Create policies for service role access
  - Create policies for admin users
  - Create policies for authenticated users
  - Create policies for user-specific data access

## How It Works

### Service Role Key

The **service role key** is special in Supabase:
- ✅ **Automatically bypasses ALL RLS policies**
- ✅ Has full access to all tables and operations
- ✅ Used for backend/admin operations

This means:
- Your backend API using the service role key will **NOT be affected** by RLS
- All existing functionality will continue to work
- Only frontend users (using anon key) will be restricted by RLS policies

### Policy Strategy

The generated SQL script creates multiple types of policies:

1. **Service Role Policy** (Documentation only)
   - Service role automatically bypasses RLS
   - Policy created for documentation purposes

2. **Admin Policy**
   - Users with `role = 'admin'` in profiles table
   - Full access to all operations (SELECT, INSERT, UPDATE, DELETE)

3. **User-Specific Policies**
   - Users can only access records where `user_id = auth.uid()`
   - Applies to tables like: compliance_submissions, notifications, children, etc.

4. **Public Read Policies**
   - For tables without user_id column
   - Authenticated users can read all records
   - Useful for reference data like compliance_items

## Step-by-Step Guide

### Step 1: Check Current RLS Status

```bash
cd src/SSH
npx tsx scripts/check-rls-status.ts
```

Review the output to see which tables need RLS enabled.

### Step 2: Generate RLS Script

```bash
npx tsx scripts/generate-rls-script.ts
```

This creates `migrations/enable_rls_all_tables.sql`

### Step 3: Review Generated SQL

Open `migrations/enable_rls_all_tables.sql` and review:
- Tables that will have RLS enabled
- Policies that will be created
- Access patterns for different user roles

### Step 4: Execute SQL Script

1. Go to your Supabase Dashboard
2. Navigate to SQL Editor
3. Copy and paste the contents of `enable_rls_all_tables.sql`
4. Execute the script

### Step 5: Verify RLS is Enabled

```bash
npx tsx scripts/check-rls-status.ts
```

All tables should now show RLS as enabled.

### Step 6: Test Your Application

1. Test with service role key (backend) - should work normally
2. Test with authenticated users (frontend) - should respect policies
3. Test with admin users - should have elevated access

## Tables Covered

The scripts handle all SSH tables:

- `profiles` - User profile information
- `compliance_items` - Compliance requirements
- `compliance_submissions` - User compliance submissions
- `compliance_notifications` - Compliance-related notifications
- `compliance_files` - File uploads for compliance
- `user_compliance_status` - User compliance tracking
- `children` - Parent-child relationships
- `class_assignments` - Teacher-class assignments
- `classes` - Class information
- `attendance` - Attendance configuration
- `attendance_records` - Daily attendance records
- `teacher_dashboard_stats` - Dashboard statistics

## Important Notes

### ✅ Backend Safety

- Your backend using **service role key** will **NOT be affected**
- All API functions in `src/lib/api/` will continue to work
- Service role automatically bypasses RLS

### ⚠️ Frontend Impact

- Frontend users with **anon key** or **authenticated users** will be restricted
- Users can only access their own data (based on policies)
- Admin users have elevated access

### 🔒 Security Benefits

- Prevents unauthorized data access at database level
- Additional security layer beyond application logic
- Compliance with security best practices
- Audit trail through database policies

## Troubleshooting

### Issue: "Cannot read from table"

**Solution:** Ensure you're using the service role key for backend operations.

### Issue: "User cannot access data"

**Solution:** Check if the user is authenticated and the policy matches their user_id.

### Issue: "Admin cannot access all data"

**Solution:** Verify the user's role is set to 'admin' in the profiles table.

## Custom Policies

If you need to modify policies for specific tables:

1. Edit the `SSH_TABLES` array in `generate-rls-script.ts`
2. Adjust the `userColumn` and `hasRole` properties
3. Re-generate the SQL script
4. Review and execute the updated script

## Rollback

If you need to disable RLS:

```sql
-- Disable RLS on a specific table
ALTER TABLE public.table_name DISABLE ROW LEVEL SECURITY;

-- Drop all policies on a table
DROP POLICY IF EXISTS "policy_name" ON public.table_name;
```

## Additional Resources

- [Supabase RLS Documentation](https://supabase.com/docs/guides/auth/row-level-security)
- [PostgreSQL RLS Documentation](https://www.postgresql.org/docs/current/ddl-rowsecurity.html)
- [Supabase Service Role vs Anon Key](https://supabase.com/docs/guides/api/api-keys)

## Support

If you encounter issues:
1. Check the generated SQL for errors
2. Verify your environment variables are correct
3. Test with a single table first before applying to all
4. Review Supabase logs for policy errors
