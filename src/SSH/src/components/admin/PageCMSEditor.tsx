import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader } from '../ui/Card'
import { Button } from '../ui/Button'
import { Input } from '../ui/Input'
import { Badge } from '../ui/Badge'
import {
  PageSettings,
  getPageSettings,
  updatePageSettings,
  resetPageSettings,
} from '../../lib/api/pageSettings'
import { useWebsiteAuth } from '../../contexts/WebsiteAuthContext'
import { toast } from 'react-hot-toast'
import ReactQuill from 'react-quill'
import 'react-quill/dist/quill.snow.css'
import { ArrowPathIcon, CheckIcon, EyeIcon } from '@heroicons/react/24/outline'
import { sanitizeHtml } from '../../utils/sanitize'

interface PageCMSEditorProps {
  pageSlug: 'gurukuls' | 'courses' | 'home' | 'about' | 'contact'
  onSave?: () => void
}

const PageCMSEditor: React.FC<PageCMSEditorProps> = ({ pageSlug, onSave }) => {
  const { user } = useWebsiteAuth()
  const [settings, setSettings] = useState<PageSettings | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [activeTab, setActiveTab] = useState<'hero' | 'stats' | 'features' | 'cta' | 'seo'>('hero')
  const [previewMode, setPreviewMode] = useState(false)

  useEffect(() => {
    loadSettings()
  }, [pageSlug])

  const loadSettings = async () => {
    try {
      setLoading(true)
      const data = await getPageSettings(pageSlug)
      setSettings(data)
    } catch (error) {
      console.error('Error loading page settings:', error)
      toast.error('Failed to load page settings')
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async () => {
    if (!settings || !user) return

    setSaving(true)
    try {
      await updatePageSettings(pageSlug, settings, user.id)
      toast.success('Page settings saved successfully')
      onSave?.()
    } catch (error) {
      console.error('Error saving settings:', error)
      toast.error('Failed to save page settings')
    } finally {
      setSaving(false)
    }
  }

  const handleReset = async () => {
    if (!user || !window.confirm('Are you sure? This will reset all changes to defaults.')) return

    setSaving(true)
    try {
      const resetSettings = await resetPageSettings(pageSlug, user.id)
      setSettings(resetSettings)
      toast.success('Page settings reset to defaults')
    } catch (error) {
      console.error('Error resetting settings:', error)
      toast.error('Failed to reset page settings')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-center">
          <div className="spinner w-8 h-8 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading page settings...</p>
        </div>
      </div>
    )
  }

  if (!settings) {
    return (
      <Card>
        <CardContent className="p-8 text-center">
          <p className="text-gray-600 mb-4">Page settings not found for {pageSlug}</p>
          <Button onClick={loadSettings}>Retry</Button>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Page CMS Editor</h2>
            <p className="text-sm text-gray-600 mt-1">
              Manage {pageSlug} page appearance and content
            </p>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPreviewMode(!previewMode)}
              className="flex items-center gap-2"
            >
              <EyeIcon className="h-4 w-4" />
              {previewMode ? 'Edit' : 'Preview'}
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleReset}
              loading={saving}
              className="flex items-center gap-2"
            >
              <ArrowPathIcon className="h-4 w-4" />
              Reset
            </Button>
            <Button
              size="sm"
              onClick={handleSave}
              loading={saving}
              className="flex items-center gap-2"
            >
              <CheckIcon className="h-4 w-4" />
              Save Changes
            </Button>
          </div>
        </CardHeader>
      </Card>

      {previewMode ? (
        // Preview Mode
        <Card>
          <CardContent className="p-8">
            <div className="space-y-12">
              {/* Hero Preview */}
              <div
                className="border rounded-lg overflow-hidden"
                style={{ backgroundColor: settings.hero_background_color || '#fef3f2' }}
              >
                <div
                  className="p-12 text-center"
                  style={{ color: settings.hero_text_color || '#111827' }}
                >
                  <h1 className="text-4xl font-bold mb-4">{settings.hero_title}</h1>
                  <div
                    className="text-lg mb-8 max-w-3xl mx-auto"
                    dangerouslySetInnerHTML={{
                      __html: sanitizeHtml(settings.hero_description || ''),
                    }}
                  />
                  {settings.hero_cta_button_text && (
                    <Button
                      size="lg"
                      style={{ backgroundColor: settings.hero_cta_button_color || '#FB7E3F' }}
                    >
                      {settings.hero_cta_button_text}
                    </Button>
                  )}
                </div>
              </div>

              {/* Features Preview */}
              {settings.features_visible && settings.features_items && (
                <div>
                  <h2 className="text-3xl font-bold mb-2 text-center">{settings.features_title}</h2>
                  <p className="text-center text-gray-600 mb-8">{settings.features_subtitle}</p>
                  <div className="grid md:grid-cols-3 gap-8">
                    {settings.features_items.map((feature, idx) => (
                      <div key={idx} className="text-center p-6 border rounded-lg">
                        <h3 className="text-xl font-semibold mb-2">{feature.title}</h3>
                        <p className="text-gray-600">{feature.description}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* CTA Preview */}
              {settings.cta_visible && (
                <div
                  className="border rounded-lg p-12 text-center text-white"
                  style={{ backgroundColor: settings.cta_background_color || '#fb7e3f' }}
                >
                  <h2 className="text-3xl font-bold mb-4">{settings.cta_title}</h2>
                  <p className="text-lg mb-8 opacity-90">{settings.cta_description}</p>
                  <div className="flex gap-4 justify-center">
                    {settings.cta_buttons?.map((btn, idx) => (
                      <Button key={idx} variant={btn.variant as any} size="lg">
                        {btn.text}
                      </Button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      ) : (
        // Edit Mode
        <div className="grid lg:grid-cols-4 gap-6">
          {/* Tab Navigation */}
          <div className="lg:col-span-1">
            <Card className="sticky top-4">
              <CardContent className="p-4 space-y-2">
                {[
                  { id: 'hero', label: 'Hero Section' },
                  { id: 'stats', label: 'Statistics' },
                  { id: 'features', label: 'Features' },
                  { id: 'cta', label: 'Call to Action' },
                  { id: 'seo', label: 'SEO Settings' },
                ].map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id as any)}
                    className={`w-full text-left px-3 py-2 rounded-lg transition-colors ${
                      activeTab === tab.id
                        ? 'bg-orange-100 text-orange-700 font-medium'
                        : 'text-gray-700 hover:bg-gray-100'
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </CardContent>
            </Card>
          </div>

          {/* Tab Content */}
          <div className="lg:col-span-3 space-y-6">
            {/* Hero Section Tab */}
            {activeTab === 'hero' && (
              <Card>
                <CardHeader>
                  <h3 className="text-lg font-semibold">Hero Section</h3>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
                    <Input
                      value={settings.hero_title || ''}
                      onChange={(e) => setSettings({ ...settings, hero_title: e.target.value })}
                      placeholder="Enter hero title"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Description
                    </label>
                    <ReactQuill
                      value={settings.hero_description || ''}
                      onChange={(value) => setSettings({ ...settings, hero_description: value })}
                      placeholder="Enter hero description"
                      className="bg-white"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Background Color
                      </label>
                      <div className="flex items-center gap-2">
                        <input
                          type="color"
                          value={settings.hero_background_color || '#fef3f2'}
                          onChange={(e) =>
                            setSettings({ ...settings, hero_background_color: e.target.value })
                          }
                          className="h-10 w-14 rounded cursor-pointer"
                        />
                        <span className="text-sm text-gray-600">
                          {settings.hero_background_color || '#fef3f2'}
                        </span>
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Text Color
                      </label>
                      <div className="flex items-center gap-2">
                        <input
                          type="color"
                          value={settings.hero_text_color || '#111827'}
                          onChange={(e) =>
                            setSettings({ ...settings, hero_text_color: e.target.value })
                          }
                          className="h-10 w-14 rounded cursor-pointer"
                        />
                        <span className="text-sm text-gray-600">
                          {settings.hero_text_color || '#111827'}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        CTA Button Text
                      </label>
                      <Input
                        value={settings.hero_cta_button_text || ''}
                        onChange={(e) =>
                          setSettings({ ...settings, hero_cta_button_text: e.target.value })
                        }
                        placeholder="e.g., Get Started"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        CTA Button Link
                      </label>
                      <Input
                        value={settings.hero_cta_button_link || ''}
                        onChange={(e) =>
                          setSettings({ ...settings, hero_cta_button_link: e.target.value })
                        }
                        placeholder="e.g., /courses"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Button Color
                    </label>
                    <div className="flex items-center gap-2">
                      <input
                        type="color"
                        value={settings.hero_cta_button_color || '#FB7E3F'}
                        onChange={(e) =>
                          setSettings({ ...settings, hero_cta_button_color: e.target.value })
                        }
                        className="h-10 w-14 rounded cursor-pointer"
                      />
                      <span className="text-sm text-gray-600">
                        {settings.hero_cta_button_color || '#FB7E3F'}
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Features Tab */}
            {activeTab === 'features' && (
              <Card>
                <CardHeader>
                  <h3 className="text-lg font-semibold">Features Section</h3>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center gap-2 mb-4">
                    <input
                      type="checkbox"
                      checked={settings.features_visible !== false}
                      onChange={(e) =>
                        setSettings({ ...settings, features_visible: e.target.checked })
                      }
                      className="h-4 w-4"
                    />
                    <label className="text-sm font-medium text-gray-700">
                      Show Features Section
                    </label>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Section Title
                    </label>
                    <Input
                      value={settings.features_title || ''}
                      onChange={(e) => setSettings({ ...settings, features_title: e.target.value })}
                      placeholder="Enter features title"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Section Subtitle
                    </label>
                    <Input
                      value={settings.features_subtitle || ''}
                      onChange={(e) =>
                        setSettings({ ...settings, features_subtitle: e.target.value })
                      }
                      placeholder="Enter features subtitle"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Features</label>
                    <div className="space-y-3">
                      {settings.features_items?.map((feature, idx) => (
                        <div key={idx} className="p-3 border rounded-lg space-y-2">
                          <Input
                            value={feature.title}
                            onChange={(e) => {
                              const updated = [...(settings.features_items || [])]
                              updated[idx].title = e.target.value
                              setSettings({ ...settings, features_items: updated })
                            }}
                            placeholder="Feature title"
                          />
                          <textarea
                            value={feature.description}
                            onChange={(e) => {
                              const updated = [...(settings.features_items || [])]
                              updated[idx].description = e.target.value
                              setSettings({ ...settings, features_items: updated })
                            }}
                            placeholder="Feature description"
                            rows={2}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* CTA Tab */}
            {activeTab === 'cta' && (
              <Card>
                <CardHeader>
                  <h3 className="text-lg font-semibold">Call to Action Section</h3>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center gap-2 mb-4">
                    <input
                      type="checkbox"
                      checked={settings.cta_visible !== false}
                      onChange={(e) => setSettings({ ...settings, cta_visible: e.target.checked })}
                      className="h-4 w-4"
                    />
                    <label className="text-sm font-medium text-gray-700">Show CTA Section</label>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
                    <Input
                      value={settings.cta_title || ''}
                      onChange={(e) => setSettings({ ...settings, cta_title: e.target.value })}
                      placeholder="Enter CTA title"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Description
                    </label>
                    <textarea
                      value={settings.cta_description || ''}
                      onChange={(e) =>
                        setSettings({ ...settings, cta_description: e.target.value })
                      }
                      placeholder="Enter CTA description"
                      rows={3}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Background Color
                    </label>
                    <div className="flex items-center gap-2">
                      <input
                        type="color"
                        value={settings.cta_background_color || '#fb7e3f'}
                        onChange={(e) =>
                          setSettings({ ...settings, cta_background_color: e.target.value })
                        }
                        className="h-10 w-14 rounded cursor-pointer"
                      />
                      <span className="text-sm text-gray-600">
                        {settings.cta_background_color || '#fb7e3f'}
                      </span>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Buttons</label>
                    <div className="space-y-3">
                      {settings.cta_buttons?.map((btn, idx) => (
                        <div key={idx} className="p-3 border rounded-lg space-y-2">
                          <Input
                            value={btn.text}
                            onChange={(e) => {
                              const updated = [...(settings.cta_buttons || [])]
                              updated[idx].text = e.target.value
                              setSettings({ ...settings, cta_buttons: updated })
                            }}
                            placeholder="Button text"
                          />
                          <Input
                            value={btn.link}
                            onChange={(e) => {
                              const updated = [...(settings.cta_buttons || [])]
                              updated[idx].link = e.target.value
                              setSettings({ ...settings, cta_buttons: updated })
                            }}
                            placeholder="Button link (e.g., /courses)"
                          />
                          <select
                            value={btn.variant}
                            onChange={(e) => {
                              const updated = [...(settings.cta_buttons || [])]
                              updated[idx].variant = e.target.value as any
                              setSettings({ ...settings, cta_buttons: updated })
                            }}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md"
                          >
                            <option value="primary">Primary</option>
                            <option value="secondary">Secondary</option>
                            <option value="outline">Outline</option>
                          </select>
                        </div>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* SEO Tab */}
            {activeTab === 'seo' && (
              <Card>
                <CardHeader>
                  <h3 className="text-lg font-semibold">SEO Settings</h3>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Meta Title
                    </label>
                    <Input
                      value={settings.seo_title || ''}
                      onChange={(e) => setSettings({ ...settings, seo_title: e.target.value })}
                      placeholder="Enter meta title"
                      maxLength={60}
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      {settings.seo_title?.length || 0}/60 characters
                    </p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Meta Description
                    </label>
                    <textarea
                      value={settings.seo_description || ''}
                      onChange={(e) =>
                        setSettings({ ...settings, seo_description: e.target.value })
                      }
                      placeholder="Enter meta description"
                      rows={3}
                      maxLength={160}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      {settings.seo_description?.length || 0}/160 characters
                    </p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Keywords (comma-separated)
                    </label>
                    <textarea
                      value={settings.seo_keywords || ''}
                      onChange={(e) => setSettings({ ...settings, seo_keywords: e.target.value })}
                      placeholder="Enter keywords separated by commas"
                      rows={3}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                    />
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

export default PageCMSEditor
