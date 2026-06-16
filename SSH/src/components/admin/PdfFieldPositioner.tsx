import React, { useState, useRef, useEffect, useCallback } from 'react'
import { Card, CardContent, CardHeader } from '../ui/Card'
import { Button } from '../ui/Button'
import { TrashIcon, PlusIcon } from '@heroicons/react/24/outline'
import { DynamicField } from './DynamicFieldEditor'
import toast from 'react-hot-toast'
import * as pdfjsLib from 'pdfjs-dist'

// Set up PDF.js worker
if (typeof window !== 'undefined') {
  const workerSrc = new URL('pdfjs-dist/build/pdf.worker.min.mjs', import.meta.url).href
  pdfjsLib.GlobalWorkerOptions.workerSrc = workerSrc
}

// Preset fields that can be added to the certificate
const PRESET_FIELDS = [
  { name: 'student_name', label: 'Student Name', fontSize: 24, fontColor: '#1a5490' },
  { name: 'student_id', label: 'Student ID', fontSize: 12, fontColor: '#666666' },
  { name: 'course_name', label: 'Course Name', fontSize: 18, fontColor: '#d97706' },
  { name: 'course_id', label: 'Course ID', fontSize: 12, fontColor: '#666666' },
  { name: 'completion_date', label: 'Completion Date', fontSize: 14, fontColor: '#000000' },
  { name: 'certificate_number', label: 'Certificate Number', fontSize: 10, fontColor: '#666666' },
  { name: 'gurukul_name', label: 'Gurukul Name', fontSize: 14, fontColor: '#000000' },
]

interface PdfFieldPositionerProps {
  pdfUrl: string
  pdfDimensions: { width: number; height: number } // In mm
  fields: DynamicField[]
  onFieldsChange: (fields: DynamicField[]) => void
  signatures?: {
    secretary?: { x: number; y: number; width: number; height: number }
    chancellor?: { x: number; y: number; width: number; height: number }
  }
  onSignaturesChange?: (signatures: any) => void
}

interface DraggingState {
  fieldId: string
  startX: number
  startY: number
  initialX: number
  initialY: number
}

interface SignatureDraggingState {
  type: 'secretary' | 'chancellor'
  startX: number
  startY: number
  initialX: number
  initialY: number
}

