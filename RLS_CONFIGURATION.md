# RLS Configuration Summary

## Overview

This project now includes automated scripts to check and enable Row Level Security (RLS) on all Supabase database tables for the SSH (Student School Hub) application.

## Created Files

### Scripts
- **`src/SSH/scripts/check-rls-status.ts`** - Checks current RLS status of all database tables
- **`src/SSH/scripts/generate-rls-script.ts`** - Generates SQL script to enable RLS with policies

### Documentation
- **`src/SSH/scripts/RLS_GUIDE.md`** - Comprehensive guide with detailed explanations
- **`src/SSH/scripts/QUICK_START_RLS.md`** - Quick reference and troubleshooting guide

### Generated Migration
- **`src/SSH/migrations/enable_rls_all_tables.sql`** - SQL script to enable RLS on all tables (675 lines)

## Quick Start

```bash
# Navigate to SSH directory
cd src/SSH

# Step 1: Check current RLS status
npx tsx scripts/check-rls-status.ts

# Step 2: Generate RLS SQL script (already done)
npx tsx scripts/generate-rls-script.ts

# Step 3: Execute the SQL in Supabase Dashboard
# Open: src/SSH/migrations/enable_rls_all_tables.sql
# Copy contents → Supabase Dashboard → SQL Editor → Run

# Step 4: Verify RLS is enabled
npx tsx scripts/check-rls-status.ts
```

## ✅ Service Role Key Protection

**IMPORTANT:** Your backend functionality will NOT be affected!

The Supabase **service role key** automatically bypasses ALL RLS policies:
- ✅ All API functions in `src/SSH/src/lib/api/` will continue to work
- ✅ Backend operations using `supabaseAdmin` are unrestricted
- ✅ Only frontend users (with anon/auth keys) are restricted by RLS

## Tables Protected

The script enables RLS on 12 SSH tables:

| Table | User Column | Access Pattern |
|-------|-------------|----------------|
| profiles | id | Own profile only |
| compliance_items | - | Read all (reference data) |
| compliance_submissions | user_id | Own submissions only |
| compliance_notifications | user_id | Own notifications only |
| compliance_files | user_id | Own files only |
| user_compliance_status | user_id | Own status only |
| children | parent_id | Own children only |
| class_assignments | user_id | Own assignments only |
| classes | teacher_id | Own classes only |
| attendance | - | Read all |
| attendance_records | marked_by | Own records only |
| teacher_dashboard_stats | teacher_id | Own stats only |

## Policy Types Created

### 1. Service Role Policy
```sql
CREATE POLICY "table_service_role_all" ON public.table_name
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);
```
- Full access for backend operations
- Automatically applied to service role key

### 2. Admin Policy
```sql
CREATE POLICY "table_admin_all" ON public.table_name
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );
```
- Full access for admin users
- Based on `role = 'admin'` in profiles table

### 3. User Policies
```sql
-- SELECT
CREATE POLICY "table_authenticated_read" ON public.table_name
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

-- INSERT
CREATE POLICY "table_authenticated_insert" ON public.table_name
  FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

-- UPDATE
CREATE POLICY "table_authenticated_update" ON public.table_name
  FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- DELETE
CREATE POLICY "table_authenticated_delete" ON public.table_name
  FOR DELETE
  TO authenticated
  USING (user_id = auth.uid());
```
- Users can only access their own data
- Based on matching `user_id` column

## Security Benefits

1. **Database-Level Security**
   - Protection enforced at PostgreSQL level
   - Cannot be bypassed by client-side code

2. **Defense in Depth**
   - Additional layer beyond application logic
   - Complements existing authentication

3. **Data Isolation**
   - Users automatically restricted to their data
   - No risk of data leakage between users

4. **Audit Trail**
   - Policies logged in database
   - Clear documentation of access rules

## Testing Checklist

After enabling RLS, verify:

### Backend Operations (Service Role)
- [ ] Compliance submission creation works
- [ ] Admin dashboard loads all data
- [ ] Batch operations function correctly
- [ ] Background jobs complete successfully

### Frontend (Regular Users)
- [ ] Users see only their compliance items
- [ ] Cannot access other users' submissions
- [ ] Can submit new compliance items
- [ ] Can view reference data (compliance_items)

### Frontend (Admin Users)
- [ ] Admin dashboard shows all submissions
- [ ] Can review and approve any submission
- [ ] Can manage all compliance items
- [ ] Statistics show complete data

## Rollback Plan

If issues occur, disable RLS on specific tables:

```sql
-- Disable RLS
ALTER TABLE public.table_name DISABLE ROW LEVEL SECURITY;

-- Drop policies
DROP POLICY IF EXISTS "table_service_role_all" ON public.table_name;
DROP POLICY IF EXISTS "table_admin_all" ON public.table_name;
-- ... etc
```

## Environment Requirements

Ensure `.env` file contains:

```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
VITE_SUPABASE_ANON_KEY=your-anon-key
```

## Documentation References

- **Detailed Guide:** `src/SSH/scripts/RLS_GUIDE.md`
- **Quick Start:** `src/SSH/scripts/QUICK_START_RLS.md`
- **Generated SQL:** `src/SSH/migrations/enable_rls_all_tables.sql`

## Support Resources

- [Supabase RLS Docs](https://supabase.com/docs/guides/auth/row-level-security)
- [PostgreSQL RLS Docs](https://www.postgresql.org/docs/current/ddl-rowsecurity.html)
- [Supabase Service Role](https://supabase.com/docs/guides/api/api-keys)

---

**Status:** ✅ Scripts created and tested
**Generated:** October 11, 2025
**Next Step:** Execute `enable_rls_all_tables.sql` in Supabase Dashboard
