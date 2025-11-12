# Student Consent Management - Implementation Guide

**Created**: 2025-11-12
**Status**: ✅ Ready for Integration

## Overview

A comprehensive consent management system for tracking student/parent consent for participation in eYogi Gurukul activities. The system includes proper audit trails, RLS policies, and UX across all dashboards.

## Database Schema

### Table: `student_consent`

```sql
CREATE TABLE student_consent (
  id UUID PRIMARY KEY,
  student_id UUID NOT NULL REFERENCES profiles(id),
  consent_given BOOLEAN NOT NULL DEFAULT false,
  consent_text TEXT NOT NULL,
  consent_date TIMESTAMPTZ,
  consented_by UUID REFERENCES profiles(id),
  ip_address TEXT,
  user_agent TEXT,
  withdrawn BOOLEAN DEFAULT false,
  withdrawn_date TIMESTAMPTZ,
  withdrawn_reason TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(student_id)
);
```

**Migration File**: `src/SSH/migrations/student_consent.sql`

## API Functions

**Location**: `src/SSH/src/lib/api/consent.ts`

### Main Functions:

1. **`getStudentConsent(studentId: string)`** - Get consent status for a student
2. **`giveConsent(params)`** - Record consent for a student
3. **`withdrawConsent(studentId, reason?)`** - Withdraw consent
4. **`getStudentsConsent(studentIds[])`** - Bulk fetch for teachers/admins
5. **`getAllConsents(params?)`** - Admin view with pagination
6. **`getConsentStats()`** - Get statistics for admin dashboard

### Consent Text Constant:

```typescript
export const CONSENT_TEXT = `I/ my children(s) wish to voluntarily participate in eYogi Gurukul...`
```

## Components

### 1. ConsentModal
**Location**: `src/SSH/src/components/consent/ConsentModal.tsx`

**Features**:
- Full consent text display
- Checkbox agreement
- Parent vs Student wording
- Withdraw consent functionality
- Audit trail (IP address, user agent)
- Responsive design

**Props**:
```typescript
{
  studentId: string
  studentName: string
  consentedBy: string  // Parent or student ID
  currentConsent?: { consent_given, consent_date, withdrawn } | null
  onClose: () => void
  onSuccess: () => void
  isParent?: boolean
}
```

### 2. ConsentStatusBadge
**Location**: `src/SSH/src/components/consent/ConsentStatusBadge.tsx`

**Features**:
- Green checkmark: Consent Given
- Red X: Consent Withdrawn
- Yellow warning: No Consent
- Configurable size (sm, md, lg)
- Optional label display

**Props**:
```typescript
{
  consentGiven: boolean
  withdrawn: boolean
  size?: 'sm' | 'md' | 'lg'
  showLabel?: boolean
}
```

## Integration Points

### Parent Dashboard

**Location**: `src/SSH/src/pages/dashboard/parents/ParentsDashboard.tsx`

**Where to integrate**:
1. **Children Tab** (line ~1548): Add consent button to each child card
2. **Home Tab** (line ~911): Show consent warnings for children without consent

**Implementation Steps**:

1. Add imports at top:
```typescript
import ConsentModal from '../../../components/consent/ConsentModal'
import ConsentStatusBadge from '../../../components/consent/ConsentStatusBadge'
import { getStudentConsent } from '../../../lib/api/consent'
```

2. Add state for consent modal:
```typescript
const [showConsentModal, setShowConsentModal] = useState(false)
const [selectedChildForConsent, setSelectedChildForConsent] = useState<Child | null>(null)
const [childConsents, setChildConsents] = useState<Map<string, any>>(new Map())
```

3. Load consents when children are loaded:
```typescript
// In loadChildren or useEffect after children are loaded
const consents = await Promise.all(
  children.map(child => getStudentConsent(child.student_id))
)
setChildConsents(new Map(consents.filter(c => c).map(c => [c.student_id, c])))
```

4. Add consent button in child card (after Edit/Delete buttons):
```typescript
<motion.button
  onClick={() => {
    setSelectedChildForConsent(child)
    setShowConsentModal(true)
  }}
  className="min-w-[44px] min-h-[44px] w-11 h-11 bg-green-500 hover:bg-green-600 text-white rounded-full"
  title="Manage Consent"
>
  <DocumentTextIcon className="h-5 w-5" />
</motion.button>

{/* Show consent status badge */}
<div className="mt-2">
  <ConsentStatusBadge
    consentGiven={childConsents.get(child.student_id)?.consent_given || false}
    withdrawn={childConsents.get(child.student_id)?.withdrawn || false}
    size="sm"
  />
</div>
```

