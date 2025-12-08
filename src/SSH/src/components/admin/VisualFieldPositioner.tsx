import React, { useState, useRef, useEffect } from 'react'
import { Card, CardContent, CardHeader } from '../ui/Card'
import { Button } from '../ui/Button'
import { TrashIcon, PencilIcon } from '@heroicons/react/24/outline'
import { DynamicField } from './DynamicFieldEditor'
import toast from 'react-hot-toast'

interface VisualFieldPositionerProps {
  templateImage: string
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

export default function VisualFieldPositioner({
  templateImage,
  fields,
  onFieldsChange,
  signatures,
  onSignaturesChange,
}: VisualFieldPositionerProps) {
  const [selectedFieldId, setSelectedFieldId] = useState<string | null>(null)
  const [selectedSignature, setSelectedSignature] = useState<'secretary' | 'chancellor' | null>(
    null,
  )
  const [dragging, setDragging] = useState<DraggingState | null>(null)
  const [signatureDragging, setSignatureDragging] = useState<SignatureDraggingState | null>(null)
  const [imageSize, setImageSize] = useState({ width: 0, height: 0 })
  const containerRef = useRef<HTMLDivElement>(null)
  const imageRef = useRef<HTMLImageElement>(null)

  // Calculate image display size
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

  // Handle field drag start
  const handleFieldMouseDown = (e: React.MouseEvent, field: DynamicField) => {
    e.preventDefault()
    e.stopPropagation()
    setSelectedFieldId(field.id)
    setSelectedSignature(null)
    setDragging({
      fieldId: field.id,
      startX: e.clientX,
      startY: e.clientY,
      initialX: field.x,
      initialY: field.y,
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
    setSignatureDragging({
      type,
      startX: e.clientX,
      startY: e.clientY,
      initialX: currentPos.x,
      initialY: currentPos.y,
    })
  }

  // Handle mouse move
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (dragging && containerRef.current) {
        const deltaX = e.clientX - dragging.startX
        const deltaY = e.clientY - dragging.startY

        const newX = Math.max(0, Math.min(imageSize.width - 50, dragging.initialX + deltaX))
        const newY = Math.max(0, Math.min(imageSize.height - 20, dragging.initialY + deltaY))

        const updatedFields = fields.map((f) =>
          f.id === dragging.fieldId ? { ...f, x: Math.round(newX), y: Math.round(newY) } : f,
        )
        onFieldsChange(updatedFields)
      }

      if (signatureDragging && containerRef.current && onSignaturesChange) {
        const deltaX = e.clientX - signatureDragging.startX
        const deltaY = e.clientY - signatureDragging.startY

        const newX = Math.max(
          0,
          Math.min(imageSize.width - 100, signatureDragging.initialX + deltaX),
        )
        const newY = Math.max(
          0,
          Math.min(imageSize.height - 50, signatureDragging.initialY + deltaY),
        )

        const updatedSignatures = {
          ...signatures,
          [signatureDragging.type]: {
            ...(signatures?.[signatureDragging.type] || { width: 120, height: 40 }),
            x: Math.round(newX),
            y: Math.round(newY),
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
  }, [
    dragging,
    signatureDragging,
    fields,
    signatures,
    imageSize,
    onFieldsChange,
    onSignaturesChange,
  ])

  const handleDeleteField = (fieldId: string) => {
    onFieldsChange(fields.filter((f) => f.id !== fieldId))
    setSelectedFieldId(null)
    toast.success('Field deleted')
  }

  const selectedField = fields.find((f) => f.id === selectedFieldId)

  return (
    <Card>
      <CardHeader>
        <h3 className="text-lg font-semibold">Visual Field Positioning</h3>
        <p className="text-sm text-gray-600 mt-1">
          Drag and drop fields and signatures to position them on the certificate template
        </p>
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
              <img
                ref={imageRef}
                src={templateImage}
                alt="Certificate Template"
                className="w-full h-auto"
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
                        ? 'border-blue-600 bg-blue-100 z-20 shadow-lg'
                        : 'border-orange-400 bg-orange-50 hover:border-orange-600 z-10'
                    } bg-opacity-60 hover:bg-opacity-80`}
                    style={{
                      left: `${field.x}px`,
                      top: `${field.y}px`,
                      width: `${field.width || 200}px`,
                      minHeight: '30px',
                    }}
                    onMouseDown={(e) => handleFieldMouseDown(e, field)}
                  >
                    <div className="px-2 py-1 text-xs font-semibold truncate">{field.label}</div>
                    <div className="absolute -top-6 left-0 bg-gray-800 text-white px-2 py-0.5 rounded text-xs opacity-0 group-hover:opacity-100 whitespace-nowrap">
                      x: {field.x}, y: {field.y}
                    </div>
                  </div>
                )
              })}

              {/* Render draggable signatures */}
              {signatures?.secretary && (
                <div
                  className={`absolute cursor-move border-2 transition-all ${
                    selectedSignature === 'secretary'
                      ? 'border-green-600 bg-green-100 z-20 shadow-lg'
                      : 'border-green-400 bg-green-50 hover:border-green-600 z-10'
                  } bg-opacity-60 hover:bg-opacity-80 flex items-center justify-center`}
                  style={{
                    left: `${signatures.secretary.x}px`,
                    top: `${signatures.secretary.y}px`,
                    width: `${signatures.secretary.width}px`,
                    height: `${signatures.secretary.height}px`,
                  }}
                  onMouseDown={(e) =>
                    handleSignatureMouseDown(e, 'secretary', signatures.secretary)
                  }
                >
                  <span className="text-xs font-semibold text-gray-700">Secretary</span>
                </div>
              )}

              {signatures?.chancellor && (
                <div
                  className={`absolute cursor-move border-2 transition-all ${
                    selectedSignature === 'chancellor'
                      ? 'border-purple-600 bg-purple-100 z-20 shadow-lg'
                      : 'border-purple-400 bg-purple-50 hover:border-purple-600 z-10'
                  } bg-opacity-60 hover:bg-opacity-80 flex items-center justify-center`}
                  style={{
                    left: `${signatures.chancellor.x}px`,
                    top: `${signatures.chancellor.y}px`,
                    width: `${signatures.chancellor.width}px`,
                    height: `${signatures.chancellor.height}px`,
                  }}
                  onMouseDown={(e) =>
                    handleSignatureMouseDown(e, 'chancellor', signatures.chancellor)
                  }
                >
                  <span className="text-xs font-semibold text-gray-700">Chancellor</span>
                </div>
              )}
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
                      <label className="text-xs font-medium text-gray-700">X Position</label>
                      <input
                        type="number"
                        value={selectedField.x}
                        onChange={(e) => {
                          const updatedFields = fields.map((f) =>
                            f.id === selectedField.id
                              ? { ...f, x: parseInt(e.target.value) || 0 }
                              : f,
                          )
                          onFieldsChange(updatedFields)
                        }}
                        className="w-full px-2 py-1 text-sm border border-gray-300 rounded"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-medium text-gray-700">Y Position</label>
                      <input
                        type="number"
                        value={selectedField.y}
                        onChange={(e) => {
                          const updatedFields = fields.map((f) =>
                            f.id === selectedField.id
                              ? { ...f, y: parseInt(e.target.value) || 0 }
                              : f,
                          )
                          onFieldsChange(updatedFields)
                        }}
                        className="w-full px-2 py-1 text-sm border border-gray-300 rounded"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="text-xs font-medium text-gray-700">Width (px)</label>
                    <input
                      type="number"
                      value={selectedField.width}
                      onChange={(e) => {
                        const updatedFields = fields.map((f) =>
                          f.id === selectedField.id
                            ? { ...f, width: parseInt(e.target.value) || 100 }
                            : f,
                        )
                        onFieldsChange(updatedFields)
                      }}
                      className="w-full px-2 py-1 text-sm border border-gray-300 rounded"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-gray-700">Font Size</label>
                    <input
                      type="number"
                      value={selectedField.fontSize}
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
                      value={selectedField.fontFamily}
                      onChange={(e) => {
                        const updatedFields = fields.map((f) =>
                          f.id === selectedField.id ? { ...f, fontFamily: e.target.value } : f,
                        )
                        onFieldsChange(updatedFields)
                      }}
                      className="w-full px-2 py-1 text-sm border border-gray-300 rounded"
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
                    <label className="text-xs font-medium text-gray-700">Text Color</label>
                    <input
                      type="color"
                      value={selectedField.fontColor}
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
                      value={selectedField.textAlign}
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
                        checked={selectedField.isBold}
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
                        checked={selectedField.isItalic}
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
                      <label className="text-xs font-medium text-gray-700">X Position</label>
                      <input
                        type="number"
                        value={signatures?.[selectedSignature]?.x || 0}
                        onChange={(e) => {
                          if (onSignaturesChange && signatures) {
                            const updated = {
                              ...signatures,
                              [selectedSignature]: {
                                ...signatures[selectedSignature]!,
                                x: parseInt(e.target.value) || 0,
                              },
                            }
                            onSignaturesChange(updated)
                          }
                        }}
                        className="w-full px-2 py-1 text-sm border border-gray-300 rounded"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-medium text-gray-700">Y Position</label>
                      <input
                        type="number"
                        value={signatures?.[selectedSignature]?.y || 0}
                        onChange={(e) => {
                          if (onSignaturesChange && signatures) {
                            const updated = {
                              ...signatures,
                              [selectedSignature]: {
                                ...signatures[selectedSignature]!,
                                y: parseInt(e.target.value) || 0,
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
                      <label className="text-xs font-medium text-gray-700">Width (px)</label>
                      <input
                        type="number"
                        value={signatures?.[selectedSignature]?.width || 120}
                        onChange={(e) => {
                          if (onSignaturesChange && signatures) {
                            const updated = {
                              ...signatures,
                              [selectedSignature]: {
                                ...signatures[selectedSignature]!,
                                width: parseInt(e.target.value) || 100,
                              },
                            }
                            onSignaturesChange(updated)
                          }
                        }}
                        className="w-full px-2 py-1 text-sm border border-gray-300 rounded"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-medium text-gray-700">Height (px)</label>
                      <input
                        type="number"
                        value={signatures?.[selectedSignature]?.height || 40}
                        onChange={(e) => {
                          if (onSignaturesChange && signatures) {
                            const updated = {
                              ...signatures,
                              [selectedSignature]: {
                                ...signatures[selectedSignature]!,
                                height: parseInt(e.target.value) || 30,
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
                <li>Drag fields to reposition them</li>
                <li>Click to select and edit properties</li>
                <li>Use number inputs for precise positioning</li>
                <li>Orange boxes are dynamic fields</li>
                <li>Green/Purple boxes are signature areas</li>
              </ul>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
