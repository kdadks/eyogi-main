import React, { useEffect, useState } from 'react'
import {
  getAboutPageCMS,
  updateAboutPageCMS,
  AboutPageCMSSettings,
} from '../../lib/api/aboutPageCMS'
import { Button } from '@/components/ui/Button'
import MediaSelector from '../MediaSelector'
import type { MediaFile } from '../../lib/api/media'

interface Props {
  slug?: string
}

type TabType = 'hero' | 'mission' | 'stats' | 'values' | 'team' | 'vision' | 'cta'

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

const AboutPageCMSEditor: React.FC<Props> = ({ slug = 'about' }) => {
  const [settings, setSettings] = useState<AboutPageCMSSettings | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [activeTab, setActiveTab] = useState<TabType>('hero')
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  useEffect(() => {
    const loadSettings = async () => {
      try {
        const data = await getAboutPageCMS(slug)
        if (!data) {
          setError('About page settings not found')
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
      await updateAboutPageCMS(settings, slug)
      setSuccess('Settings saved successfully!')
      setTimeout(() => setSuccess(null), 3000)
    } catch (e) {
      setError(`Failed to save: ${e instanceof Error ? e.message : 'Unknown error'}`)
    } finally {
      setSaving(false)
    }
  }

  const updateSetting = <K extends keyof AboutPageCMSSettings>(
    key: K,
    value: AboutPageCMSSettings[K],
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
        <p className="text-red-600 text-sm">About page settings not found</p>
      </div>
    )
  }

  const tabs: Array<{ id: TabType; label: string; icon: string }> = [
    { id: 'hero', label: 'Hero', icon: '🎯' },
    { id: 'mission', label: 'Mission', icon: '📖' },
    { id: 'stats', label: 'Stats', icon: '📊' },
    { id: 'values', label: 'Values', icon: '💎' },
    { id: 'team', label: 'Team', icon: '👥' },
    { id: 'vision', label: 'Vision', icon: '🔮' },
    { id: 'cta', label: 'CTA', icon: '🚀' },
  ]

  return (
    <div className="w-full max-w-5xl mx-auto">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="px-4 py-3 flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">About Page Settings</h1>
            <p className="text-gray-600 text-xs mt-0.5">
              Manage all about page sections and content
            </p>
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
        {activeTab === 'mission' && (
          <MissionSection settings={settings} updateSetting={updateSetting} />
        )}
        {activeTab === 'stats' && (
          <StatsSection settings={settings} updateSetting={updateSetting} />
        )}
        {activeTab === 'values' && (
          <ValuesSection settings={settings} updateSetting={updateSetting} />
        )}
        {activeTab === 'team' && <TeamSection settings={settings} updateSetting={updateSetting} />}
        {activeTab === 'vision' && (
          <VisionSection settings={settings} updateSetting={updateSetting} />
        )}
        {activeTab === 'cta' && <CTASection settings={settings} updateSetting={updateSetting} />}
      </div>
    </div>
  )
}

// Section Components
interface SectionProps {
  settings: AboutPageCMSSettings
  updateSetting: <K extends keyof AboutPageCMSSettings>(
    key: K,
    value: AboutPageCMSSettings[K],
  ) => void
}

function HeroSection({ settings, updateSetting }: SectionProps) {
  return (
    <>
      <SectionCard title="Hero Section">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField label="Title">
            <input
              type="text"
              value={settings.hero_title || ''}
              onChange={(e) => updateSetting('hero_title', e.target.value)}
              placeholder="Enter hero title"
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

        <FormField label="Description" description="HTML supported">
          <textarea
            value={settings.hero_description || ''}
            onChange={(e) => updateSetting('hero_description', e.target.value)}
            placeholder="Enter hero description... (HTML tags supported)"
            rows={2}
            className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
          <p className="text-xs text-gray-500 italic mt-1">
            💡 HTML content is supported (e.g., &lt;b&gt;, &lt;i&gt;, &lt;br&gt;, &lt;a&gt;)
          </p>
          {settings.hero_description && (
            <div
              className="mt-2 p-2 bg-gray-50 border border-gray-200 rounded text-sm text-gray-700"
              dangerouslySetInnerHTML={{ __html: settings.hero_description }}
            />
          )}
        </FormField>

        <div className="border-t border-gray-200 pt-3 mt-3">
          <h3 className="font-semibold text-sm text-gray-900 mb-3">Buttons</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <FormField label="Button 1 Text">
              <input
                type="text"
                value={settings.hero_button_1_text || ''}
                onChange={(e) => updateSetting('hero_button_1_text', e.target.value)}
                placeholder="e.g., Get Started"
                className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </FormField>

            <FormField label="Button 1 Link">
              <input
                type="text"
                value={settings.hero_button_1_link || ''}
                onChange={(e) => updateSetting('hero_button_1_link', e.target.value)}
                placeholder="/courses"
                className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </FormField>

            <FormField label="Button 2 Text">
              <input
                type="text"
                value={settings.hero_button_2_text || ''}
                onChange={(e) => updateSetting('hero_button_2_text', e.target.value)}
                placeholder="e.g., Learn More"
                className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </FormField>

            <FormField label="Button 2 Link">
              <input
                type="text"
                value={settings.hero_button_2_link || ''}
                onChange={(e) => updateSetting('hero_button_2_link', e.target.value)}
                placeholder="/about"
                className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </FormField>
          </div>
        </div>
      </SectionCard>
    </>
  )
}

function MissionSection({ settings, updateSetting }: SectionProps) {
  const [showImageSelector, setShowImageSelector] = useState(false)

  const handleImageSelect = (media: MediaFile[]) => {
    if (media.length > 0) {
      updateSetting('mission_image_url', media[0].file_url)
    }
    setShowImageSelector(false)
  }

  return (
    <>
      <SectionCard title="Mission Section">
        <FormField label="Title">
          <input
            type="text"
            value={settings.mission_title || ''}
            onChange={(e) => updateSetting('mission_title', e.target.value)}
            placeholder="Mission title"
            className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </FormField>

        <FormField label="Description" description="HTML supported">
          <textarea
            value={settings.mission_description || ''}
            onChange={(e) => updateSetting('mission_description', e.target.value)}
            placeholder="Mission description... (HTML tags supported)"
            rows={2}
            className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
          <p className="text-xs text-gray-500 italic mt-1">💡 HTML content is supported</p>
          {settings.mission_description && (
            <div
              className="mt-2 p-2 bg-gray-50 border border-gray-200 rounded text-sm text-gray-700"
              dangerouslySetInnerHTML={{ __html: settings.mission_description }}
            />
          )}
        </FormField>

        <div className="border-t border-gray-200 pt-3 mt-3">
          <h3 className="font-semibold text-sm text-gray-900 mb-3">Image & Caption</h3>
          <div className="space-y-3">
            <FormField label="Image">
              {settings.mission_image_url && (
                <div className="relative mb-2 h-32 bg-gray-100 rounded-lg overflow-hidden flex items-center justify-center">
                  <img
                    src={settings.mission_image_url}
                    alt="Mission"
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      e.currentTarget.style.display = 'none'
                      const fallback = e.currentTarget.parentElement
                      if (fallback)
                        fallback.innerHTML =
                          '<div class="text-gray-400 text-center"><div class="text-4xl">📷</div></div>'
                    }}
                  />
                </div>
              )}
              <button
                onClick={() => setShowImageSelector(true)}
                className="w-full px-3 py-1.5 bg-blue-600 text-white text-sm rounded hover:bg-blue-700"
              >
                {settings.mission_image_url ? 'Change Image' : 'Select Image'}
              </button>
            </FormField>

            <FormField label="Caption Title">
              <input
                type="text"
                value={settings.mission_image_caption_title || ''}
                onChange={(e) => updateSetting('mission_image_caption_title', e.target.value)}
                placeholder="Caption title"
                className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </FormField>

            <FormField label="Caption Description">
              <textarea
                value={settings.mission_image_caption_description || ''}
                onChange={(e) => updateSetting('mission_image_caption_description', e.target.value)}
                placeholder="Caption description"
                rows={2}
                className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </FormField>

            <FormField label="Caption Icon">
              <select
                value={settings.mission_image_caption_icon || 'StarIcon'}
                onChange={(e) => updateSetting('mission_image_caption_icon', e.target.value)}
                className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="StarIcon">Star</option>
                <option value="AcademicCapIcon">Academic Cap</option>
                <option value="BookOpenIcon">Book Open</option>
                <option value="UserGroupIcon">User Group</option>
                <option value="LightBulbIcon">Light Bulb</option>
                <option value="SparklesIcon">Sparkles</option>
                <option value="GlobeAltIcon">Globe</option>
                <option value="HeartIcon">Heart</option>
              </select>
            </FormField>
          </div>
        </div>
      </SectionCard>

      {/* Image Selector Modal */}
      {showImageSelector && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-3xl w-full max-h-[80vh] flex flex-col">
            <div className="px-6 py-3 border-b border-gray-200 flex justify-between items-center">
              <h3 className="text-lg font-semibold">Select Image</h3>
              <button
                onClick={() => setShowImageSelector(false)}
                className="text-gray-500 hover:text-gray-700 text-2xl leading-none"
              >
                ×
              </button>
            </div>
            <div className="px-4 py-3 overflow-y-auto flex-1">
              <MediaSelector
                accept={['image/*']}
                compact={true}
                showUpload={false}
                onSelect={handleImageSelect}
                onClose={() => setShowImageSelector(false)}
              />
            </div>
          </div>
        </div>
      )}
    </>
  )
}

