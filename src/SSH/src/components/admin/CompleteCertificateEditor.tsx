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

interface CompleteCertificateEditorProps {
  template?: CertificateTemplate
  isOpen: boolean
  onClose: () => void
  onSave: (template: CertificateTemplate) => void
}

interface SignatureBox {
  x: number
  y: number
  width: number
  height: number
  image?: string
  name: string
}

interface TextBox {
  x: number
  y: number
  width: number
  height: number
  text: string
  fontSize: number
  fontColor: string
  fontFamily: string
  textAlign: 'left' | 'center' | 'right'
  isBold: boolean
  isItalic: boolean
}

const PRESET_FIELDS = [
  { name: 'student_name', label: 'Student Name', fontSize: 32, fontColor: '#1a5490' },
  { name: 'student_id', label: 'Student Number', fontSize: 14, fontColor: '#666666' },
  { name: 'course_name', label: 'Course Name', fontSize: 24, fontColor: '#d97706' },
  { name: 'course_id', label: 'Course Number', fontSize: 14, fontColor: '#666666' },
  { name: 'completion_date', label: 'Completion Date', fontSize: 16, fontColor: '#000000' },
  { name: 'certificate_number', label: 'Certificate Number', fontSize: 12, fontColor: '#666666' },
]

const FONT_FAMILIES = [
  'Arial',
  'Georgia',
  'Times New Roman',
  'Courier New',
  'Verdana',
  'Trebuchet MS',
]

