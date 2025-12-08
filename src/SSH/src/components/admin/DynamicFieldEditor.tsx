import React, { useState } from 'react'
import { Button } from '../ui/Button'
import { Card, CardContent } from '../ui/Card'
import { PlusIcon, TrashIcon, ArrowUpIcon, ArrowDownIcon } from '@heroicons/react/24/outline'
import toast from 'react-hot-toast'

export interface DynamicField {
  id: string
  name: string
  label: string
  type: 'text' | 'date' | 'number' | 'select' | 'image'
  x: number // Position from left (percentage or pixels)
  y: number // Position from top (percentage or pixels)
  width: number
  height: number
  fontSize: number
  fontColor: string
  fontFamily: string
  textAlign: 'left' | 'center' | 'right'
  isBold: boolean
  isItalic: boolean
  isRequired: boolean
  options?: string[] // For select type
}

interface DynamicFieldEditorProps {
  fields: DynamicField[]
  onFieldsChange: (fields: DynamicField[]) => void
  templateImage?: string
  disabled?: boolean
}

const FONT_FAMILIES = [
  'Arial',
  'Georgia',
  'Times New Roman',
  'Courier New',
  'Verdana',
  'Trebuchet MS',
  'League Spartan',
]

export default function DynamicFieldEditor({
  fields,
  onFieldsChange,
  templateImage,
  disabled,
}: DynamicFieldEditorProps) {
  const [showAddField, setShowAddField] = useState(false)
  const [editingFieldId, setEditingFieldId] = useState<string | null>(null)
  const [newField, setNewField] = useState<Partial<DynamicField>>({
    type: 'text',
    fontSize: 35,
    fontColor: '#000000',
    fontFamily: 'League Spartan',
    textAlign: 'left',
    isBold: false,
    isItalic: false,
    isRequired: false,
  })

  const generateId = () => `field-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`

  const handleAddField = () => {
    if (!newField.name?.trim()) {
      toast.error('Please enter a field name')
      return
    }
    if (!newField.label?.trim()) {
      toast.error('Please enter a field label')
      return
    }

    const field: DynamicField = {
      id: generateId(),
      name: newField.name.trim(),
      label: newField.label.trim(),
      type: (newField.type || 'text') as DynamicField['type'],
      x: newField.x || 50,
      y: newField.y || 50,
      width: newField.width || 200,
      height: newField.height || 40,
      fontSize: newField.fontSize || 35,
      fontColor: newField.fontColor || '#000000',
      fontFamily: newField.fontFamily || 'League Spartan',
      textAlign: newField.textAlign || 'left',
      isBold: newField.isBold || false,
      isItalic: newField.isItalic || false,
      isRequired: newField.isRequired || false,
      options: newField.options || [],
    }

    onFieldsChange([...fields, field])
    setNewField({
      type: 'text',
      fontSize: 35,
      fontColor: '#000000',
      fontFamily: 'League Spartan',
      textAlign: 'left',
      isBold: false,
      isItalic: false,
      isRequired: false,
    })
    setShowAddField(false)
    toast.success('Field added successfully')
  }

  const handleUpdateField = (id: string, updates: Partial<DynamicField>) => {
    const updated = fields.map((f) => (f.id === id ? { ...f, ...updates } : f))
    onFieldsChange(updated)
  }

  const handleDeleteField = (id: string) => {
    onFieldsChange(fields.filter((f) => f.id !== id))
    toast.success('Field deleted')
  }

  const handleMoveField = (id: string, direction: 'up' | 'down') => {
    const index = fields.findIndex((f) => f.id === id)
    if (direction === 'up' && index > 0) {
      const updated = [...fields]
      ;[updated[index - 1], updated[index]] = [updated[index], updated[index - 1]]
      onFieldsChange(updated)
    } else if (direction === 'down' && index < fields.length - 1) {
      const updated = [...fields]
      ;[updated[index], updated[index + 1]] = [updated[index + 1], updated[index]]
      onFieldsChange(updated)
    }
  }

  return (
    <div className="space-y-4">
      {/* Template Preview */}
      {templateImage && (
        <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
          <h3 className="text-sm font-medium text-gray-900 mb-3">Template Preview</h3>
          <div className="relative bg-white rounded border border-gray-300 overflow-hidden">
            <img src={templateImage} alt="Template" className="w-full h-auto" />
            {/* Overlay field positions */}
            {fields.map((field) => (
              <div
                key={field.id}
                className="absolute border-2 border-blue-500 bg-blue-50 bg-opacity-30 flex items-center justify-center text-xs font-medium text-blue-700"
                style={{
                  left: `${field.x}px`,
                  top: `${field.y}px`,
                  width: `${field.width}px`,
                  height: `${field.height}px`,
                }}
              >
                {field.label}
              </div>
            ))}
          </div>
          <p className="text-xs text-gray-500 mt-2">
            Blue boxes show where fields will be positioned on the certificate
          </p>
        </div>
      )}

      {/* Fields List */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-medium text-gray-900">Dynamic Fields ({fields.length})</h3>
          <Button
            onClick={() => setShowAddField(!showAddField)}
            size="sm"
            variant={showAddField ? 'primary' : 'outline'}
            disabled={disabled}
          >
            <PlusIcon className="w-4 h-4 mr-1" />
            Add Field
          </Button>
        </div>

        {/* Add Field Form */}
        {showAddField && (
          <Card className="bg-blue-50 border-blue-200">
            <CardContent className="pt-4 space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    Field Name *
                  </label>
                  <input
                    type="text"
                    placeholder="e.g., student_name"
                    value={newField.name || ''}
                    onChange={(e) => setNewField({ ...newField, name: e.target.value })}
                    className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    Display Label *
                  </label>
                  <input
                    type="text"
                    placeholder="e.g., Student Name"
                    value={newField.label || ''}
                    onChange={(e) => setNewField({ ...newField, label: e.target.value })}
                    className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Field Type</label>
                  <select
                    value={newField.type || 'text'}
                    onChange={(e) =>
                      setNewField({ ...newField, type: e.target.value as DynamicField['type'] })
                    }
                    className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="text">Text</option>
                    <option value="date">Date</option>
                    <option value="number">Number</option>
                    <option value="select">Select</option>
                    <option value="image">Image</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Font Size</label>
                  <input
                    type="number"
                    min="8"
                    max="72"
                    value={newField.fontSize || 35}
                    onChange={(e) =>
                      setNewField({ ...newField, fontSize: parseInt(e.target.value) })
                    }
                    className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    X Position (px)
                  </label>
                  <input
                    type="number"
                    value={newField.x || 50}
                    onChange={(e) => setNewField({ ...newField, x: parseInt(e.target.value) })}
                    className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    Y Position (px)
                  </label>
                  <input
                    type="number"
                    value={newField.y || 50}
                    onChange={(e) => setNewField({ ...newField, y: parseInt(e.target.value) })}
                    className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Width (px)</label>
                  <input
                    type="number"
                    value={newField.width || 200}
                    onChange={(e) => setNewField({ ...newField, width: parseInt(e.target.value) })}
                    className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    Height (px)
                  </label>
                  <input
                    type="number"
                    value={newField.height || 40}
                    onChange={(e) => setNewField({ ...newField, height: parseInt(e.target.value) })}
                    className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Font Color</label>
                  <input
                    type="color"
                    value={newField.fontColor || '#000000'}
                    onChange={(e) => setNewField({ ...newField, fontColor: e.target.value })}
                    className="w-full h-8 rounded border border-gray-300 cursor-pointer"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    Font Family
                  </label>
                  <select
                    value={newField.fontFamily || 'League Spartan'}
                    onChange={(e) => setNewField({ ...newField, fontFamily: e.target.value })}
                    className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    {FONT_FAMILIES.map((family) => (
                      <option key={family} value={family}>
                        {family}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Text Align</label>
                  <select
                    value={newField.textAlign || 'left'}
                    onChange={(e) =>
                      setNewField({
                        ...newField,
                        textAlign: e.target.value as 'left' | 'center' | 'right',
                      })
                    }
                    className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="left">Left</option>
                    <option value="center">Center</option>
                    <option value="right">Right</option>
                  </select>
                </div>
              </div>

              <div className="flex items-center gap-4 px-1">
                <label className="flex items-center gap-2 text-xs text-gray-700 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={newField.isBold || false}
                    onChange={(e) => setNewField({ ...newField, isBold: e.target.checked })}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="font-bold">Bold</span>
                </label>
                <label className="flex items-center gap-2 text-xs text-gray-700 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={newField.isItalic || false}
                    onChange={(e) => setNewField({ ...newField, isItalic: e.target.checked })}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="italic">Italic</span>
                </label>
                <label className="flex items-center gap-2 text-xs text-gray-700 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={newField.isRequired || false}
                    onChange={(e) => setNewField({ ...newField, isRequired: e.target.checked })}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span>Required</span>
                </label>
              </div>

              <div className="flex gap-2">
                <Button onClick={handleAddField} size="sm" className="flex-1">
                  Add Field
                </Button>
                <Button
                  onClick={() => setShowAddField(false)}
                  size="sm"
                  variant="outline"
                  className="flex-1"
                >
                  Cancel
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Fields List */}
        {fields.length > 0 ? (
          <div className="space-y-2 max-h-96 overflow-y-auto">
            {fields.map((field, index) => (
              <Card key={field.id} className="bg-white">
                <CardContent className="p-3">
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-2">
                        <h4 className="font-medium text-sm text-gray-900">{field.label}</h4>
                        <span className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-gray-100 text-gray-800">
                          {field.type}
                        </span>
                        {field.isRequired && (
                          <span className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-red-100 text-red-800">
                            Required
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-gray-500">
                        Position: {field.x}px, {field.y}px | Size: {field.width}px × {field.height}
                        px | Font: {field.fontSize}px
                      </p>
                    </div>

                    <div className="flex items-center gap-1 ml-2 flex-shrink-0">
                      <button
                        onClick={() => handleMoveField(field.id, 'up')}
                        disabled={disabled || index === 0}
                        className="p-1 hover:bg-gray-100 rounded disabled:opacity-50 disabled:cursor-not-allowed"
                        title="Move up"
                      >
                        <ArrowUpIcon className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleMoveField(field.id, 'down')}
                        disabled={disabled || index === fields.length - 1}
                        className="p-1 hover:bg-gray-100 rounded disabled:opacity-50 disabled:cursor-not-allowed"
                        title="Move down"
                      >
                        <ArrowDownIcon className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() =>
                          setEditingFieldId(editingFieldId === field.id ? null : field.id)
                        }
                        className="px-2 py-1 text-xs font-medium text-blue-600 hover:bg-blue-50 rounded"
                      >
                        {editingFieldId === field.id ? 'Hide' : 'Edit'}
                      </button>
                      <button
                        onClick={() => handleDeleteField(field.id)}
                        disabled={disabled}
                        className="p-1 hover:bg-red-50 rounded disabled:opacity-50 disabled:cursor-not-allowed"
                        title="Delete field"
                      >
                        <TrashIcon className="w-4 h-4 text-red-500" />
                      </button>
                    </div>
                  </div>

                  {/* Edit Panel */}
                  {editingFieldId === field.id && (
                    <div className="mt-3 pt-3 border-t border-gray-200 space-y-3">
                      <div className="grid grid-cols-3 gap-2">
                        <div>
                          <label className="block text-xs font-medium text-gray-600 mb-1">
                            Font Color
                          </label>
                          <input
                            type="color"
                            value={field.fontColor}
                            onChange={(e) =>
                              handleUpdateField(field.id, { fontColor: e.target.value })
                            }
                            className="w-full h-8 rounded border border-gray-300 cursor-pointer"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-gray-600 mb-1">
                            Font Family
                          </label>
                          <select
                            value={field.fontFamily}
                            onChange={(e) =>
                              handleUpdateField(field.id, { fontFamily: e.target.value })
                            }
                            className="w-full px-2 py-1 text-xs border border-gray-300 rounded"
                          >
                            {FONT_FAMILIES.map((family) => (
                              <option key={family} value={family}>
                                {family}
                              </option>
                            ))}
                          </select>
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-gray-600 mb-1">
                            Text Align
                          </label>
                          <select
                            value={field.textAlign}
                            onChange={(e) =>
                              handleUpdateField(field.id, {
                                textAlign: e.target.value as 'left' | 'center' | 'right',
                              })
                            }
                            className="w-full px-2 py-1 text-xs border border-gray-300 rounded"
                          >
                            <option value="left">Left</option>
                            <option value="center">Center</option>
                            <option value="right">Right</option>
                          </select>
                        </div>
                      </div>

                      <div className="flex items-center gap-4">
                        <label className="flex items-center gap-2 text-xs text-gray-700 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={field.isBold}
                            onChange={(e) =>
                              handleUpdateField(field.id, { isBold: e.target.checked })
                            }
                            className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                          />
                          <span className="font-bold">Bold</span>
                        </label>
                        <label className="flex items-center gap-2 text-xs text-gray-700 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={field.isItalic}
                            onChange={(e) =>
                              handleUpdateField(field.id, { isItalic: e.target.checked })
                            }
                            className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                          />
                          <span className="italic">Italic</span>
                        </label>
                        <label className="flex items-center gap-2 text-xs text-gray-700 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={field.isRequired}
                            onChange={(e) =>
                              handleUpdateField(field.id, { isRequired: e.target.checked })
                            }
                            className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                          />
                          <span>Required</span>
                        </label>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <div className="text-center py-6 text-gray-500">
            <p className="text-sm">No fields added yet</p>
            <p className="text-xs mt-1">Click "Add Field" to create dynamic fields</p>
          </div>
        )}
      </div>
    </div>
  )
}
