import React, { useState, useRef, useEffect } from 'react'
import { Card, CardContent, CardHeader } from '../ui/Card'
import { Button } from '../ui/Button'
import { CertificateTemplate, DynamicField } from '@/types'
import {
  createCertificateTemplate,
  updateCertificateTemplate,
} from '@/lib/api/certificateTemplates'
import { uploadTemplateImage } from '@/lib/api/templateImages'
import toast from 'react-hot-toast'
import {
  XMarkIcon,
  PhotoIcon,
  PlusIcon,
  TrashIcon,
  ArrowPathIcon,
} from '@heroicons/react/24/outline'

interface SimpleCertificateTemplateEditorProps {
  template?: CertificateTemplate
  isOpen: boolean
  onClose: () => void
  onSave: (template: CertificateTemplate) => void
}

interface DraggingField {
  fieldId: string
  offsetX: number
  offsetY: number
}

const PRESET_FIELDS = [
  { name: 'student_name', label: 'Student Name', fontSize: 32, fontColor: '#1a5490' },
  { name: 'student_id', label: 'Student Number', fontSize: 14, fontColor: '#666666' },
  { name: 'course_name', label: 'Course Name', fontSize: 24, fontColor: '#d97706' },
  { name: 'course_id', label: 'Course Number', fontSize: 14, fontColor: '#666666' },
  { name: 'completion_date', label: 'Completion Date', fontSize: 16, fontColor: '#000000' },
  { name: 'certificate_number', label: 'Certificate Number', fontSize: 12, fontColor: '#666666' },
]

