import React, { useState, useRef, useEffect } from 'react'
import { Card, CardContent, CardHeader } from '../ui/Card'
import { Button } from '../ui/Button'
import { TrashIcon, PencilIcon } from '@heroicons/react/24/outline'
import { DynamicField } from './DynamicFieldEditor'
import toast from 'react-hot-toast'

// Version: 2.0 - Added coordinate scaling and migration support

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
  const [originalImageSize, setOriginalImageSize] = useState({ width: 0, height: 0 })
  const containerRef = useRef<HTMLDivElement>(null)
  const imageRef = useRef<HTMLImageElement>(null)

  // Calculate scale factor from display to original image dimensions
  const getScaleFactor = () => {
    if (imageSize.width === 0 || originalImageSize.width === 0) return 1
    return originalImageSize.width / imageSize.width
  }

  // Convert display position to original image position (for saving)
  const displayToOriginal = (displayX: number, displayY: number) => {
    const scale = getScaleFactor()
    return {
      x: Math.round(displayX * scale),
      y: Math.round(displayY * scale),
    }
  }

  // Convert original image position to display position (for rendering)
  const originalToDisplay = (origX: number, origY: number) => {
    const scale = getScaleFactor()
    if (scale === 0) return { x: origX, y: origY }
    return {
      x: origX / scale,
      y: origY / scale,
    }
  }

  // Track if we've already migrated to prevent multiple migrations
  const [hasMigrated, setHasMigrated] = useState(false)

  // Calculate image display size and original size
  useEffect(() => {
    if (imageRef.current) {
      const updateSize = () => {
        if (imageRef.current) {
          setImageSize({
            width: imageRef.current.offsetWidth,
            height: imageRef.current.offsetHeight,
          })
          // Get original/natural dimensions
          setOriginalImageSize({
            width: imageRef.current.naturalWidth,
            height: imageRef.current.naturalHeight,
          })
        }
      }
      // Wait for image to load to get natural dimensions
      if (imageRef.current.complete) {
        updateSize()
      } else {
        imageRef.current.onload = updateSize
      }
      window.addEventListener('resize', updateSize)
      return () => window.removeEventListener('resize', updateSize)
    }
  }, [templateImage])

  // Auto-migrate old display coordinates to original coordinates
  // This runs once when we detect that positions are in display coords (small values for large images)
  useEffect(() => {
    if (hasMigrated || originalImageSize.width === 0 || imageSize.width === 0) return
    if (fields.length === 0) return

    // Detect if positions seem to be in display coordinates
    // If original image is much larger than any field position, they're likely in display coords
    const maxFieldX = Math.max(...fields.map((f) => f.x))
    const maxFieldY = Math.max(...fields.map((f) => f.y))
    
    // If max positions are less than display width (typically ~700px) and original is much larger (2000px+)
    // then we need to migrate
    const needsMigration = originalImageSize.width > 1000 && 
                          maxFieldX < imageSize.width * 1.5 && 
                          maxFieldX < originalImageSize.width * 0.5

    if (needsMigration) {
      console.log('[VisualFieldPositioner] Migrating field positions from display to original coordinates')
      console.log('  Original image:', originalImageSize.width, 'x', originalImageSize.height)
      console.log('  Display size:', imageSize.width, 'x', imageSize.height)
      console.log('  Max field position:', maxFieldX, maxFieldY)
      
      const scale = originalImageSize.width / imageSize.width
      console.log('  Scale factor:', scale)
      
      // Migrate all fields to original coordinates
      const migratedFields = fields.map((field) => ({
        ...field,
        x: Math.round(field.x * scale),
        y: Math.round(field.y * scale),
        width: Math.round((field.width || 200) * scale),
      }))
      
      console.log('  Migrated fields:', migratedFields.map(f => ({ name: f.name, x: f.x, y: f.y, width: f.width })))
      
      onFieldsChange(migratedFields)
      setHasMigrated(true)
      toast.success('Field positions updated to match template dimensions')
      
      // Also migrate signatures if present
      if (signatures && onSignaturesChange) {
        const migratedSigs: any = {}
        if (signatures.secretary) {
          migratedSigs.secretary = {
            x: Math.round(signatures.secretary.x * scale),
            y: Math.round(signatures.secretary.y * scale),
            width: Math.round(signatures.secretary.width * scale),
            height: Math.round(signatures.secretary.height * scale),
          }
        }
        if (signatures.chancellor) {
          migratedSigs.chancellor = {
            x: Math.round(signatures.chancellor.x * scale),
            y: Math.round(signatures.chancellor.y * scale),
            width: Math.round(signatures.chancellor.width * scale),
            height: Math.round(signatures.chancellor.height * scale),
          }
        }
        if (Object.keys(migratedSigs).length > 0) {
          onSignaturesChange(migratedSigs)
          console.log('  Migrated signatures:', migratedSigs)
        }
      }
    } else {
      setHasMigrated(true) // Mark as checked even if no migration needed
    }
  }, [fields, signatures, originalImageSize, imageSize, hasMigrated, onFieldsChange, onSignaturesChange])

  // Handle field drag start
  const handleFieldMouseDown = (e: React.MouseEvent, field: DynamicField) => {
    e.preventDefault()
    e.stopPropagation()
    setSelectedFieldId(field.id)
    setSelectedSignature(null)
    // Convert original coordinates to display coordinates for dragging
    const displayPos = originalToDisplay(field.x, field.y)
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
    // Convert original coordinates to display coordinates for dragging
    const displayPos = originalToDisplay(currentPos.x, currentPos.y)
    setSignatureDragging({
      type,
      startX: e.clientX,
      startY: e.clientY,
      initialX: displayPos.x,
      initialY: displayPos.y,
    })
  }

  // Handle mouse move
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (dragging && containerRef.current) {
        const deltaX = e.clientX - dragging.startX
        const deltaY = e.clientY - dragging.startY

        // Calculate new display position
        const newDisplayX = Math.max(0, Math.min(imageSize.width - 50, dragging.initialX + deltaX))
        const newDisplayY = Math.max(0, Math.min(imageSize.height - 20, dragging.initialY + deltaY))

        // Convert to original image coordinates for storage
        const origPos = displayToOriginal(newDisplayX, newDisplayY)

        const updatedFields = fields.map((f) =>
          f.id === dragging.fieldId ? { ...f, x: origPos.x, y: origPos.y } : f,
        )
        onFieldsChange(updatedFields)
      }

      if (signatureDragging && containerRef.current && onSignaturesChange) {
        const deltaX = e.clientX - signatureDragging.startX
        const deltaY = e.clientY - signatureDragging.startY

        // Calculate new display position
        const newDisplayX = Math.max(
          0,
          Math.min(imageSize.width - 100, signatureDragging.initialX + deltaX),
        )
        const newDisplayY = Math.max(
          0,
          Math.min(imageSize.height - 50, signatureDragging.initialY + deltaY),
        )

        // Convert to original image coordinates for storage
        const origPos = displayToOriginal(newDisplayX, newDisplayY)
        const scale = getScaleFactor()

        const updatedSignatures = {
          ...signatures,
          [signatureDragging.type]: {
            ...(signatures?.[signatureDragging.type] || { width: 120, height: 40 }),
            x: origPos.x,
            y: origPos.y,
            // Also scale width/height if they're in display coordinates
            width: Math.round((signatures?.[signatureDragging.type]?.width || 120) * (scale > 1 ? 1 : scale)),
            height: Math.round((signatures?.[signatureDragging.type]?.height || 40) * (scale > 1 ? 1 : scale)),
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
    originalImageSize,
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
                // Convert original coordinates to display coordinates for rendering
                const displayPos = originalToDisplay(field.x, field.y)
                const scale = getScaleFactor()
                const displayWidth = scale > 0 ? (field.width || 200) / scale : (field.width || 200)
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
              {signatures?.secretary && (() => {
                const displayPos = originalToDisplay(signatures.secretary.x, signatures.secretary.y)
                const scale = getScaleFactor()
                const displayWidth = scale > 0 ? signatures.secretary.width / scale : signatures.secretary.width
                const displayHeight = scale > 0 ? signatures.secretary.height / scale : signatures.secretary.height
                return (
                <div
                  className={`absolute cursor-move border-2 transition-all ${
                    selectedSignature === 'secretary'
                      ? 'border-green-600 bg-green-100 z-20 shadow-lg'
                      : 'border-green-400 bg-green-50 hover:border-green-600 z-10'
                  } bg-opacity-60 hover:bg-opacity-80 flex items-center justify-center`}
                  style={{
                    left: `${displayPos.x}px`,
                    top: `${displayPos.y}px`,
                    width: `${displayWidth}px`,
                    height: `${displayHeight}px`,
                  }}
                  onMouseDown={(e) =>
                    handleSignatureMouseDown(e, 'secretary', signatures.secretary!)
                  }
                >
                  <span className="text-xs font-semibold text-gray-700">Secretary</span>
                </div>
              )})()}

              {signatures?.chancellor && (() => {
                const displayPos = originalToDisplay(signatures.chancellor.x, signatures.chancellor.y)
                const scale = getScaleFactor()
                const displayWidth = scale > 0 ? signatures.chancellor.width / scale : signatures.chancellor.width
                const displayHeight = scale > 0 ? signatures.chancellor.height / scale : signatures.chancellor.height
                return (
                <div
                  className={`absolute cursor-move border-2 transition-all ${
                    selectedSignature === 'chancellor'
                      ? 'border-purple-600 bg-purple-100 z-20 shadow-lg'
                      : 'border-purple-400 bg-purple-50 hover:border-purple-600 z-10'
                  } bg-opacity-60 hover:bg-opacity-80 flex items-center justify-center`}
                  style={{
                    left: `${displayPos.x}px`,
                    top: `${displayPos.y}px`,
                    width: `${displayWidth}px`,
                    height: `${displayHeight}px`,
                  }}
                  onMouseDown={(e) =>
                    handleSignatureMouseDown(e, 'chancellor', signatures.chancellor!)
                  }
                >
                  <span className="text-xs font-semibold text-gray-700">Chancellor</span>
                </div>
              )})()}
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