function StatsSection({ settings, updateSetting }: SectionProps) {
  const items = (settings.stats_items || []) as Array<{ number: string; label: string }>

  const updateItem = (index: number, field: string, value: string) => {
    const newItems = [...items]
    newItems[index] = { ...newItems[index], [field]: value }
    updateSetting('stats_items', newItems as any)
  }

  const addItem = () => {
    updateSetting('stats_items', [...items, { number: '', label: '' }] as any)
  }

  const removeItem = (index: number) => {
    updateSetting('stats_items', items.filter((_: unknown, i: number) => i !== index) as any)
  }

  return (
    <>
      <SectionCard title="Stats Section">
        <FormField label="Visible">
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={settings.stats_visible || false}
              onChange={(e) => updateSetting('stats_visible', e.target.checked)}
              className="rounded border-gray-300"
            />
            <span className="text-sm font-medium text-gray-700">Show this section</span>
          </label>
        </FormField>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField label="Title">
            <input
              type="text"
              value={settings.stats_title || ''}
              onChange={(e) => updateSetting('stats_title', e.target.value)}
              placeholder="Enter stats title"
              className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </FormField>

          <FormField label="Subtitle">
            <input
              type="text"
              value={settings.stats_subtitle || ''}
              onChange={(e) => updateSetting('stats_subtitle', e.target.value)}
              placeholder="Enter stats subtitle"
              className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </FormField>
        </div>

        <div className="border-t border-gray-200 pt-3 mt-3">
          <div className="flex justify-between items-center mb-3">
            <h3 className="font-semibold text-sm text-gray-900">Stats Items</h3>
            <button
              onClick={addItem}
              className="px-2 py-1 bg-blue-600 text-white text-xs rounded hover:bg-blue-700"
            >
              + Add Stat
            </button>
          </div>

          <div className="space-y-2">
            {items.map((item: { number: string; label: string }, index: number) => (
              <div key={index} className="p-2 border border-gray-200 rounded-lg flex gap-2">
                <input
                  type="text"
                  value={item.number || ''}
                  onChange={(e) => updateItem(index, 'number', e.target.value)}
                  placeholder="Number"
                  className="flex-1 px-2 py-1 border border-gray-300 rounded text-xs"
                />
                <input
                  type="text"
                  value={item.label || ''}
                  onChange={(e) => updateItem(index, 'label', e.target.value)}
                  placeholder="Label"
                  className="flex-1 px-2 py-1 border border-gray-300 rounded text-xs"
                />
                <button
                  onClick={() => removeItem(index)}
                  className="px-2 py-1 bg-red-600 text-white text-xs rounded hover:bg-red-700"
                >
                  Remove
                </button>
              </div>
            ))}
          </div>
        </div>
      </SectionCard>
    </>
  )
}

