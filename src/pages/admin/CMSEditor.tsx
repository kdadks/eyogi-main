import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import {
  Save,
  Eye,
  ArrowLeft,
  Globe,
  Layout,
  Settings,
  Image as ImageIcon,
  FileText,
  Clock,
  CheckCircle,
  Calendar,
  History,
} from 'lucide-react'
import { AdminLayout } from '@/components/admin/layout/AdminLayout'
import { Card, CardBody, CardHeader } from '@/components/admin/common/Card'
import { Button } from '@/components/admin/common/Button'
import { Input } from '@/components/admin/forms/Input'
import { Select } from '@/components/admin/forms/Select'
import { Textarea } from '@/components/admin/forms/Textarea'
import { Tabs, TabList, Tab, TabPanels, TabPanel } from '@/components/admin/common/Tabs'
import { Badge } from '@/components/admin/common/Badge'
import { Modal } from '@/components/admin/common/Modal'
import { RichTextEditor } from '@/components/admin/RichTextEditor'
import { MediaPicker } from '@/components/admin/cms/MediaPicker'
import { ContentBlockEditor } from '@/components/admin/cms/ContentBlockEditor'
import { SEOEditor } from '@/components/admin/cms/SEOEditor'
import { VersionHistory } from '@/components/admin/cms/VersionHistory'
import { cmsAPI } from '@/lib/cms-api'
import type {
  CMSContent,
  CMSLanguage,
  CreateCMSContentDTO,
  UpdateCMSContentDTO,
  AnyContentBlock,
} from '@/lib/cms-types'
import { useAuth } from '@/contexts/AuthContext'
import { toast } from 'react-hot-toast'

