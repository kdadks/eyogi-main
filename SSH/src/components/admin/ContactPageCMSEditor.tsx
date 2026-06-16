import React, { useEffect, useState } from 'react'
import {
  getContactPageCMS,
  updateContactPageCMS,
  ContactPageCMSSettings,
  ContactInfoItem,
  FAQItem,
} from '../../lib/api/contactPageCMS'
import { Button } from '@/components/ui/Button'
import BackgroundStylingField from './BackgroundStylingField'
import MediaSelector from '../MediaSelector'
import type { MediaFile } from '../../lib/api/media'

interface Props {
  slug?: string
}

type TabType = 'hero' | 'contact-info' | 'form' | 'faq' | 'cta'

// Icon options for contact info
const iconOptions = [
  'EnvelopeIcon',
  'PhoneIcon',
  'MapPinIcon',
  'ClockIcon',
  'ChatBubbleLeftRightIcon',
  'QuestionMarkCircleIcon',
  'UserGroupIcon',
  'GlobeAltIcon',
]

// Reusable form components
function FormField({
  label,
  description,
  children,
}: {
  label: string
  description?: string
  children: React.ReactNode
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-sm font-semibold text-gray-900">
        {label}
        {description && <i className="font-normal text-xs text-gray-500 ml-2">{description}</i>}
      </label>
      {children}
    </div>
  )
}

function SectionCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-4 space-y-4">
      <h2 className="text-lg font-bold text-gray-900">{title}</h2>
      {children}
    </div>
  )
}