export default function CompleteCertificateEditor({
  template,
  isOpen,
  onClose,
  onSave,
}: CompleteCertificateEditorProps) {
  // Basic state
  const [templateName, setTemplateName] = useState('')
  const [templateImage, setTemplateImage] = useState<string | null>(null)
  const [uploadedFile, setUploadedFile] = useState<File | null>(null)
  const [loading, setLoading] = useState(false)

  // Fields
  const [fields, setFields] = useState<DynamicField[]>([])
  const [selectedFieldId, setSelectedFieldId] = useState<string | null>(null)
  const [selectedElement, setSelectedElement] = useState<
    'secretary' | 'chancellor' | 'text' | null
  >(null)

  // Signatures
  const [secretarySignature, setSecretarySignature] = useState<SignatureBox>({
    x: 80,
    y: 500,
    width: 150,
    height: 60,
    name: 'President',
  })
  const [chancellorSignature, setChancellorSignature] = useState<SignatureBox>({
    x: 450,
    y: 500,
    width: 150,
    height: 60,
    name: 'Chancellor',
  })

  // Text message
  const [textMessage, setTextMessage] = useState<TextBox>({
    x: 50,
    y: 450,
    width: 600,
    height: 40,
    text: 'This certifies successful completion of the above course',
    fontSize: 14,
    fontColor: '#000000',
    fontFamily: 'Arial',
    textAlign: 'center',
    isBold: false,
    isItalic: false,
  })

  // Dragging state
  const [dragging, setDragging] = useState<{
    type: 'field' | 'secretary' | 'chancellor' | 'text'
    id?: string
    offsetX: number
    offsetY: number
  } | null>(null)

  const [imageSize, setImageSize] = useState({ width: 0, height: 0 })
  const containerRef = useRef<HTMLDivElement>(null)
  const imageRef = useRef<HTMLImageElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const secretarySigInputRef = useRef<HTMLInputElement>(null)
  const chancellorSigInputRef = useRef<HTMLInputElement>(null)

  // Load template data
  useEffect(() => {
    if (template) {
      setTemplateName(template.name)

      if (template.template_data?.template_image) {
        setTemplateImage(template.template_data.template_image)
      }

      if (template.template_data?.dynamic_fields) {
        setFields(template.template_data.dynamic_fields)
      }

      // Load signatures
      if (template.template_data?.signature_positions) {
        const sig = template.template_data.signature_positions
        if (sig.secretary) {
          setSecretarySignature({
            ...secretarySignature,
            ...sig.secretary,
            name: template.template_data.signatures?.vice_chancellor_name || 'President',
            image: template.template_data.signatures?.vice_chancellor_signature_data,
          })
        }
        if (sig.chancellor) {
          setChancellorSignature({
            ...chancellorSignature,
            ...sig.chancellor,
            name: template.template_data.signatures?.president_name || 'Chancellor',
            image: template.template_data.signatures?.president_signature_data,
          })
        }
      }

      // Load text message
      if (template.template_data?.text_message) {
        setTextMessage(template.template_data.text_message)
      }
    }
  }, [template])

  // Update image size
  useEffect(() => {
    const updateSize = () => {
      if (imageRef.current) {
        setImageSize({
          width: imageRef.current.offsetWidth,
          height: imageRef.current.offsetHeight,
        })
      }
    }

    // Update size when image loads
    if (imageRef.current) {
      const img = imageRef.current

      // If image is already loaded
      if (img.complete) {
        updateSize()
      }

      // Listen for load event
      img.addEventListener('load', updateSize)
      window.addEventListener('resize', updateSize)

      return () => {
        img.removeEventListener('load', updateSize)
        window.removeEventListener('resize', updateSize)
      }
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

  // Handle signature image upload
  const handleSignatureUpload = (
    e: React.ChangeEvent<HTMLInputElement>,
    type: 'secretary' | 'chancellor',
  ) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (!file.type.startsWith('image/')) {
      toast.error('Please select an image file')
      return
    }

    const reader = new FileReader()
    reader.onload = (e) => {
      const image = e.target?.result as string
      if (type === 'secretary') {
        setSecretarySignature({ ...secretarySignature, image })
      } else {
        setChancellorSignature({ ...chancellorSignature, image })
      }
      toast.success(`${type === 'secretary' ? 'Secretary' : 'Chancellor'} signature uploaded`)
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
      fontFamily: 'Arial',
      textAlign: 'center',
      isBold: true,
      isItalic: false,
      isRequired: true,
    }
    setFields([...fields, newField])
    toast.success(`${preset.label} added`)
  }

  // Handle drag start
  const handleDragStart = (
    e: React.MouseEvent,
    type: 'field' | 'secretary' | 'chancellor' | 'text',
    id?: string,
  ) => {
    e.preventDefault()
    e.stopPropagation()
    const rect = e.currentTarget.getBoundingClientRect()
    const containerRect = containerRef.current?.getBoundingClientRect()

    if (!containerRect) {
      console.warn('Container not found for drag start')
      return
    }

    // Calculate offset from element's position on the template
    setDragging({
      type,
      id,
      offsetX: e.clientX - rect.left,
      offsetY: e.clientY - rect.top,
    })

    if (type === 'field' && id) {
      setSelectedFieldId(id)
      setSelectedElement(null)
    } else if (type === 'secretary') {
      setSelectedElement('secretary')
      setSelectedFieldId(null)
    } else if (type === 'chancellor') {
      setSelectedElement('chancellor')
      setSelectedFieldId(null)
    } else if (type === 'text') {
      setSelectedElement('text')
      setSelectedFieldId(null)
    }
  }

  // Handle click to select without dragging
  const handleElementClick = (e: React.MouseEvent, type: 'secretary' | 'chancellor' | 'text') => {
    e.stopPropagation()
    setSelectedElement(type)
    setSelectedFieldId(null)
  }

  // Handle mouse move for dragging
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!dragging || !containerRef.current) return

      const containerRect = containerRef.current.getBoundingClientRect()
      const newX = e.clientX - containerRect.left - dragging.offsetX
      const newY = e.clientY - containerRect.top - dragging.offsetY

      if (dragging.type === 'field' && dragging.id) {
        setFields((prev) =>
          prev.map((f) =>
            f.id === dragging.id
              ? {
                  ...f,
                  x: Math.max(0, Math.min(imageSize.width - f.width, newX)),
                  y: Math.max(0, Math.min(imageSize.height - 30, newY)),
                }
              : f,
          ),
        )
      } else if (dragging.type === 'secretary') {
        setSecretarySignature((prev) => ({
          ...prev,
          x: Math.max(0, Math.min(imageSize.width - prev.width, newX)),
          y: Math.max(0, Math.min(imageSize.height - prev.height, newY)),
        }))
      } else if (dragging.type === 'chancellor') {
        setChancellorSignature((prev) => ({
          ...prev,
          x: Math.max(0, Math.min(imageSize.width - prev.width, newX)),
          y: Math.max(0, Math.min(imageSize.height - prev.height, newY)),
        }))
      } else if (dragging.type === 'text') {
        setTextMessage((prev) => ({
          ...prev,
          x: Math.max(0, Math.min(imageSize.width - prev.width, newX)),
          y: Math.max(0, Math.min(imageSize.height - prev.height, newY)),
        }))
      }
    }

    const handleMouseUp = () => {
      setDragging(null)
    }

    if (dragging) {
      document.addEventListener('mousemove', handleMouseMove)
      document.addEventListener('mouseup', handleMouseUp)
      return () => {
        document.removeEventListener('mousemove', handleMouseMove)
        document.removeEventListener('mouseup', handleMouseUp)
      }
    }
  }, [dragging, imageSize])

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
            vice_chancellor_name: secretarySignature.name,
            vice_chancellor_signature_data: secretarySignature.image,
            president_name: chancellorSignature.name,
            president_signature_data: chancellorSignature.image,
          },
          signature_positions: {
            secretary: {
              x: secretarySignature.x,
              y: secretarySignature.y,
              width: secretarySignature.width,
              height: secretarySignature.height,
            },
            chancellor: {
              x: chancellorSignature.x,
              y: chancellorSignature.y,
              width: chancellorSignature.width,
              height: chancellorSignature.height,
            },
          },
          text_message: textMessage,
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
    <div className="fixed inset-0 backdrop-blur-sm bg-white/30 z-50 flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-lg shadow-2xl border border-gray-300 w-full max-w-7xl my-8">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b bg-gradient-to-r from-blue-500 to-purple-600">
          <h2 className="text-2xl font-bold text-white">
            {template ? 'Edit' : 'Create'} Certificate Template
          </h2>
          <button onClick={onClose} className="text-white/80 hover:text-white" disabled={loading}>
            <XMarkIcon className="w-6 h-6" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 max-h-[calc(100vh-200px)] overflow-y-auto">
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            {/* Left Panel - Configuration */}
            <div className="space-y-4">
              {/* Template Name */}
              <Card>
                <CardHeader>
                  <h3 className="font-semibold text-sm">1. Template Name</h3>
                </CardHeader>
                <CardContent>
                  <input
                    type="text"
                    value={templateName}
                    onChange={(e) => setTemplateName(e.target.value)}
                    placeholder="Certificate name"
                    className="w-full px-3 py-2 text-sm border rounded-md focus:ring-2 focus:ring-orange-500"
                  />
                </CardContent>
              </Card>

              {/* Upload Template */}
              <Card>
                <CardHeader>
                  <h3 className="font-semibold text-sm">2. Upload Template</h3>
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
                      className="w-full border-2 border-dashed rounded-lg p-4 hover:border-orange-500 flex flex-col items-center gap-2"
                    >
                      <PhotoIcon className="w-8 h-8 text-gray-400" />
                      <span className="text-xs text-gray-600">Upload Image</span>
                    </button>
                  ) : (
                    <div className="space-y-2">
                      <img src={templateImage} alt="Template" className="w-full rounded border" />
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => fileInputRef.current?.click()}
                        className="w-full text-xs"
                      >
                        Change
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* President Signature */}
              <Card>
                <CardHeader>
                  <h3 className="font-semibold text-sm">3. President</h3>
                </CardHeader>
                <CardContent className="space-y-2">
                  <div>
                    <label className="text-xs font-medium">Name</label>
                    <input
                      type="text"
                      value={secretarySignature.name}
                      onChange={(e) =>
                        setSecretarySignature({ ...secretarySignature, name: e.target.value })
                      }
                      className="w-full mt-1 px-2 py-1 text-sm border rounded"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-medium">Signature Image</label>
                    <input
                      ref={secretarySigInputRef}
                      type="file"
                      accept="image/*"
                      onChange={(e) => handleSignatureUpload(e, 'secretary')}
                      className="hidden"
                    />
                    {!secretarySignature.image ? (
                      <button
                        onClick={() => secretarySigInputRef.current?.click()}
                        className="w-full mt-1 border border-dashed rounded p-2 text-xs hover:border-green-500"
                      >
                        Upload Signature
                      </button>
                    ) : (
                      <div className="mt-1">
                        <img
                          src={secretarySignature.image}
                          alt="President signature"
                          className="w-full h-12 object-contain border rounded"
                        />
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => secretarySigInputRef.current?.click()}
                          className="w-full mt-1 text-xs"
                        >
                          Change
                        </Button>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Chancellor Signature */}
              <Card>
                <CardHeader>
                  <h3 className="font-semibold text-sm">4. Chancellor</h3>
                </CardHeader>
                <CardContent className="space-y-2">
                  <div>
                    <label className="text-xs font-medium">Name</label>
                    <input
                      type="text"
                      value={chancellorSignature.name}
                      onChange={(e) =>
                        setChancellorSignature({ ...chancellorSignature, name: e.target.value })
                      }
                      className="w-full mt-1 px-2 py-1 text-sm border rounded"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-medium">Signature Image</label>
                    <input
                      ref={chancellorSigInputRef}
                      type="file"
                      accept="image/*"
                      onChange={(e) => handleSignatureUpload(e, 'chancellor')}
                      className="hidden"
                    />
                    {!chancellorSignature.image ? (
                      <button
                        onClick={() => chancellorSigInputRef.current?.click()}
                        className="w-full mt-1 border border-dashed rounded p-2 text-xs hover:border-purple-500"
                      >
                        Upload Signature
                      </button>
                    ) : (
                      <div className="mt-1">
                        <img
                          src={chancellorSignature.image}
                          alt="Chancellor signature"
                          className="w-full h-12 object-contain border rounded"
                        />
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => chancellorSigInputRef.current?.click()}
                          className="w-full mt-1 text-xs"
                        >
                          Change
                        </Button>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Text Message */}
              <Card>
                <CardHeader>
                  <h3 className="font-semibold text-sm">5. Text Message</h3>
                </CardHeader>
                <CardContent>
                  <textarea
                    value={textMessage.text}
                    onChange={(e) => setTextMessage({ ...textMessage, text: e.target.value })}
                    rows={3}
                    className="w-full px-2 py-1 text-xs border rounded"
                    placeholder="Custom message on certificate"
                  />
                </CardContent>
              </Card>

              {/* Add Fields */}
              {templateImage && (
                <Card>
                  <CardHeader>
                    <h3 className="font-semibold text-sm">6. Add Fields</h3>
                  </CardHeader>
                  <CardContent className="space-y-1">
                    {PRESET_FIELDS.map((preset) => {
                      const exists = fields.some((f) => f.name === preset.name)
                      return (
                        <Button
                          key={preset.name}
                          onClick={() => addField(preset)}
                          disabled={exists}
                          size="sm"
                          className="w-full text-xs justify-start"
                          variant={exists ? 'outline' : 'primary'}
                        >
                          {exists ? '✓' : '+'} {preset.label}
                        </Button>
                      )
                    })}
                  </CardContent>
                </Card>
              )}
            </div>

            {/* Center/Right Panel - Visual Editor */}
            <div className="lg:col-span-3 space-y-4">
              {templateImage ? (
                <>
                  <Card>
                    <CardHeader>
                      <h3 className="font-semibold">7. Position Elements (Drag & Drop)</h3>
                      <div className="flex gap-3 text-xs mt-2">
                        <span className="flex items-center gap-1">
                          <div className="w-3 h-3 bg-orange-400 border border-orange-600"></div>
                          Fields
                        </span>
                        <span className="flex items-center gap-1">
                          <div className="w-3 h-3 bg-green-400 border border-green-600"></div>
                          President
                        </span>
                        <span className="flex items-center gap-1">
                          <div className="w-3 h-3 bg-purple-400 border border-purple-600"></div>
                          Chancellor
                        </span>
                        <span className="flex items-center gap-1">
                          <div className="w-3 h-3 bg-blue-400 border border-blue-600"></div>
                          Text Message
                        </span>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div
                        ref={containerRef}
                        className="relative bg-gray-50 rounded-lg border-2 overflow-hidden"
                        style={{
                          userSelect: 'none',
                          cursor: dragging ? 'grabbing' : 'default',
                        }}
                      >
                        <img
                          ref={imageRef}
                          src={templateImage}
                          alt="Certificate"
                          className="w-full h-auto pointer-events-none"
                          draggable={false}
                        />

                        {/* Fields */}
                        {fields.map((field) => (
                          <div
                            key={field.id}
                            className={`absolute cursor-move border-2 transition-all ${
                              selectedFieldId === field.id
                                ? 'border-blue-600 bg-blue-100 z-20 shadow-lg'
                                : 'border-orange-400 bg-orange-50 hover:border-orange-600 z-10'
                            } bg-opacity-70 flex items-center justify-center`}
                            style={{
                              left: `${field.x}px`,
                              top: `${field.y}px`,
                              width: `${field.width}px`,
                              minHeight: '30px',
                            }}
                            onMouseDown={(e) => handleDragStart(e, 'field', field.id)}
                          >
                            <span className="text-xs font-semibold truncate px-2">
                              {field.label}
                            </span>
                          </div>
                        ))}

                        {/* President Signature */}
                        <div
                          className={`absolute cursor-move border-2 transition-all ${
                            selectedElement === 'secretary'
                              ? 'border-green-800 bg-green-200 z-20 shadow-lg'
                              : 'border-green-600 bg-green-100 hover:border-green-700 z-10'
                          } bg-opacity-70 flex flex-col items-center justify-center p-1`}
                          style={{
                            left: `${secretarySignature.x}px`,
                            top: `${secretarySignature.y}px`,
                            width: `${secretarySignature.width}px`,
                            height: `${secretarySignature.height}px`,
                          }}
                          onMouseDown={(e) => handleDragStart(e, 'secretary')}
                          onClick={(e) => handleElementClick(e, 'secretary')}
                        >
                          {secretarySignature.image ? (
                            <img
                              src={secretarySignature.image}
                              alt="President"
                              className="max-w-full max-h-full object-contain"
                            />
                          ) : (
                            <span className="text-[10px] font-semibold text-center">President</span>
                          )}
                        </div>

                        {/* Chancellor Signature */}
                        <div
                          className={`absolute cursor-move border-2 transition-all ${
                            selectedElement === 'chancellor'
                              ? 'border-purple-800 bg-purple-200 z-20 shadow-lg'
                              : 'border-purple-600 bg-purple-100 hover:border-purple-700 z-10'
                          } bg-opacity-70 flex flex-col items-center justify-center p-1`}
                          style={{
                            left: `${chancellorSignature.x}px`,
                            top: `${chancellorSignature.y}px`,
                            width: `${chancellorSignature.width}px`,
                            height: `${chancellorSignature.height}px`,
                          }}
                          onMouseDown={(e) => handleDragStart(e, 'chancellor')}
                          onClick={(e) => handleElementClick(e, 'chancellor')}
                        >
                          {chancellorSignature.image ? (
                            <img
                              src={chancellorSignature.image}
                              alt="Chancellor"
                              className="max-w-full max-h-full object-contain"
                            />
                          ) : (
                            <span className="text-[10px] font-semibold text-center">
                              Chancellor
                            </span>
                          )}
                        </div>

                        {/* Text Message */}
                        <div
                          className={`absolute cursor-move border-2 transition-all ${
                            selectedElement === 'text'
                              ? 'border-blue-800 bg-blue-200 z-20 shadow-lg'
                              : 'border-blue-600 bg-blue-100 hover:border-blue-700 z-10'
                          } bg-opacity-70 flex items-center justify-center p-2`}
                          style={{
                            left: `${textMessage.x}px`,
                            top: `${textMessage.y}px`,
                            width: `${textMessage.width}px`,
                            minHeight: `${textMessage.height}px`,
                          }}
                          onMouseDown={(e) => handleDragStart(e, 'text')}
                          onClick={(e) => handleElementClick(e, 'text')}
                        >
                          <span className="text-[10px] text-center line-clamp-2">
                            {textMessage.text || 'Text Message'}
                          </span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Field Properties */}
                  {selectedField && (
                    <Card className="bg-blue-50">
                      <CardHeader>
                        <div className="flex items-center justify-between">
                          <h3 className="font-semibold text-sm">Edit: {selectedField.label}</h3>
                          <Button
                            variant="danger"
                            size="sm"
                            onClick={() => deleteField(selectedField.id)}
                          >
                            <TrashIcon className="w-4 h-4" />
                          </Button>
                        </div>
                      </CardHeader>
                      <CardContent className="grid grid-cols-4 gap-2 text-xs">
                        <div>
                          <label className="font-medium">X</label>
                          <input
                            type="number"
                            value={selectedField.x}
                            onChange={(e) =>
                              updateField(selectedField.id, { x: parseInt(e.target.value) || 0 })
                            }
                            className="w-full px-2 py-1 border rounded"
                          />
                        </div>
                        <div>
                          <label className="font-medium">Y</label>
                          <input
                            type="number"
                            value={selectedField.y}
                            onChange={(e) =>
                              updateField(selectedField.id, { y: parseInt(e.target.value) || 0 })
                            }
                            className="w-full px-2 py-1 border rounded"
                          />
                        </div>
                        <div>
                          <label className="font-medium">Width</label>
                          <input
                            type="number"
                            value={selectedField.width}
                            onChange={(e) =>
                              updateField(selectedField.id, {
                                width: parseInt(e.target.value) || 100,
                              })
                            }
                            className="w-full px-2 py-1 border rounded"
                          />
                        </div>
                        <div>
                          <label className="font-medium">Font Size</label>
                          <input
                            type="number"
                            value={selectedField.fontSize}
                            onChange={(e) =>
                              updateField(selectedField.id, {
                                fontSize: parseInt(e.target.value) || 12,
                              })
                            }
                            className="w-full px-2 py-1 border rounded"
                          />
                        </div>
                        <div>
                          <label className="font-medium">Color</label>
                          <input
                            type="color"
                            value={selectedField.fontColor}
                            onChange={(e) =>
                              updateField(selectedField.id, { fontColor: e.target.value })
                            }
                            className="w-full h-8 border rounded"
                          />
                        </div>
                        <div className="col-span-2">
                          <label className="font-medium">Font Family</label>
                          <select
                            value={selectedField.fontFamily}
                            onChange={(e) =>
                              updateField(selectedField.id, { fontFamily: e.target.value })
                            }
                            className="w-full px-2 py-1 border rounded"
                          >
                            {FONT_FAMILIES.map((family) => (
                              <option key={family} value={family}>
                                {family}
                              </option>
                            ))}
                          </select>
                        </div>
                        <div className="col-span-2">
                          <label className="font-medium">Align</label>
                          <select
                            value={selectedField.textAlign}
                            onChange={(e) =>
                              updateField(selectedField.id, {
                                textAlign: e.target.value as any,
                              })
                            }
                            className="w-full px-2 py-1 border rounded"
                          >
                            <option value="left">Left</option>
                            <option value="center">Center</option>
                            <option value="right">Right</option>
                          </select>
                        </div>
                        <div className="col-span-2 flex gap-2 items-center pt-4">
                          <label className="flex items-center gap-1">
                            <input
                              type="checkbox"
                              checked={selectedField.isBold}
                              onChange={(e) =>
                                updateField(selectedField.id, { isBold: e.target.checked })
                              }
                            />
                            Bold
                          </label>
                          <label className="flex items-center gap-1">
                            <input
                              type="checkbox"
                              checked={selectedField.isItalic}
                              onChange={(e) =>
                                updateField(selectedField.id, { isItalic: e.target.checked })
                              }
                            />
                            Italic
                          </label>
                        </div>
                      </CardContent>
                    </Card>
                  )}

                  {/* President Properties */}
                  {selectedElement === 'secretary' && (
                    <Card className="bg-green-50">
                      <CardHeader>
                        <h3 className="font-semibold text-sm">Edit: President Signature</h3>
                      </CardHeader>
                      <CardContent className="grid grid-cols-4 gap-2 text-xs">
                        <div>
                          <label className="font-medium">X</label>
                          <input
                            type="number"
                            value={secretarySignature.x}
                            onChange={(e) =>
                              setSecretarySignature({
                                ...secretarySignature,
                                x: parseInt(e.target.value) || 0,
                              })
                            }
                            className="w-full px-2 py-1 border rounded"
                          />
                        </div>
                        <div>
                          <label className="font-medium">Y</label>
                          <input
                            type="number"
                            value={secretarySignature.y}
                            onChange={(e) =>
                              setSecretarySignature({
                                ...secretarySignature,
                                y: parseInt(e.target.value) || 0,
                              })
                            }
                            className="w-full px-2 py-1 border rounded"
                          />
                        </div>
                        <div>
                          <label className="font-medium">Width</label>
                          <input
                            type="number"
                            value={secretarySignature.width}
                            onChange={(e) =>
                              setSecretarySignature({
                                ...secretarySignature,
                                width: parseInt(e.target.value) || 100,
                              })
                            }
                            className="w-full px-2 py-1 border rounded"
                          />
                        </div>
                        <div>
                          <label className="font-medium">Height</label>
                          <input
                            type="number"
                            value={secretarySignature.height}
                            onChange={(e) =>
                              setSecretarySignature({
                                ...secretarySignature,
                                height: parseInt(e.target.value) || 40,
                              })
                            }
                            className="w-full px-2 py-1 border rounded"
                          />
                        </div>
                      </CardContent>
                    </Card>
                  )}

                  {/* Chancellor Properties */}
                  {selectedElement === 'chancellor' && (
                    <Card className="bg-purple-50">
                      <CardHeader>
                        <h3 className="font-semibold text-sm">Edit: Chancellor Signature</h3>
                      </CardHeader>
                      <CardContent className="grid grid-cols-4 gap-2 text-xs">
                        <div>
                          <label className="font-medium">X</label>
                          <input
                            type="number"
                            value={chancellorSignature.x}
                            onChange={(e) =>
                              setChancellorSignature({
                                ...chancellorSignature,
                                x: parseInt(e.target.value) || 0,
                              })
                            }
                            className="w-full px-2 py-1 border rounded"
                          />
                        </div>
                        <div>
                          <label className="font-medium">Y</label>
                          <input
                            type="number"
                            value={chancellorSignature.y}
                            onChange={(e) =>
                              setChancellorSignature({
                                ...chancellorSignature,
                                y: parseInt(e.target.value) || 0,
                              })
                            }
                            className="w-full px-2 py-1 border rounded"
                          />
                        </div>
                        <div>
                          <label className="font-medium">Width</label>
                          <input
                            type="number"
                            value={chancellorSignature.width}
                            onChange={(e) =>
                              setChancellorSignature({
                                ...chancellorSignature,
                                width: parseInt(e.target.value) || 100,
                              })
                            }
                            className="w-full px-2 py-1 border rounded"
                          />
                        </div>
                        <div>
                          <label className="font-medium">Height</label>
                          <input
                            type="number"
                            value={chancellorSignature.height}
                            onChange={(e) =>
                              setChancellorSignature({
                                ...chancellorSignature,
                                height: parseInt(e.target.value) || 40,
                              })
                            }
                            className="w-full px-2 py-1 border rounded"
                          />
                        </div>
                      </CardContent>
                    </Card>
                  )}

                  {/* Text Message Properties */}
                  {selectedElement === 'text' && (
                    <Card className="bg-blue-50">
                      <CardHeader>
                        <h3 className="font-semibold text-sm">Edit: Text Message</h3>
                      </CardHeader>
                      <CardContent className="grid grid-cols-4 gap-2 text-xs">
                        <div>
                          <label className="font-medium">X</label>
                          <input
                            type="number"
                            value={textMessage.x}
                            onChange={(e) =>
                              setTextMessage({
                                ...textMessage,
                                x: parseInt(e.target.value) || 0,
                              })
                            }
                            className="w-full px-2 py-1 border rounded"
                          />
                        </div>
                        <div>
                          <label className="font-medium">Y</label>
                          <input
                            type="number"
                            value={textMessage.y}
                            onChange={(e) =>
                              setTextMessage({
                                ...textMessage,
                                y: parseInt(e.target.value) || 0,
                              })
                            }
                            className="w-full px-2 py-1 border rounded"
                          />
                        </div>
                        <div>
                          <label className="font-medium">Width</label>
                          <input
                            type="number"
                            value={textMessage.width}
                            onChange={(e) =>
                              setTextMessage({
                                ...textMessage,
                                width: parseInt(e.target.value) || 100,
                              })
                            }
                            className="w-full px-2 py-1 border rounded"
                          />
                        </div>
                        <div>
                          <label className="font-medium">Height</label>
                          <input
                            type="number"
                            value={textMessage.height}
                            onChange={(e) =>
                              setTextMessage({
                                ...textMessage,
                                height: parseInt(e.target.value) || 40,
                              })
                            }
                            className="w-full px-2 py-1 border rounded"
                          />
                        </div>
                        <div>
                          <label className="font-medium">Font Size</label>
                          <input
                            type="number"
                            value={textMessage.fontSize}
                            onChange={(e) =>
                              setTextMessage({
                                ...textMessage,
                                fontSize: parseInt(e.target.value) || 12,
                              })
                            }
                            className="w-full px-2 py-1 border rounded"
                          />
                        </div>
                        <div>
                          <label className="font-medium">Font Color</label>
                          <input
                            type="color"
                            value={textMessage.fontColor}
                            onChange={(e) =>
                              setTextMessage({
                                ...textMessage,
                                fontColor: e.target.value,
                              })
                            }
                            className="w-full h-8 border rounded"
                          />
                        </div>
                        <div className="col-span-2">
                          <label className="font-medium">Font Family</label>
                          <select
                            value={textMessage.fontFamily}
                            onChange={(e) =>
                              setTextMessage({
                                ...textMessage,
                                fontFamily: e.target.value,
                              })
                            }
                            className="w-full px-2 py-1 border rounded"
                          >
                            {FONT_FAMILIES.map((family) => (
                              <option key={family} value={family}>
                                {family}
                              </option>
                            ))}
                          </select>
                        </div>
                        <div className="col-span-2">
                          <label className="font-medium">Text Align</label>
                          <select
                            value={textMessage.textAlign}
                            onChange={(e) =>
                              setTextMessage({
                                ...textMessage,
                                textAlign: e.target.value as 'left' | 'center' | 'right',
                              })
                            }
                            className="w-full px-2 py-1 border rounded"
                          >
                            <option value="left">Left</option>
                            <option value="center">Center</option>
                            <option value="right">Right</option>
                          </select>
                        </div>
                        <div className="col-span-4 flex items-center gap-4 pt-2">
                          <label className="flex items-center gap-2 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={textMessage.isBold}
                              onChange={(e) =>
                                setTextMessage({
                                  ...textMessage,
                                  isBold: e.target.checked,
                                })
                              }
                              className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                            />
                            <span className="font-bold">Bold</span>
                          </label>
                          <label className="flex items-center gap-2 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={textMessage.isItalic}
                              onChange={(e) =>
                                setTextMessage({
                                  ...textMessage,
                                  isItalic: e.target.checked,
                                })
                              }
                              className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                            />
                            <span className="italic">Italic</span>
                          </label>
                        </div>
                      </CardContent>
                    </Card>
                  )}
                </>
              ) : (
                <div className="flex items-center justify-center h-96 bg-gray-50 rounded-lg border-2 border-dashed">
                  <div className="text-center">
                    <PhotoIcon className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-600">Upload a template image to start</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-3 p-6 border-t bg-gray-50">
          <Button variant="outline" onClick={onClose} disabled={loading}>
            Cancel
          </Button>
          <Button
            onClick={handleSave}
            disabled={loading || !templateName || !templateImage || fields.length === 0}
            className="bg-orange-600 hover:bg-orange-700"
          >
            {loading ? 'Saving...' : template ? 'Update' : 'Create'} Template
          </Button>
        </div>
      </div>
    </div>
  )
}