function ValuesSection({ settings, updateSetting }: SectionProps) {
  const items = (settings.values_items || []) as Array<{
    title: string
    description: string
    icon: string
  }>

  const updateItem = (index: number, field: string, value: string) => {
    const newItems = [...items]
    newItems[index] = { ...newItems[index], [field]: value }
    updateSetting('values_items', newItems)
  }

  const addItem = () => {
    updateSetting('values_items', [...items, { title: '', description: '', icon: 'StarIcon' }])
  }

  const removeItem = (index: number) => {
    updateSetting(
      'values_items',
      items.filter((_: unknown, i: number) => i !== index),
    )
  }

  return (
    <SectionCard title="Values Section">
      <div className="flex items-center gap-2">
        <input
          type="checkbox"
          checked={settings.values_visible || false}
          onChange={(e) => updateSetting('values_visible', e.target.checked)}
          className="rounded border-gray-300"
        />
        <span className="text-sm font-medium text-gray-700">Visible</span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <FormField label="Title">
          <input
            type="text"
            value={settings.values_title || ''}
            onChange={(e) => updateSetting('values_title', e.target.value)}
            className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="Enter values title"
          />
        </FormField>

        <FormField label="Subtitle">
          <input
            type="text"
            value={settings.values_subtitle || ''}
            onChange={(e) => updateSetting('values_subtitle', e.target.value)}
            className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="Enter values subtitle"
          />
        </FormField>
      </div>

      <div className="border-t border-gray-200 pt-3 mt-3">
        <div className="flex justify-between items-center mb-3">
          <h3 className="font-semibold text-sm text-gray-900">Values Items</h3>
          <button
            onClick={addItem}
            className="px-2 py-1 bg-blue-600 text-white text-xs rounded-lg hover:bg-blue-700"
          >
            + Add Value
          </button>
        </div>

        <div className="space-y-2">
          {items.map(
            (item: { title: string; description: string; icon: string }, index: number) => (
              <div key={index} className="p-3 border border-gray-200 rounded-lg space-y-2">
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={item.title || ''}
                    onChange={(e) => updateItem(index, 'title', e.target.value)}
                    placeholder="Value Title"
                    className="flex-1 px-2 py-1 border border-gray-300 rounded text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                  <button
                    onClick={() => removeItem(index)}
                    className="px-2 py-1 bg-red-600 text-white text-xs rounded hover:bg-red-700"
                  >
                    Remove
                  </button>
                </div>
                <textarea
                  value={item.description || ''}
                  onChange={(e) => updateItem(index, 'description', e.target.value)}
                  placeholder="Value Description"
                  className="w-full px-2 py-1 border border-gray-300 rounded text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  rows={2}
                />
                <select
                  value={item.icon || 'StarIcon'}
                  onChange={(e) => updateItem(index, 'icon', e.target.value)}
                  className="w-full px-2 py-1 border border-gray-300 rounded text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="StarIcon">Star</option>
                  <option value="AcademicCapIcon">Academic Cap</option>
                  <option value="BookOpenIcon">Book Open</option>
                  <option value="UserGroupIcon">User Group</option>
                  <option value="LightBulbIcon">Light Bulb</option>
                  <option value="SparklesIcon">Sparkles</option>
                  <option value="GlobeAltIcon">Globe</option>
                  <option value="HeartIcon">Heart</option>
                </select>
              </div>
            ),
          )}
        </div>
      </div>
    </SectionCard>
  )
}