5. Add modal before closing div:
```typescript
{showConsentModal && selectedChildForConsent && (
  <ConsentModal
    studentId={selectedChildForConsent.student_id}
    studentName={selectedChildForConsent.full_name}
    consentedBy={user!.id}
    currentConsent={childConsents.get(selectedChildForConsent.student_id)}
    onClose={() => {
      setShowConsentModal(false)
      setSelectedChildForConsent(null)
    }}
    onSuccess={() => {
      setShowConsentModal(false)
      setSelectedChildForConsent(null)
      loadChildren() // Reload to update consent status
    }}
    isParent={true}
  />
)}
```

### Student Dashboard

**Location**: `src/SSH/src/pages/dashboard/StudentDashboard.tsx`

**Implementation**:

1. Add consent section in main dashboard view
2. Show prominent warning if no consent given
3. Allow student to give consent for themselves

```typescript
// Add state
const [showConsentModal, setShowConsentModal] = useState(false)
const [studentConsent, setStudentConsent] = useState<any>(null)

// Load consent
useEffect(() => {
  if (user?.id) {
    getStudentConsent(user.id).then(setStudentConsent)
  }
}, [user?.id])

// Show warning banner if no consent
{!studentConsent?.consent_given && (
  <Card className="mb-6 bg-yellow-50 border-yellow-200">
    <CardContent className="p-4">
      <div className="flex items-start gap-3">
        <ExclamationTriangleIcon className="h-6 w-6 text-yellow-600" />
        <div className="flex-1">
          <h3 className="font-semibold text-yellow-900">Consent Required</h3>
          <p className="text-sm text-yellow-800 mt-1">
            Please provide consent to participate in eYogi Gurukul activities.
          </p>
          <Button
            onClick={() => setShowConsentModal(true)}
            className="mt-3"
            variant="primary"
          >
            Review & Provide Consent
          </Button>
        </div>
      </div>
    </CardContent>
  </Card>
)}
```

### Teacher Dashboard

**Location**: `src/SSH/src/components/teacher/TeacherStudentManagement.tsx`

**Implementation**:

1. Add consent column to student list table
2. Show ConsentStatusBadge for each student
3. Allow viewing (but not editing) consent details

```typescript
// In student table
<td className="px-6 py-4">
  <ConsentStatusBadge
    consentGiven={studentConsents.get(student.id)?.consent_given || false}
    withdrawn={studentConsents.get(student.id)?.withdrawn || false}
    size="sm"
  />
</td>
```

### Admin Dashboards

**Location**: Admin and Business Admin dashboards

**Implementation**:

1. **Admin People section**: Add consent status column
2. **Analytics**: Add consent statistics widget
3. **Export**: Include consent status in student exports

```typescript
// Analytics widget
const stats = await getConsentStats()

<Card>
  <CardHeader>
    <CardTitle>Consent Status</CardTitle>
  </CardHeader>
  <CardContent>
    <div className="grid grid-cols-2 gap-4">
      <div>
        <p className="text-2xl font-bold text-green-600">{stats.consented}</p>
        <p className="text-sm text-gray-600">Consented</p>
      </div>
      <div>
        <p className="text-2xl font-bold text-yellow-600">{stats.not_consented}</p>
        <p className="text-sm text-gray-600">No Consent</p>
      </div>
    </div>
  </CardContent>
</Card>
```

## UX Guidelines

### 1. Parent Dashboard
- **Prominent placement**: Consent button on each child card
- **Visual indicators**: Color-coded status badges
- **Clear call-to-action**: "Manage Consent" button
- **Warning for missing consent**: Banner on home tab

### 2. Student Dashboard
- **Top banner warning**: If no consent given
- **Easy access**: "Provide Consent" button in settings
- **Clear explanation**: Full consent text visible before agreeing

### 3. Teacher Dashboard
- **Read-only view**: Can see consent status but not modify
- **At-a-glance status**: Badge in student list
- **Filterable**: Filter students by consent status

