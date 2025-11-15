import React, { useEffect, useState } from 'react'
import { getPageSettings, updatePageSettings, PageSettings } from '../../lib/api/pageSettings'
import { Button } from '@/components/ui/Button'
import { getCourses } from '../../lib/api/courses'
import { getGurukuls } from '../../lib/api/gurukuls'
import { Gurukul, Course } from '../../types'
import MediaSelector from '../MediaSelector'
import { type MediaFile } from '../../lib/api/media'

interface Props {
  slug?: string
}

type TabType = 'hero' | 'features' | 'gurukuls' | 'testimonials' | 'cta'

const HomePageCMSEditor: React.FC<Props> = ({ slug = 'home' }) => {
  const [settings, setSettings] = useState<PageSettings | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [activeTab, setActiveTab] = useState<TabType>('hero')
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [courses, setCourses] = useState<Course[]>([])
  const [gurukuls, setGurukuls] = useState<Gurukul[]>([])

  useEffect(() => {
    const loadSettings = async () => {
      try {
        const [data, coursesData, gurukulData] = await Promise.all([
          getPageSettings(slug),
          getCourses(),
          getGurukuls(),
        ])
        setSettings(data)
        setCourses(coursesData)
        setGurukuls(gurukulData)
        setError(null)
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
      await updatePageSettings(slug, settings)
      setSuccess('Settings saved successfully!')
      setTimeout(() => setSuccess(null), 3000)
    } catch (e) {
      setError(`Failed to save: ${e instanceof Error ? e.message : 'Unknown error'}`)
    } finally {
      setSaving(false)
    }
  }

  const updateSetting = <K extends keyof PageSettings>(key: K, value: PageSettings[K]) => {
    setSettings((prev) => {
      if (!prev) return null
      return { ...prev, [key]: value }
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
        <p className="text-red-600 text-sm">Page settings not found</p>
      </div>
    )
  }

  const tabs: Array<{ id: TabType; label: string; icon: string }> = [
    { id: 'hero', label: 'Hero', icon: '🎯' },
    { id: 'features', label: 'Features', icon: '✨' },
    { id: 'gurukuls', label: 'Centers', icon: '🏢' },
    { id: 'testimonials', label: 'Testimonials', icon: '⭐' },
    { id: 'cta', label: 'CTA', icon: '🚀' },
  ]

  return (
    <div className="w-full max-w-5xl mx-auto">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="px-4 py-3 flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">HomePage Settings</h1>
            <p className="text-gray-600 text-xs mt-0.5">Manage all homepage sections and content</p>
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
        {activeTab === 'features' && (
          <FeaturesSection settings={settings} updateSetting={updateSetting} />
        )}
        {activeTab === 'gurukuls' && (
          <GurukulsSection
            settings={settings}
            updateSetting={updateSetting}
            gurukuls={gurukuls}
            courses={courses}
          />
        )}
        {activeTab === 'testimonials' && (
          <TestimonialsSection settings={settings} updateSetting={updateSetting} />
        )}
        {activeTab === 'cta' && <CTASection settings={settings} updateSetting={updateSetting} />}
      </div>
    </div>
  )
}

// Modal component for image selection
function ImageSelectorModal({
  isOpen,
  onClose,
  onSelect,
}: {
  isOpen: boolean
  onClose: () => void
  onSelect: (media: MediaFile[]) => void
}) {
  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-2xl w-full max-h-[80vh] flex flex-col">
        <div className="px-6 py-3 border-b border-gray-200 flex justify-end">
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700 font-bold text-xl">
            ×
          </button>
        </div>
        <div className="px-4 py-3 overflow-y-auto flex-1">
          <MediaSelector
            accept={['image/*']}
            compact={true}
            showUpload={false}
            onSelect={(media) => {
              onSelect(media)
              onClose()
            }}
          />
        </div>
      </div>
    </div>
  )
}

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

function HeroSection({
  settings,
  updateSetting,
}: {
  settings: PageSettings
  updateSetting: <K extends keyof PageSettings>(key: K, value: PageSettings[K]) => void
}) {
  const [showMediaSelector, setShowMediaSelector] = useState(false)

  return (
    <>
      <SectionCard title="Hero Section">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField label="Badge Text" description="Small text above the main title">
            <input
              type="text"
              value={settings.home_hero_badge_text || ''}
              onChange={(e) => updateSetting('home_hero_badge_text', e.target.value)}
              placeholder="e.g., Welcome to eYogi"
              className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </FormField>

          <FormField label="Title" description="Main heading">
            <input
              type="text"
              value={settings.home_hero_title || ''}
              onChange={(e) => updateSetting('home_hero_title', e.target.value)}
              placeholder="e.g., Transform Your Life"
              className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </FormField>
        </div>

        <FormField label="Description" description="Hero section subtitle - HTML supported">
          <textarea
            value={settings.home_hero_description || ''}
            onChange={(e) => updateSetting('home_hero_description', e.target.value)}
            placeholder="Enter the hero section description... (HTML tags supported)"
            rows={3}
            className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
          <p className="text-xs text-gray-500 italic mt-1">
            💡 HTML content is supported (e.g., &lt;b&gt;, &lt;i&gt;, &lt;br&gt;, &lt;a&gt;)
          </p>
          {settings.home_hero_description && (
            <div
              className="mt-2 p-2 bg-gray-50 border border-gray-200 rounded text-sm text-gray-700"
              dangerouslySetInnerHTML={{ __html: settings.home_hero_description }}
            />
          )}
        </FormField>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField label="Background Type" description="Choose color or image">
            <select
              value={settings.home_hero_background_type || 'gradient'}
              onChange={(e) =>
                updateSetting('home_hero_background_type', e.target.value as 'gradient' | 'image')
              }
              className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="gradient">Color</option>
              <option value="image">Image</option>
            </select>
          </FormField>

          {settings.home_hero_background_type === 'image' ? (
            <FormField label="Background Image">
              {settings.home_hero_background_image_url && (
                <div className="relative h-32 bg-gray-100 rounded-lg overflow-hidden mb-2">
                  <img
                    src={settings.home_hero_background_image_url}
                    alt="Hero background preview"
                    className="w-full h-full object-cover"
                  />
                </div>
              )}
              <div className="flex gap-2">
                <Button
                  onClick={() => setShowMediaSelector(true)}
                  className="flex-1 bg-blue-600 hover:bg-blue-700 text-white text-sm py-1"
                >
                  {settings.home_hero_background_image_url ? 'Change' : 'Select'}
                </Button>
                {settings.home_hero_background_image_url && (
                  <Button
                    onClick={() => updateSetting('home_hero_background_image_url', '')}
                    className="flex-1 bg-red-600 hover:bg-red-700 text-white text-sm py-1"
                  >
                    Remove
                  </Button>
                )}
              </div>
            </FormField>
          ) : (
            <FormField label="Background Color">
              <div className="flex gap-2 items-center">
                <input
                  type="color"
                  value={settings.home_hero_background_color || '#fef3f2'}
                  onChange={(e) => updateSetting('home_hero_background_color', e.target.value)}
                  className="w-12 h-8 border border-gray-300 rounded-lg cursor-pointer"
                />
                <span className="text-xs text-gray-600 flex-1">
                  {settings.home_hero_background_color}
                </span>
              </div>
            </FormField>
          )}
        </div>

        <div className="pt-3 border-t border-gray-200 mt-4">
          <h3 className="font-semibold text-sm text-gray-900 mb-3">Buttons</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <FormField label="Button 1 Text">
              <input
                type="text"
                value={settings.home_hero_button_1_text || ''}
                onChange={(e) => updateSetting('home_hero_button_1_text', e.target.value)}
                placeholder="e.g., Get Started"
                className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </FormField>

            <FormField label="Button 1 Link">
              <input
                type="text"
                value={settings.home_hero_button_1_link || ''}
                onChange={(e) => updateSetting('home_hero_button_1_link', e.target.value)}
                placeholder="e.g., /courses"
                className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </FormField>

            <FormField label="Button 2 Text">
              <input
                type="text"
                value={settings.home_hero_button_2_text || ''}
                onChange={(e) => updateSetting('home_hero_button_2_text', e.target.value)}
                placeholder="e.g., Learn More"
                className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </FormField>

            <FormField label="Button 2 Link">
              <input
                type="text"
                value={settings.home_hero_button_2_link || ''}
                onChange={(e) => updateSetting('home_hero_button_2_link', e.target.value)}
                placeholder="e.g., /about"
                className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </FormField>
          </div>
        </div>

        <div className="pt-3 border-t border-gray-200 mt-4">
          <h3 className="font-semibold text-sm text-gray-900 mb-3">Hero Image & Caption</h3>
          <div className="space-y-3">
            <FormField label="Hero Image" description="Main image displayed in hero section">
              {settings.home_hero_image_url && (
                <div className="relative h-40 bg-gray-100 rounded-lg overflow-hidden mb-2">
                  <img
                    src={settings.home_hero_image_url}
                    alt="Hero image preview"
                    className="w-full h-full object-cover"
                  />
                </div>
              )}
              <div className="flex gap-2">
                <Button
                  onClick={() => setShowMediaSelector(true)}
                  className="flex-1 bg-blue-600 hover:bg-blue-700 text-white text-sm py-1.5"
                >
                  {settings.home_hero_image_url ? 'Change Image' : 'Select Image'}
                </Button>
                {settings.home_hero_image_url && (
                  <Button
                    onClick={() => updateSetting('home_hero_image_url', '')}
                    className="flex-1 bg-red-600 hover:bg-red-700 text-white text-sm py-1.5"
                  >
                    Remove
                  </Button>
                )}
              </div>
            </FormField>

            <FormField label="Image Caption" description="Small text displayed below the image">
              <textarea
                value={settings.home_hero_image_caption || ''}
                onChange={(e) => updateSetting('home_hero_image_caption', e.target.value)}
                placeholder="e.g., A description or caption for the hero image"
                rows={2}
                className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </FormField>
          </div>
        </div>
      </SectionCard>

      <ImageSelectorModal
        isOpen={showMediaSelector}
        onClose={() => setShowMediaSelector(false)}
        onSelect={(media) => {
          if (media.length > 0) {
            updateSetting('home_hero_background_image_url', media[0].file_url)
          }
        }}
      />
    </>
  )
}

function FeaturesSection({
  settings,
  updateSetting,
}: {
  settings: PageSettings
  updateSetting: <K extends keyof PageSettings>(key: K, value: PageSettings[K]) => void
}) {
  const [selectedBox, setSelectedBox] = useState<number | null>(null)

  return (
    <>
      <SectionCard title="Features Section">
        <FormField label="Visible" description="Toggle section visibility">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={settings.home_features_visible || false}
              onChange={(e) => updateSetting('home_features_visible', e.target.checked)}
              className="w-5 h-5 rounded border-gray-300 cursor-pointer"
            />
            <span className="text-sm font-medium text-gray-700">Show features section</span>
          </label>
        </FormField>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <FormField label="Section Title">
            <input
              type="text"
              value={settings.home_features_title || ''}
              onChange={(e) => updateSetting('home_features_title', e.target.value)}
              placeholder="e.g., Why Choose Us"
              className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </FormField>

          <FormField label="Section Description" description="HTML supported">
            <textarea
              value={settings.home_features_subtitle || ''}
              onChange={(e) => updateSetting('home_features_subtitle', e.target.value)}
              placeholder="Enter features section description... (HTML tags supported)"
              rows={2}
              className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            <p className="text-xs text-gray-500 italic mt-1">
              💡 HTML content is supported (e.g., &lt;b&gt;, &lt;i&gt;, &lt;br&gt;, &lt;a&gt;)
            </p>
            {settings.home_features_subtitle && (
              <div
                className="mt-2 p-2 bg-gray-50 border border-gray-200 rounded text-sm text-gray-700"
                dangerouslySetInnerHTML={{ __html: settings.home_features_subtitle }}
              />
            )}
          </FormField>
        </div>

        <FormField label="Background Color">
          <div className="flex gap-2 items-center">
            <input
              type="color"
              value={settings.home_features_background_color || '#ffffff'}
              onChange={(e) => updateSetting('home_features_background_color', e.target.value)}
              className="w-12 h-8 border border-gray-300 rounded-lg cursor-pointer"
            />
            <span className="text-xs text-gray-600">{settings.home_features_background_color}</span>
          </div>
        </FormField>

        <div className="mt-3 border-t pt-3">
          <h3 className="font-semibold text-sm text-gray-900 mb-3">Feature Boxes</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {[1, 2, 3, 4].map((boxNum) => {
              const imageKey = `home_features_box_${boxNum}_image_url` as keyof PageSettings
              const titleKey = `home_features_box_${boxNum}_title` as keyof PageSettings
              const descKey = `home_features_box_${boxNum}_description` as keyof PageSettings

              return (
                <div
                  key={boxNum}
                  className="border border-gray-200 rounded-lg p-3 bg-gray-50 cursor-pointer hover:bg-gray-100 transition"
                  onClick={() => setSelectedBox(boxNum)}
                >
                  {settings[imageKey] && (
                    <div className="relative w-full h-24 bg-gray-200 rounded-lg overflow-hidden mb-2">
                      <img
                        src={settings[imageKey] as string}
                        alt={`Feature ${boxNum}`}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  )}
                  <h4 className="font-semibold text-xs text-gray-900 line-clamp-1">
                    {(settings[titleKey] as string) || `Feature ${boxNum}`}
                  </h4>
                  <p className="text-xs text-gray-500 line-clamp-2 mt-1">
                    {(settings[descKey] as string) || 'Click to edit...'}
                  </p>
                </div>
              )
            })}
          </div>
        </div>
      </SectionCard>

      {selectedBox !== null && (
        <FeatureBoxModal
          boxNum={selectedBox}
          settings={settings}
          updateSetting={updateSetting}
          onClose={() => setSelectedBox(null)}
        />
      )}
    </>
  )
}

// Feature Box Modal Component
function FeatureBoxModal({
  boxNum,
  settings,
  updateSetting,
  onClose,
}: {
  boxNum: number
  settings: PageSettings
  updateSetting: <K extends keyof PageSettings>(key: K, value: PageSettings[K]) => void
  onClose: () => void
}) {
  const [showMediaSelector, setShowMediaSelector] = useState(false)
  const imageKey = `home_features_box_${boxNum}_image_url` as keyof PageSettings
  const titleKey = `home_features_box_${boxNum}_title` as keyof PageSettings
  const descKey = `home_features_box_${boxNum}_description` as keyof PageSettings

  return (
    <>
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-40 p-4">
        <div className="bg-white rounded-lg max-w-2xl w-full max-h-screen overflow-y-auto">
          <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center sticky top-0 bg-white">
            <h3 className="text-lg font-semibold text-gray-900">Edit Feature {boxNum}</h3>
            <button
              onClick={onClose}
              className="text-gray-500 hover:text-gray-700 font-bold text-xl"
            >
              ×
            </button>
          </div>
          <div className="px-6 py-4 space-y-4">
            {/* Image Section */}
            <div>
              <label className="block text-sm font-semibold text-gray-900 mb-2">
                Thumbnail Image
              </label>
              {settings[imageKey] && (
                <div className="relative h-32 bg-gray-100 rounded-lg overflow-hidden mb-2">
                  <img
                    src={settings[imageKey] as string}
                    alt={`Feature ${boxNum}`}
                    className="w-full h-full object-cover"
                  />
                </div>
              )}
              <div className="flex gap-2">
                <Button
                  onClick={() => setShowMediaSelector(true)}
                  className="flex-1 bg-blue-600 hover:bg-blue-700 text-white text-sm py-1.5"
                >
                  {settings[imageKey] ? 'Change' : 'Select'} Image
                </Button>
                {settings[imageKey] && (
                  <Button
                    onClick={() => updateSetting(imageKey, '')}
                    className="flex-1 bg-red-600 hover:bg-red-700 text-white text-sm py-1.5"
                  >
                    Remove
                  </Button>
                )}
              </div>
            </div>

            {/* Title */}
            <FormField label="Title">
              <input
                type="text"
                value={(settings[titleKey] as string) || ''}
                onChange={(e) => updateSetting(titleKey, e.target.value)}
                placeholder={`Feature ${boxNum} title`}
                className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </FormField>

            {/* Description */}
            <FormField label="Description">
              <textarea
                value={(settings[descKey] as string) || ''}
                onChange={(e) => updateSetting(descKey, e.target.value)}
                placeholder={`Feature ${boxNum} description`}
                rows={4}
                className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </FormField>
          </div>
        </div>
      </div>

      <ImageSelectorModal
        isOpen={showMediaSelector}
        onClose={() => setShowMediaSelector(false)}
        onSelect={(media) => {
          if (media.length > 0) {
            updateSetting(imageKey, media[0].file_url)
          }
        }}
      />
    </>
  )
}

function GurukulsSection({
  settings,
  updateSetting,
  gurukuls,
  courses,
}: {
  settings: PageSettings
  updateSetting: <K extends keyof PageSettings>(key: K, value: PageSettings[K]) => void
  gurukuls: Gurukul[]
  courses: Course[]
}) {
  const selectedItemIds = (settings.home_gurukuls_selected_ids || []) as string[]
  const selectedItemType = (settings.home_gurukuls_item_type || 'gurukuls') as
    | 'gurukuls'
    | 'courses'

  return (
    <SectionCard title="Academic Centers">
      <FormField label="Visible" description="Toggle section visibility">
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={settings.home_gurukuls_visible || false}
            onChange={(e) => updateSetting('home_gurukuls_visible', e.target.checked)}
            className="w-5 h-5 rounded border-gray-300 cursor-pointer"
          />
          <span className="text-sm font-medium text-gray-700">Show centers section</span>
        </label>
      </FormField>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <FormField label="Section Title">
          <input
            type="text"
            value={settings.home_gurukuls_title || ''}
            onChange={(e) => updateSetting('home_gurukuls_title', e.target.value)}
            placeholder="e.g., Our Centers"
            className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </FormField>

        <FormField label="Section Description" description="HTML supported">
          <textarea
            value={settings.home_gurukuls_subtitle || ''}
            onChange={(e) => updateSetting('home_gurukuls_subtitle', e.target.value)}
            placeholder="Enter centers section description... (HTML tags supported)"
            rows={2}
            className="w-full px-3 py-1.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent font-mono text-xs"
          />
          <p className="text-xs text-gray-500 italic mt-1">
            💡 HTML content is supported (e.g., &lt;b&gt;, &lt;i&gt;, &lt;br&gt;, &lt;a&gt;)
          </p>
          {settings.home_gurukuls_subtitle && (
            <div
              className="mt-2 p-2 bg-gray-50 border border-gray-200 rounded text-sm text-gray-700"
              dangerouslySetInnerHTML={{ __html: settings.home_gurukuls_subtitle }}
            />
          )}
        </FormField>
      </div>

      <FormField label="Display Type" description="Select what to show">
        <select
          value={selectedItemType}
          onChange={(e) => {
            updateSetting('home_gurukuls_item_type', e.target.value as 'gurukuls' | 'courses')
            updateSetting('home_gurukuls_selected_ids', [])
          }}
          className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        >
          <option value="gurukuls">Academic Centers (Gurukuls)</option>
          <option value="courses">Courses</option>
        </select>
      </FormField>

      <FormField label={selectedItemType === 'gurukuls' ? 'Select Centers' : 'Select Courses'}>
        <div className="space-y-2 max-h-80 overflow-y-auto border border-gray-200 rounded-lg p-3">
          {selectedItemType === 'gurukuls' ? (
            gurukuls.length === 0 ? (
              <p className="text-xs text-gray-500 py-3 text-center">No centers available</p>
            ) : (
              gurukuls.map((item) => {
                const isSelected = selectedItemIds.includes(item.id)
                return (
                  <label
                    key={item.id}
                    className="flex items-center gap-2 cursor-pointer p-2 hover:bg-gray-50 rounded text-sm"
                  >
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={(e) => {
                        if (e.target.checked) {
                          updateSetting('home_gurukuls_selected_ids', [...selectedItemIds, item.id])
                        } else {
                          updateSetting(
                            'home_gurukuls_selected_ids',
                            selectedItemIds.filter((id) => id !== item.id),
                          )
                        }
                      }}
                      className="w-4 h-4 rounded border-gray-300 cursor-pointer"
                    />
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-gray-900 text-xs">{item.name}</p>
                      <p
                        className="text-xs text-gray-500 line-clamp-2"
                        dangerouslySetInnerHTML={{
                          __html: item.description?.substring(0, 80) || '',
                        }}
                      />
                    </div>
                  </label>
                )
              })
            )
          ) : courses.length === 0 ? (
            <p className="text-xs text-gray-500 py-3 text-center">No courses available</p>
          ) : (
            courses.map((item) => {
              const isSelected = selectedItemIds.includes(item.id)
              return (
                <label
                  key={item.id}
                  className="flex items-center gap-2 cursor-pointer p-2 hover:bg-gray-50 rounded text-sm"
                >
                  <input
                    type="checkbox"
                    checked={isSelected}
                    onChange={(e) => {
                      if (e.target.checked) {
                        updateSetting('home_gurukuls_selected_ids', [...selectedItemIds, item.id])
                      } else {
                        updateSetting(
                          'home_gurukuls_selected_ids',
                          selectedItemIds.filter((id) => id !== item.id),
                        )
                      }
                    }}
                    className="w-4 h-4 rounded border-gray-300 cursor-pointer"
                  />
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-gray-900 text-xs">{item.title}</p>
                    <p
                      className="text-xs text-gray-500 line-clamp-2"
                      dangerouslySetInnerHTML={{
                        __html: item.description?.substring(0, 80) || '',
                      }}
                    />
                  </div>
                </label>
              )
            })
          )}
        </div>
      </FormField>

      <div className="mt-4 pt-3 border-t">
        <h3 className="font-semibold text-sm text-gray-900 mb-3">
          {selectedItemType === 'gurukuls' ? 'Selected Centers' : 'Selected Courses'} (
          {selectedItemIds.length})
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
          {selectedItemType === 'gurukuls'
            ? gurukuls
                .filter((g) => selectedItemIds.includes(g.id))
                .map((item) => (
                  <div key={item.id} className="border border-gray-200 rounded-lg p-2 bg-gray-50">
                    <h4 className="font-medium text-xs text-gray-900">{item.name}</h4>
                    <p
                      className="text-xs text-gray-600 line-clamp-2 mt-0.5"
                      dangerouslySetInnerHTML={{ __html: item.description || '' }}
                    />
                  </div>
                ))
            : courses
                .filter((c) => selectedItemIds.includes(c.id))
                .map((item) => (
                  <div key={item.id} className="border border-gray-200 rounded-lg p-2 bg-blue-50">
                    <h4 className="font-medium text-xs text-gray-900">{item.title}</h4>
                    <p
                      className="text-xs text-gray-600 line-clamp-2 mt-0.5"
                      dangerouslySetInnerHTML={{ __html: item.description || '' }}
                    />
                  </div>
                ))}
        </div>
      </div>

      <FormField label="Background Color">
        <div className="flex gap-2 items-center">
          <input
            type="color"
            value={settings.home_gurukuls_background_color || '#ffffff'}
            onChange={(e) => updateSetting('home_gurukuls_background_color', e.target.value)}
            className="w-12 h-8 border border-gray-300 rounded-lg cursor-pointer"
          />
          <span className="text-xs text-gray-600">{settings.home_gurukuls_background_color}</span>
        </div>
      </FormField>
    </SectionCard>
  )
}

function TestimonialsSection({
  settings,
  updateSetting,
}: {
  settings: PageSettings
  updateSetting: <K extends keyof PageSettings>(key: K, value: PageSettings[K]) => void
}) {
  const [editingIndex, setEditingIndex] = useState<number | null>(null)

  const testimonials = (settings.home_testimonials || []) as Array<{
    name: string
    role: string
    content: string
    rating: number
    image?: string
  }>

  const addTestimonial = () => {
    updateSetting('home_testimonials', [
      ...testimonials,
      { name: '', role: '', content: '', rating: 5 },
    ])
  }

  const updateTestimonial = (index: number, field: string, value: string | number) => {
    const updated = [...testimonials]
    updated[index] = { ...updated[index], [field]: value }
    updateSetting('home_testimonials', updated)
  }

  const removeTestimonial = (index: number) => {
    updateSetting(
      'home_testimonials',
      testimonials.filter((_, i) => i !== index),
    )
  }

  return (
    <SectionCard title="Testimonials Section">
      <FormField label="Visible" description="Toggle section visibility">
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={settings.home_testimonials_visible || false}
            onChange={(e) => updateSetting('home_testimonials_visible', e.target.checked)}
            className="w-5 h-5 rounded border-gray-300 cursor-pointer"
          />
          <span className="text-sm font-medium text-gray-700">Show testimonials section</span>
        </label>
      </FormField>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <FormField label="Section Title">
          <input
            type="text"
            value={settings.home_testimonials_title || ''}
            onChange={(e) => updateSetting('home_testimonials_title', e.target.value)}
            placeholder="e.g., What Our Students Say"
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </FormField>

        <FormField label="Section Description" description="HTML supported">
          <textarea
            value={settings.home_testimonials_subtitle || ''}
            onChange={(e) => updateSetting('home_testimonials_subtitle', e.target.value)}
            placeholder="Enter testimonials section description... (HTML tags supported)"
            rows={3}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
          <p className="text-xs text-gray-500 italic mt-1">
            💡 HTML content is supported (e.g., &lt;b&gt;, &lt;i&gt;, &lt;br&gt;, &lt;a&gt;)
          </p>
          {settings.home_testimonials_subtitle && (
            <div
              className="mt-2 p-2 bg-gray-50 border border-gray-200 rounded text-sm text-gray-700"
              dangerouslySetInnerHTML={{ __html: settings.home_testimonials_subtitle }}
            />
          )}
        </FormField>
      </div>

      <FormField label="Background Color">
        <div className="flex gap-2 items-center">
          <input
            type="color"
            value={settings.home_testimonials_background_color || '#ffffff'}
            onChange={(e) => updateSetting('home_testimonials_background_color', e.target.value)}
            className="w-16 h-10 border border-gray-300 rounded-lg cursor-pointer"
          />
          <span className="text-sm text-gray-600">
            {settings.home_testimonials_background_color}
          </span>
        </div>
      </FormField>

      <div className="pt-4 border-t border-gray-200">
        <div className="flex justify-between items-center mb-4">
          <h3 className="font-semibold text-gray-900">Testimonials ({testimonials.length})</h3>
          <Button
            onClick={addTestimonial}
            className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg text-sm"
          >
            + Add Testimonial
          </Button>
        </div>

        <div className="space-y-4 max-h-96 overflow-y-auto">
          {testimonials.length === 0 ? (
            <p className="text-sm text-gray-500 py-8 text-center">
              No testimonials yet. Add one to get started!
            </p>
          ) : (
            testimonials.map((testimonial, index) => (
              <div
                key={index}
                className="border border-gray-300 rounded-lg p-4 bg-gray-50 hover:bg-gray-100 transition-colors"
              >
                <div className="flex justify-between items-start mb-3">
                  <span className="text-sm font-semibold text-gray-700">
                    Testimonial #{index + 1}
                  </span>
                  <button
                    onClick={() => removeTestimonial(index)}
                    className="text-red-600 hover:text-red-700 text-sm font-medium"
                  >
                    Delete
                  </button>
                </div>

                {editingIndex === index ? (
                  <div className="space-y-3">
                    <input
                      type="text"
                      placeholder="Name"
                      value={testimonial.name}
                      onChange={(e) => updateTestimonial(index, 'name', e.target.value)}
                      className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg"
                    />
                    <input
                      type="text"
                      placeholder="Role/Title"
                      value={testimonial.role}
                      onChange={(e) => updateTestimonial(index, 'role', e.target.value)}
                      className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg"
                    />
                    <textarea
                      placeholder="Testimonial content"
                      value={testimonial.content}
                      onChange={(e) => updateTestimonial(index, 'content', e.target.value)}
                      rows={3}
                      className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg"
                    />
                    <input
                      type="number"
                      min="1"
                      max="5"
                      placeholder="Rating (1-5)"
                      value={testimonial.rating}
                      onChange={(e) => updateTestimonial(index, 'rating', parseInt(e.target.value))}
                      className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg"
                    />
                    <input
                      type="text"
                      placeholder="Image URL (optional)"
                      value={testimonial.image || ''}
                      onChange={(e) => updateTestimonial(index, 'image', e.target.value)}
                      className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg"
                    />
                    <button
                      onClick={() => setEditingIndex(null)}
                      className="w-full px-3 py-2 text-sm bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium"
                    >
                      Done Editing
                    </button>
                  </div>
                ) : (
                  <div onClick={() => setEditingIndex(index)} className="cursor-pointer">
                    <p className="text-sm font-medium text-gray-900">
                      {testimonial.name || '(No name)'}
                    </p>
                    <p className="text-xs text-gray-600">{testimonial.role || '(No role)'}</p>
                    <p className="text-sm text-gray-700 mt-2">
                      {testimonial.content || '(No content)'}
                    </p>
                    <div className="flex gap-1 mt-2">
                      {Array.from({ length: testimonial.rating }).map((_, i) => (
                        <span key={i}>⭐</span>
                      ))}
                    </div>
                    <p className="text-xs text-blue-600 mt-2">Click to edit</p>
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </div>
    </SectionCard>
  )
}

function CTASection({
  settings,
  updateSetting,
}: {
  settings: PageSettings
  updateSetting: <K extends keyof PageSettings>(key: K, value: PageSettings[K]) => void
}) {
  const [showMediaSelector, setShowMediaSelector] = useState(false)

  return (
    <>
      <SectionCard title="Call-To-Action Section">
        <FormField label="Visible" description="Toggle section visibility">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={settings.home_cta_visible || false}
              onChange={(e) => updateSetting('home_cta_visible', e.target.checked)}
              className="w-5 h-5 rounded border-gray-300 cursor-pointer"
            />
            <span className="text-sm font-medium text-gray-700">Show CTA section</span>
          </label>
        </FormField>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <FormField label="Title" description="CTA section heading">
            <input
              type="text"
              value={settings.home_cta_title || ''}
              onChange={(e) => updateSetting('home_cta_title', e.target.value)}
              placeholder="e.g., Ready to Begin?"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </FormField>
        </div>

        <FormField label="Description" description="CTA section subtitle - HTML supported">
          <textarea
            value={settings.home_cta_description || ''}
            onChange={(e) => updateSetting('home_cta_description', e.target.value)}
            placeholder="Enter the CTA section description... (HTML tags supported)"
            rows={4}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
          <p className="text-xs text-gray-500 italic mt-1">
            💡 HTML content is supported (e.g., &lt;b&gt;, &lt;i&gt;, &lt;br&gt;, &lt;a&gt;)
          </p>
          {settings.home_cta_description && (
            <div
              className="mt-2 p-2 bg-gray-50 border border-gray-200 rounded text-sm text-gray-700"
              dangerouslySetInnerHTML={{ __html: settings.home_cta_description }}
            />
          )}
        </FormField>

        <div className="border-t pt-4 mt-4">
          <h3 className="font-semibold text-sm text-gray-900 mb-3">Background Settings</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField label="Background Type">
              <select
                value={settings.home_cta_background_type || 'gradient'}
                onChange={(e) =>
                  updateSetting('home_cta_background_type', e.target.value as 'gradient' | 'image')
                }
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="gradient">Color</option>
                <option value="image">Image</option>
              </select>
            </FormField>

            {settings.home_cta_background_type === 'gradient' && (
              <FormField label="Background Color">
                <div className="flex gap-2 items-center">
                  <input
                    type="color"
                    value={settings.home_cta_background_color || '#fb7e3f'}
                    onChange={(e) => updateSetting('home_cta_background_color', e.target.value)}
                    className="w-16 h-10 border border-gray-300 rounded-lg cursor-pointer"
                  />
                  <span className="text-sm text-gray-600">
                    {settings.home_cta_background_color}
                  </span>
                </div>
              </FormField>
            )}

            {settings.home_cta_background_type === 'image' && (
              <div className="flex gap-2 items-end">
                <Button
                  onClick={() => setShowMediaSelector(true)}
                  className="flex-1 bg-blue-600 hover:bg-blue-700 text-white text-sm py-2"
                >
                  {settings.home_cta_background_image_url ? 'Change' : 'Select'} Image
                </Button>
                {settings.home_cta_background_image_url && (
                  <Button
                    onClick={() => updateSetting('home_cta_background_image_url', '')}
                    className="bg-red-600 hover:bg-red-700 text-white text-sm py-2 px-4"
                  >
                    Remove
                  </Button>
                )}
              </div>
            )}
          </div>

          {settings.home_cta_background_type === 'image' &&
            settings.home_cta_background_image_url && (
              <div className="mt-4">
                <div className="relative h-32 bg-gray-100 rounded-lg overflow-hidden">
                  <img
                    src={settings.home_cta_background_image_url}
                    alt="CTA background preview"
                    className="w-full h-full object-cover"
                  />
                </div>
              </div>
            )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-4 border-t border-gray-200">
          <div className="md:col-span-2">
            <h3 className="font-semibold text-sm text-gray-900 mb-3">Button 1</h3>
          </div>
          <FormField label="Button 1 Text">
            <input
              type="text"
              value={settings.home_cta_button_1_text || ''}
              onChange={(e) => updateSetting('home_cta_button_1_text', e.target.value)}
              placeholder="e.g., Enroll Now"
              className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </FormField>

          <FormField label="Button 1 Link">
            <input
              type="text"
              value={settings.home_cta_button_1_link || ''}
              onChange={(e) => updateSetting('home_cta_button_1_link', e.target.value)}
              placeholder="e.g., /enroll"
              className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </FormField>

          <div className="md:col-span-2">
            <h3 className="font-semibold text-sm text-gray-900 mb-3">Button 2</h3>
          </div>
          <FormField label="Button 2 Text">
            <input
              type="text"
              value={settings.home_cta_button_2_text || ''}
              onChange={(e) => updateSetting('home_cta_button_2_text', e.target.value)}
              placeholder="e.g., Learn More"
              className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </FormField>

          <FormField label="Button 2 Link">
            <input
              type="text"
              value={settings.home_cta_button_2_link || ''}
              onChange={(e) => updateSetting('home_cta_button_2_link', e.target.value)}
              placeholder="e.g., /about"
              className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </FormField>
        </div>
      </SectionCard>

      <ImageSelectorModal
        isOpen={showMediaSelector}
        onClose={() => setShowMediaSelector(false)}
        onSelect={(media) => {
          if (media.length > 0) {
            updateSetting('home_cta_background_image_url', media[0].file_url)
          }
          setShowMediaSelector(false)
        }}
      />
    </>
  )
}

export default HomePageCMSEditor
