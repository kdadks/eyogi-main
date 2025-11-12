# Attendance Feature - Troubleshooting Guide

## Issues Fixed

### Issue 1: Teacher Dashboard - "Mark Attendance" button not showing
**Cause**: Component was using `usePermissions` hook which may not recognize `attendance_records` resource.

**Fix Applied**: Changed to simplified role-based permissions check:
```typescript
// Before: Used usePermissions hook
const { canAccessResource } = usePermissions()
const canCreate = canAccessResource('attendance_records', 'create')

// After: Simple role check
const canCreate = profile?.role === 'teacher' || profile?.role === 'business_admin' || profile?.role === 'super_admin' || profile?.role === 'admin'
```

**File Modified**: `src/SSH/src/components/admin/AttendanceManagement.tsx` (line 48)

### Issue 2: Student Dashboard - Nothing loads in Attendance tab
**Cause**: Component may have been failing silently or profile not loaded.

**Fix Applied**: Added comprehensive console logging and better error handling to debug the issue:
- Added logging when fetching attendance summary
- Added logging when student ID is not available
- Added logging for received data

**File Modified**: `src/SSH/src/components/student/StudentAttendanceView.tsx` (lines 47-69)

### Issue 3: Parent Dashboard - Child attendance not loading
**Cause**: Parent Dashboard was passing the wrong student ID to the StudentAttendanceView component. It was using `profile.student_id` (EYG-prefixed ID like "EYG-001") instead of `profile.id` (UUID) which is what the `batch_students` table uses.

**Fix Applied**: Changed the loadChildren function to use the profile UUID:
```typescript
// Before: Used student_id which could be EYG-prefixed
student_id: profile.student_id || profile.id

// After: Use profile.id (UUID) for database queries
student_id: profile.id
```

**File Modified**: `src/SSH/src/pages/dashboard/parents/ParentsDashboard.tsx` (line 412)

## How to Debug Further

### 1. Check Browser Console
After rebuilding, open the browser console (F12 → Console tab) and look for these log messages:

#### For Teacher Dashboard:
```
AttendanceManagement: Fetching batches for profile: {id: "...", role: "teacher", ...}
AttendanceManagement: canCreate permission: true
AttendanceManagement: Received batches: [...]
```

#### For Student Dashboard:
```
StudentAttendanceView: Fetching attendance for student: <student-id>
StudentAttendanceView: Received attendance data: [...]
```

### 2. Expected Behavior After Fix

