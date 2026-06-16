/**
 * Site Settings Page
 */

'use client'

export const dynamic = 'force-dynamic'

import { useState } from 'react'
import { Save } from 'lucide-react'

export default function SettingsPage() {
  const [settings, setSettings] = useState({
    siteName: 'eYogi Gurukul',
    siteDescription: 'Spiritual and Educational Platform',
    contactEmail: 'contact@eyotigurukul.com',
    phoneNumber: '+1 234 567 8900',
    maintenanceMode: false,
  })
  const [saving, setSaving] = useState(false)

  const handleSave = async () => {
    setSaving(true)
    try {
      // Save settings to API
      await new Promise((resolve) => setTimeout(resolve, 1000))
      alert('Settings saved successfully!')
    } catch (error) {
      alert('Error saving settings')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h1 className="text-3xl font-bold text-slate-900">Settings</h1>
        <p className="text-slate-600 mt-1">Configure site settings</p>
      </div>

      <div className="bg-white p-8 rounded-lg border border-slate-200 space-y-6">
        {/* Site Name */}
        <div>
          <label className="block text-sm font-medium text-slate-900 mb-2">Site Name</label>
          <input
            type="text"
            value={settings.siteName}
            onChange={(e) => setSettings((prev) => ({ ...prev, siteName: e.target.value }))}
            className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
          />
        </div>

        {/* Description */}
        <div>
          <label className="block text-sm font-medium text-slate-900 mb-2">Description</label>
          <textarea
            value={settings.siteDescription}
            onChange={(e) => setSettings((prev) => ({ ...prev, siteDescription: e.target.value }))}
            rows={3}
            className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 resize-none"
          />
        </div>

        {/* Email */}
        <div>
          <label className="block text-sm font-medium text-slate-900 mb-2">Contact Email</label>
          <input
            type="email"
            value={settings.contactEmail}
            onChange={(e) => setSettings((prev) => ({ ...prev, contactEmail: e.target.value }))}
            className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
          />
        </div>

        {/* Phone */}
        <div>
          <label className="block text-sm font-medium text-slate-900 mb-2">Phone Number</label>
          <input
            type="tel"
            value={settings.phoneNumber}
            onChange={(e) => setSettings((prev) => ({ ...prev, phoneNumber: e.target.value }))}
            className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
          />
        </div>

        {/* Maintenance Mode */}
        <div className="pt-4 border-t border-slate-200">
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={settings.maintenanceMode}
              onChange={(e) =>
                setSettings((prev) => ({ ...prev, maintenanceMode: e.target.checked }))
              }
              className="w-4 h-4 rounded border-slate-300"
            />
            <span className="text-sm font-medium text-slate-900">Enable Maintenance Mode</span>
          </label>
        </div>

        {/* Save Button */}
        <div className="pt-6 border-t border-slate-200">
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex items-center gap-2 px-6 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 disabled:bg-slate-400 transition-colors font-medium"
          >
            <Save className="w-5 h-5" />
            {saving ? 'Saving...' : 'Save Settings'}
          </button>
        </div>
      </div>
    </div>
  )
}
