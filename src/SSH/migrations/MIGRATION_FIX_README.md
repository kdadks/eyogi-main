# Migration Fix for Parent Policy Errors

## Issues Encountered

### Issue 1: Parent Guardian Email Column Error
When running `attendance_tables.sql`, you may encounter:
```
ERROR: 42703: column p2.parent_guardian_email does not exist
```

### Issue 2: Parent Children Table Error
When running `attendance_tables_fixed.sql`, you may encounter:
```
ERROR: 42P01: relation "parent_children" does not exist
```

## Root Cause
The migration scripts assumed parent-child relationship structures (junction tables or specific columns) that don't exist in your actual database schema.

## Solution

**Use the final migration file:**

```bash
# Run this file instead of the other versions
psql $DATABASE_URI < src/SSH/migrations/attendance_tables_final.sql
```

This version only uses the `parent_id` column in the profiles table for parent-child relationships.

## What's Different in attendance_tables_final.sql?

The **final version** (`attendance_tables_final.sql`) uses a **simplified parent policy** that only relies on the `parent_id` column in the profiles table:

```sql
CREATE POLICY "Parents can view their children attendance" ON attendance_records
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles parent_profile
      WHERE parent_profile.id = auth.uid()
      AND parent_profile.role = 'parent'
      AND EXISTS (
        SELECT 1 FROM profiles student_profile
        WHERE student_profile.id = attendance_records.student_id
        AND student_profile.parent_id = parent_profile.id
      )
    )
  );
```

This policy:
- **Does NOT** reference non-existent `parent_children` table
- **Does NOT** reference non-existent `parent_guardian_email` column
- **Only uses** the `parent_id` column in the profiles table

## What if parent_id doesn't exist either?

If your profiles table doesn't have a `parent_id` column and you don't need parent access to attendance, you can skip the parent policy entirely.

---

## Previous Attempts (For Reference)

### attendance_tables_fixed.sql attempted approach:

The **fixed version** (`attendance_tables_fixed.sql`) tried to support **three different** parent-child relationship patterns:

### Option 1: Parent-Children Junction Table
```sql
-- If you have a dedicated parent_children table
EXISTS (
  SELECT 1 FROM parent_children pc
  WHERE pc.parent_id = parent_profile.id
  AND pc.child_id = attendance_records.student_id
)
```

### Option 2: Student Profile with Parent ID
```sql
-- If student profiles have a parent_id column
EXISTS (
  SELECT 1 FROM profiles student_profile
  WHERE student_profile.id = attendance_records.student_id
  AND student_profile.parent_id = parent_profile.id
)
```

### Option 3: Email Matching (Fallback)
```sql
-- If students store their parent's email
EXISTS (
  SELECT 1 FROM profiles student_profile
  WHERE student_profile.id = attendance_records.student_id
  AND student_profile.parent_guardian_email = parent_profile.email
)
```

The policy will use whichever pattern exists in your database.

## If You Already Ran the Original Migration

If you already ran the original migration and got errors, here's how to fix it:

### Step 1: Drop the problematic policy

```sql
-- Connect to your database
psql $DATABASE_URI

-- Drop the problematic parent policy
DROP POLICY IF EXISTS "Parents can view their children's attendance" ON attendance_records;

-- Exit psql
\q
```

### Step 2: Run only the fixed policy

Create a file `fix_parent_policy.sql`:

```sql
-- Parents can view their children's attendance (FIXED VERSION)
CREATE POLICY "Parents can view their children attendance" ON attendance_records
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles parent_profile
      WHERE parent_profile.id = auth.uid()
      AND parent_profile.role = 'parent'
      AND (
        -- Option 1: parent_children junction table
        EXISTS (
          SELECT 1 FROM parent_children pc
          WHERE pc.parent_id = parent_profile.id
          AND pc.child_id = attendance_records.student_id
        )
        -- Option 2: parent_id in student profile
        OR EXISTS (
          SELECT 1 FROM profiles student_profile
          WHERE student_profile.id = attendance_records.student_id
          AND student_profile.parent_id = parent_profile.id
        )
        -- Option 3: email matching (fallback)
        OR EXISTS (
          SELECT 1 FROM profiles student_profile
          WHERE student_profile.id = attendance_records.student_id
          AND student_profile.parent_guardian_email = parent_profile.email
        )
      )
    )
  );
```

Then run:
```bash
psql $DATABASE_URI < fix_parent_policy.sql
```

## Verify the Fix

```sql
-- Check that the policy exists
SELECT schemaname, tablename, policyname, cmd
FROM pg_policies
WHERE tablename = 'attendance_records'
  AND policyname LIKE '%Parent%';
```

You should see the policy listed with cmd = 'SELECT'.

## If You Want to Simplify

If you don't need parent access at all, you can skip the parent policy entirely:

```sql
-- Just drop it
DROP POLICY IF EXISTS "Parents can view their children's attendance" ON attendance_records;
DROP POLICY IF EXISTS "Parents can view their children attendance" ON attendance_records;
```

Parents won't be able to view attendance, but the rest of the system will work fine.

## Testing the Policy

After fixing, test with a parent account:

```sql
-- Switch to parent user context (in your app)
-- Then try to query attendance
SELECT * FROM attendance_records WHERE student_id = 'some-child-id';
```

If it works, the policy is correct. If you get zero rows (and you should have data), the parent-child relationship isn't being detected.

## Need Help?

If the fixed migration still doesn't work, check your actual database schema:

```sql
-- Check what columns exist in profiles table
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'profiles'
ORDER BY ordinal_position;

-- Check if parent_children table exists
SELECT table_name
FROM information_schema.tables
WHERE table_name = 'parent_children';
```

Send the output and we can create a custom policy for your specific schema.

---

**TL;DR**: Use `attendance_tables_fixed.sql` instead of `attendance_tables.sql` to avoid the parent policy error.
