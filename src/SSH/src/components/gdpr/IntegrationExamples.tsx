/**
 * GDPR Integration Examples
 *
 * Quick reference for integrating GDPR deletion components into existing dashboards
 */

import React from 'react'
import DataDeletionRequest from '@/components/gdpr/DataDeletionRequest'
import GDPRDeletionManagement from '@/components/admin/GDPRDeletionManagement'

// ============================================
// EXAMPLE 1: Student Dashboard Integration
// ============================================
export function StudentSettingsWithGDPR({ student }: { student: { id: string; role: string } }) {
  return (
    <div className="space-y-6">
      {/* Existing settings sections */}
      <section>
        <h2>Profile Settings</h2>
        {/* ... existing profile settings ... */}
      </section>

      <section>
        <h2>Notification Preferences</h2>
        {/* ... existing notification settings ... */}
      </section>

      {/* NEW: GDPR Data Deletion Section */}
      <section>
        <h2>Privacy & Data Rights</h2>
        <DataDeletionRequest userId={student.id} userRole="student" />
      </section>
    </div>
  )
}

// ============================================
// EXAMPLE 2: Parent Dashboard Integration
// ============================================
interface Child {
  id: string
  full_name: string
}

export function ParentDashboardWithGDPR({
  parent,
  children,
}: {
  parent: { id: string }
  children: Child[]
}) {
  const [selectedChild, setSelectedChild] = React.useState<Child>(children[0])

  return (
    <div className="space-y-6">
      {/* Child Selector */}
      <div>
        <label>Select Child:</label>
        <select
          onChange={(e) => {
            const child = children.find((c) => c.id === e.target.value)
            if (child) setSelectedChild(child)
          }}
        >
          {children.map((child) => (
            <option key={child.id} value={child.id}>
              {child.full_name}
            </option>
          ))}
        </select>
      </div>

      {/* Existing sections for selected child */}
      <section>
        <h2>{selectedChild.full_name}'s Progress</h2>
        {/* ... existing progress tracking ... */}
      </section>

      <section>
        <h2>{selectedChild.full_name}'s Enrollments</h2>
        {/* ... existing enrollment management ... */}
      </section>

      {/* NEW: GDPR Data Deletion for Child */}
      <section>
        <h2>Data Privacy Rights</h2>
        <p className="text-sm text-gray-600 mb-4">
          As a parent/guardian, you can request deletion of {selectedChild.full_name}'s data
        </p>
        <DataDeletionRequest
          userId={parent.id}
          userRole="parent"
          targetUserId={selectedChild.id}
          targetUserName={selectedChild.full_name}
        />
      </section>
    </div>
  )
}

// ============================================
// EXAMPLE 3: Admin Dashboard Integration
// ============================================
export function AdminDashboardWithGDPR({ admin }: { admin: { id: string } }) {
  const [activeSection, setActiveSection] = React.useState<'overview' | 'gdpr'>('overview')

  return (
    <div className="space-y-6">
      {/* Admin Navigation */}
      <nav className="flex gap-4 border-b">
        <button
          onClick={() => setActiveSection('overview')}
          className={activeSection === 'overview' ? 'font-bold' : ''}
        >
          Overview
        </button>
        <button
          onClick={() => setActiveSection('gdpr')}
          className={activeSection === 'gdpr' ? 'font-bold' : ''}
        >
          GDPR Compliance
        </button>
      </nav>

      {/* Content based on active section */}
      {activeSection === 'overview' && (
        <section>
          <h2>Admin Overview</h2>
          {/* ... existing admin overview ... */}
        </section>
      )}

      {/* NEW: GDPR Deletion Management */}
      {activeSection === 'gdpr' && (
        <section>
          <GDPRDeletionManagement adminId={admin.id} />
        </section>
      )}
    </div>
  )
}

