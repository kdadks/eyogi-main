
import { useState, useEffect } from 'react'
import { Save, Key, CreditCard, AlertCircle } from 'lucide-react'
import { createClient } from '@supabase/supabase-js'
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

const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL || '',
  import.meta.env.VITE_SUPABASE_ANON_KEY || ''
)

interface PaymentSetting {
  key: string
  value: string
  description: string
}

export default function AdminPaymentSettings() {
  const [settings, setSettings] = useState<Record<string, string>>({
    sumup_api_key: '',
    sumup_merchant_code: '',
    sumup_enabled: 'false',
    donation_min_amount: '5',
  })
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  useEffect(() => {
    fetchSettings()
  }, [])

  const fetchSettings = async () => {
    try {
      const { data, error } = await supabase
        .from('settings')
        .select('key, value')
        .eq('category', 'payment')

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
      // Update each setting
      const updates = Object.entries(settings).map(([key, value]) =>
        supabase
          .from('settings')
          .upsert(
            {
              key,
              value,
              category: 'payment',
              is_public: key.includes('min_amount') || key.includes('currency'),
            },
            { onConflict: 'key' },
          ),
      )

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
      <div className="max-w-2xl">
        <p className="text-gray-600 mb-8">
          Configure SumUp payment gateway integration for donations
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
            <CardBody>
              <label className="flex items-center justify-between cursor-pointer">
                <div>
                  <h3 className="font-semibold text-gray-900 mb-1">
                    Enable SumUp Payments
                  </h3>
                  <p className="text-sm text-gray-600">
                    Turn on to accept online donations via SumUp
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

          {/* SumUp API Key */}
          <Card>
            <CardBody>
              <Input
                label={
                  <div className="flex items-center gap-2">
                    <Key className="w-4 h-4" />
                    <span>SumUp API Key</span>
                  </div>
                }
                type="password"
                value={settings.sumup_api_key}
                onChange={(e) => handleChange('sumup_api_key', e.target.value)}
                placeholder="sup_sk_..."
                hint="Your SumUp API key for processing payments"
              />
            </CardBody>
          </Card>

          {/* SumUp Merchant Code */}
          <Card>
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

          {/* Minimum Amount */}
          <Card>
            <CardBody>
              <Input
                label="Minimum Donation Amount (EUR)"
                type="number"
                min="1"
                step="1"
                value={settings.donation_min_amount}
                onChange={(e) => handleChange('donation_min_amount', e.target.value)}
                hint="Minimum amount users can donate online"
              />
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
