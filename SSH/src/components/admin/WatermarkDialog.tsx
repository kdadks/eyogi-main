'use client'

import React, { useState, useEffect } from 'react'
import { Button } from '../ui/Button'
import { Card, CardContent, CardHeader } from '../ui/Card'
import { Badge } from '../ui/Badge'
import { Input } from '../ui/Input'
import { toast } from 'sonner'
import { X, Eye, Droplets, Loader2, Check, AlertCircle } from 'lucide-react'
import {
  useWatermark,
  canBeWatermarked,
  WATERMARK_PRESETS,
  type WatermarkOptions,
  type WatermarkResult,
} from '../../hooks/useWatermark'
import type { MediaFile } from '../../lib/api/media'

interface WatermarkDialogProps {
  mediaFiles: MediaFile[]
  onClose: () => void
  onComplete: () => void
}

export default function WatermarkDialog({ mediaFiles, onClose, onComplete }: WatermarkDialogProps) {
  const { watermarkFiles, previewWatermark, loading } = useWatermark()

  const [step, setStep] = useState<'configure' | 'preview' | 'processing' | 'complete'>('configure')
  const [watermarkOptions, setWatermarkOptions] = useState<WatermarkOptions>(
    WATERMARK_PRESETS.standard,
  )
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [selectedPreset, setSelectedPreset] = useState<string>('standard')
  const [processingResults, setProcessingResults] = useState<WatermarkResult[]>([])

  // Filter only watermarkable files
  const watermarkableFiles = mediaFiles.filter(
    (file) => canBeWatermarked(file.mime_type) && file.file_category === 'image',
  )

  const nonWatermarkableFiles = mediaFiles.filter(
    (file) => !canBeWatermarked(file.mime_type) || file.file_category !== 'image',
  )

  useEffect(() => {
    // Cleanup preview URL on unmount
    return () => {
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl)
      }
    }
  }, [previewUrl])

  const handlePresetChange = (presetName: string) => {
    setSelectedPreset(presetName)
    setWatermarkOptions(WATERMARK_PRESETS[presetName as keyof typeof WATERMARK_PRESETS])

    // Clear existing preview
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl)
      setPreviewUrl(null)
    }
  }

  const handleCustomOptionChange = (key: keyof WatermarkOptions, value: unknown) => {
    setSelectedPreset('custom')
    setWatermarkOptions((prev: WatermarkOptions) => ({
      ...prev,
      [key]: value,
    }))

    // Clear existing preview
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl)
      setPreviewUrl(null)
    }
  }

  const generatePreview = async () => {
    if (watermarkableFiles.length === 0) return

    try {
      // Use the first watermarkable image for preview
      const firstImage = watermarkableFiles[0]

      // Fetch the image as a file
      const response = await fetch(firstImage.file_url)
      const blob = await response.blob()
      const file = new File([blob], firstImage.original_name, { type: firstImage.mime_type })

      const preview = await previewWatermark(file, watermarkOptions)

      if (preview) {
        // Clean up previous preview
        if (previewUrl) {
          URL.revokeObjectURL(previewUrl)
        }
        setPreviewUrl(preview)
      }
    } catch (error) {
      console.error('Error generating preview:', error)
      toast.error('Failed to generate preview')
    }
  }

  const processWatermarks = async () => {
    setStep('processing')

    try {
      const mediaIds = watermarkableFiles.map((file) => file.id)
      const results = await watermarkFiles(mediaIds, watermarkOptions)

      setProcessingResults(results)
      setStep('complete')
    } catch (error) {
      console.error('Error processing watermarks:', error)
      toast.error('Failed to process watermarks')
      setStep('configure')
    }
  }

  const handleComplete = () => {
    onComplete()
    onClose()
  }

  return (
    <div className="fixed inset-0 bg-gray-900 bg-opacity-50 flex items-center justify-center z-50 p-4 overflow-hidden">
      <Card className="modal-card w-full max-w-4xl max-h-[90vh] overflow-y-auto overflow-x-hidden bg-white text-gray-900 shadow-xl">
        <CardHeader className="bg-white border-b border-gray-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Droplets className="h-6 w-6 text-blue-600" />
              <h2 className="text-xl font-bold text-gray-900">Add Watermarks</h2>
              <Badge variant="secondary">{mediaFiles.length} files selected</Badge>
            </div>
            <Button variant="ghost" size="sm" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          </div>
        </CardHeader>

        <CardContent className="space-y-6 bg-white text-gray-900">
          {/* File Summary */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card className="border-green-200 bg-green-50">
              <CardContent className="p-4">
                <div className="flex items-center space-x-2">
                  <Check className="h-5 w-5 text-green-600" />
                  <div>
                    <div className="font-medium text-green-900">
                      {watermarkableFiles.length} files can be watermarked
                    </div>
                    <div className="text-sm text-green-700">
                      Images (JPEG, PNG, WebP, TIFF, BMP)
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {nonWatermarkableFiles.length > 0 && (
              <Card className="border-yellow-200 bg-yellow-50">
                <CardContent className="p-4">
                  <div className="flex items-center space-x-2">
                    <AlertCircle className="h-5 w-5 text-yellow-600" />
                    <div>
                      <div className="font-medium text-yellow-900">
                        {nonWatermarkableFiles.length} files will be skipped
                      </div>
                      <div className="text-sm text-yellow-700">
                        Videos, documents, and unsupported formats
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {step === 'configure' && (
            <div className="space-y-6">
              {/* Preset Selection */}
              <div>
                <h3 className="text-lg font-medium mb-3">Watermark Style</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                  {Object.entries(WATERMARK_PRESETS).map(([key, preset]) => (
                    <Button
                      key={key}
                      variant={selectedPreset === key ? 'primary' : 'outline'}
                      size="sm"
                      onClick={() => handlePresetChange(key)}
                      className="h-auto p-3 flex-col space-y-1"
                    >
                      <div className="font-medium capitalize">{key}</div>
                      <div className="text-xs opacity-80">
                        {preset.opacity * 100}% • {preset.maxSize}%
                      </div>
                    </Button>
                  ))}
                </div>
              </div>

              {/* Custom Options */}
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Opacity ({Math.round((watermarkOptions.opacity || 0.3) * 100)}%)
                  </label>
                  <Input
                    type="range"
                    min="0.1"
                    max="0.8"
                    step="0.1"
                    value={watermarkOptions.opacity || 0.3}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                      handleCustomOptionChange('opacity', parseFloat(e.target.value))
                    }
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Position</label>
                  <select
                    value={watermarkOptions.position || 'bottom-right'}
                    onChange={(e) => handleCustomOptionChange('position', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="bottom-right">Bottom Right</option>
                    <option value="bottom-left">Bottom Left</option>
                    <option value="top-right">Top Right</option>
                    <option value="top-left">Top Left</option>
                    <option value="center">Center</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Margin ({watermarkOptions.margin || 20}px)
                  </label>
                  <Input
                    type="range"
                    min="5"
                    max="50"
                    step="5"
                    value={watermarkOptions.margin || 20}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                      handleCustomOptionChange('margin', parseInt(e.target.value))
                    }
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Size ({watermarkOptions.maxSize || 15}%)
                  </label>
                  <Input
                    type="range"
                    min="5"
                    max="30"
                    step="1"
                    value={watermarkOptions.maxSize || 15}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                      handleCustomOptionChange('maxSize', parseInt(e.target.value))
                    }
                  />
                </div>
              </div>

              {/* Preview */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-lg font-medium">Preview</h3>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={generatePreview}
                    disabled={loading || watermarkableFiles.length === 0}
                  >
                    {loading ? (
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    ) : (
                      <Eye className="h-4 w-4 mr-2" />
                    )}
                    Generate Preview
                  </Button>
                </div>

                {previewUrl ? (
                  <div className="border rounded-lg p-4 bg-gray-50">
                    <img
                      src={previewUrl}
                      alt="Watermark preview"
                      className="max-w-full max-h-64 mx-auto rounded border"
                    />
                    <p className="text-sm text-gray-600 text-center mt-2">
                      Preview of {watermarkableFiles[0]?.original_name}
                    </p>
                  </div>
                ) : (
                  <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center text-gray-500">
                    Click "Generate Preview" to see how the watermark will look
                  </div>
                )}
              </div>

              {/* Actions */}
              <div className="flex justify-end space-x-3">
                <Button variant="outline" onClick={onClose}>
                  Cancel
                </Button>
                <Button
                  onClick={processWatermarks}
                  disabled={watermarkableFiles.length === 0 || loading}
                >
                  {loading ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <Droplets className="h-4 w-4 mr-2" />
                  )}
                  Add Watermarks ({watermarkableFiles.length})
                </Button>
              </div>
            </div>
          )}

          {step === 'processing' && (
            <div className="text-center py-12">
              <Loader2 className="h-12 w-12 animate-spin mx-auto mb-4 text-blue-600" />
              <h3 className="text-lg font-medium mb-2">Adding Watermarks...</h3>
              <p className="text-gray-600">
                Processing {watermarkableFiles.length} file(s). This may take a moment.
              </p>
            </div>
          )}

          {step === 'complete' && (
            <div className="space-y-6">
              <div className="text-center">
                <Check className="h-12 w-12 text-green-600 mx-auto mb-4" />
                <h3 className="text-lg font-medium mb-2">Watermarking Complete!</h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
                  <Card className="border-green-200 bg-green-50">
                    <CardContent className="p-4 text-center">
                      <div className="text-2xl font-bold text-green-600">
                        {processingResults.filter((r) => r.success).length}
                      </div>
                      <div className="text-sm text-green-700">Successfully watermarked</div>
                    </CardContent>
                  </Card>

                  {processingResults.filter((r) => !r.success).length > 0 && (
                    <Card className="border-red-200 bg-red-50">
                      <CardContent className="p-4 text-center">
                        <div className="text-2xl font-bold text-red-600">
                          {processingResults.filter((r) => !r.success).length}
                        </div>
                        <div className="text-sm text-red-700">Failed to watermark</div>
                      </CardContent>
                    </Card>
                  )}
                </div>
              </div>

              <div className="flex justify-center space-x-3">
                <Button variant="outline" onClick={onClose}>
                  Close
                </Button>
                <Button onClick={handleComplete}>
                  <Check className="h-4 w-4 mr-2" />
                  Done
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