// ============================================
// EXAMPLE 4: Settings Page with Tabs
// ============================================
export function SettingsPageWithGDPR({
  user,
}: {
  user: { id: string; role: 'student' | 'teacher' | 'admin' | 'parent' }
}) {
  const [activeTab, setActiveTab] = React.useState<'profile' | 'privacy' | 'notifications'>(
    'profile',
  )

  return (
    <div>
      {/* Tab Navigation */}
      <div className="flex gap-2 mb-6 border-b">
        <button
          onClick={() => setActiveTab('profile')}
          className={`px-4 py-2 ${activeTab === 'profile' ? 'border-b-2 border-orange-600' : ''}`}
        >
          Profile
        </button>
        <button
          onClick={() => setActiveTab('notifications')}
          className={`px-4 py-2 ${activeTab === 'notifications' ? 'border-b-2 border-orange-600' : ''}`}
        >
          Notifications
        </button>
        {/* NEW: Privacy Tab */}
        <button
          onClick={() => setActiveTab('privacy')}
          className={`px-4 py-2 ${activeTab === 'privacy' ? 'border-b-2 border-orange-600' : ''}`}
        >
          Privacy & Data
        </button>
      </div>

      {/* Tab Content */}
      <div>
        {activeTab === 'profile' && (
          <div>
            <h2>Profile Settings</h2>
            {/* ... existing profile settings ... */}
          </div>
        )}

        {activeTab === 'notifications' && (
          <div>
            <h2>Notification Preferences</h2>
            {/* ... existing notification settings ... */}
          </div>
        )}

        {/* NEW: Privacy Tab Content */}
        {activeTab === 'privacy' && (
          <div>
            <h2>Privacy & Data Rights</h2>
            <div className="space-y-6">
              {/* Existing privacy settings */}
              <section>
                <h3>Data Consent</h3>
                {/* ... existing consent management ... */}
              </section>

              {/* NEW: Data Deletion */}
              <section>
                <h3>Right to Deletion</h3>
                <DataDeletionRequest userId={user.id} userRole={user.role} />
              </section>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

// ============================================
// EXAMPLE 5: Standalone Privacy Page
// ============================================
export function PrivacyManagementPage({
  user,
}: {
  user: { id: string; role: 'student' | 'teacher' | 'admin' | 'parent' }
}) {
  return (
    <div className="max-w-4xl mx-auto p-6 space-y-8">
      <header>
        <h1 className="text-3xl font-bold">Privacy & Data Management</h1>
        <p className="text-gray-600 mt-2">Manage your data and exercise your privacy rights</p>
      </header>

      {/* Consent Section */}
      <section className="space-y-4">
        <h2 className="text-2xl font-semibold">Data Consent</h2>
        <p className="text-gray-600">
          Review and manage the consent you've given for data processing
        </p>
        {/* ... existing consent components ... */}
      </section>

      {/* NEW: Data Deletion Section */}
      <section className="space-y-4">
        <h2 className="text-2xl font-semibold">Right to Be Forgotten</h2>
        <p className="text-gray-600">
          Under GDPR Article 17, you have the right to request deletion of your personal data
        </p>
        <DataDeletionRequest userId={user.id} userRole={user.role} className="mt-4" />
      </section>

      {/* Additional Privacy Info */}
      <section className="space-y-4">
        <h2 className="text-2xl font-semibold">Your Privacy Rights</h2>
        <ul className="list-disc list-inside space-y-2 text-gray-700">
          <li>Right to access your data</li>
          <li>Right to rectification</li>
          <li>Right to erasure (deletion)</li>
          <li>Right to restrict processing</li>
          <li>Right to data portability</li>
          <li>Right to object</li>
        </ul>
      </section>
    </div>
  )
}

// ============================================
// EXAMPLE 6: Add to Existing Admin Tabs
// ============================================

/**
 * To integrate into existing admin management component:
 *
 * 1. Import the component:
 *    import GDPRDeletionManagement from '@/components/admin/GDPRDeletionManagement'
 *
 * 2. Add to your tab type:
 *    type TabType = 'overview' | 'users' | 'courses' | 'gdpr'
 *
 * 3. Add tab button:
 *    <button onClick={() => setActiveTab('gdpr')}>GDPR Compliance</button>
 *
 * 4. Add tab content:
 *    {activeTab === 'gdpr' && (
 *      <GDPRDeletionManagement adminId={admin.id} />
 *    )}
 */

// ============================================
// EXAMPLE 7: Add Link to Navigation Menu
// ============================================
/**
 * Example navigation menu structure with GDPR privacy link.
 * Add this to your navigation configuration:
 *
 * const navigationMenuWithGDPR = [
 *   {
 *     name: 'Dashboard',
 *     href: '/dashboard',
 *   },
 *   {
 *     name: 'Courses',
 *     href: '/courses',
 *   },
 *   {
 *     name: 'Settings',
 *     href: '/settings',
 *     subItems: [
 *       { name: 'Profile', href: '/settings/profile' },
 *       { name: 'Notifications', href: '/settings/notifications' },
 *       { name: 'Privacy & Data', href: '/settings/privacy' }, // NEW
 *     ],
 *   },
 * ]
 */

// ============================================
// EXAMPLE 8: Add to Footer (Privacy Link)
// ============================================
export function FooterWithPrivacyLink() {
  return (
    <footer>
      <div className="flex gap-4">
        <a href="/terms">Terms of Service</a>
        <a href="/privacy-policy">Privacy Policy</a>
        <a href="/settings/privacy">Manage Your Data</a> {/* NEW */}
      </div>
    </footer>
  )
}
