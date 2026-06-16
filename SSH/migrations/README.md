# Database Migrations for Attendance System

## Overview
This directory contains SQL migration scripts for the attendance management feature.

## Running the Migration

### Option 1: Using Supabase CLI (Recommended)
```bash
# Make sure you're in the project root
cd /path/to/eyogi-main

# Run the migration
supabase db push migrations/attendance_tables.sql

# Or if using psql directly:
psql $DATABASE_URI -f src/SSH/migrations/attendance_tables.sql
```

### Option 2: Using Supabase Dashboard
1. Go to your Supabase project dashboard
2. Navigate to SQL Editor
3. Copy the contents of `attendance_tables.sql`
4. Paste and execute

### Option 3: Using psql command line
```bash
# Connect to your database
psql "postgresql://user:password@host:port/database?sslmode=require"

# Run the migration
\i src/SSH/migrations/attendance_tables.sql

# Or in one command:
psql $DATABASE_URI < src/SSH/migrations/attendance_tables.sql
```

## Migration Contents

The migration creates the following:

### Tables
1. **attendance_sessions** - Stores class session information
   - Links to batches
   - Tracks session number, date, topic
   - Created by teacher/admin

2. **attendance_records** - Stores individual attendance records
   - Links to batches and students
   - Status: present, absent, late, excused
   - Marked by teacher/admin
   - Notes field for additional context

### Enums
- **attendance_status**: 'present', 'absent', 'late', 'excused'

### Indexes
- Performance indexes on batch_id, student_id, class_date
- Composite indexes for common queries
- Unique constraints to prevent duplicates

### Functions
- `get_student_attendance_stats(student_id, batch_id)` - Returns attendance statistics
- `get_batch_attendance_summary(batch_id)` - Returns batch-wide attendance summary

### Row Level Security (RLS)
- Teachers and admins can view and manage all attendance
- Students can view their own attendance
- Parents can view their children's attendance

## Verification

After running the migration, verify it worked:

```sql
-- Check if tables exist
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
  AND table_name IN ('attendance_sessions', 'attendance_records');

-- Check if functions exist
SELECT routine_name
FROM information_schema.routines
WHERE routine_schema = 'public'
  AND routine_name IN ('get_student_attendance_stats', 'get_batch_attendance_summary');

-- Check RLS policies
SELECT schemaname, tablename, policyname
FROM pg_policies
WHERE tablename IN ('attendance_sessions', 'attendance_records');
```

## Rollback

If you need to rollback the migration:

```sql
-- Drop tables (cascades will handle foreign keys)
DROP TABLE IF EXISTS attendance_records CASCADE;
DROP TABLE IF EXISTS attendance_sessions CASCADE;

-- Drop functions
DROP FUNCTION IF EXISTS get_student_attendance_stats(UUID, UUID);
DROP FUNCTION IF EXISTS get_batch_attendance_summary(UUID);

-- Drop enum (only if not used elsewhere)
DROP TYPE IF EXISTS attendance_status CASCADE;
```

## Troubleshooting

### Issue: "enum already exists"
The migration handles this gracefully with `DO $$ BEGIN ... EXCEPTION WHEN duplicate_object ...`

### Issue: "foreign key constraint violation"
Make sure the `batches` and `profiles` tables exist before running this migration.

### Issue: "permission denied"
Make sure you're connected with a user that has CREATE TABLE permissions.

## Next Steps

After running the migration:
1. Verify tables and functions are created
2. Test RLS policies with different user roles
3. Use the TypeScript API functions in `src/SSH/src/lib/api/attendance.ts`
4. Integrate UI components in dashboards
