# Fix Compliance Foreign Key Error

## Problem
The compliance system is failing with error:
```
Key (user_id)=(xxx) is not present in table "users"
```

## Root Cause
The `compliance_submissions` and `compliance_notifications` tables have foreign key constraints that reference the `users` table, but the actual user data is stored in the `profiles` table.

## Solution

### Option 1: Run SQL Migration (Recommended)

1. **Open Supabase Dashboard**
   - Go to https://app.supabase.com
   - Navigate to your project: `fxhmipivmuqgdtwzpeni`

2. **Access SQL Editor**
   - Click on "SQL Editor" in the left sidebar
   - Click "New Query"

3. **Run the Fix Migration**
   - Copy the content from `migrations/fix_compliance_foreign_keys.sql`
   - Paste it into the SQL Editor
   - Click "Run" to execute

4. **Verify**
   - The script will output the updated constraints
   - Check that they now reference `profiles` instead of `users`

### Option 2: Quick SQL Fix (Copy-Paste)

Run this SQL directly in Supabase SQL Editor:

```sql
-- Drop existing foreign key constraints
ALTER TABLE compliance_submissions 
DROP CONSTRAINT IF EXISTS compliance_submissions_user_id_fkey;

ALTER TABLE compliance_submissions 
DROP CONSTRAINT IF EXISTS compliance_submissions_reviewed_by_fkey;

ALTER TABLE compliance_notifications 
DROP CONSTRAINT IF EXISTS compliance_notifications_user_id_fkey;

-- Add corrected foreign key constraints
ALTER TABLE compliance_submissions 
ADD CONSTRAINT compliance_submissions_user_id_fkey 
FOREIGN KEY (user_id) REFERENCES profiles(id) ON DELETE CASCADE;

ALTER TABLE compliance_submissions 
ADD CONSTRAINT compliance_submissions_reviewed_by_fkey 
FOREIGN KEY (reviewed_by) REFERENCES profiles(id) ON DELETE SET NULL;

ALTER TABLE compliance_notifications 
ADD CONSTRAINT compliance_notifications_user_id_fkey 
FOREIGN KEY (user_id) REFERENCES profiles(id) ON DELETE CASCADE;
```

## Additional Fix Required

After running the first migration, you also need to fix two more constraints:

**Run this SQL in Supabase SQL Editor:**

```sql
-- Fix remaining auth.users references
ALTER TABLE compliance_items 
DROP CONSTRAINT IF EXISTS compliance_items_created_by_fkey;

ALTER TABLE user_compliance_status 
DROP CONSTRAINT IF EXISTS user_compliance_status_user_id_fkey;

-- Add correct constraints
ALTER TABLE compliance_items 
ADD CONSTRAINT compliance_items_created_by_fkey 
FOREIGN KEY (created_by) REFERENCES profiles(id) ON DELETE SET NULL;

ALTER TABLE user_compliance_status 
ADD CONSTRAINT user_compliance_status_user_id_fkey 
FOREIGN KEY (user_id) REFERENCES profiles(id) ON DELETE CASCADE;
```

Or simply run the file: `migrations/fix_remaining_compliance_foreign_keys.sql`

## After Running Both Fixes

1. The checkbox feature should work correctly
2. Submissions will be created successfully
3. No more foreign key constraint errors
4. All compliance tables properly reference the `profiles` table

## Testing

After running the migration:
1. Refresh your browser
2. Go to teacher dashboard → Profile → Compliance Center
3. Click a checkbox on any compliance item
4. You should see: "Thank you for completing this compliance item..."
5. The item should show as "Under Review" with a blue checkbox
6. Admin can see it in Admin → Compliance → Submissions tab

## Troubleshooting

If you still get errors after running the migration:
1. Verify the `profiles` table exists: `SELECT * FROM profiles LIMIT 1;`
2. Check if your user exists: `SELECT * FROM profiles WHERE id = 'your-user-id';`
3. Verify constraints were updated: 
   ```sql
   SELECT conname, conrelid::regclass, confrelid::regclass 
   FROM pg_constraint 
   WHERE conname LIKE '%compliance%' AND contype = 'f';
   ```