export default function CMSEditor() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { user } = useAuth()
  const isEditMode = id !== 'new'

  // State
  const [content, setContent] = useState<Partial<CMSContent>>({
    content_type: 'page',
    status: 'draft',
    content: {},
    metadata: {},
    views: 0,
    sort_order: 0,
    version_number: 1,
    is_latest_version: true,
  })
  const [languages, setLanguages] = useState<CMSLanguage[]>([])
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [activeTab, setActiveTab] = useState(0)
  const [isPreviewOpen, setIsPreviewOpen] = useState(false)
  const [isScheduleModalOpen, setIsScheduleModalOpen] = useState(false)
  const [scheduledDate, setScheduledDate] = useState('')
  const [isVersionHistoryOpen, setIsVersionHistoryOpen] = useState(false)

  // Load content if editing
  useEffect(() => {
    if (isEditMode) {
      fetchContent()
    }
    fetchLanguages()
  }, [id])

  const fetchContent = async () => {
    if (!id || id === 'new') return

    try {
      setLoading(true)
      const data = await cmsAPI.content.getById(id)
      if (data) {
        setContent(data)
      }
    } catch (error) {
      console.error('Error fetching content:', error)
      toast.error('Failed to load content')
    } finally {
      setLoading(false)
    }
  }

  const fetchLanguages = async () => {
    try {
      const langs = await cmsAPI.languages.getAll()
      setLanguages(langs)
      
      // Set default language if creating new
      if (!isEditMode && langs.length > 0) {
        const defaultLang = langs.find((l) => l.is_default) || langs[0]
        setContent((prev) => ({ ...prev, language_id: defaultLang.id }))
      }
    } catch (error) {
      console.error('Error fetching languages:', error)
    }
  }

  // Handlers
  const handleSave = async (publish = false) => {
    if (!user?.id) {
      toast.error('You must be logged in to save content')
      return
    }

    // Validation
    if (!content.title?.trim()) {
      toast.error('Title is required')
      return
    }
    if (!content.slug?.trim()) {
      toast.error('Slug is required')
      return
    }
    if (!content.language_id) {
      toast.error('Language is required')
      return
    }

    try {
      setSaving(true)
      
      const payload = {
        ...content,
        status: publish ? 'published' : content.status,
      }

      let saved: CMSContent
      if (isEditMode) {
        saved = await cmsAPI.content.update(id!, payload as UpdateCMSContentDTO, user.id)
      } else {
        saved = await cmsAPI.content.create(payload as CreateCMSContentDTO, user.id)
      }

      toast.success(publish ? 'Content published successfully' : 'Content saved successfully')
      
      if (!isEditMode) {
        navigate(`/admin/cms/editor/${saved.id}`)
      } else {
        setContent(saved)
      }
    } catch (error) {
      console.error('Error saving content:', error)
      toast.error('Failed to save content')
    } finally {
      setSaving(false)
    }
  }

  const handleSchedule = async () => {
    if (!user?.id || !scheduledDate) return

    try {
      await cmsAPI.content.schedule(content.id!, scheduledDate, user.id)
      toast.success('Content scheduled successfully')
      setIsScheduleModalOpen(false)
      fetchContent()
    } catch (error) {
      console.error('Error scheduling content:', error)
      toast.error('Failed to schedule content')
    }
  }

  const generateSlug = (title: string) => {
    return title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '')
  }

  const handleTitleChange = (title: string) => {
    setContent((prev) => {
      const updates: any = { title }
      // Auto-generate slug if creating new content
      if (!isEditMode || !prev.slug) {
        updates.slug = generateSlug(title)
      }
      return { ...prev, ...updates }
    })
  }

  // Get status badge
  const getStatusBadge = () => {
    if (!content.status) return null
    
    const variants: Record<string, any> = {
      published: 'success',
      draft: 'secondary',
      pending_review: 'warning',
      scheduled: 'info',
      archived: 'default',
    }
    
    return (
      <Badge variant={variants[content.status] || 'default'}>
        {content.status.replace('_', ' ').toUpperCase()}
      </Badge>
    )
  }

  if (loading) {
    return (
      <AdminLayout title="Loading...">
        <div className="flex items-center justify-center h-96">
          <div className="animate-spin w-8 h-8 border-4 border-orange-600 border-t-transparent rounded-full" />
        </div>
      </AdminLayout>
    )
  }

  return (
    <AdminLayout
      title={isEditMode ? `Edit: ${content.title}` : 'Create New Content'}
      breadcrumbs={[
        { label: 'Dashboard', href: '/admin' },
        { label: 'CMS', href: '/admin/cms' },
        { label: isEditMode ? 'Edit' : 'Create' },
      ]}
    >
      {/* Header Actions */}
      <div className="mb-6 flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            onClick={() => navigate('/admin/cms')}
            leftIcon={<ArrowLeft className="w-4 h-4" />}
          >
            Back
          </Button>
          {getStatusBadge()}
          {isEditMode && (
            <span className="text-sm text-stone-500">
              Version {content.version_number}
            </span>
          )}
        </div>

        <div className="flex gap-2 flex-wrap">
          {isEditMode && (
            <>
              <Button
                variant="outline"
                onClick={() => setIsVersionHistoryOpen(true)}
                leftIcon={<History className="w-4 h-4" />}
              >
                History
              </Button>
              <Button
                variant="outline"
                onClick={() => setIsPreviewOpen(true)}
                leftIcon={<Eye className="w-4 h-4" />}
              >
                Preview
              </Button>
            </>
          )}
          <Button
            variant="outline"
            onClick={() => setIsScheduleModalOpen(true)}
            leftIcon={<Calendar className="w-4 h-4" />}
            disabled={content.status === 'published'}
          >
            Schedule
          </Button>
          <Button
            variant="outline"
            onClick={() => handleSave(false)}
            disabled={saving}
            leftIcon={<Save className="w-4 h-4" />}
          >
            {saving ? 'Saving...' : 'Save Draft'}
          </Button>
          <Button
            variant="primary"
            onClick={() => handleSave(true)}
            disabled={saving}
            leftIcon={<CheckCircle className="w-4 h-4" />}
          >
            {content.status === 'published' ? 'Update' : 'Publish'}
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content Area */}
        <div className="lg:col-span-2 space-y-6">
          {/* Basic Information */}
          <Card>
            <CardHeader>
              <h2 className="text-lg font-semibold text-stone-900">Content Details</h2>
            </CardHeader>
            <CardBody>
              <div className="space-y-4">
                <Input
                  label="Title *"
                  value={content.title || ''}
                  onChange={(e) => handleTitleChange(e.target.value)}
                  placeholder="Enter content title..."
                  required
                />

                <Input
                  label="Slug *"
                  value={content.slug || ''}
                  onChange={(e) =>
                    setContent((prev) => ({ ...prev, slug: e.target.value }))
                  }
                  placeholder="url-friendly-slug"
                  required
                  helperText="URL-friendly identifier for this content"
                />

                <Select
                  label="Content Type *"
                  value={content.content_type || 'page'}
                  onChange={(e) =>
                    setContent((prev) => ({ ...prev, content_type: e.target.value }))
                  }
                  required
                >
                  <option value="page">Page</option>
                  <option value="section">Section</option>
                  <option value="component">Component</option>
                  <option value="block">Block</option>
                </Select>

                {content.content_type === 'page' && (
                  <Select
                    label="Page Type"
                    value={content.page_type || 'custom'}
                    onChange={(e) =>
                      setContent((prev) => ({ ...prev, page_type: e.target.value }))
                    }
                  >
                    <option value="home">Home</option>
                    <option value="about">About</option>
                    <option value="faq">FAQ</option>
                    <option value="membership">Membership</option>
                    <option value="contact">Contact</option>
                    <option value="donation">Donation</option>
                    <option value="hinduism">Hinduism</option>
                    <option value="forms">Forms</option>
                    <option value="custom">Custom</option>
                  </Select>
                )}

                <Input
                  label="Template"
                  value={content.template || ''}
                  onChange={(e) =>
                    setContent((prev) => ({ ...prev, template: e.target.value }))
                  }
                  placeholder="template-name"
                  helperText="Optional: Specify a custom template for rendering"
                />
              </div>
            </CardBody>
          </Card>

          {/* Tabbed Content Editor */}
          <Card>
            <CardBody>
              <Tabs selectedIndex={activeTab} onChange={setActiveTab}>
                <TabList>
                  <Tab>
                    <Layout className="w-4 h-4 mr-2" />
                    Content
                  </Tab>
                  <Tab>
                    <Settings className="w-4 h-4 mr-2" />
                    SEO
                  </Tab>
                  <Tab>
                    <FileText className="w-4 h-4 mr-2" />
                    Metadata
                  </Tab>
                </TabList>

                <TabPanels>
                  {/* Content Tab */}
                  <TabPanel>
                    <div className="space-y-4">
                      <ContentBlockEditor
                        blocks={content.content?.blocks || []}
                        onChange={(blocks) =>
                          setContent((prev) => ({
                            ...prev,
                            content: { ...prev.content, blocks },
                          }))
                        }
                      />
                    </div>
                  </TabPanel>

                  {/* SEO Tab */}
                  <TabPanel>
                    <SEOEditor
                      seoTitle={content.seo_title}
                      seoDescription={content.seo_description}
                      seoKeywords={content.seo_keywords}
                      ogTitle={content.og_title}
                      ogDescription={content.og_description}
                      ogImageId={content.og_image_id}
                      canonicalUrl={content.canonical_url}
                      onChange={(seoData) =>
                        setContent((prev) => ({ ...prev, ...seoData }))
                      }
                    />
                  </TabPanel>

                  {/* Metadata Tab */}
                  <TabPanel>
                    <Textarea
                      label="Custom Metadata (JSON)"
                      value={JSON.stringify(content.metadata || {}, null, 2)}
                      onChange={(e) => {
                        try {
                          const metadata = JSON.parse(e.target.value)
                          setContent((prev) => ({ ...prev, metadata }))
                        } catch (err) {
                          // Invalid JSON, ignore
                        }
                      }}
                      rows={10}
                      helperText="Custom metadata in JSON format"
                    />
                  </TabPanel>
                </TabPanels>
              </Tabs>
            </CardBody>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Status & Publishing */}
          <Card>
            <CardHeader>
              <h3 className="text-md font-semibold text-stone-900">Publishing</h3>
            </CardHeader>
            <CardBody>
              <div className="space-y-4">
                <Select
                  label="Status"
                  value={content.status || 'draft'}
                  onChange={(e) =>
                    setContent((prev) => ({ ...prev, status: e.target.value }))
                  }
                >
                  <option value="draft">Draft</option>
                  <option value="pending_review">Pending Review</option>
                  <option value="scheduled">Scheduled</option>
                  <option value="published">Published</option>
                  <option value="archived">Archived</option>
                </Select>

                {content.published_at && (
                  <div className="text-sm text-stone-600">
                    <Clock className="w-4 h-4 inline mr-1" />
                    Published: {new Date(content.published_at).toLocaleString()}
                  </div>
                )}

                {content.scheduled_at && (
                  <div className="text-sm text-stone-600">
                    <Calendar className="w-4 h-4 inline mr-1" />
                    Scheduled: {new Date(content.scheduled_at).toLocaleString()}
                  </div>
                )}
              </div>
            </CardBody>
          </Card>

          {/* Language */}
          <Card>
            <CardHeader>
              <h3 className="text-md font-semibold text-stone-900">Language</h3>
            </CardHeader>
            <CardBody>
              <Select
                label="Language *"
                value={content.language_id || ''}
                onChange={(e) =>
                  setContent((prev) => ({ ...prev, language_id: e.target.value }))
                }
                required
              >
                <option value="">Select Language</option>
                {languages.map((lang) => (
                  <option key={lang.id} value={lang.id}>
                    {lang.name} ({lang.code.toUpperCase()})
                  </option>
                ))}
              </Select>
            </CardBody>
          </Card>

          {/* Featured Image */}
          <Card>
            <CardHeader>
              <h3 className="text-md font-semibold text-stone-900">Featured Image</h3>
            </CardHeader>
            <CardBody>
              <MediaPicker
                value={content.og_image_id}
                onChange={(imageId) =>
                  setContent((prev) => ({ ...prev, og_image_id: imageId }))
                }
              />
            </CardBody>
          </Card>

          {/* Analytics */}
          {isEditMode && (
            <Card>
              <CardHeader>
                <h3 className="text-md font-semibold text-stone-900">Analytics</h3>
              </CardHeader>
              <CardBody>
                <div className="space-y-2 text-sm text-stone-600">
                  <div className="flex justify-between">
                    <span>Views:</span>
                    <span className="font-semibold">{content.views || 0}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Version:</span>
                    <span className="font-semibold">{content.version_number || 1}</span>
                  </div>
                  {content.last_viewed_at && (
                    <div className="flex justify-between">
                      <span>Last Viewed:</span>
                      <span className="font-semibold">
                        {new Date(content.last_viewed_at).toLocaleDateString()}
                      </span>
                    </div>
                  )}
                </div>
              </CardBody>
            </Card>
          )}
        </div>
      </div>

      {/* Schedule Modal */}
      <Modal
        isOpen={isScheduleModalOpen}
        onClose={() => setIsScheduleModalOpen(false)}
        title="Schedule Content"
      >
        <div className="space-y-4">
          <Input
            type="datetime-local"
            label="Schedule Date & Time"
            value={scheduledDate}
            onChange={(e) => setScheduledDate(e.target.value)}
          />
          <div className="flex gap-3 justify-end">
            <Button variant="outline" onClick={() => setIsScheduleModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" onClick={handleSchedule}>
              Schedule
            </Button>
          </div>
        </div>
      </Modal>

      {/* Version History Modal */}
      {isEditMode && (
        <Modal
          isOpen={isVersionHistoryOpen}
          onClose={() => setIsVersionHistoryOpen(false)}
          title="Version History"
          size="lg"
        >
          <VersionHistory
            contentId={content.id!}
            onRestore={(version) => {
              setIsVersionHistoryOpen(false)
              fetchContent()
              toast.success(`Restored to version ${version}`)
            }}
          />
        </Modal>
      )}
    </AdminLayout>
  )
}