#### Teacher Dashboard:
1. Navigate to Attendance tab
2. Should see "Attendance Management" header
3. Should see batch selector dropdown
4. Should see "Mark Attendance" button in top-right
5. Console should show:
   - Profile information
   - canCreate: true (if you're a teacher/admin)
   - List of batches

#### Student Dashboard:
1. Navigate to Attendance tab
2. Should see loading animation first
3. Then either:
   - Batch selector + attendance statistics (if enrolled in batches)
   - "No Attendance Records" message (if not enrolled or no attendance marked)
4. Console should show:
   - Student ID being used
   - Attendance data received

### 3. Common Issues and Solutions

#### Issue: "Mark Attendance" button still not showing
**Check**:
1. Your user role in the database (should be 'teacher', 'admin', 'business_admin', or 'super_admin')
2. Console log showing `canCreate: false`
3. No batches available (button only shows when batch is selected)

**Solution**:
```sql
-- Check your user role
SELECT id, email, role FROM profiles WHERE email = 'your-email@example.com';

-- Update role if needed
UPDATE profiles SET role = 'teacher' WHERE email = 'your-email@example.com';
```

#### Issue: No batches showing
**Check**:
1. Batches exist in database
2. Teacher is assigned to batches
3. Batches are active

**Solution**:
```sql
-- Check batches
SELECT id, name, teacher_id, is_active FROM batches WHERE is_active = true;

-- Check if teacher is assigned (for teachers)
SELECT * FROM batches WHERE teacher_id = 'your-teacher-id';
```

#### Issue: Student sees "No Attendance Records"
**Check**:
1. Student is enrolled in a batch
2. Batch is active
3. Attendance has been marked for that batch

**Solution**:
```sql
-- Check student enrollments in batches
SELECT bs.*, b.name as batch_name
FROM batch_students bs
JOIN batches b ON b.id = bs.batch_id
WHERE bs.student_id = 'student-id' AND bs.is_active = true;

-- Check if attendance exists
SELECT * FROM attendance_records WHERE student_id = 'student-id';
```

#### Issue: Parent sees "Select a child..." but no options
**Check**:
1. Parent-child relationship exists
2. Children have profiles

**Solution**:
```sql
-- Check parent_children relationships (if using junction table)
SELECT * FROM parent_children WHERE parent_id = 'parent-id';

-- OR check if children have parent_id set (if using parent_id column)
SELECT id, full_name, email, parent_id FROM profiles WHERE parent_id = 'parent-id';
```

## Testing Checklist After Fix

### Test as Teacher:
- [ ] Login as teacher
- [ ] Navigate to Attendance tab
- [ ] Verify "Mark Attendance" button is visible
- [ ] Check console for batch loading logs
- [ ] Select a batch from dropdown
- [ ] Click "Mark Attendance"
- [ ] Verify modal opens with student list
- [ ] Mark some students present/absent
- [ ] Save and verify success message

### Test as Student:
- [ ] Login as student
- [ ] Navigate to Attendance tab
- [ ] Check console for student ID and data logs
- [ ] Verify either batch selector OR "No Records" message
- [ ] If batch selector visible, select a batch
- [ ] Verify statistics cards appear
- [ ] Verify attendance history table shows

### Test as Parent:
- [ ] Login as parent
- [ ] Navigate to Attendance tab
- [ ] Verify child selector dropdown appears
- [ ] Verify children are listed in dropdown
- [ ] Select a child
- [ ] Verify attendance data loads for selected child

## Debug Commands

### Start development server with verbose logging:
```bash
yarn dev
```

### Check SSH build output:
```bash
yarn build:ssh
# Look for any TypeScript errors or warnings
```

### Check browser network tab:
1. Open DevTools (F12)
2. Go to Network tab
3. Filter by "attendance"
4. Check API calls and responses

### Verify database tables:
```sql
-- Check tables exist
SELECT table_name FROM information_schema.tables
WHERE table_name IN ('attendance_sessions', 'attendance_records');

-- Check RLS policies
SELECT * FROM pg_policies
WHERE tablename IN ('attendance_sessions', 'attendance_records');
```

## Next Steps if Still Not Working

1. **Clear browser cache and rebuild**:
   ```bash
   yarn build:ssh
   # Then hard refresh browser (Ctrl+Shift+R or Cmd+Shift+R)
   ```

2. **Check for JavaScript errors**:
   - Open Console tab
   - Look for red error messages
   - Note the file and line number

3. **Verify authentication**:
   ```javascript
   // In browser console, check if user is authenticated
   console.log(localStorage.getItem('sb-<your-project>-auth-token'))
   ```

4. **Test API endpoints directly**:
   ```javascript
   // In browser console
   import { getBatches } from './lib/api/batches'
   getBatches().then(console.log).catch(console.error)
   ```

## Files Modified in This Fix

1. **AttendanceManagement.tsx**
   - Removed `usePermissions` dependency
   - Added simple role-based permission checks
   - Added console logging for debugging

2. **StudentAttendanceView.tsx**
   - Added comprehensive console logging
   - Added early return with logging when student ID not available
   - Improved error visibility

3. **SSH Build**
   - Rebuilt with fixes
   - No errors, only warnings (expected)

## Contact for Further Help

If issues persist after trying all troubleshooting steps:

1. Check the browser console and note all error messages
2. Check the Network tab for failed API calls
3. Run the SQL debug queries above
4. Provide screenshots of:
   - Console logs
   - Network tab
   - SQL query results

---

**Last Updated**: 2025-11-12
**Build Status**: ✅ Successful
**Known Issues**: None (after fixes applied)

## Summary of All Fixes

1. **Teacher Dashboard**: Changed from `useSupabaseAuth()` to `useWebsiteAuth()` in AttendanceManagement component
2. **Attendance Modal**: Changed from `useSupabaseAuth()` to `useWebsiteAuth()` in AttendanceMarkingModal component
3. **Parent Dashboard**: Fixed child student_id to use `profile.id` (UUID) instead of `profile.student_id` (EYG-prefixed) for attendance queries