function TeamSection({ settings, updateSetting }: SectionProps) {
  const members = (settings.team_members || []) as Array<{
    name: string
    role: string
    bio: string
    image_url: string
  }>
  const [showImageSelector, setShowImageSelector] = useState(false)
  const [selectedMemberIndex, setSelectedMemberIndex] = useState<number | null>(null)

  const updateMember = (index: number, field: string, value: string) => {
    const newMembers = [...members]
    newMembers[index] = { ...newMembers[index], [field]: value }
    updateSetting('team_members', newMembers)
  }

  const handleImageSelect = (media: MediaFile[]) => {
    if (media.length > 0 && selectedMemberIndex !== null) {
      updateMember(selectedMemberIndex, 'image_url', media[0].file_url)
    }
    setShowImageSelector(false)
    setSelectedMemberIndex(null)
  }

  const openImageSelector = (index: number) => {
    setSelectedMemberIndex(index)
    setShowImageSelector(true)
  }

  const addMember = () => {
    updateSetting('team_members', [...members, { name: '', role: '', bio: '', image_url: '' }])
  }

  const removeMember = (index: number) => {
    updateSetting(
      'team_members',
      members.filter((_: unknown, i: number) => i !== index),
    )
  }

  return (
    <>
      <SectionCard title="Team Section">
        <div className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={settings.team_visible || false}
            onChange={(e) => updateSetting('team_visible', e.target.checked)}
            className="rounded border-gray-300"
          />
          <span className="text-sm font-medium text-gray-700">Visible</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField label="Title">
            <input
              type="text"
              value={settings.team_title || ''}
              onChange={(e) => updateSetting('team_title', e.target.value)}
              className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Enter team title"
            />
          </FormField>

          <FormField label="Subtitle">
            <input
              type="text"
              value={settings.team_subtitle || ''}
              onChange={(e) => updateSetting('team_subtitle', e.target.value)}
              className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Enter team subtitle"
            />
          </FormField>
        </div>

        <div className="border-t border-gray-200 pt-3 mt-3">
          <div className="flex justify-between items-center mb-3">
            <h3 className="font-semibold text-sm text-gray-900">Team Members</h3>
            <button
              onClick={addMember}
              className="px-2 py-1 bg-blue-600 text-white text-xs rounded-lg hover:bg-blue-700"
            >
              + Add Member
            </button>
          </div>

          <div className="space-y-2">
            {members.map(
              (
                member: { name: string; role: string; bio: string; image_url: string },
                index: number,
              ) => (
                <div key={index} className="p-3 border border-gray-200 rounded-lg space-y-2">
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={member.name || ''}
                      onChange={(e) => updateMember(index, 'name', e.target.value)}
                      placeholder="Name"
                      className="flex-1 px-2 py-1 border border-gray-300 rounded text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                    <input
                      type="text"
                      value={member.role || ''}
                      onChange={(e) => updateMember(index, 'role', e.target.value)}
                      placeholder="Role"
                      className="flex-1 px-2 py-1 border border-gray-300 rounded text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                  <textarea
                    value={member.bio || ''}
                    onChange={(e) => updateMember(index, 'bio', e.target.value)}
                    placeholder="Bio"
                    className="w-full px-2 py-1 border border-gray-300 rounded text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    rows={2}
                  />
                  {member.image_url && (
                    <div className="relative w-24 h-24 bg-gray-100 rounded-lg overflow-hidden flex items-center justify-center">
                      <img
                        src={member.image_url}
                        alt={member.name}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          e.currentTarget.style.display = 'none'
                          const fallback = e.currentTarget.parentElement
                          if (fallback)
                            fallback.innerHTML =
                              '<div class="text-gray-400 text-center"><div class="text-2xl">📷</div></div>'
                        }}
                      />
                    </div>
                  )}
                  <div className="flex gap-2">
                    <button
                      onClick={() => openImageSelector(index)}
                      className="flex-1 px-2 py-1 bg-blue-600 text-white text-xs rounded hover:bg-blue-700"
                    >
                      {member.image_url ? 'Change Image' : 'Select Image'}
                    </button>
                    <button
                      onClick={() => removeMember(index)}
                      className="px-2 py-1 bg-red-600 text-white text-xs rounded hover:bg-red-700"
                    >
                      Remove
                    </button>
                  </div>
                </div>
              ),
            )}
          </div>
        </div>
      </SectionCard>

      {/* Image Selector Modal */}
      {showImageSelector && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-3xl w-full max-h-[80vh] flex flex-col">
            <div className="px-6 py-3 border-b border-gray-200 flex justify-between items-center">
              <h3 className="text-lg font-semibold">Select Image</h3>
              <button
                onClick={() => {
                  setShowImageSelector(false)
                  setSelectedMemberIndex(null)
                }}
                className="text-gray-500 hover:text-gray-700 text-2xl leading-none"
              >
                ×
              </button>
            </div>
            <div className="px-4 py-3 overflow-y-auto flex-1">
              <MediaSelector
                accept={['image/*']}
                compact={true}
                showUpload={false}
                onSelect={handleImageSelect}
                onClose={() => {
                  setShowImageSelector(false)
                  setSelectedMemberIndex(null)
                }}
              />
            </div>
          </div>
        </div>
      )}
    </>
  )
}