const ContactPageCMSEditor: React.FC<Props> = ({ slug = 'contact' }) => {
  const [settings, setSettings] = useState<ContactPageCMSSettings | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [activeTab, setActiveTab] = useState<TabType>('hero')
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  useEffect(() => {
    const loadSettings = async () => {
      try {
        const data = await getContactPageCMS(slug)
        if (!data) {
          setError('Contact page settings not found')
        } else {
          setSettings(data)
          setError(null)
        }
      } catch (e) {
        setError(`Failed to load settings: ${e instanceof Error ? e.message : 'Unknown error'}`)
      } finally {
        setLoading(false)
      }
    }

    loadSettings()
  }, [slug])

  const handleSave = async () => {
    if (!settings) return

    try {
      setSaving(true)
      const result = await updateContactPageCMS(settings, slug)
      if (result.success) {
        setSuccess('Settings saved successfully!')
        setTimeout(() => setSuccess(null), 3000)
      } else {
        setError(result.error || 'Failed to save settings')
      }
    } catch (e) {
      setError(`Failed to save: ${e instanceof Error ? e.message : 'Unknown error'}`)
    } finally {
      setSaving(false)
    }
  }

  const updateSetting = <K extends keyof ContactPageCMSSettings>(
    key: K,
    value: ContactPageCMSSettings[K],
  ) => {
    setSettings((prev) => {
      if (!prev) return null
      return {
        ...prev,
        [key]: value,
      }
    })
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center p-12">
        <div className="text-gray-600 text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
          Loading settings...
        </div>
      </div>
    )
  }

  if (!settings) {
    return (
      <div className="p-6 bg-red-50 border-l-4 border-red-500 rounded">
        <p className="text-red-800 font-semibold">Error</p>
        <p className="text-red-600 text-sm">Contact page settings not found</p>
      </div>
    )
  }

  const tabs: Array<{ id: TabType; label: string; icon: string }> = [
    { id: 'hero', label: 'Hero', icon: '🎯' },
    { id: 'contact-info', label: 'Contact Info', icon: '📞' },
    { id: 'form', label: 'Form', icon: '📝' },
    { id: 'faq', label: 'FAQ', icon: '❓' },
    { id: 'cta', label: 'CTA', icon: '🚀' },
  ]

  return (
    <div className="w-full max-w-5xl mx-auto">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="px-4 py-3 flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Contact Page Settings</h1>
            <p className="text-gray-600 text-xs mt-0.5">Manage contact page content and sections</p>
          </div>
          <Button
            onClick={handleSave}
            disabled={saving}
            className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-1.5 rounded-lg text-sm font-semibold transition-colors"
          >
            {saving ? 'Saving...' : '💾 Save'}
          </Button>
        </div>

        {/* Messages */}
        {error && (
          <div className="px-4 pb-3 pt-0">
            <div className="p-3 bg-red-50 border-l-4 border-red-500 rounded text-sm">
              <p className="text-red-800 font-semibold">Error</p>
              <p className="text-red-600 text-xs mt-0.5">{error}</p>
            </div>
          </div>
        )}
        {success && (
          <div className="px-4 pb-3 pt-0">
            <div className="p-3 bg-green-50 border-l-4 border-green-500 rounded text-sm">
              <p className="text-green-800 font-semibold">Success</p>
              <p className="text-green-600 text-xs mt-0.5">{success}</p>
            </div>
          </div>
        )}
      </div>

      {/* Tabs */}
      <div className="bg-white border-b border-gray-200">
        <div className="flex gap-2 px-4 overflow-x-auto">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-3 py-2.5 text-sm font-semibold border-b-2 whitespace-nowrap transition-all ${
                activeTab === tab.id
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-gray-600 hover:text-gray-900'
              }`}
            >
              <span className="mr-1">{tab.icon}</span>
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="bg-gray-50 min-h-screen p-4">
        {activeTab === 'hero' && <HeroSection settings={settings} updateSetting={updateSetting} />}
        {activeTab === 'contact-info' && (
          <ContactInfoSection settings={settings} updateSetting={updateSetting} />
        )}
        {activeTab === 'form' && <FormSection settings={settings} updateSetting={updateSetting} />}
        {activeTab === 'faq' && <FAQSection settings={settings} updateSetting={updateSetting} />}
        {activeTab === 'cta' && <CTASection settings={settings} updateSetting={updateSetting} />}
      </div>
    </div>
  )
}

function HeroSection({
  settings,
  updateSetting,
}: {
  settings: ContactPageCMSSettings
  updateSetting: <K extends keyof ContactPageCMSSettings>(
    key: K,
    value: ContactPageCMSSettings[K],
  ) => void
}) {
  return (
    <>
      <SectionCard title="Hero Section">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField label="Title" description="Main heading">
            <input
              type="text"
              value={settings.hero_title || ''}
              onChange={(e) => updateSetting('hero_title', e.target.value)}
              placeholder="e.g., Get in Touch"
              className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </FormField>

          <FormField label="Title Highlight">
            <input
              type="text"
              value={settings.hero_title_highlight || ''}
              onChange={(e) => updateSetting('hero_title_highlight', e.target.value)}
              placeholder="Highlighted part of title"
              className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </FormField>
        </div>

        <FormField label="Description" description="Hero section subtitle">
          <textarea
            value={settings.hero_description || ''}
            onChange={(e) => updateSetting('hero_description', e.target.value)}
            placeholder="Enter hero description..."
            rows={3}
            className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </FormField>

        <div className="border-t border-gray-200 pt-4 mt-4">
          <h3 className="font-semibold text-sm text-gray-900 mb-3">Background Settings</h3>
          <BackgroundStylingField
            bgType={(settings.hero_bg_type as 'color' | 'image') || 'color'}
            bgColor={settings.hero_bg_color || '#fffbfa'}
            bgImageUrl={settings.hero_bg_image_url}
            onBgTypeChange={(type) => updateSetting('hero_bg_type', type)}
            onBgColorChange={(color) => updateSetting('hero_bg_color', color)}
            onBgImageChange={(url) => updateSetting('hero_bg_image_url', url)}
            label="Hero Section"
          />
        </div>
      </SectionCard>
    </>
  )
}

function ContactInfoSection({
  settings,
  updateSetting,
}: {
  settings: ContactPageCMSSettings
  updateSetting: <K extends keyof ContactPageCMSSettings>(
    key: K,
    value: ContactPageCMSSettings[K],
  ) => void
}) {
  const items = settings.contact_info_items || []

  const updateItem = (index: number, field: keyof ContactInfoItem, value: string) => {
    const newItems = [...items]
    newItems[index] = { ...newItems[index], [field]: value }
    updateSetting('contact_info_items', newItems)
  }

  const addItem = () => {
    updateSetting('contact_info_items', [
      ...items,
      {
        icon: 'EnvelopeIcon',
        title: 'New Contact',
        details: 'Details',
        description: 'Description',
      },
    ])
  }

  const removeItem = (index: number) => {
    updateSetting(
      'contact_info_items',
      items.filter((_, i) => i !== index),
    )
  }

  return (
    <>
      <SectionCard title="Contact Info Cards">
        <div className="space-y-6">
          {items.map((item, index) => (
            <div key={index} className="p-4 bg-gray-50 rounded-lg border border-gray-200">
              <div className="flex justify-between items-center mb-3">
                <h3 className="font-semibold text-gray-900">Contact Card {index + 1}</h3>
                <button
                  onClick={() => removeItem(index)}
                  className="text-red-600 hover:text-red-700 text-sm font-medium"
                >
                  Remove
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField label="Icon">
                  <select
                    value={item.icon}
                    onChange={(e) => updateItem(index, 'icon', e.target.value)}
                    className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    {iconOptions.map((icon) => (
                      <option key={icon} value={icon}>
                        {icon}
                      </option>
                    ))}
                  </select>
                </FormField>

                <FormField label="Title">
                  <input
                    type="text"
                    value={item.title}
                    onChange={(e) => updateItem(index, 'title', e.target.value)}
                    placeholder="e.g., Email Us"
                    className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </FormField>

                <FormField label="Details">
                  <input
                    type="text"
                    value={item.details}
                    onChange={(e) => updateItem(index, 'details', e.target.value)}
                    placeholder="e.g., info@example.com"
                    className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </FormField>

                <FormField label="Description">
                  <input
                    type="text"
                    value={item.description}
                    onChange={(e) => updateItem(index, 'description', e.target.value)}
                    placeholder="e.g., Send us an email anytime"
                    className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </FormField>
              </div>
            </div>
          ))}

          <Button onClick={addItem} variant="outline" className="w-full">
            + Add Contact Card
          </Button>
        </div>

        <div className="border-t border-gray-200 pt-4 mt-4">
          <h3 className="font-semibold text-sm text-gray-900 mb-3">Background Settings</h3>
          <BackgroundStylingField
            bgType={(settings.contact_info_bg_type as 'color' | 'image') || 'color'}
            bgColor={settings.contact_info_bg_color || '#ffffff'}
            bgImageUrl={settings.contact_info_bg_image_url}
            onBgTypeChange={(type) => updateSetting('contact_info_bg_type', type)}
            onBgColorChange={(color) => updateSetting('contact_info_bg_color', color)}
            onBgImageChange={(url) => updateSetting('contact_info_bg_image_url', url)}
            label="Contact Info Section"
          />
        </div>
      </SectionCard>
    </>
  )
}

function FormSection({
  settings,
  updateSetting,
}: {
  settings: ContactPageCMSSettings
  updateSetting: <K extends keyof ContactPageCMSSettings>(
    key: K,
    value: ContactPageCMSSettings[K],
  ) => void
}) {
  return (
    <>
      <SectionCard title="Contact Form Section">
        <FormField label="Visible">
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={settings.form_visible || false}
              onChange={(e) => updateSetting('form_visible', e.target.checked)}
              className="h-4 w-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
            />
            <span className="text-sm text-gray-700">Show contact form section</span>
          </label>
        </FormField>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField label="Form Title">
            <input
              type="text"
              value={settings.form_title || ''}
              onChange={(e) => updateSetting('form_title', e.target.value)}
              placeholder="e.g., Send us a Message"
              className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </FormField>

          <FormField label="Form Description">
            <input
              type="text"
              value={settings.form_description || ''}
              onChange={(e) => updateSetting('form_description', e.target.value)}
              placeholder="e.g., Fill out the form below..."
              className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </FormField>
        </div>

        <div className="border-t border-gray-200 pt-4 mt-4">
          <h3 className="font-semibold text-sm text-gray-900 mb-3">Background Settings</h3>
          <BackgroundStylingField
            bgType={(settings.form_bg_type as 'color' | 'image') || 'color'}
            bgColor={settings.form_bg_color || '#ffffff'}
            bgImageUrl={settings.form_bg_image_url}
            onBgTypeChange={(type) => updateSetting('form_bg_type', type)}
            onBgColorChange={(color) => updateSetting('form_bg_color', color)}
            onBgImageChange={(url) => updateSetting('form_bg_image_url', url)}
            label="Form Section"
          />
        </div>
      </SectionCard>
    </>
  )
}

function FAQSection({
  settings,
  updateSetting,
}: {
  settings: ContactPageCMSSettings
  updateSetting: <K extends keyof ContactPageCMSSettings>(
    key: K,
    value: ContactPageCMSSettings[K],
  ) => void
}) {
  const items = settings.faq_items || []

  const updateItem = (index: number, field: keyof FAQItem, value: string) => {
    const newItems = [...items]
    newItems[index] = { ...newItems[index], [field]: value }
    updateSetting('faq_items', newItems)
  }

  const addItem = () => {
    updateSetting('faq_items', [
      ...items,
      {
        question: 'New Question',
        answer: 'Answer',
      },
    ])
  }

  const removeItem = (index: number) => {
    updateSetting(
      'faq_items',
      items.filter((_, i) => i !== index),
    )
  }

  return (
    <>
      <SectionCard title="FAQ Section">
        <FormField label="Visible">
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={settings.faq_visible || false}
              onChange={(e) => updateSetting('faq_visible', e.target.checked)}
              className="h-4 w-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
            />
            <span className="text-sm text-gray-700">Show FAQ section</span>
          </label>
        </FormField>

        <FormField label="FAQ Title">
          <input
            type="text"
            value={settings.faq_title || ''}
            onChange={(e) => updateSetting('faq_title', e.target.value)}
            placeholder="e.g., Frequently Asked Questions"
            className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </FormField>

        <div className="space-y-4">
          {items.map((item, index) => (
            <div key={index} className="p-4 bg-gray-50 rounded-lg border border-gray-200">
              <div className="flex justify-between items-center mb-3">
                <h3 className="font-semibold text-gray-900">FAQ {index + 1}</h3>
                <button
                  onClick={() => removeItem(index)}
                  className="text-red-600 hover:text-red-700 text-sm font-medium"
                >
                  Remove
                </button>
              </div>

              <div className="space-y-3">
                <FormField label="Question">
                  <input
                    type="text"
                    value={item.question}
                    onChange={(e) => updateItem(index, 'question', e.target.value)}
                    placeholder="e.g., How do I enroll?"
                    className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </FormField>

                <FormField label="Answer">
                  <textarea
                    value={item.answer}
                    onChange={(e) => updateItem(index, 'answer', e.target.value)}
                    placeholder="Enter the answer..."
                    rows={3}
                    className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </FormField>
              </div>
            </div>
          ))}

          <Button onClick={addItem} variant="outline" className="w-full">
            + Add FAQ Item
          </Button>
        </div>

        <div className="border-t border-gray-200 pt-4 mt-4">
          <h3 className="font-semibold text-sm text-gray-900 mb-3">Background Settings</h3>
          <BackgroundStylingField
            bgType={(settings.faq_bg_type as 'color' | 'image') || 'color'}
            bgColor={settings.faq_bg_color || '#ffffff'}
            bgImageUrl={settings.faq_bg_image_url}
            onBgTypeChange={(type) => updateSetting('faq_bg_type', type)}
            onBgColorChange={(color) => updateSetting('faq_bg_color', color)}
            onBgImageChange={(url) => updateSetting('faq_bg_image_url', url)}
            label="FAQ Section"
          />
        </div>
      </SectionCard>

      <SectionCard title="Help Card">
        <FormField label="Visible">
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={settings.help_card_visible || false}
              onChange={(e) => updateSetting('help_card_visible', e.target.checked)}
              className="h-4 w-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
            />
            <span className="text-sm text-gray-700">Show help card</span>
          </label>
        </FormField>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField label="Title">
            <input
              type="text"
              value={settings.help_card_title || ''}
              onChange={(e) => updateSetting('help_card_title', e.target.value)}
              placeholder="e.g., Need Immediate Help?"
              className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </FormField>

          <FormField label="Description">
            <input
              type="text"
              value={settings.help_card_description || ''}
              onChange={(e) => updateSetting('help_card_description', e.target.value)}
              placeholder="Help card description"
              className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </FormField>

          <FormField label="Button Text">
            <input
              type="text"
              value={settings.help_card_button_text || ''}
              onChange={(e) => updateSetting('help_card_button_text', e.target.value)}
              placeholder="e.g., Chat with AI Assistant"
              className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </FormField>

          <FormField label="Button Link">
            <input
              type="text"
              value={settings.help_card_button_link || ''}
              onChange={(e) => updateSetting('help_card_button_link', e.target.value)}
              placeholder="e.g., /chat"
              className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </FormField>
        </div>
      </SectionCard>
    </>
  )
}

function CTASection({
  settings,
  updateSetting,
}: {
  settings: ContactPageCMSSettings
  updateSetting: <K extends keyof ContactPageCMSSettings>(
    key: K,
    value: ContactPageCMSSettings[K],
  ) => void
}) {
  return (
    <SectionCard title="CTA Section">
      <FormField label="Visible">
        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={settings.cta_visible || false}
            onChange={(e) => updateSetting('cta_visible', e.target.checked)}
            className="h-4 w-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
          />
          <span className="text-sm text-gray-700">Show CTA section</span>
        </label>
      </FormField>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <FormField label="CTA Title">
          <input
            type="text"
            value={settings.cta_title || ''}
            onChange={(e) => updateSetting('cta_title', e.target.value)}
            placeholder="e.g., Ready to Start Learning?"
            className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </FormField>

        <FormField label="CTA Description">
          <input
            type="text"
            value={settings.cta_description || ''}
            onChange={(e) => updateSetting('cta_description', e.target.value)}
            placeholder="CTA description"
            className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </FormField>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <FormField label="Button 1 Text">
          <input
            type="text"
            value={settings.cta_button_1_text || ''}
            onChange={(e) => updateSetting('cta_button_1_text', e.target.value)}
            placeholder="e.g., Browse Courses"
            className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </FormField>

        <FormField label="Button 1 Link">
          <input
            type="text"
            value={settings.cta_button_1_link || ''}
            onChange={(e) => updateSetting('cta_button_1_link', e.target.value)}
            placeholder="e.g., /courses"
            className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </FormField>

        <FormField label="Button 2 Text">
          <input
            type="text"
            value={settings.cta_button_2_text || ''}
            onChange={(e) => updateSetting('cta_button_2_text', e.target.value)}
            placeholder="e.g., Create Account"
            className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </FormField>

        <FormField label="Button 2 Link">
          <input
            type="text"
            value={settings.cta_button_2_link || ''}
            onChange={(e) => updateSetting('cta_button_2_link', e.target.value)}
            placeholder="e.g., /register"
            className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </FormField>
      </div>

      <div className="border-t border-gray-200 pt-4 mt-4">
        <h3 className="font-semibold text-sm text-gray-900 mb-3">Background Settings</h3>
        <BackgroundStylingField
          bgType={(settings.cta_bg_type as 'color' | 'image') || 'color'}
          bgColor={settings.cta_bg_color || '#dc2626'}
          bgImageUrl={settings.cta_bg_image_url}
          onBgTypeChange={(type) => updateSetting('cta_bg_type', type)}
          onBgColorChange={(color) => updateSetting('cta_bg_color', color)}
          onBgImageChange={(url) => updateSetting('cta_bg_image_url', url)}
          label="CTA Section"
          previewClassName="gradient-bg"
        />
      </div>
    </SectionCard>
  )
}

export default ContactPageCMSEditor
