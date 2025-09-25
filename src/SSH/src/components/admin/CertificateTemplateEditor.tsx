import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { CertificateTemplate } from '@/types'
import { generateCertificatePreview, CertificateData } from '@/lib/pdf/certificateGenerator'
import {
  createCertificateTemplate,
  updateCertificateTemplate,
  duplicateCertificateTemplate,
} from '@/lib/api/certificateTemplates'
import toast from 'react-hot-toast'
import {
  XMarkIcon,
  EyeIcon,
  PhotoIcon,
  PencilIcon,
  DocumentDuplicateIcon,
} from '@heroicons/react/24/outline'
interface CertificateTemplateEditorProps {
  template?: CertificateTemplate
  isOpen: boolean
  onClose: () => void
  onSave: (template: CertificateTemplate) => void
}
const CertificateTemplateEditor: React.FC<CertificateTemplateEditorProps> = ({
  template,
  isOpen,
  onClose,
  onSave,
}) => {
  const [formData, setFormData] = useState<Partial<CertificateTemplate>>({
    name: '',
    type: 'student',
    template_data: {
      design: {
        colors: {
          primary: '#FF6B35',
          secondary: '#2563EB',
          text: '#1F2937',
        },
        layout: {
          orientation: 'landscape',
          size: 'a4',
        },
      },
      logos: {
        eyogi_logo_url: '/eyogiLogo.png',
        ssh_logo_url: '/ssh-app/Images/Logo.png',
      },
      signatures: {
        vice_chancellor_signature_url: '',
        vice_chancellor_signature_data: '',
        president_signature_url: '',
        president_signature_data: '',
      },
      seal: {
        official_seal_url: '',
        official_seal_data: '',
      },
      placeholders: {
        student_name: true,
        student_id: true,
        course_name: true,
        course_id: true,
        gurukul_name: true,
        completion_date: true,
        certificate_number: true,
      },
      custom_text: {
        title: 'CERTIFICATE OF COMPLETION',
        subtitle: 'This is to certify that',
        header_text: 'eYogi Gurukul',
        footer_text: 'This certificate verifies successful completion of the course.',
      },
    },
    is_active: true,
  })
  const [loading, setLoading] = useState(false)
  const [previewUrl, setPreviewUrl] = useState<string>('')
  useEffect(() => {
    if (template) {
      setFormData(template)
    }
  }, [template])
  const handleSave = async () => {
    if (!formData.name?.trim()) {
      toast.error('Please enter a template name')
      return
    }
    setLoading(true)
    try {
      let savedTemplate: CertificateTemplate
      if (template?.id) {
        // Update existing template
        savedTemplate = await updateCertificateTemplate(template.id, formData)
        toast.success('Template updated successfully')
      } else {
        // Create new template
        savedTemplate = await createCertificateTemplate(
          formData as Omit<CertificateTemplate, 'id' | 'created_at' | 'updated_at'>,
        )
        toast.success('Template created successfully')
      }
      onSave(savedTemplate)
      onClose()
    } catch (error) {
      toast.error('Failed to save template')
    } finally {
      setLoading(false)
    }
  }
  const handleDuplicate = async () => {
    if (!template?.id) return
    setLoading(true)
    try {
      const duplicatedTemplate = await duplicateCertificateTemplate(template.id)
      toast.success('Template duplicated successfully')
      onSave(duplicatedTemplate)
      onClose()
    } catch (error) {
      toast.error('Failed to duplicate template')
    } finally {
      setLoading(false)
    }
  }
  const generatePreview = async () => {
    setLoading(true)
    try {
      const sampleData: CertificateData = {
        studentName: 'John Doe',
        studentId: 'STU001',
        courseName: 'Sample Course Name',
        courseId: 'CSE101',
        gurukulName: 'Sample Gurukul',
        completionDate: new Date().toISOString(),
        certificateNumber: 'CERT-2024-001',
        verificationCode: 'ABC123',
      }
      const preview = await generateCertificatePreview(sampleData)
      setPreviewUrl(preview)
    } catch (error) {
      toast.error('Failed to generate preview')
    } finally {
      setLoading(false)
    }
  }
  const updateTemplateData = (path: string, value: unknown) => {
    setFormData((prev) => {
      const newData = { ...prev }
      const keys = path.split('.')
      let current: Record<string, unknown> = newData
      // Navigate to the parent of the target property
      for (let i = 0; i < keys.length - 1; i++) {
        if (!current[keys[i]]) {
          current[keys[i]] = {}
        }
        current = current[keys[i]] as Record<string, unknown>
      }
      // Set the final value
      current[keys[keys.length - 1]] = value
      return newData
    })
  }
  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>, path: string) => {
    const file = event.target.files?.[0]
    if (!file) return
    // Check if file is an image
    if (!file.type.startsWith('image/')) {
      toast.error('Please select an image file')
      return
    }
    // Check file size (max 2MB)
    if (file.size > 2 * 1024 * 1024) {
      toast.error('Image size should be less than 2MB')
      return
    }
    const reader = new FileReader()
    reader.onload = (e) => {
      const base64Data = e.target?.result as string
      updateTemplateData(path, base64Data)
    }
    reader.readAsDataURL(file)
  }
  const removeImage = (path: string) => {
    updateTemplateData(path, '')
  }
  if (!isOpen) return null
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity"
        onClick={onClose}
      />
      <div className="relative bg-white rounded-lg shadow-xl max-w-6xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header - Fixed */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 flex-shrink-0">
          <h3 className="text-lg leading-6 font-medium text-gray-900">
            {template ? 'Edit Certificate Template' : 'Create Certificate Template'}
          </h3>
          <div className="flex items-center gap-2">
            {template && (
              <Button onClick={handleDuplicate} disabled={loading} variant="outline" size="sm">
                <DocumentDuplicateIcon className="h-4 w-4 mr-2" />
                Duplicate
              </Button>
            )}
            <button type="button" className="text-gray-400 hover:text-gray-600" onClick={onClose}>
              <XMarkIcon className="h-6 w-6" />
            </button>
          </div>
        </div>
        {/* Content - Scrollable */}
        <div className="flex-1 overflow-y-auto p-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Left Panel - Template Configuration */}
            <div className="space-y-6">
              {/* Basic Information */}
              <Card>
                <CardHeader>
                  <h4 className="text-lg font-medium">Basic Information</h4>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Template Name
                    </label>
                    <input
                      type="text"
                      value={formData.name || ''}
                      onChange={(e) => setFormData((prev) => ({ ...prev, name: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-orange-500 focus:border-orange-500"
                      placeholder="Enter template name"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Certificate Type
                    </label>
                    <select
                      value={formData.type || 'student'}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          type: e.target.value as 'student' | 'teacher',
                        }))
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-orange-500 focus:border-orange-500"
                    >
                      <option value="student">Student Certificate</option>
                      <option value="teacher">Teacher Certificate</option>
                    </select>
                  </div>
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      id="is_active"
                      checked={formData.is_active || false}
                      onChange={(e) =>
                        setFormData((prev) => ({ ...prev, is_active: e.target.checked }))
                      }
                      className="rounded border-gray-300 text-orange-600 focus:ring-orange-500"
                    />
                    <label htmlFor="is_active" className="ml-2 text-sm text-gray-700">
                      Active template
                    </label>
                  </div>
                </CardContent>
              </Card>
              {/* Design Settings */}
              <Card>
                <CardHeader>
                  <h4 className="text-lg font-medium">Design Settings</h4>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Primary Color
                    </label>
                    <input
                      type="color"
                      value={formData.template_data?.design?.colors?.primary || '#FF6B35'}
                      onChange={(e) =>
                        updateTemplateData('template_data.design.colors.primary', e.target.value)
                      }
                      className="w-full h-10 rounded-md border border-gray-300"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Secondary Color
                    </label>
                    <input
                      type="color"
                      value={formData.template_data?.design?.colors?.secondary || '#2563EB'}
                      onChange={(e) =>
                        updateTemplateData('template_data.design.colors.secondary', e.target.value)
                      }
                      className="w-full h-10 rounded-md border border-gray-300"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Text Color
                    </label>
                    <input
                      type="color"
                      value={formData.template_data?.design?.colors?.text || '#1F2937'}
                      onChange={(e) =>
                        updateTemplateData('template_data.design.colors.text', e.target.value)
                      }
                      className="w-full h-10 rounded-md border border-gray-300"
                    />
                  </div>
                </CardContent>
              </Card>
              {/* Custom Text */}
              <Card>
                <CardHeader>
                  <h4 className="text-lg font-medium">Custom Text</h4>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Certificate Title
                    </label>
                    <input
                      type="text"
                      value={formData.template_data?.custom_text?.title || ''}
                      onChange={(e) =>
                        updateTemplateData('template_data.custom_text.title', e.target.value)
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-orange-500 focus:border-orange-500"
                      placeholder="CERTIFICATE OF COMPLETION"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Subtitle</label>
                    <input
                      type="text"
                      value={formData.template_data?.custom_text?.subtitle || ''}
                      onChange={(e) =>
                        updateTemplateData('template_data.custom_text.subtitle', e.target.value)
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-orange-500 focus:border-orange-500"
                      placeholder="This is to certify that"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Header Text
                    </label>
                    <input
                      type="text"
                      value={formData.template_data?.custom_text?.header_text || ''}
                      onChange={(e) =>
                        updateTemplateData('template_data.custom_text.header_text', e.target.value)
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-orange-500 focus:border-orange-500"
                      placeholder="eYogi Gurukul"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Footer Text
                    </label>
                    <textarea
                      value={formData.template_data?.custom_text?.footer_text || ''}
                      onChange={(e) =>
                        updateTemplateData('template_data.custom_text.footer_text', e.target.value)
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-orange-500 focus:border-orange-500"
                      rows={3}
                      placeholder="This certificate verifies successful completion of the course."
                    />
                  </div>
                </CardContent>
              </Card>
              {/* Logo Uploads */}
              <Card>
                <CardHeader>
                  <h4 className="text-lg font-medium">Logo Images</h4>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* eYogi Logo */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      eYogi Logo
                    </label>
                    {formData.template_data?.logos?.eyogi_logo_data ? (
                      <div className="space-y-2">
                        <img
                          src={formData.template_data.logos.eyogi_logo_data}
                          alt="eYogi Logo"
                          className="max-w-32 max-h-20 object-contain border rounded"
                        />
                        <button
                          type="button"
                          onClick={() => removeImage('template_data.logos.eyogi_logo_data')}
                          className="text-red-600 hover:text-red-700 text-sm"
                        >
                          Remove Image
                        </button>
                      </div>
                    ) : (
                      <div className="border-2 border-dashed border-gray-300 rounded-lg p-4">
                        <input
                          type="file"
                          accept="image/*"
                          onChange={(e) =>
                            handleImageUpload(e, 'template_data.logos.eyogi_logo_data')
                          }
                          className="hidden"
                          id="eyogi-logo-upload"
                        />
                        <label
                          htmlFor="eyogi-logo-upload"
                          className="cursor-pointer flex flex-col items-center gap-2"
                        >
                          <PhotoIcon className="h-8 w-8 text-gray-400" />
                          <span className="text-sm text-gray-600">Upload eYogi Logo</span>
                          <span className="text-xs text-gray-500">PNG, JPG up to 2MB</span>
                        </label>
                      </div>
                    )}
                  </div>
                  {/* SSH Logo */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">SSH Logo</label>
                    {formData.template_data?.logos?.ssh_logo_data ? (
                      <div className="space-y-2">
                        <img
                          src={formData.template_data.logos.ssh_logo_data}
                          alt="SSH Logo"
                          className="max-w-32 max-h-20 object-contain border rounded"
                        />
                        <button
                          type="button"
                          onClick={() => removeImage('template_data.logos.ssh_logo_data')}
                          className="text-red-600 hover:text-red-700 text-sm"
                        >
                          Remove Image
                        </button>
                      </div>
                    ) : (
                      <div className="border-2 border-dashed border-gray-300 rounded-lg p-4">
                        <input
                          type="file"
                          accept="image/*"
                          onChange={(e) =>
                            handleImageUpload(e, 'template_data.logos.ssh_logo_data')
                          }
                          className="hidden"
                          id="ssh-logo-upload"
                        />
                        <label
                          htmlFor="ssh-logo-upload"
                          className="cursor-pointer flex flex-col items-center gap-2"
                        >
                          <PhotoIcon className="h-8 w-8 text-gray-400" />
                          <span className="text-sm text-gray-600">Upload SSH Logo</span>
                          <span className="text-xs text-gray-500">PNG, JPG up to 2MB</span>
                        </label>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
              {/* Signature Uploads */}
              <Card>
                <CardHeader>
                  <h4 className="text-lg font-medium">Signature Images</h4>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Vice Chancellor Signature */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Vice Chancellor Signature
                    </label>
                    {formData.template_data?.signatures?.vice_chancellor_signature_data ? (
                      <div className="space-y-2">
                        <img
                          src={formData.template_data.signatures.vice_chancellor_signature_data}
                          alt="Vice Chancellor Signature"
                          className="max-w-40 max-h-16 object-contain border rounded"
                        />
                        <button
                          type="button"
                          onClick={() =>
                            removeImage('template_data.signatures.vice_chancellor_signature_data')
                          }
                          className="text-red-600 hover:text-red-700 text-sm"
                        >
                          Remove Signature
                        </button>
                      </div>
                    ) : (
                      <div className="border-2 border-dashed border-gray-300 rounded-lg p-4">
                        <input
                          type="file"
                          accept="image/*"
                          onChange={(e) =>
                            handleImageUpload(
                              e,
                              'template_data.signatures.vice_chancellor_signature_data',
                            )
                          }
                          className="hidden"
                          id="vc-signature-upload"
                        />
                        <label
                          htmlFor="vc-signature-upload"
                          className="cursor-pointer flex flex-col items-center gap-2"
                        >
                          <PencilIcon className="h-8 w-8 text-gray-400" />
                          <span className="text-sm text-gray-600">Upload VC Signature</span>
                          <span className="text-xs text-gray-500">PNG, JPG up to 2MB</span>
                        </label>
                      </div>
                    )}
                  </div>
                  {/* President Signature */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      President Signature
                    </label>
                    {formData.template_data?.signatures?.president_signature_data ? (
                      <div className="space-y-2">
                        <img
                          src={formData.template_data.signatures.president_signature_data}
                          alt="President Signature"
                          className="max-w-40 max-h-16 object-contain border rounded"
                        />
                        <button
                          type="button"
                          onClick={() =>
                            removeImage('template_data.signatures.president_signature_data')
                          }
                          className="text-red-600 hover:text-red-700 text-sm"
                        >
                          Remove Signature
                        </button>
                      </div>
                    ) : (
                      <div className="border-2 border-dashed border-gray-300 rounded-lg p-4">
                        <input
                          type="file"
                          accept="image/*"
                          onChange={(e) =>
                            handleImageUpload(
                              e,
                              'template_data.signatures.president_signature_data',
                            )
                          }
                          className="hidden"
                          id="president-signature-upload"
                        />
                        <label
                          htmlFor="president-signature-upload"
                          className="cursor-pointer flex flex-col items-center gap-2"
                        >
                          <PencilIcon className="h-8 w-8 text-gray-400" />
                          <span className="text-sm text-gray-600">Upload President Signature</span>
                          <span className="text-xs text-gray-500">PNG, JPG up to 2MB</span>
                        </label>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
              {/* Official Seal Upload */}
              <Card>
                <CardHeader>
                  <h4 className="text-lg font-medium">Official Seal</h4>
                </CardHeader>
                <CardContent>
                  {formData.template_data?.seal?.official_seal_data ? (
                    <div className="space-y-2">
                      <img
                        src={formData.template_data.seal.official_seal_data}
                        alt="Official Seal"
                        className="max-w-24 max-h-24 object-contain border rounded"
                      />
                      <button
                        type="button"
                        onClick={() => removeImage('template_data.seal.official_seal_data')}
                        className="text-red-600 hover:text-red-700 text-sm"
                      >
                        Remove Seal
                      </button>
                    </div>
                  ) : (
                    <div className="border-2 border-dashed border-gray-300 rounded-lg p-4">
                      <input
                        type="file"
                        accept="image/*"
                        onChange={(e) =>
                          handleImageUpload(e, 'template_data.seal.official_seal_data')
                        }
                        className="hidden"
                        id="seal-upload"
                      />
                      <label
                        htmlFor="seal-upload"
                        className="cursor-pointer flex flex-col items-center space-y-2"
                      >
                        <PhotoIcon className="h-8 w-8 text-gray-400" />
                        <span className="text-sm text-gray-600">Upload Official Seal</span>
                        <span className="text-xs text-gray-500">PNG, JPG up to 2MB</span>
                      </label>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
            {/* Right Panel - Preview */}
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <h4 className="text-lg font-medium">Preview</h4>
                    <Button onClick={generatePreview} disabled={loading} size="sm">
                      <EyeIcon className="h-4 w-4 mr-2" />
                      Generate Preview
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  {previewUrl ? (
                    <div className="border border-gray-200 rounded-lg overflow-hidden">
                      <iframe
                        src={previewUrl}
                        className="w-full h-96"
                        title="Certificate Preview"
                      />
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center h-96 bg-gray-50 border border-gray-200 rounded-lg">
                      <PencilIcon className="h-12 w-12 text-gray-400 mb-4" />
                      <p className="text-gray-500 text-center">
                        Click "Generate Preview" to see how your certificate will look
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
        {/* Footer - Fixed */}
        <div className="flex justify-end gap-3 p-6 border-t border-gray-200 flex-shrink-0">
          <Button onClick={onClose} variant="outline" disabled={loading}>
            Cancel
          </Button>
          <Button
            onClick={handleSave}
            disabled={loading || !formData.name?.trim()}
            className="bg-orange-600 hover:bg-orange-700"
          >
            {loading ? 'Saving...' : template ? 'Update Template' : 'Create Template'}
          </Button>
        </div>
      </div>
    </div>
  )
}
export default CertificateTemplateEditor