function VisionSection({ settings, updateSetting }: SectionProps) {
  const items = (settings.vision_items || []) as Array<{
    title: string
    description: string
    icon: string
  }>

  const updateItem = (index: number, field: string, value: string) => {
    const newItems = [...items]
    newItems[index] = { ...newItems[index], [field]: value }
    updateSetting('vision_items', newItems)
  }

  const addItem = () => {
    updateSetting('vision_items', [...items, { title: '', description: '', icon: 'StarIcon' }])
  }

  const removeItem = (index: number) => {
    updateSetting(
      'vision_items',
      items.filter((_: unknown, i: number) => i !== index),
    )
  }

  return (
    <SectionCard title="Vision Section">
      <FormField label="Title">
        <input
          type="text"
          value={settings.vision_title || ''}
          onChange={(e) => updateSetting('vision_title', e.target.value)}
          className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          placeholder="Enter vision title"
        />
      </FormField>

      <FormField label="Description" description="HTML supported">
        <textarea
          value={settings.vision_description || ''}
          onChange={(e) => updateSetting('vision_description', e.target.value)}
          className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          rows={4}
          placeholder="Enter vision description... (HTML tags supported)"
        />
        <p className="text-xs text-gray-500 italic mt-1">
          💡 HTML content is supported (e.g., &lt;b&gt;, &lt;i&gt;, &lt;br&gt;, &lt;a&gt;)
        </p>
        {settings.vision_description && (
          <div
            className="mt-2 p-2 bg-gray-50 border border-gray-200 rounded text-sm text-gray-700"
            dangerouslySetInnerHTML={{ __html: settings.vision_description }}
          />
        )}
      </FormField>

      <div className="border-t border-gray-200 pt-3 mt-3">
        <div className="flex justify-between items-center mb-3">
          <h3 className="font-semibold text-sm text-gray-900">Vision Items</h3>
          <button
            onClick={addItem}
            className="px-2 py-1 bg-blue-600 text-white text-xs rounded-lg hover:bg-blue-700"
          >
            + Add Item
          </button>
        </div>

        <div className="space-y-2">
          {items.map(
            (item: { title: string; description: string; icon: string }, index: number) => (
              <div key={index} className="p-3 border border-gray-200 rounded-lg space-y-2">
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={item.title || ''}
                    onChange={(e) => updateItem(index, 'title', e.target.value)}
                    placeholder="Item Title"
                    className="flex-1 px-2 py-1 border border-gray-300 rounded text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                  <button
                    onClick={() => removeItem(index)}
                    className="px-2 py-1 bg-red-600 text-white text-xs rounded hover:bg-red-700"
                  >
                    Remove
                  </button>
                </div>
                <textarea
                  value={item.description || ''}
                  onChange={(e) => updateItem(index, 'description', e.target.value)}
                  placeholder="Item Description"
                  className="w-full px-2 py-1 border border-gray-300 rounded text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  rows={2}
                />
                <select
                  value={item.icon || 'StarIcon'}
                  onChange={(e) => updateItem(index, 'icon', e.target.value)}
                  className="w-full px-2 py-1 border border-gray-300 rounded text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="StarIcon">Star</option>
                  <option value="AcademicCapIcon">Academic Cap</option>
                  <option value="BookOpenIcon">Book Open</option>
                  <option value="UserGroupIcon">User Group</option>
                  <option value="LightBulbIcon">Light Bulb</option>
                  <option value="SparklesIcon">Sparkles</option>
                  <option value="GlobeAltIcon">Globe</option>
                  <option value="HeartIcon">Heart</option>
                </select>
              </div>
            ),
          )}
        </div>
      </div>
    </SectionCard>
  )
}