export default function SimpleCertificateTemplateEditor({
  template,
  isOpen,
  onClose,
  onSave,
}: SimpleCertificateTemplateEditorProps) {
  const [templateName, setTemplateName] = useState('')
  const [secretaryName, setSecretaryName] = useState('President')
  const [chancellorName, setChancellorName] = useState('Chancellor')
  const [templateImage, setTemplateImage] = useState<string | null>(null)
  const [uploadedFile, setUploadedFile] = useState<File | null>(null)
  const [fields, setFields] = useState<DynamicField[]>([])
  const [selectedFieldId, setSelectedFieldId] = useState<string | null>(null)
  const [draggingField, setDraggingField] = useState<DraggingField | null>(null)
  const [imageSize, setImageSize] = useState({ width: 0, height: 0 })
  const [loading, setLoading] = useState(false)

  const containerRef = useRef<HTMLDivElement>(null)
  const imageRef = useRef<HTMLImageElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Load template data
  useEffect(() => {
    if (template) {
      setTemplateName(template.name)
      setSecretaryName(template.template_data?.signatures?.vice_chancellor_name || 'President')
      setChancellorName(template.template_data?.signatures?.president_name || 'Chancellor')

      if (template.template_data?.template_image) {
        setTemplateImage(template.template_data.template_image)
      }

      if (template.template_data?.dynamic_fields) {
        setFields(template.template_data.dynamic_fields)
      }
    }
  }, [template])

  // Update image size when image loads
  useEffect(() => {
    if (imageRef.current) {
      const updateSize = () => {
        if (imageRef.current) {
          setImageSize({
            width: imageRef.current.offsetWidth,
            height: imageRef.current.offsetHeight,
          })
        }
      }
      updateSize()
      window.addEventListener('resize', updateSize)
      return () => window.removeEventListener('resize', updateSize)
    }
  }, [templateImage])

  // Handle file selection
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (!file.type.startsWith('image/')) {
      toast.error('Please select an image file')
      return
    }

    if (file.size > 10 * 1024 * 1024) {
      toast.error('Image size should be less than 10MB')
      return
    }

    setUploadedFile(file)
    const reader = new FileReader()
    reader.onload = (e) => {
      setTemplateImage(e.target?.result as string)
    }
    reader.readAsDataURL(file)
  }

  // Add preset field
  const addField = (preset: (typeof PRESET_FIELDS)[0]) => {
    const newField: DynamicField = {
      id: `field-${Date.now()}`,
      name: preset.name,
      label: preset.label,
      type: 'text',
      x: 100,
      y: 100,
      width: 300,
      height: 40,
      fontSize: preset.fontSize,
      fontColor: preset.fontColor,
      fontFamily: 'League Spartan',
      textAlign: 'center',
      isBold: true,
      isItalic: false,
      isRequired: true,
    }
    setFields([...fields, newField])
    toast.success(`${preset.label} added`)
  }

  // Handle field drag start
  const handleFieldMouseDown = (e: React.MouseEvent, field: DynamicField) => {
    e.preventDefault()
    const rect = e.currentTarget.getBoundingClientRect()
    setDraggingField({
      fieldId: field.id,
      offsetX: e.clientX - rect.left,
      offsetY: e.clientY - rect.top,
    })
    setSelectedFieldId(field.id)
  }

  // Handle mouse move for dragging
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!draggingField || !containerRef.current) return

      const containerRect = containerRef.current.getBoundingClientRect()
      const newX = e.clientX - containerRect.left - draggingField.offsetX
      const newY = e.clientY - containerRect.top - draggingField.offsetY

      setFields((prevFields) =>
        prevFields.map((f) =>
          f.id === draggingField.fieldId
            ? {
                ...f,
                x: Math.max(0, Math.min(imageSize.width - f.width, newX)),
                y: Math.max(0, Math.min(imageSize.height - 30, newY)),
              }
            : f,
        ),
      )
    }

    const handleMouseUp = () => {
      if (draggingField) {
        setDraggingField(null)
      }
    }

    if (draggingField) {
      document.addEventListener('mousemove', handleMouseMove)
      document.addEventListener('mouseup', handleMouseUp)
      return () => {
        document.removeEventListener('mousemove', handleMouseMove)
        document.removeEventListener('mouseup', handleMouseUp)
      }
    }
  }, [draggingField, imageSize])

  // Delete field
  const deleteField = (fieldId: string) => {
    setFields(fields.filter((f) => f.id !== fieldId))
    if (selectedFieldId === fieldId) {
      setSelectedFieldId(null)
    }
    toast.success('Field removed')
  }

  // Update field property
  const updateField = (fieldId: string, updates: Partial<DynamicField>) => {
    setFields(fields.map((f) => (f.id === fieldId ? { ...f, ...updates } : f)))
  }

  // Save template
  const handleSave = async () => {
    if (!templateName.trim()) {
      toast.error('Please enter a template name')
      return
    }

    if (!templateImage) {
      toast.error('Please upload a certificate template image')
      return
    }

    if (fields.length === 0) {
      toast.error('Please add at least one field')
      return
    }

    setLoading(true)
    try {
      let imageUrl = templateImage

      // Upload image if new file selected
      if (uploadedFile) {
        const templateId = template?.id || `temp-${Date.now()}`
        imageUrl = await uploadTemplateImage(templateId, uploadedFile)
      }

      const templateData = {
        name: templateName,
        type: 'student' as const,
        is_active: true,
        template_data: {
          template_image: imageUrl,
          dynamic_fields: fields,
          signatures: {
            vice_chancellor_name: secretaryName,
            president_name: chancellorName,
          },
        },
      }

      let savedTemplate: CertificateTemplate
      if (template?.id) {
        savedTemplate = await updateCertificateTemplate(template.id, templateData)
        toast.success('Template updated successfully')
      } else {
        savedTemplate = await createCertificateTemplate(templateData as any)
        toast.success('Template created successfully')
      }

      onSave(savedTemplate)
      onClose()
    } catch (error) {
      console.error('Save error:', error)
      toast.error('Failed to save template')
    } finally {
      setLoading(false)
    }
  }

  const selectedField = fields.find((f) => f.id === selectedFieldId)

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-7xl max-h-[95vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-2xl font-bold text-gray-900">
            {template ? 'Edit' : 'Create'} Certificate Template
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
            disabled={loading}
          >
            <XMarkIcon className="w-6 h-6" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-auto p-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left Panel - Configuration */}
            <div className="space-y-6">
              {/* Template Name */}
              <Card>
                <CardHeader>
                  <h3 className="font-semibold">1. Template Name</h3>
                </CardHeader>
                <CardContent>
                  <input
                    type="text"
                    value={templateName}
                    onChange={(e) => setTemplateName(e.target.value)}
                    placeholder="e.g., Course Completion Certificate"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                  />
                </CardContent>
              </Card>

              {/* Upload Template Image */}
              <Card>
                <CardHeader>
                  <h3 className="font-semibold">2. Upload Template Image</h3>
                </CardHeader>
                <CardContent>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleFileSelect}
                    className="hidden"
                  />
                  {!templateImage ? (
                    <button
                      onClick={() => fileInputRef.current?.click()}
                      className="w-full border-2 border-dashed border-gray-300 rounded-lg p-8 hover:border-orange-500 transition-colors flex flex-col items-center gap-3"
                    >
                      <PhotoIcon className="w-12 h-12 text-gray-400" />
                      <span className="text-sm font-medium text-gray-600">
                        Click to upload certificate template
                      </span>
                      <span className="text-xs text-gray-500">PNG, JPG (Max 10MB)</span>
                    </button>
                  ) : (
                    <div className="space-y-2">
                      <img
                        src={templateImage}
                        alt="Template preview"
                        className="w-full rounded border"
                      />
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => fileInputRef.current?.click()}
                        className="w-full"
                      >
                        <ArrowPathIcon className="w-4 h-4 mr-2" />
                        Change Image
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Signatory Names */}
              <Card>
                <CardHeader>
                  <h3 className="font-semibold">3. Signatory Names</h3>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div>
                    <label className="text-sm font-medium text-gray-700">Secretary Name</label>
                    <input
                      type="text"
                      value={secretaryName}
                      onChange={(e) => setSecretaryName(e.target.value)}
                      className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-md"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-700">Chancellor Name</label>
                    <input
                      type="text"
                      value={chancellorName}
                      onChange={(e) => setChancellorName(e.target.value)}
                      className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-md"
                    />
                  </div>
                </CardContent>
              </Card>

              {/* Add Fields */}
              {templateImage && (
                <Card>
                  <CardHeader>
                    <h3 className="font-semibold">4. Add Fields</h3>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    {PRESET_FIELDS.map((preset) => {
                      const exists = fields.some((f) => f.name === preset.name)
                      return (
                        <Button
                          key={preset.name}
                          onClick={() => addField(preset)}
                          disabled={exists}
                          variant={exists ? 'outline' : 'primary'}
                          size="sm"
                          className="w-full justify-start"
                        >
                          {exists ? '✓' : <PlusIcon className="w-4 h-4 mr-2" />}
                          {preset.label}
                        </Button>
                      )
                    })}
                  </CardContent>
                </Card>
              )}
            </div>

            {/* Center Panel - Visual Editor */}
            <div className="lg:col-span-2 space-y-4">
              {templateImage ? (
                <>
                  <Card>
                    <CardHeader>
                      <h3 className="font-semibold">5. Position Fields (Drag & Drop)</h3>
                      <p className="text-sm text-gray-600 mt-1">
                        Drag the colored boxes to position fields on your certificate
                      </p>
                    </CardHeader>
                    <CardContent>
                      <div
                        ref={containerRef}
                        className="relative bg-gray-50 rounded-lg border-2 border-gray-300 overflow-hidden"
                        style={{ userSelect: 'none' }}
                      >
                        <img
                          ref={imageRef}
                          src={templateImage}
                          alt="Certificate Template"
                          className="w-full h-auto pointer-events-none"
                          draggable={false}
                        />

                        {/* Render draggable fields */}
                        {fields.map((field) => {
                          const isSelected = selectedFieldId === field.id
                          return (
                            <div
                              key={field.id}
                              className={`absolute cursor-move border-2 transition-all ${
                                isSelected
                                  ? 'border-blue-600 bg-blue-100 z-20 shadow-lg ring-2 ring-blue-300'
                                  : 'border-orange-400 bg-orange-50 hover:border-orange-600 z-10'
                              } bg-opacity-70 hover:bg-opacity-90 flex items-center justify-center`}
                              style={{
                                left: `${field.x}px`,
                                top: `${field.y}px`,
                                width: `${field.width}px`,
                                minHeight: '30px',
                              }}
                              onMouseDown={(e) => handleFieldMouseDown(e, field)}
                            >
                              <span className="text-xs font-semibold text-gray-800 truncate px-2">
                                {field.label}
                              </span>
                            </div>
                          )
                        })}
                      </div>
                    </CardContent>
                  </Card>

                  {/* Field Properties */}
                  {selectedField && (
                    <Card className="bg-blue-50 border-blue-200">
                      <CardHeader>
                        <div className="flex items-center justify-between">
                          <h3 className="font-semibold">Edit: {selectedField.label}</h3>
                          <Button
                            variant="danger"
                            size="sm"
                            onClick={() => deleteField(selectedField.id)}
                          >
                            <TrashIcon className="w-4 h-4 mr-1" />
                            Delete
                          </Button>
                        </div>
                      </CardHeader>
                      <CardContent className="grid grid-cols-2 gap-3">
                        <div className="col-span-2 grid grid-cols-4 gap-2">
                          <div>
                            <label className="text-xs font-medium text-gray-700">X</label>
                            <input
                              type="number"
                              value={selectedField.x}
                              onChange={(e) =>
                                updateField(selectedField.id, { x: parseInt(e.target.value) || 0 })
                              }
                              className="w-full px-2 py-1 text-sm border rounded"
                            />
                          </div>
                          <div>
                            <label className="text-xs font-medium text-gray-700">Y</label>
                            <input
                              type="number"
                              value={selectedField.y}
                              onChange={(e) =>
                                updateField(selectedField.id, { y: parseInt(e.target.value) || 0 })
                              }
                              className="w-full px-2 py-1 text-sm border rounded"
                            />
                          </div>
                          <div>
                            <label className="text-xs font-medium text-gray-700">Width</label>
                            <input
                              type="number"
                              value={selectedField.width}
                              onChange={(e) =>
                                updateField(selectedField.id, {
                                  width: parseInt(e.target.value) || 100,
                                })
                              }
                              className="w-full px-2 py-1 text-sm border rounded"
                            />
                          </div>
                          <div>
                            <label className="text-xs font-medium text-gray-700">Font Size</label>
                            <input
                              type="number"
                              value={selectedField.fontSize}
                              onChange={(e) =>
                                updateField(selectedField.id, {
                                  fontSize: parseInt(e.target.value) || 12,
                                })
                              }
                              className="w-full px-2 py-1 text-sm border rounded"
                            />
                          </div>
                        </div>
                        <div>
                          <label className="text-xs font-medium text-gray-700">Text Color</label>
                          <input
                            type="color"
                            value={selectedField.fontColor}
                            onChange={(e) =>
                              updateField(selectedField.id, { fontColor: e.target.value })
                            }
                            className="w-full h-9 border rounded cursor-pointer"
                          />
                        </div>
                        <div>
                          <label className="text-xs font-medium text-gray-700">Font Family</label>
                          <select
                            value={selectedField.fontFamily}
                            onChange={(e) =>
                              updateField(selectedField.id, { fontFamily: e.target.value })
                            }
                            className="w-full px-2 py-1 text-sm border rounded"
                          >
                            <option value="Arial">Arial</option>
                            <option value="Georgia">Georgia</option>
                            <option value="Times New Roman">Times New Roman</option>
                            <option value="Courier New">Courier New</option>
                            <option value="Verdana">Verdana</option>
                            <option value="Trebuchet MS">Trebuchet MS</option>
                            <option value="League Spartan">League Spartan</option>
                          </select>
                        </div>
                        <div>
                          <label className="text-xs font-medium text-gray-700">Align</label>
                          <select
                            value={selectedField.textAlign}
                            onChange={(e) =>
                              updateField(selectedField.id, {
                                textAlign: e.target.value as 'left' | 'center' | 'right',
                              })
                            }
                            className="w-full px-2 py-1 text-sm border rounded"
                          >
                            <option value="left">Left</option>
                            <option value="center">Center</option>
                            <option value="right">Right</option>
                          </select>
                        </div>
                        <div className="col-span-2 flex gap-4">
                          <label className="flex items-center gap-2">
                            <input
                              type="checkbox"
                              checked={selectedField.isBold}
                              onChange={(e) =>
                                updateField(selectedField.id, { isBold: e.target.checked })
                              }
                              className="rounded"
                            />
                            <span className="text-sm font-medium">Bold</span>
                          </label>
                          <label className="flex items-center gap-2">
                            <input
                              type="checkbox"
                              checked={selectedField.isItalic}
                              onChange={(e) =>
                                updateField(selectedField.id, { isItalic: e.target.checked })
                              }
                              className="rounded"
                            />
                            <span className="text-sm font-medium">Italic</span>
                          </label>
                        </div>
                      </CardContent>
                    </Card>
                  )}

                  {!selectedField && fields.length > 0 && (
                    <div className="text-center text-sm text-gray-500 py-8 bg-gray-50 rounded-lg border-2 border-dashed">
                      👆 Click on a field box to edit its properties
                    </div>
                  )}
                </>
              ) : (
                <div className="flex items-center justify-center h-96 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
                  <div className="text-center">
                    <PhotoIcon className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-600 font-medium">Upload a template image to start</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-3 p-6 border-t border-gray-200 bg-gray-50">
          <Button variant="outline" onClick={onClose} disabled={loading}>
            Cancel
          </Button>
          <Button
            onClick={handleSave}
            disabled={loading || !templateName || !templateImage || fields.length === 0}
            className="bg-orange-600 hover:bg-orange-700"
          >
            {loading ? 'Saving...' : template ? 'Update Template' : 'Create Template'}
          </Button>
        </div>
      </div>
    </div>
  )
}