### 4. Admin Dashboards
- **Statistics widget**: Overview of consent coverage
- **Full audit trail**: View who consented, when, IP address
- **Export capability**: Include in student reports
- **Bulk actions**: Identify students needing consent follow-up

## Testing Checklist

### Database
- [ ] Run migration: `src/SSH/migrations/student_consent.sql`
- [ ] Verify table created with proper indexes
- [ ] Test RLS policies (student, parent, teacher, admin access)

### API Functions
- [ ] Test `giveConsent()` - creates new record
- [ ] Test `giveConsent()` - updates existing record
- [ ] Test `withdrawConsent()` - sets withdrawn flag
- [ ] Test `getStudentConsent()` - retrieves consent
- [ ] Test `getStudentsConsent()` - bulk retrieval

### UI Components
- [ ] ConsentModal opens and displays consent text
- [ ] Checkbox agreement works
- [ ] Submit creates consent record
- [ ] Withdraw flow works with reason
- [ ] ConsentStatusBadge shows correct colors
- [ ] Responsive on mobile devices

### Parent Dashboard
- [ ] Consent button appears on child cards
- [ ] Modal opens for selected child
- [ ] Status badge updates after consent given
- [ ] Warning shows for children without consent

### Student Dashboard
- [ ] Warning banner shows if no consent
- [ ] Student can give consent for themselves
- [ ] Consent status visible in profile

### Teacher Dashboard
- [ ] Consent status visible in student list
- [ ] Teachers can filter by consent status
- [ ] Read-only (no edit capability)

### Admin Dashboards
- [ ] Consent statistics widget shows correct counts
- [ ] Full consent list accessible
- [ ] Audit trail information visible
- [ ] Export includes consent status

## Security & Privacy

### RLS Policies
- ✅ Students can view/manage own consent
- ✅ Parents can view/manage children's consent
- ✅ Teachers can view (read-only) students in their batches
- ✅ Admins can view all consents

### Audit Trail
- ✅ IP address recorded
- ✅ User agent recorded
- ✅ Timestamp of consent
- ✅ Who gave consent (parent vs self)
- ✅ Withdrawal reason tracked

### Data Privacy
- Consent text includes GDPR-compliant withdrawal rights
- Email provided for data removal requests
- Full transparency about data usage
- Right to withdraw clearly stated

## Migration Steps

1. **Run Database Migration**:
   ```bash
   # Connect to database and run
   psql $DATABASE_URL < src/SSH/migrations/student_consent.sql
   ```

2. **Verify Tables**:
   ```sql
   SELECT * FROM student_consent LIMIT 1;
   ```

3. **Build and Deploy**:
   ```bash
   yarn build:ssh
   ```

4. **Test Each Dashboard**:
   - Parent: Give consent for a child
   - Student: View consent status
   - Teacher: See consent in student list
   - Admin: View statistics

## Support & Troubleshooting

### Common Issues:

**Issue**: RLS policies blocking access
**Solution**: Verify user role in profiles table, check policy conditions

**Issue**: Consent not showing after submission
**Solution**: Check browser console for API errors, verify foreign key constraints

**Issue**: IP address not recording
**Solution**: Check CORS settings, verify ipify.org is accessible

### Debug Queries:

```sql
-- Check consent for a student
SELECT * FROM student_consent WHERE student_id = 'uuid';

-- Get all students without consent
SELECT p.id, p.full_name, p.email
FROM profiles p
LEFT JOIN student_consent sc ON sc.student_id = p.id
WHERE p.role = 'student' AND (sc.consent_given IS NULL OR sc.consent_given = false);

-- Consent statistics
SELECT
  COUNT(*) as total,
  SUM(CASE WHEN consent_given = true AND withdrawn = false THEN 1 ELSE 0 END) as consented,
  SUM(CASE WHEN withdrawn = true THEN 1 ELSE 0 END) as withdrawn
FROM student_consent;
```

## Related Files

- **Migration**: `src/SSH/migrations/student_consent.sql`
- **API**: `src/SSH/src/lib/api/consent.ts`
- **Components**:
  - `src/SSH/src/components/consent/ConsentModal.tsx`
  - `src/SSH/src/components/consent/ConsentStatusBadge.tsx`
- **Dashboards**: Parent, Student, Teacher, Admin (to be integrated)

---

**Last Updated**: 2025-11-12
**Version**: 1.0
**Status**: ✅ Components Ready - Integration Pending
