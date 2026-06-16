import React, { useState, useRef } from 'react'
import { DocumentIcon, XMarkIcon } from '@heroicons/react/24/outline'
import { Button } from '../ui/Button'
import toast from 'react-hot-toast'
import * as pdfjsLib from 'pdfjs-dist'

// Set up PDF.js worker
if (typeof window !== 'undefined') {
  const workerSrc = new URL('pdfjs-dist/build/pdf.worker.min.mjs', import.meta.url).href
  pdfjsLib.GlobalWorkerOptions.workerSrc = workerSrc
}

interface TemplatePdfUploadProps {
  onPdfSelect: (pdfData: {
    file: File
    preview: string
    width: number
    height: number
    pageCount: number
  }) => void
  currentPdf?: string
  disabled?: boolean
}

export default function TemplatePdfUpload({
  onPdfSelect,
  currentPdf,
  disabled,
}: TemplatePdfUploadProps) {
  const [preview, setPreview] = useState<string | null>(null)
  const [pdfInfo, setPdfInfo] = useState<{
    width: number
    height: number
    pageCount: number
  } | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [uploading, setUploading] = useState(false)
  const canvasRef = useRef<HTMLCanvasElement>(null)

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Validate file type
    if (file.type !== 'application/pdf') {
      toast.error('Please select a PDF file')
      return
    }

    // Validate file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      toast.error('PDF must be smaller than 10MB')
      return
    }

    setUploading(true)

    try {
      // Read file as ArrayBuffer for PDF.js
      const arrayBuffer = await file.arrayBuffer()
      
      // Load PDF document
      const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer })
      const pdf = await loadingTask.promise
      
      // Get first page for dimensions and preview
      const page = await pdf.getPage(1)
      const viewport = page.getViewport({ scale: 1 })
      
      // Convert PDF points to mm (1 point = 0.352778 mm)
      const widthMm = viewport.width * 0.352778
      const heightMm = viewport.height * 0.352778
      
      // Generate preview image from first page
      const scale = 1.5 // Render at 1.5x for better preview quality
      const scaledViewport = page.getViewport({ scale })
      
      const canvas = document.createElement('canvas')
      const context = canvas.getContext('2d')
      
      if (!context) {
        throw new Error('Failed to get canvas context')
      }
      
      canvas.width = scaledViewport.width
      canvas.height = scaledViewport.height
      
      await page.render({
        canvasContext: context,
        viewport: scaledViewport,
        canvas,
      }).promise
      
      const previewDataUrl = canvas.toDataURL('image/png')
      setPreview(previewDataUrl)
      
      setPdfInfo({
        width: widthMm,
        height: heightMm,
        pageCount: pdf.numPages,
      })
      
      // Read file as data URL for storage
      const reader = new FileReader()
      reader.onload = (event) => {
        const dataUrl = event.target?.result as string
        onPdfSelect({
          file,
          preview: dataUrl,
          width: widthMm,
          height: heightMm,
          pageCount: pdf.numPages,
        })
        toast.success('PDF template selected successfully')
      }
      reader.readAsDataURL(file)
      
    } catch (error) {
      console.error('Error processing PDF:', error)
      toast.error('Failed to process PDF file')
    } finally {
      setUploading(false)
    }
  }

  const handleClear = () => {
    setPreview(null)
    setPdfInfo(null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  // Load existing PDF preview
  React.useEffect(() => {
    if (currentPdf && !preview) {
      loadPdfPreview(currentPdf)
    }
  }, [currentPdf])

  const loadPdfPreview = async (pdfUrl: string) => {
    try {
      setUploading(true)
      
      // Fetch the PDF
      const response = await fetch(pdfUrl)
      const arrayBuffer = await response.arrayBuffer()
      
      const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer })
      const pdf = await loadingTask.promise
      
      const page = await pdf.getPage(1)
      const viewport = page.getViewport({ scale: 1 })
      
      const widthMm = viewport.width * 0.352778
      const heightMm = viewport.height * 0.352778
      
      const scale = 1.5
      const scaledViewport = page.getViewport({ scale })
      
      const canvas = document.createElement('canvas')
      const context = canvas.getContext('2d')
      
      if (context) {
        canvas.width = scaledViewport.width
        canvas.height = scaledViewport.height
        
        await page.render({
          canvasContext: context,
          viewport: scaledViewport,
          canvas,
        }).promise
        
        setPreview(canvas.toDataURL('image/png'))
        setPdfInfo({
          width: widthMm,
          height: heightMm,
          pageCount: pdf.numPages,
        })
      }
    } catch (error) {
      console.error('Error loading PDF preview:', error)
    } finally {
      setUploading(false)
    }
  }

  return (
    <div className="space-y-4">
      <input
        ref={fileInputRef}
        type="file"
        accept="application/pdf"
        onChange={handleFileSelect}
        disabled={disabled || uploading}
        className="hidden"
      />

      {preview ? (
        <div className="space-y-3">
          <div className="relative bg-gray-100 rounded-lg overflow-hidden border-2 border-dashed border-gray-300">
            <img
              src={preview}
              alt="PDF Template preview"
              className="w-full h-auto max-h-96 object-contain"
            />
            <button
              onClick={handleClear}
              className="absolute top-2 right-2 p-1 bg-red-500 hover:bg-red-600 text-white rounded-full transition"
              title="Remove PDF"
            >
              <XMarkIcon className="w-5 h-5" />
            </button>
            <div className="absolute top-2 left-2 bg-blue-500 text-white px-2 py-1 rounded text-xs font-medium">
              PDF Template
            </div>
          </div>

          {pdfInfo && (
            <div className="text-sm text-gray-600 bg-blue-50 p-3 rounded-lg">
              <p>
                <strong>Dimensions:</strong> {pdfInfo.width.toFixed(1)}mm × {pdfInfo.height.toFixed(1)}mm
              </p>
              <p className="mt-1">
                <strong>Pages:</strong> {pdfInfo.pageCount}
              </p>
              <p className="mt-1">
                <strong>Orientation:</strong>{' '}
                {pdfInfo.width > pdfInfo.height ? 'Landscape' : 'Portrait'}
              </p>
              <p className="text-xs mt-2 text-blue-600">
                ✓ PDF templates provide better quality and easier field positioning
              </p>
            </div>
          )}

          <Button
            onClick={() => fileInputRef.current?.click()}
            variant="outline"
            size="sm"
            className="w-full"
            disabled={uploading}
          >
            Change PDF Template
          </Button>
        </div>
      ) : (
        <button
          onClick={() => fileInputRef.current?.click()}
          disabled={disabled || uploading}
          className="w-full border-2 border-dashed border-gray-300 rounded-lg p-8 hover:border-blue-500 hover:bg-blue-50 transition disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <div className="flex flex-col items-center justify-center">
            <DocumentIcon className="w-12 h-12 text-gray-400 mb-3" />
            <p className="text-sm font-medium text-gray-700">
              {uploading ? 'Processing PDF...' : 'Click to upload PDF certificate template'}
            </p>
            <p className="text-xs text-gray-500 mt-2">
              Recommended: A4 Landscape (297mm × 210mm)
            </p>
            <p className="text-xs text-gray-400 mt-1">Maximum file size: 10MB</p>
          </div>
        </button>
      )}

      <canvas ref={canvasRef} style={{ display: 'none' }} />
    </div>
  )
}
