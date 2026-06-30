
import { useState, useEffect } from 'react'
import { Save, Key, CreditCard, AlertCircle } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import {
  AdminLayout,
  Card,
  CardBody,
  CardHeader,
  Button,
  Input,
  Alert,
  Spinner,
} from '@/components/admin'

interface PaymentSetting {
  key: string
  value: string
  description: string
}

export default function AdminPaymentSettings() {
  const [settings, setSettings] = useState<Record<string, string>>({
    sumup_api_key_sandbox: '',
    sumup_api_key_production: '',
    sumup_merchant_code: '',
    sumup_environment: 'sandbox',
    sumup_enabled: 'true',
    membership_monthly_price: '29',
    membership_annual_price: '299',
  })
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  useEffect(() => {
    fetchSettings()
  }, [])

  const fetchSettings = async () => {
    try {
      const supabase = createClient()
      const { data, error } = await supabase
        .schema('gurukul_main')
        .from('settings')
        .select('key, value')
        .in('category', ['payment', 'membership'])

      if (error) throw error

      if (data) {
        const settingsMap: Record<string, string> = {}
        data.forEach((item) => {
          settingsMap[item.key] = item.value || ''
        })
        setSettings((prev) => ({ ...prev, ...settingsMap }))
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
      const supabase = createClient()
      // Update each setting
      const updates = Object.entries(settings).map(async ([key, value]) => {
        const category = key.includes('membership') ? 'membership' : 'payment'
        const isPublic = key.includes('price') || key.includes('min_amount')

        const { data, error } = await supabase
          .schema('gurukul_main')
          .from('settings')
          .upsert(
            {
              key,
              value,
              category,
              is_public: isPublic,
            },
            { onConflict: 'key' },
          )

        if (error) {
          console.error(`Error saving setting ${key}:`, error)
          throw new Error(`Failed to save ${key}: ${error.message}`)
        }
        console.log(`✅ Saved ${key}:`, data)
      })

      await Promise.all(updates)
      showMessage('success', 'Payment settings saved successfully')
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

  const handleChange = (key: string, value: string) => {
    setSettings((prev) => ({ ...prev, [key]: value }))
  }

  if (loading) {
    return (
      <AdminLayout
        title="Payment Settings"
        breadcrumbs={[
          { label: 'Dashboard', href: '/admin' },
          { label: 'Payment Settings' },
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
      title="Payment Settings"
      breadcrumbs={[
        { label: 'Dashboard', href: '/admin' },
        { label: 'Payment Settings' },
      ]}
    >
      <div className="max-w-4xl">
        <p className="text-gray-600 mb-8">
          Configure SumUp payment gateway integration for donations and memberships
        </p>

        {/* Success/Error Message */}
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
          {/* Enable SumUp Toggle */}
          <Card>
            <CardHeader>
              <h3 className="text-lg font-semibold">Payment Gateway Status</h3>
            </CardHeader>
            <CardBody>
              <label className="flex items-center justify-between cursor-pointer">
                <div>
                  <h3 className="font-semibold text-gray-900 mb-1">
                    Enable SumUp Payments
                  </h3>
                  <p className="text-sm text-gray-600">
                    Turn on to accept online donations and membership payments via SumUp
                  </p>
                </div>
                <div className="relative flex-shrink-0">
                  <input
                    type="checkbox"
                    checked={settings.sumup_enabled === 'true'}
                    onChange={(e) =>
                      handleChange('sumup_enabled', e.target.checked ? 'true' : 'false')
                    }
                    className="sr-only peer"
                  />
                  <div className="w-14 h-8 bg-gray-300 peer-checked:bg-blue-600 rounded-full peer transition-colors"></div>
                  <div className="absolute left-1 top-1 w-6 h-6 bg-white rounded-full transition-transform peer-checked:translate-x-6"></div>
                </div>
              </label>
            </CardBody>
          </Card>

          {/* Environment Selection */}
          <Card>
            <CardHeader>
              <h3 className="text-lg font-semibold">Environment Settings</h3>
            </CardHeader>
            <CardBody>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    SumUp Environment
                  </label>
                  <select
                    value={settings.sumup_environment}
                    onChange={(e) => handleChange('sumup_environment', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="sandbox">Sandbox (Testing)</option>
                    <option value="production">Production (Live)</option>
                  </select>
                  <p className="text-sm text-gray-600 mt-1">
                    {settings.sumup_environment === 'sandbox'
                      ? '🧪 Using test environment - no real charges will be made'
                      : '⚠️ Using production environment - real transactions will be processed'}
                  </p>
                </div>
              </div>
            </CardBody>
          </Card>

          {/* API Keys */}
          <Card>
            <CardHeader>
              <h3 className="text-lg font-semibold">SumUp API Keys</h3>
            </CardHeader>
            <CardBody className="space-y-4">
              <Input
                label={
                  <div className="flex items-center gap-2">
                    <Key className="w-4 h-4" />
                    <span>Sandbox API Key</span>
                  </div>
                }
                type="password"
                value={settings.sumup_api_key_sandbox}
                onChange={(e) => handleChange('sumup_api_key_sandbox', e.target.value)}
                placeholder="sup_sk_sandbox_..."
                hint="Your SumUp Sandbox API key for testing"
              />
              
              <Input
                label={
                  <div className="flex items-center gap-2">
                    <Key className="w-4 h-4 text-red-500" />
                    <span className="text-red-600">Production API Key</span>
                  </div>
                }
                type="password"
                value={settings.sumup_api_key_production}
                onChange={(e) => handleChange('sumup_api_key_production', e.target.value)}
                placeholder="sup_sk_live_..."
                hint="⚠️ Your SumUp Production API key - keep this secret!"
              />
            </CardBody>
          </Card>

          {/* Merchant Code */}
          <Card>
            <CardHeader>
              <h3 className="text-lg font-semibold">Merchant Details</h3>
            </CardHeader>
            <CardBody>
              <Input
                label={
                  <div className="flex items-center gap-2">
                    <CreditCard className="w-4 h-4" />
                    <span>SumUp Merchant Code</span>
                  </div>
                }
                type="text"
                value={settings.sumup_merchant_code}
                onChange={(e) => handleChange('sumup_merchant_code', e.target.value)}
                placeholder="MC123456"
                hint="Your SumUp merchant/account identifier"
              />
            </CardBody>
          </Card>

          {/* Membership Pricing */}
          <Card>
            <CardHeader>
              <h3 className="text-lg font-semibold">Membership Pricing</h3>
            </CardHeader>
            <CardBody className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input
                  label="Monthly Membership Price (EUR)"
                  type="number"
                  min="1"
                  step="1"
                  value={settings.membership_monthly_price}
                  onChange={(e) => handleChange('membership_monthly_price', e.target.value)}
                  hint="Price for monthly membership"
                />
                
                <Input
                  label="Annual Membership Price (EUR)"
                  type="number"
                  min="1"
                  step="1"
                  value={settings.membership_annual_price}
                  onChange={(e) => handleChange('membership_annual_price', e.target.value)}
                  hint="Price for annual membership"
                />
              </div>
              
              {settings.membership_monthly_price && settings.membership_annual_price && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <p className="text-sm text-blue-900">
                    💰 Annual savings: €{(parseFloat(settings.membership_monthly_price) * 12 - parseFloat(settings.membership_annual_price)).toFixed(2)} 
                    ({(((parseFloat(settings.membership_monthly_price) * 12 - parseFloat(settings.membership_annual_price)) / (parseFloat(settings.membership_monthly_price) * 12)) * 100).toFixed(0)}%)
                  </p>
                </div>
              )}
            </CardBody>
          </Card>

          {/* Save Button */}
          <div className="flex justify-end pt-4">
            <Button
              onClick={handleSave}
              isLoading={saving}
              disabled={saving}
              icon={!saving && <Save className="w-4 h-4" />}
            >
              {saving ? 'Saving...' : 'Save Settings'}
            </Button>
          </div>

          {/* Help Text */}
          <Alert
            type="info"
            title="Setup Instructions"
            message={
              <ol className="list-decimal list-inside space-y-2 text-sm">
                <li>
                  Sign up for a SumUp account at{' '}
                  <a
                    href="https://sumup.com"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="underline hover:no-underline"
                  >
                    sumup.com
                  </a>
                </li>
                <li>Get your API key from the SumUp developer dashboard</li>
                <li>Copy your merchant code from your SumUp account settings</li>
                <li>Paste both keys above and enable SumUp payments</li>
                <li>Test with a small donation before going live</li>
              </ol>
            }
          />
        </div>
      </div>
    </AdminLayout>
  )
}
