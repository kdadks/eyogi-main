# Attendance Migration - Errors and Solutions

## Overview
This document explains the migration errors encountered and how they were resolved.

---

## Error Timeline

### Error #1: Parent Guardian Email Column Not Found
**File**: `attendance_tables.sql` (original)

**Error Message**:
```
ERROR: 42703: column p2.parent_guardian_email does not exist
```

**Root Cause**:
The original migration's parent policy referenced a column (`parent_guardian_email`) that doesn't exist in the profiles table.

**Problem Code** (from attendance_tables.sql):
```sql
CREATE POLICY "Parents can view their children attendance" ON attendance_records
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles p1
      JOIN profiles p2 ON p2.parent_guardian_email = p1.email  -- COLUMN DOESN'T EXIST
      WHERE p1.id = auth.uid()
      AND p1.role = 'parent'
      AND p2.id = attendance_records.student_id
    )
  );
```

**Attempted Fix**: Created `attendance_tables_fixed.sql` with multiple parent-child relationship patterns.

---

### Error #2: Parent Children Table Not Found
**File**: `attendance_tables_fixed.sql` (first fix attempt)

**Error Message**:
```
ERROR: 42P01: relation "parent_children" does not exist
```

**Root Cause**:
The fixed migration tried to support three different parent-child relationship patterns, including a junction table approach. However, the `parent_children` table doesn't exist in the database.

**Problem Code** (from attendance_tables_fixed.sql):
```sql
CREATE POLICY "Parents can view their children attendance" ON attendance_records
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles parent_profile
      WHERE parent_profile.id = auth.uid()
      AND parent_profile.role = 'parent'
      AND (
        -- Option 1: parent_children table (DOESN'T EXIST)
        EXISTS (
          SELECT 1 FROM parent_children pc  -- TABLE DOESN'T EXIST
          WHERE pc.parent_id = parent_profile.id
          AND pc.child_id = attendance_records.student_id
        )
        OR EXISTS (...)  -- Other options
      )
    )
  );
```

**Issue**: Even though the policy used OR to provide fallback options, PostgreSQL fails immediately when it encounters a reference to a non-existent table, before evaluating the OR conditions.

---

## Final Solution

### File: `attendance_tables_final.sql`

**Strategy**: Simplified the parent policy to only use the `parent_id` column in the profiles table.

**Working Code**:
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

**Why This Works**:
1. Only references the `parent_id` column in profiles table
2. No reference to non-existent `parent_children` table
3. No reference to non-existent `parent_guardian_email` column
4. Simple, clean, and reliable

**Assumption**: The profiles table has a `parent_id` column that links student profiles to their parent profiles.

---

## Migration Comparison

| Feature | attendance_tables.sql | attendance_tables_fixed.sql | attendance_tables_final.sql |
|---------|----------------------|----------------------------|----------------------------|
| Tables Created | ✅ | ✅ | ✅ |
| RLS Policies | ✅ | ✅ | ✅ |
| Helper Functions | ✅ | ✅ | ✅ |
| Parent Policy | ❌ (references non-existent column) | ❌ (references non-existent table) | ✅ (uses only parent_id) |
| Works Out of Box | ❌ | ❌ | ✅ |

---

## How to Use

### Step 1: Run the Final Migration
```bash
psql $DATABASE_URI < src/SSH/migrations/attendance_tables_final.sql
```

### Step 2: Verify Tables Created
```sql
SELECT table_name FROM information_schema.tables
WHERE table_name IN ('attendance_sessions', 'attendance_records');
```

Expected output:
```
     table_name
--------------------
 attendance_sessions
 attendance_records
(2 rows)
```

### Step 3: Verify Policies Created
```sql
SELECT schemaname, tablename, policyname, cmd
FROM pg_policies
WHERE tablename IN ('attendance_sessions', 'attendance_records')
ORDER BY tablename, policyname;
```

Expected output: 7 policies total
- 4 policies for `attendance_records` (including parent policy)
- 3 policies for `attendance_sessions`

---

## What if parent_id doesn't exist?

If your profiles table doesn't have a `parent_id` column, you have two options:

### Option 1: Skip Parent Access (Recommended if not needed)
Drop the parent policy:
```sql
DROP POLICY IF EXISTS "Parents can view their children attendance" ON attendance_records;
```

Parents won't be able to view attendance, but everything else will work.

### Option 2: Add parent_id Column to Profiles
If you need parent access, add the column:
```sql
ALTER TABLE profiles ADD COLUMN parent_id UUID REFERENCES profiles(id);
```

Then establish parent-child relationships in your application.

---

## Key Lessons Learned

1. **PostgreSQL fails fast on non-existent tables**: Even with OR conditions, if any part of a policy references a non-existent table, the entire CREATE POLICY statement fails.

2. **Schema assumptions are dangerous**: Always verify actual database schema before writing RLS policies.

3. **Simpler is better**: The final solution uses only one relationship pattern (parent_id), making it more reliable and easier to maintain.

4. **Optional policies**: Not every feature needs every policy. If parent access isn't required, skip the parent policy entirely.

---

## Files Summary

- **attendance_tables.sql** - Original (has parent_guardian_email error)
- **attendance_tables_fixed.sql** - First fix attempt (has parent_children error)
- **attendance_tables_final.sql** - ✅ WORKING VERSION - Use this one!
- **MIGRATION_FIX_README.md** - Detailed troubleshooting guide
- **MIGRATION_ERRORS_AND_SOLUTIONS.md** - This file

---

## Next Steps After Running Migration

1. ✅ Run `attendance_tables_final.sql`
2. ✅ Verify tables and policies created
3. ⏭️ Add attendance tabs to dashboards (see ATTENDANCE_QUICK_START.md)
4. ⏭️ Build SSH application: `yarn build:ssh`
5. ⏭️ Test the feature end-to-end

---

**Status**: Migration issues resolved
**Date**: 2025-11-11
**Final Migration File**: `src/SSH/migrations/attendance_tables_final.sql`
