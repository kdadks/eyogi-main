
import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Save, Globe, Mail, Building2, MessageCircle } from 'lucide-react'
import {
  AdminLayout,
  Card,
  CardBody,
  CardHeader,
  Button,
  Input,
  Textarea,
  Select,
  Alert,
  Spinner,
} from '@/components/admin'

const supabase = createClient()

interface Settings {
  site_name: string
  site_email: string
  site_phone: string
  site_url: string
  organization_name: string
  organization_address: string
  currency: string
  timezone: string
  language: string
  maintenance_mode: boolean
  whatsapp_phone: string
}

export default function AdminSettings() {
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)
  const [settings, setSettings] = useState<Settings>({
    site_name: 'eyogi',
    site_email: 'contact@eyogi.com',
    site_phone: '',
    site_url: '',
    organization_name: 'eyogi Foundation',
    organization_address: '',
    currency: 'EUR',
    timezone: 'UTC',
    language: 'en',
    maintenance_mode: false,
    whatsapp_phone: '',
  })

  useEffect(() => {
    fetchSettings()
  }, [])

  const fetchSettings = async () => {
    try {
      setLoading(true)
      const { data, error } = await supabase
        .schema('gurukul_main')
        .from('settings')
        .select('key, value')
        .eq('category', 'general')

      if (error) throw error

      if (data && data.length > 0) {
        const settingsMap: Record<string, string | boolean> = {}
        data.forEach((item) => {
          if (item.key === 'maintenance_mode') {
            settingsMap[item.key] = item.value === 'true'
          } else {
            settingsMap[item.key] = item.value || ''
          }
        })
        setSettings((prev) => ({ ...prev, ...settingsMap } as Settings))
      }
    } catch (err) {
      console.error('Error fetching settings:', err)
      showMessage('error', 'Failed to load settings')
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async () => {
    setSaving(true)
    setMessage(null)

    try {
      const updates = Object.entries(settings).map(([key, value]) =>
        supabase
          .schema('gurukul_main')
          .from('settings')
          .upsert(
            {
              key,
              value: typeof value === 'boolean' ? (value ? 'true' : 'false') : value,
              category: key === 'whatsapp_phone' ? 'contact' : 'general',
              is_public: !['site_phone', 'organization_address'].includes(key),
            },
            { onConflict: 'key' },
          ),
      )

      await Promise.all(updates)
      showMessage('success', 'Settings saved successfully')
    } catch (err: any) {
      console.error('Error saving settings:', err)
      showMessage('error', err.message || 'Failed to save settings')
    } finally {
      setSaving(false)
    }
  }

  const showMessage = (type: 'success' | 'error', text: string) => {
    setMessage({ type, text })
    setTimeout(() => setMessage(null), 5000)
  }

  const handleChange = (key: keyof Settings, value: any) => {
    setSettings((prev) => ({ ...prev, [key]: value }))
  }

  if (loading) {
    return (
      <AdminLayout
        title="Settings"
        breadcrumbs={[
          { label: 'Dashboard', href: '/admin' },
          { label: 'Settings' },
        ]}
      >
        <div className="flex items-center justify-center py-12">
          <Spinner size="lg" />
        </div>
      </AdminLayout>
    )
  }

  return (
    <AdminLayout
      title="Site Settings"
      breadcrumbs={[
        { label: 'Dashboard', href: '/admin' },
        { label: 'Settings' },
      ]}
    >
      <div className="max-w-3xl">
        {message && (
          <Alert
            type={message.type === 'success' ? 'success' : 'error'}
            title={message.type === 'success' ? 'Success' : 'Error'}
            message={message.text}
            onClose={() => setMessage(null)}
            className="mb-6"
          />
        )}

        <div className="space-y-6">
          {/* Site Information */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Globe className="w-5 h-5 text-blue-600" />
                <h2 className="text-lg font-semibold">Site Information</h2>
              </div>
            </CardHeader>
            <CardBody>
              <div className="space-y-4">
                <Input
                  label="Site Name"
                  value={settings.site_name}
                  onChange={(e) => handleChange('site_name', e.target.value)}
                  placeholder="eyogi"
                  required
                />

                <Input
                  label="Site URL"
                  type="url"
                  value={settings.site_url}
                  onChange={(e) => handleChange('site_url', e.target.value)}
                  placeholder="https://eyogi.com"
                  hint="The primary URL for your website"
                />

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Select
                    label="Language"
                    value={settings.language}
                    onChange={(e) => handleChange('language', e.target.value)}
                    options={[
                      { value: 'en', label: 'English' },
                      { value: 'de', label: 'German' },
                      { value: 'fr', label: 'French' },
                      { value: 'es', label: 'Spanish' },
                    ]}
                  />

                  <Select
                    label="Timezone"
                    value={settings.timezone}
                    onChange={(e) => handleChange('timezone', e.target.value)}
                    options={[
                      { value: 'UTC', label: 'UTC' },
                      { value: 'Europe/London', label: 'Europe/London' },
                      { value: 'Europe/Berlin', label: 'Europe/Berlin (CET)' },
                      { value: 'Europe/Paris', label: 'Europe/Paris (CET)' },
                      { value: 'US/Eastern', label: 'US/Eastern (EST)' },
                      { value: 'US/Pacific', label: 'US/Pacific (PST)' },
                    ]}
                  />
                </div>

                <Select
                  label="Currency"
                  value={settings.currency}
                  onChange={(e) => handleChange('currency', e.target.value)}
                  options={[
                    { value: 'EUR', label: '€ Euro (EUR)' },
                    { value: 'USD', label: '$ US Dollar (USD)' },
                    { value: 'GBP', label: '£ British Pound (GBP)' },
                    { value: 'CHF', label: 'CHF Swiss Franc (CHF)' },
                  ]}
                />
              </div>
            </CardBody>
          </Card>

          {/* Contact Information */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Mail className="w-5 h-5 text-blue-600" />
                <h2 className="text-lg font-semibold">Contact Information</h2>
              </div>
            </CardHeader>
            <CardBody>
              <div className="space-y-4">
                <Input
                  label="Email Address"
                  type="email"
                  value={settings.site_email}
                  onChange={(e) => handleChange('site_email', e.target.value)}
                  placeholder="contact@eyogi.com"
                  required
                  hint="Used for contact forms and notifications"
                />

                <Input
                  label="Phone Number"
                  type="tel"
                  value={settings.site_phone}
                  onChange={(e) => handleChange('site_phone', e.target.value)}
                  placeholder="+1 (555) 000-0000"
                  hint="Optional: displayed on contact page"
                />
              </div>
            </CardBody>
          </Card>

          {/* WhatsApp */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <MessageCircle className="w-5 h-5 text-green-600" />
                <h2 className="text-lg font-semibold">WhatsApp</h2>
              </div>
            </CardHeader>
            <CardBody>
              <Input
                label="WhatsApp Phone Number"
                type="tel"
                value={settings.whatsapp_phone}
                onChange={(e) => handleChange('whatsapp_phone', e.target.value)}
                placeholder="353894378148"
                hint="E.164 format without the + sign (e.g. 353894378148). Leave blank to hide the WhatsApp button."
              />
            </CardBody>
          </Card>

          {/* Organization Information */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Building2 className="w-5 h-5 text-blue-600" />
                <h2 className="text-lg font-semibold">Organization</h2>
              </div>
            </CardHeader>
            <CardBody>
              <div className="space-y-4">
                <Input
                  label="Organization Name"
                  value={settings.organization_name}
                  onChange={(e) => handleChange('organization_name', e.target.value)}
                  placeholder="eyogi Foundation"
                  required
                />

                <Textarea
                  label="Organization Address"
                  value={settings.organization_address}
                  onChange={(e) => handleChange('organization_address', e.target.value)}
                  placeholder="Street address, city, country..."
                  rows={3}
                  hint="Displayed in footer and legal documents"
                />
              </div>
            </CardBody>
          </Card>

          {/* System Settings */}
          <Card>
            <CardHeader>
              <h2 className="text-lg font-semibold">System Settings</h2>
            </CardHeader>
            <CardBody>
              <label className="flex items-center gap-3 cursor-pointer">
                <div className="relative flex-shrink-0">
                  <input
                    type="checkbox"
                    checked={settings.maintenance_mode}
                    onChange={(e) => handleChange('maintenance_mode', e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-14 h-8 bg-gray-300 peer-checked:bg-red-600 rounded-full peer transition-colors"></div>
                  <div className="absolute left-1 top-1 w-6 h-6 bg-white rounded-full transition-transform peer-checked:translate-x-6"></div>
                </div>
                <div>
                  <span className="font-medium text-gray-900">Maintenance Mode</span>
                  <p className="text-sm text-gray-600">
                    When enabled, only admins can access the site
                  </p>
                </div>
              </label>
            </CardBody>
          </Card>

          {/* Save Button */}
          <div className="flex justify-end gap-3">
            <Button
              onClick={() => fetchSettings()}
              variant="secondary"
              disabled={saving}
            >
              Reset
            </Button>
            <Button
              onClick={handleSave}
              isLoading={saving}
              disabled={saving}
              icon={!saving && <Save className="w-4 h-4" />}
            >
              {saving ? 'Saving...' : 'Save Settings'}
            </Button>
          </div>
        </div>
      </div>
    </AdminLayout>
  )
}
