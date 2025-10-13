# Quick Start: Enable RLS on SSH Database

## 🚀 Quick Commands

```bash
# 1. Check current RLS status
cd src/SSH
npx tsx scripts/check-rls-status.ts

# 2. Generate RLS SQL script
npx tsx scripts/generate-rls-script.ts

# 3. Execute the generated SQL in Supabase Dashboard
# Open: migrations/enable_rls_all_tables.sql
# Copy and paste into Supabase SQL Editor
# Run the script

# 4. Verify RLS is enabled
npx tsx scripts/check-rls-status.ts
```

## ✅ Key Points

### Service Role Key (Backend)
- ✅ **Automatically bypasses ALL RLS policies**
- ✅ Your backend API will continue to work unchanged
- ✅ All functions in `src/lib/api/` are safe

### RLS Benefits
- 🔒 Database-level security
- 🛡️ Prevents unauthorized access
- ✨ Users can only see their own data
- 👑 Admins have elevated access

### What Gets Protected
```
profiles              → Users see only their profile
compliance_submissions → Users see only their submissions
compliance_notifications → Users see only their notifications
children              → Parents see only their children
class_assignments     → Users see only their assignments
...and more
```

### What Stays Public (Read-Only)
```
compliance_items      → All authenticated users can read
attendance            → All authenticated users can read
```

## 📊 Policy Structure

Each table gets 3 types of policies:

1. **Service Role Policy**
   - Full access to everything
   - Used by your backend

2. **Admin Policy**
   - Full access for users with `role = 'admin'`
   - Used by admin dashboard

3. **User Policy**
   - Users can only access records where `user_id = auth.uid()`
   - Used by regular users

## ⚠️ Important Notes

### Before Enabling RLS

1. ✅ Ensure you're using **service role key** for backend operations
2. ✅ Verify your `.env` file has correct credentials
3. ✅ Test in development environment first
4. ✅ Have a rollback plan

### After Enabling RLS

1. ✅ Test backend operations (should work unchanged)
2. ✅ Test frontend with regular user (should see own data only)
3. ✅ Test frontend with admin user (should see all data)
4. ✅ Monitor for any access errors

## 🔧 Troubleshooting

### Problem: "Could not read from table"

**Check:**
- Are you using the service role key in backend?
- Is the user authenticated?
- Does the policy match the user's data?

**Solution:**
```typescript
// ✅ Backend (uses service role - bypasses RLS)
import { supabaseAdmin } from '@/lib/supabase'
const { data } = await supabaseAdmin.from('table_name').select()

// ❌ Frontend (uses anon key - respects RLS)
import { supabase } from '@/lib/supabase'
const { data } = await supabase.from('table_name').select()
```

### Problem: "Row violates row-level security policy"

**Cause:** User trying to access data they don't own

**Solution:** Verify the policy logic or add admin check:
```sql
-- Add condition for admin users
USING (user_id = auth.uid() OR 
       EXISTS (SELECT 1 FROM profiles 
               WHERE id = auth.uid() 
               AND role = 'admin'))
```

## 📝 Example SQL for Custom Policy

If you need to add a custom policy:

```sql
-- Allow teachers to see all their students' submissions
CREATE POLICY "teacher_view_student_submissions" 
ON public.compliance_submissions
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.class_assignments ca
      JOIN public.children c ON c.class_id = ca.class_id
      WHERE ca.user_id = auth.uid()
      AND c.parent_id = compliance_submissions.user_id
      AND ca.role = 'teacher'
    )
  );
```

## 🔄 Rollback Instructions

If you need to disable RLS:

```sql
-- Disable RLS on a specific table
ALTER TABLE public.table_name DISABLE ROW LEVEL SECURITY;

-- Drop all policies for a table
DROP POLICY IF EXISTS "profiles_service_role_all" ON public.profiles;
DROP POLICY IF EXISTS "profiles_admin_all" ON public.profiles;
DROP POLICY IF EXISTS "profiles_authenticated_read" ON public.profiles;
DROP POLICY IF EXISTS "profiles_authenticated_insert" ON public.profiles;
DROP POLICY IF EXISTS "profiles_authenticated_update" ON public.profiles;
DROP POLICY IF EXISTS "profiles_authenticated_delete" ON public.profiles;
```

## 📚 Files Generated

```
src/SSH/
  scripts/
    check-rls-status.ts           ← Check RLS status
    generate-rls-script.ts        ← Generate SQL script
    RLS_GUIDE.md                  ← Detailed documentation
    QUICK_START_RLS.md            ← This file
  migrations/
    enable_rls_all_tables.sql     ← Generated SQL script
```

## 🎯 Testing Checklist

After enabling RLS, test these scenarios:

### Backend (Service Role)
- [ ] Can create compliance submissions
- [ ] Can update compliance items
- [ ] Can read all user data
- [ ] Can delete records
- [ ] Admin dashboard functions work

### Frontend (Regular User)
- [ ] Can see only own profile
- [ ] Can see only own submissions
- [ ] Can see only own children
- [ ] Cannot see other users' data
- [ ] Can read public data (compliance items)

### Frontend (Admin User)
- [ ] Can see all profiles
- [ ] Can see all submissions
- [ ] Can review and approve submissions
- [ ] Admin dashboard shows all data

## 📞 Support

If issues persist:
1. Check Supabase Dashboard → Logs
2. Review RLS_GUIDE.md for detailed info
3. Test with SQL Editor directly
4. Check service role key is configured correctly

---

**Ready to proceed?** Run the commands at the top! 🚀