function CTASection({ settings, updateSetting }: SectionProps) {
  return (
    <SectionCard title="Call-to-Action Section">
      <div className="flex items-center gap-2">
        <input
          type="checkbox"
          checked={settings.cta_visible || false}
          onChange={(e) => updateSetting('cta_visible', e.target.checked)}
          className="rounded border-gray-300"
        />
        <span className="text-sm font-medium text-gray-700">Visible</span>
      </div>

      <FormField label="Title">
        <input
          type="text"
          value={settings.cta_title || ''}
          onChange={(e) => updateSetting('cta_title', e.target.value)}
          className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          placeholder="Enter CTA title"
        />
      </FormField>

      <FormField label="Description">
        <textarea
          value={settings.cta_description || ''}
          onChange={(e) => updateSetting('cta_description', e.target.value)}
          className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          rows={4}
          placeholder="Enter CTA description"
        />
      </FormField>

      <div className="border-t border-gray-200 pt-3 mt-3">
        <h3 className="font-semibold text-sm text-gray-900 mb-3">Button 1</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <FormField label="Button 1 Text">
            <input
              type="text"
              value={settings.cta_button_1_text || ''}
              onChange={(e) => updateSetting('cta_button_1_text', e.target.value)}
              className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Button text"
            />
          </FormField>
          <FormField label="Button 1 Link">
            <input
              type="text"
              value={settings.cta_button_1_link || ''}
              onChange={(e) => updateSetting('cta_button_1_link', e.target.value)}
              className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="/link"
            />
          </FormField>
        </div>
      </div>

      <div className="border-t border-gray-200 pt-3 mt-3">
        <h3 className="font-semibold text-sm text-gray-900 mb-3">Button 2</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <FormField label="Button 2 Text">
            <input
              type="text"
              value={settings.cta_button_2_text || ''}
              onChange={(e) => updateSetting('cta_button_2_text', e.target.value)}
              className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Button text"
            />
          </FormField>
          <FormField label="Button 2 Link">
            <input
              type="text"
              value={settings.cta_button_2_link || ''}
              onChange={(e) => updateSetting('cta_button_2_link', e.target.value)}
              className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="/link"
            />
          </FormField>
        </div>
      </div>
    </SectionCard>
  )
}

export default AboutPageCMSEditor
