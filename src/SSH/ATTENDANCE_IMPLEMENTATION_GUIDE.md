# Attendance Management System - Implementation Guide

## Overview
This document provides comprehensive instructions for implementing and using the attendance management system in the eYogi SSH portal.

## 📋 Table of Contents
1. [Database Setup](#database-setup)
2. [Component Overview](#component-overview)
3. [Dashboard Integration](#dashboard-integration)
4. [API Usage](#api-usage)
5. [Permissions and Access Control](#permissions-and-access-control)
6. [Testing Guide](#testing-guide)
7. [Troubleshooting](#troubleshooting)

---

## 🗄️ Database Setup

### Step 1: Run the SQL Migration

Navigate to the project root and execute the migration script:

```bash
# Option 1: Using psql
psql $DATABASE_URI < src/SSH/migrations/attendance_tables.sql

# Option 2: Using Supabase Dashboard
# Copy the contents of src/SSH/migrations/attendance_tables.sql
# Paste into SQL Editor and execute
```

### Step 2: Verify Tables Created

```sql
-- Check tables exist
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
  AND table_name IN ('attendance_sessions', 'attendance_records');

-- Should return 2 rows
```

### Step 3: Verify RLS Policies

```sql
SELECT schemaname, tablename, policyname
FROM pg_policies
WHERE tablename IN ('attendance_sessions', 'attendance_records');

-- Should return 7 policies total
```

---

## 🧩 Component Overview

### 1. **AttendanceManagement** (Teacher/Admin View)
**Location**: `src/SSH/src/components/admin/AttendanceManagement.tsx`

**Features**:
- Batch selection
- Attendance statistics overview
- Student-wise attendance summary
- Recent attendance records
- Date range filtering

**Usage**:
```tsx
import AttendanceManagement from '@/components/admin/AttendanceManagement'

// In TeacherDashboard
<AttendanceManagement />
```

### 2. **AttendanceMarkingModal** (Mark Attendance)
**Location**: `src/SSH/src/components/admin/AttendanceMarkingModal.tsx`

**Features**:
- Bulk attendance marking
- Individual student status (Present, Absent, Late, Excused)
- Session topic and notes
- Real-time statistics
- Search functionality
- Notes per student

**Props**:
```typescript
interface AttendanceMarkingModalProps {
  batch: Batch
  selectedDate: string
  onClose: () => void
  onSuccess: () => void
}
```

### 3. **StudentAttendanceView** (Student/Parent View)
**Location**: `src/SSH/src/components/student/StudentAttendanceView.tsx`

**Features**:
- View attendance across all batches
- Attendance percentage with visual progress bar
- Detailed attendance history
- Date range filtering
- Statistical breakdown

**Props**:
```typescript
interface StudentAttendanceViewProps {
  studentId?: string // Optional - for parents viewing child's attendance
}
```

---

## 🎛️ Dashboard Integration

### Teacher Dashboard Integration

**File**: `src/SSH/src/pages/dashboard/TeacherDashboard.tsx`

```typescript
// 1. Import the component
import AttendanceManagement from '../../components/admin/AttendanceManagement'

// 2. Add to view state type
type View = 'overview' | 'courses' | 'students' | 'certificates' | 'batches' | 'analytics' | 'attendance' | 'settings'

// 3. Add tab to navigation
const tabs = [
  { id: 'overview' as const, label: 'Overview', icon: HomeIcon },
  { id: 'courses' as const, label: 'Courses', icon: BookOpenIcon },
  { id: 'students' as const, label: 'Students', icon: UserGroupIcon },
  { id: 'batches' as const, label: 'Batches', icon: AcademicCapIcon },
  { id: 'attendance' as const, label: 'Attendance', icon: CalendarDaysIcon }, // NEW
  { id: 'certificates' as const, label: 'Certificates', icon: AcademicCapIcon },
  { id: 'analytics' as const, label: 'Analytics', icon: ChartBarIcon },
  { id: 'settings' as const, label: 'Settings', icon: Cog6ToothIcon },
]

// 4. Add to view rendering
{activeView === 'attendance' && <AttendanceManagement />}
```

### Student Dashboard Integration

**File**: `src/SSH/src/pages/dashboard/StudentDashboard.tsx`

```typescript
// 1. Import the component
import StudentAttendanceView from '../../components/student/StudentAttendanceView'

// 2. Add to view state type
type View = 'home' | 'courses' | 'enrollments' | 'certificates' | 'batches' | 'attendance' | 'profile' | 'analytics' | 'settings'

// 3. Add tab to navigation
const tabs = [
  { id: 'home' as const, label: 'Home', icon: HomeIcon },
  { id: 'courses' as const, label: 'Courses', icon: BookOpenIcon },
  { id: 'enrollments' as const, label: 'My Enrollments', icon: AcademicCapIcon },
  { id: 'batches' as const, label: 'My Batches', icon: UserGroupIcon },
  { id: 'attendance' as const, label: 'Attendance', icon: CalendarDaysIcon }, // NEW
  { id: 'certificates' as const, label: 'Certificates', icon: AcademicCapIcon },
  { id: 'analytics' as const, label: 'Analytics', icon: ChartBarIcon },
  { id: 'profile' as const, label: 'Profile', icon: UserIcon },
  { id: 'settings' as const, label: 'Settings', icon: Cog6ToothIcon },
]

// 4. Add to view rendering
{activeView === 'attendance' && <StudentAttendanceView />}
```

### Parent Dashboard Integration

**File**: `src/SSH/src/pages/dashboard/parents/ParentsDashboard.tsx`

```typescript
// 1. Import the component
import StudentAttendanceView from '../../../components/student/StudentAttendanceView'

// 2. Add to view state type (if not already there)
type View = 'home' | 'children' | 'enrollments' | 'progress' | 'attendance' | 'settings' | 'analytics'

// 3. Add tab to navigation
const tabs = [
  { id: 'home' as const, label: 'Home', icon: HomeIcon },
  { id: 'children' as const, label: 'Children', icon: UserGroupIcon },
  { id: 'enrollments' as const, label: 'Enrollments', icon: AcademicCapIcon },
  { id: 'progress' as const, label: 'Progress', icon: ChartBarIcon },
  { id: 'attendance' as const, label: 'Attendance', icon: CalendarDaysIcon }, // NEW
  { id: 'analytics' as const, label: 'Analytics', icon: ChartBarIcon },
  { id: 'settings' as const, label: 'Settings', icon: Cog6ToothIcon },
]

// 4. Add state for selected child
const [selectedChildForAttendance, setSelectedChildForAttendance] = useState<string | null>(null)

// 5. Add to view rendering
{activeView === 'attendance' && (
  <div className="space-y-6">
    {/* Child Selector */}
    <Card>
      <CardHeader>
        <CardTitle>Select Child</CardTitle>
      </CardHeader>
      <CardContent>
        <select
          value={selectedChildForAttendance || ''}
          onChange={(e) => setSelectedChildForAttendance(e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-md"
        >
          <option value="">Select a child...</option>
          {children.map((child) => (
            <option key={child.id} value={child.id}>
              {child.full_name || child.email}
            </option>
          ))}
        </select>
      </CardContent>
    </Card>

    {/* Attendance View */}
    {selectedChildForAttendance && (
      <StudentAttendanceView studentId={selectedChildForAttendance} />
    )}
  </div>
)}
```

---

## 📡 API Usage

### Import API Functions

```typescript
import {
  markAttendance,
  bulkMarkAttendance,
  getAttendanceRecords,
  getStudentAttendanceStats,
  getBatchAttendanceSummary,
  getStudentAttendanceSummary,
  createAttendanceSession,
  getAttendanceSessions,
  updateAttendanceRecord,
  deleteAttendanceRecord,
} from '@/lib/api/attendance'
```

### Example: Mark Attendance for Single Student

```typescript
const handleMarkAttendance = async () => {
  const result = await markAttendance({
    batch_id: 'batch-uuid',
    student_id: 'student-uuid',
    class_date: '2025-11-11', // YYYY-MM-DD
    status: 'present',
    marked_by: currentUserId,
    notes: 'Participated actively in class',
  })

  if (result) {
    toast.success('Attendance marked successfully')
  } else {
    toast.error('Failed to mark attendance')
  }
}
```

### Example: Bulk Mark Attendance

```typescript
const handleBulkMark = async () => {
  const result = await bulkMarkAttendance({
    batch_id: 'batch-uuid',
    class_date: '2025-11-11',
    marked_by: currentUserId,
    attendance_records: [
      { student_id: 'student-1', status: 'present' },
      { student_id: 'student-2', status: 'absent', notes: 'Sick leave' },
      { student_id: 'student-3', status: 'late', notes: 'Arrived 10 minutes late' },
    ],
  })

  if (result.success) {
    toast.success('Attendance marked for all students')
  } else {
    toast.error(`Failed for some students: ${result.errors.join(', ')}`)
  }
}
```

### Example: Get Student Statistics

```typescript
const stats = await getStudentAttendanceStats('student-uuid', 'batch-uuid')

console.log(stats)
// {
//   total_classes: 20,
//   present: 18,
//   absent: 1,
//   late: 1,
//   excused: 0,
//   attendance_percentage: 90
// }
```

### Example: Get Batch Summary

```typescript
const summary = await getBatchAttendanceSummary('batch-uuid')

console.log(summary)
// {
//   batch_id: 'batch-uuid',
//   batch_name: 'Advanced Yoga - Spring 2025',
//   total_students: 25,
//   total_sessions: 12,
//   average_attendance_percentage: 87.5,
//   student_summaries: [...]
// }
```

---

## 🔐 Permissions and Access Control

### Default Role Permissions

```typescript
const ATTENDANCE_PERMISSIONS = {
  teacher: ['read', 'create', 'update', 'delete'],
  admin: ['read', 'create', 'update', 'delete'],
  business_admin: ['read', 'create', 'update', 'delete'],
  super_admin: ['read', 'create', 'update', 'delete'],
  student: ['read'], // Own attendance only
  parent: ['read'], // Children's attendance only
}
```

### Permission Checks in Components

```typescript
import { usePermissions } from '@/hooks/usePermissions'

const MyComponent = () => {
  const { canAccessResource } = usePermissions()

  const canCreate = canAccessResource('attendance_records', 'create')
  const canUpdate = canAccessResource('attendance_records', 'update')
  const canDelete = canAccessResource('attendance_records', 'delete')

  return (
    <>
      {canCreate && <Button onClick={handleCreate}>Mark Attendance</Button>}
      {canUpdate && <Button onClick={handleUpdate}>Update</Button>}
      {canDelete && <Button onClick={handleDelete}>Delete</Button>}
    </>
  )
}
```

### RLS Policies (Database Level)

The database has built-in Row Level Security:

1. **Teachers/Admins**: Can view and manage ALL attendance records
2. **Students**: Can view ONLY their own attendance records
3. **Parents**: Can view ONLY their children's attendance records (matched by email)

These policies are enforced at the database level, providing an additional security layer.

---

## 🧪 Testing Guide

### Manual Testing Checklist

#### ✅ Teacher/Admin Flow

1. **Mark Attendance**:
   - [ ] Navigate to Attendance tab
   - [ ] Select a batch
   - [ ] Click "Mark Attendance"
   - [ ] Verify all students loaded
   - [ ] Mark different statuses (Present, Absent, Late, Excused)
   - [ ] Add notes for some students
   - [ ] Add session topic
   - [ ] Save and verify success

2. **View Attendance**:
   - [ ] Check statistics cards show correct numbers
   - [ ] Verify student summary table displays
   - [ ] Check attendance percentages calculated correctly
   - [ ] Filter by date range

3. **Update Attendance**:
   - [ ] Mark attendance for same date again
   - [ ] Verify it updates existing record (not duplicate)

#### ✅ Student Flow

1. **View Own Attendance**:
   - [ ] Navigate to Attendance tab
   - [ ] Select a batch from dropdown
   - [ ] Verify statistics show correctly
   - [ ] Check attendance percentage and progress bar
   - [ ] View detailed history table

2. **Filter Attendance**:
   - [ ] Set start and end dates
   - [ ] Verify filtered records display

#### ✅ Parent Flow

1. **View Child's Attendance**:
   - [ ] Navigate to Attendance tab
   - [ ] Select a child
   - [ ] Verify attendance displays for selected child
   - [ ] Switch between children
   - [ ] Verify data updates

### Automated Testing (Future)

```typescript
describe('Attendance Management', () => {
  it('should mark attendance for a single student', async () => {
    const result = await markAttendance({
      batch_id: testBatchId,
      student_id: testStudentId,
      class_date: '2025-11-11',
      status: 'present',
      marked_by: testTeacherId,
    })

    expect(result).toBeTruthy()
    expect(result?.status).toBe('present')
  })

  it('should calculate attendance percentage correctly', async () => {
    const stats = await getStudentAttendanceStats(testStudentId, testBatchId)

    expect(stats.attendance_percentage).toBeGreaterThanOrEqual(0)
    expect(stats.attendance_percentage).toBeLessThanOrEqual(100)
  })
})
```

---

## 🐛 Troubleshooting

### Issue: Tables not created

**Solution**:
```sql
-- Check if migration ran
SELECT * FROM information_schema.tables
WHERE table_name IN ('attendance_sessions', 'attendance_records');

-- If empty, run migration again
\i src/SSH/migrations/attendance_tables.sql
```

### Issue: "Permission denied" errors

**Solution**:
1. Check RLS policies are enabled:
```sql
SELECT tablename, rowsecurity
FROM pg_tables
WHERE tablename IN ('attendance_sessions', 'attendance_records');
```

2. Verify user role:
```sql
SELECT id, email, role FROM profiles WHERE id = 'your-user-id';
```

### Issue: Attendance not showing for students

**Possible Causes**:
1. Student not assigned to batch
2. No attendance marked yet
3. RLS policy blocking access

**Solution**:
```sql
-- Check if student is in batch
SELECT * FROM batch_students
WHERE student_id = 'student-id' AND batch_id = 'batch-id';

-- Check if attendance records exist
SELECT * FROM attendance_records
WHERE student_id = 'student-id' AND batch_id = 'batch-id';
```

### Issue: Duplicate attendance records

**Solution**:
The system has a unique constraint on `(batch_id, student_id, class_date)`. If you're seeing duplicates:

```sql
-- Find duplicates
SELECT batch_id, student_id, class_date, COUNT(*)
FROM attendance_records
GROUP BY batch_id, student_id, class_date
HAVING COUNT(*) > 1;

-- Delete duplicates (keep most recent)
DELETE FROM attendance_records a
USING attendance_records b
WHERE a.id < b.id
  AND a.batch_id = b.batch_id
  AND a.student_id = b.student_id
  AND a.class_date = b.class_date;
```

### Issue: Icons not showing

**Solution**:
Ensure Heroicons is installed:
```bash
yarn add @heroicons/react
```

Import correctly:
```typescript
import { CalendarDaysIcon } from '@heroicons/react/24/outline'
```

---

## 📊 Features Summary

### ✅ Implemented Features

- ✅ Mark individual student attendance
- ✅ Bulk attendance marking
- ✅ Multiple status types (Present, Absent, Late, Excused)
- ✅ Session tracking with topics and notes
- ✅ Per-student notes
- ✅ Attendance statistics and reports
- ✅ Student-wise attendance summary
- ✅ Batch-wise attendance summary
- ✅ Date range filtering
- ✅ Real-time percentage calculations
- ✅ Visual progress bars
- ✅ Search functionality
- ✅ Responsive design
- ✅ Role-based access control
- ✅ RLS policies for data security

### 🔮 Future Enhancements

- [ ] Export attendance to CSV/PDF
- [ ] Email notifications for low attendance
- [ ] Attendance trends and analytics
- [ ] Mobile app integration
- [ ] QR code-based attendance
- [ ] Biometric integration
- [ ] Automated attendance reminders
- [ ] Parent notifications via SMS/Email

---

## 📝 Best Practices

### 1. Regular Backups
```sql
-- Backup attendance data
pg_dump -t attendance_records -t attendance_sessions > attendance_backup.sql
```

### 2. Performance Optimization
- Use date range filters to limit records
- Index on `class_date` for faster queries
- Cache batch summaries when possible

### 3. Data Integrity
- Always mark attendance on correct date
- Don't delete historical records
- Use `updated_at` field for audit trail

### 4. User Experience
- Provide clear feedback on actions
- Show loading states
- Handle errors gracefully
- Make it mobile-friendly

---

## 🆘 Support

For issues or questions:
1. Check this guide first
2. Review the code comments
3. Check database logs
4. Contact the development team

---

**Last Updated**: 2025-11-11
**Version**: 1.0.0
**Author**: Claude Code Agent
