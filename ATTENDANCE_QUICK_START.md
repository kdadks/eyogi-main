# 🚀 Attendance Feature - Quick Start Guide

## 3-Step Implementation

### Step 1: Run Database Migration (2 minutes)

```bash
# Connect to your database and run the FINAL migration
psql $DATABASE_URI < src/SSH/migrations/attendance_tables_final.sql

# Verify it worked
psql $DATABASE_URI -c "SELECT table_name FROM information_schema.tables WHERE table_name IN ('attendance_sessions', 'attendance_records');"
```

Expected output: 2 rows (attendance_sessions, attendance_records)

**Important**: Use `attendance_tables_final.sql` (not the original or fixed versions) to avoid schema errors.

---

### Step 2: Add Dashboard Integrations (5 minutes)

#### A. TeacherDashboard
**File**: `src/SSH/src/pages/dashboard/TeacherDashboard.tsx`

Add these lines:

```typescript
// At the top with other imports (around line 20-30)
import AttendanceManagement from '../../components/admin/AttendanceManagement'
import { CalendarDaysIcon } from '@heroicons/react/24/outline'

// Find the View type definition (around line 40-50) and update it:
type View = 'overview' | 'courses' | 'students' | 'certificates' | 'batches' | 'analytics' | 'attendance' | 'settings'

// Find the tabs array (around line 100-120) and add this entry:
const tabs = [
  // ... existing tabs ...
  { id: 'attendance' as const, label: 'Attendance', icon: CalendarDaysIcon },
  // ... rest of tabs ...
]

// Find the view rendering section (around line 300-400) and add:
{activeView === 'attendance' && <AttendanceManagement />}
```

#### B. StudentDashboard
**File**: `src/SSH/src/pages/dashboard/StudentDashboard.tsx`

Add these lines:

```typescript
// At the top with other imports
import StudentAttendanceView from '../../components/student/StudentAttendanceView'
import { CalendarDaysIcon } from '@heroicons/react/24/outline'

// Update View type:
type View = 'home' | 'courses' | 'enrollments' | 'certificates' | 'batches' | 'attendance' | 'profile' | 'analytics' | 'settings'

// Add to tabs array:
{ id: 'attendance' as const, label: 'Attendance', icon: CalendarDaysIcon },

// Add to view rendering:
{activeView === 'attendance' && <StudentAttendanceView />}
```

#### C. ParentsDashboard
**File**: `src/SSH/src/pages/dashboard/parents/ParentsDashboard.tsx`

Add these lines:

```typescript
// At the top with other imports
import StudentAttendanceView from '../../../components/student/StudentAttendanceView'
import { Card, CardHeader, CardTitle, CardContent } from '../../../components/ui/Card'
import { CalendarDaysIcon } from '@heroicons/react/24/outline'

// Update View type:
type View = 'home' | 'children' | 'enrollments' | 'progress' | 'attendance' | 'settings' | 'analytics'

// Add state variable (near other useState declarations):
const [selectedChildForAttendance, setSelectedChildForAttendance] = useState<string | null>(null)

// Add to tabs array:
{ id: 'attendance' as const, label: 'Attendance', icon: CalendarDaysIcon },

// Add to view rendering:
{activeView === 'attendance' && (
  <div className="space-y-6">
    <Card>
      <CardHeader>
        <CardTitle>Select Child</CardTitle>
      </CardHeader>
      <CardContent>
        <select
          value={selectedChildForAttendance || ''}
          onChange={(e) => setSelectedChildForAttendance(e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
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
    {selectedChildForAttendance && (
      <StudentAttendanceView studentId={selectedChildForAttendance} />
    )}
  </div>
)}
```

---

### Step 3: Build and Test (3 minutes)

```bash
# Build the SSH application
yarn build:ssh

# Build the full application
yarn build

# Start the development server
yarn dev

# Or start production server
yarn start
```

---

## ✅ Testing Checklist

### As Teacher:
1. [ ] Login as teacher
2. [ ] Go to Attendance tab
3. [ ] Select a batch
4. [ ] Click "Mark Attendance"
5. [ ] Mark a student as Present
6. [ ] Mark another as Absent
7. [ ] Add a note
8. [ ] Save
9. [ ] Verify stats updated

### As Student:
1. [ ] Login as student
2. [ ] Go to Attendance tab
3. [ ] Select a batch
4. [ ] Verify attendance shows
5. [ ] Check percentage is correct

### As Parent:
1. [ ] Login as parent
2. [ ] Go to Attendance tab
3. [ ] Select your child
4. [ ] Verify attendance shows

---

## 🐛 Quick Troubleshooting

**Error: Tables not found**
```bash
# Run migration again with the FINAL version
psql $DATABASE_URI < src/SSH/migrations/attendance_tables_final.sql
```

**Error: parent_children or parent_guardian_email not found**
```bash
# Use the FINAL migration instead (it avoids these schema issues)
psql $DATABASE_URI < src/SSH/migrations/attendance_tables_final.sql
```

**Error: Icon not found**
```bash
# Install dependencies
yarn install
```

**Error: Component not found**
```bash
# Rebuild SSH
yarn build:ssh
```

**Error: Permission denied in database**
```sql
-- Check RLS policies
SELECT * FROM pg_policies WHERE tablename = 'attendance_records';
```

---

## 📚 Full Documentation

- **Complete Implementation Guide**: `src/SSH/ATTENDANCE_IMPLEMENTATION_GUIDE.md`
- **Feature Summary**: `ATTENDANCE_FEATURE_SUMMARY.md`
- **Migration README**: `src/SSH/migrations/README.md`

---

## 🎯 What You Get

✅ Full attendance tracking system
✅ Teacher can mark attendance (bulk or individual)
✅ Students can view their attendance
✅ Parents can view children's attendance
✅ Statistics and reporting
✅ Date filtering
✅ Visual progress bars
✅ Mobile responsive
✅ Secure with RLS policies

---

## ⏱️ Total Time: ~10 minutes

1. Database (2 min)
2. Integrations (5 min)
3. Build & Test (3 min)

---

**Ready to go!** 🚀

If you encounter issues, check the full implementation guide at `src/SSH/ATTENDANCE_IMPLEMENTATION_GUIDE.md`