export default function PdfFieldPositioner({
  pdfUrl,
  pdfDimensions,
  fields,
  onFieldsChange,
  signatures,
  onSignaturesChange,
}: PdfFieldPositionerProps) {
  const [selectedFieldId, setSelectedFieldId] = useState<string | null>(null)
  const [selectedSignature, setSelectedSignature] = useState<'secretary' | 'chancellor' | null>(null)
  const [dragging, setDragging] = useState<DraggingState | null>(null)
  const [signatureDragging, setSignatureDragging] = useState<SignatureDraggingState | null>(null)
  const [displaySize, setDisplaySize] = useState({ width: 0, height: 0 })
  const [pdfLoaded, setPdfLoaded] = useState(false)
  const [pdfPreview, setPdfPreview] = useState<string | null>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const imageRef = useRef<HTMLImageElement>(null)

  // Scale factor: display pixels to PDF mm
  // PDF positions are stored in mm (same as jsPDF uses)
  const getScaleToMm = useCallback(() => {
    if (displaySize.width === 0 || pdfDimensions.width === 0) return 1
    return pdfDimensions.width / displaySize.width
  }, [displaySize.width, pdfDimensions.width])

  // Convert display position (pixels) to PDF position (mm)
  const displayToMm = useCallback((displayX: number, displayY: number) => {
    const scale = getScaleToMm()
    return {
      x: Math.round(displayX * scale * 10) / 10, // Round to 1 decimal
      y: Math.round(displayY * scale * 10) / 10,
    }
  }, [getScaleToMm])

  // Convert PDF position (mm) to display position (pixels)
  const mmToDisplay = useCallback((mmX: number, mmY: number) => {
    const scale = getScaleToMm()
    if (scale === 0) return { x: mmX, y: mmY }
    return {
      x: mmX / scale,
      y: mmY / scale,
    }
  }, [getScaleToMm])

  // Load PDF and render preview
  useEffect(() => {
    if (!pdfUrl) return

    const loadPdf = async () => {
      try {
        let arrayBuffer: ArrayBuffer

        if (pdfUrl.startsWith('data:')) {
          // Data URL - extract base64 and decode
          const base64 = pdfUrl.split(',')[1]
          const binaryString = atob(base64)
          const bytes = new Uint8Array(binaryString.length)
          for (let i = 0; i < binaryString.length; i++) {
            bytes[i] = binaryString.charCodeAt(i)
          }
          arrayBuffer = bytes.buffer
        } else {
          // Regular URL - fetch it
          const response = await fetch(pdfUrl)
          arrayBuffer = await response.arrayBuffer()
        }

        const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer })
        const pdf = await loadingTask.promise
        const page = await pdf.getPage(1)
        
        // Render at 2x scale for crisp display
        const scale = 2
        const viewport = page.getViewport({ scale })
        
        const canvas = document.createElement('canvas')
        const context = canvas.getContext('2d')
        
        if (context) {
          canvas.width = viewport.width
          canvas.height = viewport.height
          
          await page.render({
            canvasContext: context,
            viewport,
            canvas,
          }).promise
          
          setPdfPreview(canvas.toDataURL('image/png'))
          setPdfLoaded(true)
        }
      } catch (error) {
        console.error('Error loading PDF for positioning:', error)
        toast.error('Failed to load PDF template')
      }
    }

    loadPdf()
  }, [pdfUrl])

  // Update display size when image loads or window resizes
  useEffect(() => {
    if (!imageRef.current) return

    const updateSize = () => {
      if (imageRef.current) {
        setDisplaySize({
          width: imageRef.current.offsetWidth,
          height: imageRef.current.offsetHeight,
        })
      }
    }

    if (imageRef.current.complete) {
      updateSize()
    } else {
      imageRef.current.onload = updateSize
    }

    window.addEventListener('resize', updateSize)
    return () => window.removeEventListener('resize', updateSize)
  }, [pdfPreview])

  // Handle field drag start
  const handleFieldMouseDown = (e: React.MouseEvent, field: DynamicField) => {
    e.preventDefault()
    e.stopPropagation()
    setSelectedFieldId(field.id)
    setSelectedSignature(null)
    
    const displayPos = mmToDisplay(field.x, field.y)
    setDragging({
      fieldId: field.id,
      startX: e.clientX,
      startY: e.clientY,
      initialX: displayPos.x,
      initialY: displayPos.y,
    })
  }

  // Handle signature drag start
  const handleSignatureMouseDown = (
    e: React.MouseEvent,
    type: 'secretary' | 'chancellor',
    currentPos: { x: number; y: number },
  ) => {
    e.preventDefault()
    e.stopPropagation()
    setSelectedSignature(type)
    setSelectedFieldId(null)
    
    const displayPos = mmToDisplay(currentPos.x, currentPos.y)
    setSignatureDragging({
      type,
      startX: e.clientX,
      startY: e.clientY,
      initialX: displayPos.x,
      initialY: displayPos.y,
    })
  }

  // Handle mouse move for dragging
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (dragging && containerRef.current) {
        const deltaX = e.clientX - dragging.startX
        const deltaY = e.clientY - dragging.startY

        const newDisplayX = Math.max(0, Math.min(displaySize.width - 50, dragging.initialX + deltaX))
        const newDisplayY = Math.max(0, Math.min(displaySize.height - 20, dragging.initialY + deltaY))

        const mmPos = displayToMm(newDisplayX, newDisplayY)

        const updatedFields = fields.map((f) =>
          f.id === dragging.fieldId ? { ...f, x: mmPos.x, y: mmPos.y } : f,
        )
        onFieldsChange(updatedFields)
      }

      if (signatureDragging && containerRef.current && onSignaturesChange) {
        const deltaX = e.clientX - signatureDragging.startX
        const deltaY = e.clientY - signatureDragging.startY

        const newDisplayX = Math.max(0, Math.min(displaySize.width - 100, signatureDragging.initialX + deltaX))
        const newDisplayY = Math.max(0, Math.min(displaySize.height - 50, signatureDragging.initialY + deltaY))

        const mmPos = displayToMm(newDisplayX, newDisplayY)

        const updatedSignatures = {
          ...signatures,
          [signatureDragging.type]: {
            ...(signatures?.[signatureDragging.type] || { width: 40, height: 15 }),
            x: mmPos.x,
            y: mmPos.y,
          },
        }
        onSignaturesChange(updatedSignatures)
      }
    }

    const handleMouseUp = () => {
      if (dragging) {
        setDragging(null)
        toast.success('Field position updated')
      }
      if (signatureDragging) {
        setSignatureDragging(null)
        toast.success('Signature position updated')
      }
    }

    if (dragging || signatureDragging) {
      document.addEventListener('mousemove', handleMouseMove)
      document.addEventListener('mouseup', handleMouseUp)
      return () => {
        document.removeEventListener('mousemove', handleMouseMove)
        document.removeEventListener('mouseup', handleMouseUp)
      }
    }
  }, [dragging, signatureDragging, fields, signatures, displaySize, onFieldsChange, onSignaturesChange, displayToMm])

  const handleDeleteField = (fieldId: string) => {
    onFieldsChange(fields.filter((f) => f.id !== fieldId))
    setSelectedFieldId(null)
    toast.success('Field deleted')
  }

  const selectedField = fields.find((f) => f.id === selectedFieldId)

  if (!pdfLoaded) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading PDF template...</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <h3 className="text-lg font-semibold">Visual Field Positioning</h3>
        <p className="text-sm text-gray-600 mt-1">
          Drag fields to position them on the PDF template. Positions are in millimeters.
        </p>
        <div className="mt-2 text-xs text-blue-600 bg-blue-50 px-3 py-2 rounded">
          PDF Size: {pdfDimensions.width.toFixed(1)}mm × {pdfDimensions.height.toFixed(1)}mm
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Template Preview with Draggable Fields */}
          <div className="lg:col-span-2">
            <div
              ref={containerRef}
              className="relative bg-gray-100 rounded-lg border-2 border-gray-300 overflow-auto"
              style={{ maxHeight: '600px' }}
            >
              {pdfPreview && (
                <img
                  ref={imageRef}
                  src={pdfPreview}
                  alt="PDF Template"
                  className="w-full h-auto"
                  draggable={false}
                />
              )}

              {/* Render draggable fields */}
              {fields.map((field) => {
                const isSelected = selectedFieldId === field.id
                const displayPos = mmToDisplay(field.x, field.y)
                const displayWidth = (field.width || 50) / getScaleToMm()
                
                return (
                  <div
                    key={field.id}
                    className={`absolute cursor-move border-2 transition-all ${
                      isSelected
                        ? 'border-blue-600 bg-blue-100 z-20 shadow-lg'
                        : 'border-orange-400 bg-orange-50 hover:border-orange-600 z-10'
                    } bg-opacity-60 hover:bg-opacity-80`}
                    style={{
                      left: `${displayPos.x}px`,
                      top: `${displayPos.y}px`,
                      width: `${displayWidth}px`,
                      minHeight: '24px',
                    }}
                    onMouseDown={(e) => handleFieldMouseDown(e, field)}
                  >
                    <div className="px-2 py-1 text-xs font-semibold truncate">{field.label}</div>
                    {isSelected && (
                      <div className="absolute -top-6 left-0 bg-gray-800 text-white px-2 py-0.5 rounded text-xs whitespace-nowrap">
                        {field.x.toFixed(1)}mm, {field.y.toFixed(1)}mm
                      </div>
                    )}
                  </div>
                )
              })}

              {/* Render draggable signatures */}
              {signatures?.secretary && (() => {
                const displayPos = mmToDisplay(signatures.secretary.x, signatures.secretary.y)
                const displayWidth = (signatures.secretary.width || 40) / getScaleToMm()
                const displayHeight = (signatures.secretary.height || 15) / getScaleToMm()
                
                return (
                  <div
                    className={`absolute cursor-move border-2 transition-all ${
                      selectedSignature === 'secretary'
                        ? 'border-green-600 bg-green-100 z-20 shadow-lg'
                        : 'border-green-400 bg-green-50 hover:border-green-600 z-10'
                    } bg-opacity-60 flex items-center justify-center`}
                    style={{
                      left: `${displayPos.x}px`,
                      top: `${displayPos.y}px`,
                      width: `${displayWidth}px`,
                      height: `${displayHeight}px`,
                    }}
                    onMouseDown={(e) => handleSignatureMouseDown(e, 'secretary', signatures.secretary!)}
                  >
                    <span className="text-xs font-semibold text-gray-700">Secretary</span>
                  </div>
                )
              })()}

              {signatures?.chancellor && (() => {
                const displayPos = mmToDisplay(signatures.chancellor.x, signatures.chancellor.y)
                const displayWidth = (signatures.chancellor.width || 40) / getScaleToMm()
                const displayHeight = (signatures.chancellor.height || 15) / getScaleToMm()
                
                return (
                  <div
                    className={`absolute cursor-move border-2 transition-all ${
                      selectedSignature === 'chancellor'
                        ? 'border-purple-600 bg-purple-100 z-20 shadow-lg'
                        : 'border-purple-400 bg-purple-50 hover:border-purple-600 z-10'
                    } bg-opacity-60 flex items-center justify-center`}
                    style={{
                      left: `${displayPos.x}px`,
                      top: `${displayPos.y}px`,
                      width: `${displayWidth}px`,
                      height: `${displayHeight}px`,
                    }}
                    onMouseDown={(e) => handleSignatureMouseDown(e, 'chancellor', signatures.chancellor!)}
                  >
                    <span className="text-xs font-semibold text-gray-700">Chancellor</span>
                  </div>
                )
              })()}
            </div>

            <div className="mt-4 flex items-center gap-4 text-xs text-gray-600">
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 border-2 border-orange-400 bg-orange-50"></div>
                <span>Dynamic Fields</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 border-2 border-green-400 bg-green-50"></div>
                <span>Secretary Signature</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 border-2 border-purple-400 bg-purple-50"></div>
                <span>Chancellor Signature</span>
              </div>
            </div>
          </div>

          {/* Field Properties Panel */}
          <div className="space-y-4">
            {selectedField ? (
              <Card className="bg-blue-50 border-blue-200">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <h4 className="text-sm font-semibold text-gray-900">Field Properties</h4>
                    <Button
                      size="sm"
                      variant="danger"
                      onClick={() => handleDeleteField(selectedField.id)}
                    >
                      <TrashIcon className="w-4 h-4" />
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div>
                    <label className="text-xs font-medium text-gray-700">Label</label>
                    <div className="text-sm font-semibold text-gray-900">{selectedField.label}</div>
                  </div>
                  <div>
                    <label className="text-xs font-medium text-gray-700">Field Name</label>
                    <div className="text-sm text-gray-700 font-mono">{selectedField.name}</div>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="text-xs font-medium text-gray-700">X (mm)</label>
                      <input
                        type="number"
                        step="0.1"
                        value={selectedField.x}
                        onChange={(e) => {
                          const updatedFields = fields.map((f) =>
                            f.id === selectedField.id
                              ? { ...f, x: parseFloat(e.target.value) || 0 }
                              : f,
                          )
                          onFieldsChange(updatedFields)
                        }}
                        className="w-full px-2 py-1 text-sm border border-gray-300 rounded"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-medium text-gray-700">Y (mm)</label>
                      <input
                        type="number"
                        step="0.1"
                        value={selectedField.y}
                        onChange={(e) => {
                          const updatedFields = fields.map((f) =>
                            f.id === selectedField.id
                              ? { ...f, y: parseFloat(e.target.value) || 0 }
                              : f,
                          )
                          onFieldsChange(updatedFields)
                        }}
                        className="w-full px-2 py-1 text-sm border border-gray-300 rounded"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="text-xs font-medium text-gray-700">Width (mm)</label>
                    <input
                      type="number"
                      step="1"
                      value={selectedField.width || 50}
                      onChange={(e) => {
                        const updatedFields = fields.map((f) =>
                          f.id === selectedField.id
                            ? { ...f, width: parseInt(e.target.value) || 50 }
                            : f,
                        )
                        onFieldsChange(updatedFields)
                      }}
                      className="w-full px-2 py-1 text-sm border border-gray-300 rounded"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-gray-700">Font Size (pt)</label>
                    <input
                      type="number"
                      value={selectedField.fontSize || 12}
                      onChange={(e) => {
                        const updatedFields = fields.map((f) =>
                          f.id === selectedField.id
                            ? { ...f, fontSize: parseInt(e.target.value) || 12 }
                            : f,
                        )
                        onFieldsChange(updatedFields)
                      }}
                      className="w-full px-2 py-1 text-sm border border-gray-300 rounded"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-gray-700">Font Family</label>
                    <select
                      value={selectedField.fontFamily || 'helvetica'}
                      onChange={(e) => {
                        const updatedFields = fields.map((f) =>
                          f.id === selectedField.id ? { ...f, fontFamily: e.target.value } : f,
                        )
                        onFieldsChange(updatedFields)
                      }}
                      className="w-full px-2 py-1 text-sm border border-gray-300 rounded"
                    >
                      <option value="helvetica">Helvetica</option>
                      <option value="times">Times New Roman</option>
                      <option value="courier">Courier</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-xs font-medium text-gray-700">Text Color</label>
                    <input
                      type="color"
                      value={selectedField.fontColor || '#000000'}
                      onChange={(e) => {
                        const updatedFields = fields.map((f) =>
                          f.id === selectedField.id ? { ...f, fontColor: e.target.value } : f,
                        )
                        onFieldsChange(updatedFields)
                      }}
                      className="w-full h-10 border border-gray-300 rounded cursor-pointer"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-gray-700">Text Align</label>
                    <select
                      value={selectedField.textAlign || 'left'}
                      onChange={(e) => {
                        const updatedFields = fields.map((f) =>
                          f.id === selectedField.id
                            ? { ...f, textAlign: e.target.value as 'left' | 'center' | 'right' }
                            : f,
                        )
                        onFieldsChange(updatedFields)
                      }}
                      className="w-full px-2 py-1 text-sm border border-gray-300 rounded"
                    >
                      <option value="left">Left</option>
                      <option value="center">Center</option>
                      <option value="right">Right</option>
                    </select>
                  </div>
                  <div className="flex items-center gap-4">
                    <label className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={selectedField.isBold || false}
                        onChange={(e) => {
                          const updatedFields = fields.map((f) =>
                            f.id === selectedField.id ? { ...f, isBold: e.target.checked } : f,
                          )
                          onFieldsChange(updatedFields)
                        }}
                        className="rounded"
                      />
                      <span className="text-xs font-medium">Bold</span>
                    </label>
                    <label className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={selectedField.isItalic || false}
                        onChange={(e) => {
                          const updatedFields = fields.map((f) =>
                            f.id === selectedField.id ? { ...f, isItalic: e.target.checked } : f,
                          )
                          onFieldsChange(updatedFields)
                        }}
                        className="rounded"
                      />
                      <span className="text-xs font-medium">Italic</span>
                    </label>
                  </div>
                </CardContent>
              </Card>
            ) : selectedSignature ? (
              <Card className="bg-green-50 border-green-200">
                <CardHeader>
                  <h4 className="text-sm font-semibold text-gray-900">
                    {selectedSignature === 'secretary' ? 'Secretary' : 'Chancellor'} Signature
                  </h4>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="text-xs font-medium text-gray-700">X (mm)</label>
                      <input
                        type="number"
                        step="0.1"
                        value={signatures?.[selectedSignature]?.x || 0}
                        onChange={(e) => {
                          if (onSignaturesChange && signatures) {
                            const updated = {
                              ...signatures,
                              [selectedSignature]: {
                                ...signatures[selectedSignature]!,
                                x: parseFloat(e.target.value) || 0,
                              },
                            }
                            onSignaturesChange(updated)
                          }
                        }}
                        className="w-full px-2 py-1 text-sm border border-gray-300 rounded"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-medium text-gray-700">Y (mm)</label>
                      <input
                        type="number"
                        step="0.1"
                        value={signatures?.[selectedSignature]?.y || 0}
                        onChange={(e) => {
                          if (onSignaturesChange && signatures) {
                            const updated = {
                              ...signatures,
                              [selectedSignature]: {
                                ...signatures[selectedSignature]!,
                                y: parseFloat(e.target.value) || 0,
                              },
                            }
                            onSignaturesChange(updated)
                          }
                        }}
                        className="w-full px-2 py-1 text-sm border border-gray-300 rounded"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="text-xs font-medium text-gray-700">Width (mm)</label>
                      <input
                        type="number"
                        step="1"
                        value={signatures?.[selectedSignature]?.width || 40}
                        onChange={(e) => {
                          if (onSignaturesChange && signatures) {
                            const updated = {
                              ...signatures,
                              [selectedSignature]: {
                                ...signatures[selectedSignature]!,
                                width: parseInt(e.target.value) || 40,
                              },
                            }
                            onSignaturesChange(updated)
                          }
                        }}
                        className="w-full px-2 py-1 text-sm border border-gray-300 rounded"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-medium text-gray-700">Height (mm)</label>
                      <input
                        type="number"
                        step="1"
                        value={signatures?.[selectedSignature]?.height || 15}
                        onChange={(e) => {
                          if (onSignaturesChange && signatures) {
                            const updated = {
                              ...signatures,
                              [selectedSignature]: {
                                ...signatures[selectedSignature]!,
                                height: parseInt(e.target.value) || 15,
                              },
                            }
                            onSignaturesChange(updated)
                          }
                        }}
                        className="w-full px-2 py-1 text-sm border border-gray-300 rounded"
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <Card className="bg-gray-50">
                <CardContent className="py-8 text-center text-sm text-gray-500">
                  Click on a field or signature box to edit its properties
                </CardContent>
              </Card>
            )}

            <div className="text-xs text-gray-600 space-y-1 bg-blue-50 p-3 rounded border border-blue-200">
              <p className="font-semibold text-blue-900">💡 Tips:</p>
              <ul className="list-disc list-inside space-y-1">
                <li>All positions are in millimeters (mm)</li>
                <li>Drag fields to reposition them</li>
                <li>Click to select and edit properties</li>
                <li>Use number inputs for precise positioning</li>
                <li>PDF templates provide exact positioning</li>
              </ul>
            </div>

            {/* Add Fields Section */}
            <Card>
              <CardHeader>
                <h4 className="text-sm font-semibold text-gray-900">Add Dynamic Fields</h4>
                <p className="text-xs text-gray-600 mt-1">
                  Click a field to add it to the certificate
                </p>
              </CardHeader>
              <CardContent className="space-y-2">
                {PRESET_FIELDS.map((preset) => {
                  const isAdded = fields.some((f) => f.name === preset.name)
                  return (
                    <button
                      key={preset.name}
                      onClick={() => {
                        if (isAdded) {
                          toast.error(`${preset.label} is already added`)
                          return
                        }
                        // Add new field at center of PDF
                        const newField: DynamicField = {
                          id: `field-${Date.now()}`,
                          name: preset.name,
                          label: preset.label,
                          type: preset.name.includes('date') ? 'date' : 'text',
                          x: pdfDimensions.width / 2 - 30, // Center horizontally
                          y: 50 + fields.length * 15, // Stack vertically
                          width: 60,
                          height: 10,
                          fontSize: preset.fontSize,
                          fontColor: preset.fontColor,
                          fontFamily: 'helvetica',
                          textAlign: 'center',
                          isBold: preset.name === 'student_name',
                          isItalic: false,
                          isRequired: true,
                        }
                        onFieldsChange([...fields, newField])
                        setSelectedFieldId(newField.id)
                        toast.success(`${preset.label} added`)
                      }}
                      disabled={isAdded}
                      className={`w-full px-3 py-2 text-left text-sm rounded border transition-colors flex items-center justify-between ${
                        isAdded
                          ? 'bg-gray-100 border-gray-200 text-gray-400 cursor-not-allowed'
                          : 'bg-white border-gray-300 hover:bg-orange-50 hover:border-orange-300 cursor-pointer'
                      }`}
                    >
                      <span>{preset.label}</span>
                      {isAdded ? (
                        <span className="text-xs text-green-600">✓ Added</span>
                      ) : (
                        <PlusIcon className="w-4 h-4 text-gray-400" />
                      )}
                    </button>
                  )
                })}
              </CardContent>
            </Card>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
