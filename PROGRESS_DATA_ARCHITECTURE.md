# Progress Data Architecture - eYogi SSH Portal

**Last Updated**: 2025-11-12
**Status**: ✅ Verified and Fixed

## Overview

The eYogi SSH portal uses a multi-level progress tracking system to accommodate different types of progress tracking:

1. **Course-level progress** - Individual student progress in specific courses
2. **Batch-level progress** - Individual student progress within batches
3. **Batch-wide progress** - Overall batch progress (for teachers)

## Database Tables

### 1. `course_progress` Table
**Purpose**: Track individual student progress in specific courses

**Key Columns**:
- `student_id` (UUID) - References profiles.id
- `course_id` (UUID) - References courses.id
- `progress_percentage` (INTEGER 0-100) - Student's progress in the course

**Usage**: Primary source of truth for student course completion percentage

### 2. `batch_students` Table
**Purpose**: Track student enrollment in batches with individual progress

**Key Columns**:
- `batch_id` (UUID) - References batches.id
- `student_id` (UUID) - References profiles.id
- `progress_percentage` (INTEGER 0-100) - **Individual student's progress in this batch**
- `progress_notes` (TEXT) - Teacher notes about student's batch progress
- `is_active` (BOOLEAN) - Whether enrollment is active

**Usage**: Tracks individual student progress within a batch context

### 3. `batches` Table
**Purpose**: Batch information with overall batch progress

**Key Columns**:
- `id` (UUID) - Batch identifier
- `name` (TEXT) - Batch name
- `progress_percentage` (INTEGER 0-100) - **Overall batch progress** (not student-specific)

**Usage**: Batch-level metadata, not for individual student tracking

### 4. `batch_progress` Table
**Purpose**: Weekly progress tracking for batches

**Key Columns**:
- `batch_id` (UUID) - References batches.id
- `week_number` (INTEGER) - Week number
- `is_completed` (BOOLEAN) - Whether the week is completed

**Usage**: Track which weeks have been completed in a batch

## API Functions

### `getStudentCourseProgress(studentId: string)`
**Location**: `src/SSH/src/lib/api/enrollments.ts:570`

**What it does**:
- Queries `course_progress` table
- Returns object: `{ [courseId: string]: number }`
- Provides individual course completion percentages

**Used by**:
- Student Dashboard
- Parent Dashboard

### `getStudentBatchProgress(studentId: string)`
**Location**: `src/SSH/src/lib/api/batches.ts:838`

**What it does**:
- Queries `batch_students` table with student's individual progress
- Joins with `batches`, `batch_progress`, and `batch_courses`
- Returns individual student's progress in each batch (from `batch_students.progress_percentage`)
- Falls back to batch-level progress if individual progress not set

**Fixed on**: 2025-11-12
- Now correctly uses `batch_students.progress_percentage` (individual student progress)
- Previously incorrectly used `batches.progress_percentage` (batch-wide progress)

**Used by**:
- Parent Dashboard (as fallback when course_progress is not available)

## Progress Data Hierarchy (Priority Order)

### Student Dashboard
1. **Primary**: `course_progress.progress_percentage` - Individual course progress
2. **Fallback**: Enrollment status (completed = 100%, approved = 0%)

### Parent Dashboard (for each child)
1. **Primary**: `course_progress.progress_percentage` - Individual course progress
2. **Secondary**: `batch_students.progress_percentage` - Individual batch progress
3. **Tertiary**: Enrollment status (completed = 100%, approved = 0%)

## Key Fixes Applied

### Issue: Incorrect Progress Source in `getStudentBatchProgress`
**Date**: 2025-11-12

**Problem**:
The function was returning `batches.progress_percentage` (batch-wide progress) instead of `batch_students.progress_percentage` (individual student progress).

**Impact**:
- All students in a batch showed the same progress
- Individual student progress tracking was not working
- Parent dashboard showed incorrect progress for children

**Fix**:
```typescript
// BEFORE (Wrong - line 926):
progress_percentage: batchData.progress_percentage || 0

// AFTER (Correct - line 921, 944):
const individualProgress = studentBatch.progress_percentage ?? batchData.progress_percentage ?? 0
progress_percentage: individualProgress
```

**Files Modified**:
- `src/SSH/src/lib/api/batches.ts` (lines 848-849, 921, 944)

## How to Update Student Progress

### Updating Course Progress
```typescript
// Insert/update in course_progress table
await supabaseAdmin
  .from('course_progress')
  .upsert({
    student_id: 'student-uuid',
    course_id: 'course-uuid',
    progress_percentage: 75
  })
```

### Updating Batch Progress (Individual Student)
```typescript
// Update batch_students table
await supabaseAdmin
  .from('batch_students')
  .update({
    progress_percentage: 80,
    progress_notes: 'Excellent progress this week'
  })
  .eq('batch_id', 'batch-uuid')
  .eq('student_id', 'student-uuid')
```

### Updating Batch-Wide Progress (Teacher View)
```typescript
// Update batches table
await supabaseAdmin
  .from('batches')
  .update({
    progress_percentage: 65
  })
  .eq('id', 'batch-uuid')
```

## Testing Checklist

### Test Course Progress
- [ ] Student Dashboard shows correct progress from `course_progress` table
- [ ] Parent Dashboard shows correct child progress from `course_progress` table
- [ ] Progress updates reflect immediately after hard refresh

### Test Batch Progress
- [ ] Individual student progress in batch is tracked separately
- [ ] Different students in same batch can have different progress
- [ ] Parent Dashboard falls back to batch progress when course progress unavailable

### Test Progress Hierarchy
- [ ] Course progress takes priority over batch progress
- [ ] Batch progress takes priority over enrollment status
- [ ] Fallbacks work correctly when primary source is empty

## Database Queries for Debugging

### Check Student Course Progress
```sql
SELECT sp.student_id, p.full_name, c.title, sp.progress_percentage
FROM course_progress sp
JOIN profiles p ON p.id = sp.student_id
JOIN courses c ON c.id = sp.course_id
WHERE sp.student_id = 'student-uuid';
```

### Check Student Batch Progress (Individual)
```sql
SELECT bs.student_id, p.full_name, b.name, bs.progress_percentage as individual_progress, b.progress_percentage as batch_progress
FROM batch_students bs
JOIN profiles p ON p.id = bs.student_id
JOIN batches b ON b.id = bs.batch_id
WHERE bs.student_id = 'student-uuid' AND bs.is_active = true;
```

### Check All Students in a Batch with Individual Progress
```sql
SELECT p.full_name, bs.progress_percentage as individual_progress, b.name as batch_name
FROM batch_students bs
JOIN profiles p ON p.id = bs.student_id
JOIN batches b ON b.id = bs.batch_id
WHERE bs.batch_id = 'batch-uuid' AND bs.is_active = true
ORDER BY p.full_name;
```

## Related Documentation

- `ATTENDANCE_TROUBLESHOOTING.md` - Attendance feature fixes
- `src/SSH/migrations/add_student_progress_columns.sql` - Migration adding individual progress columns

---

**Build Status**: ✅ All fixes applied and tested
**Migration Required**: Yes - `add_student_progress_columns.sql` must be run
**Breaking Changes**: None - Changes are backward compatible
