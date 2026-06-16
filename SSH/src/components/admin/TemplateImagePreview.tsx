import React, { useRef, useEffect, useState } from 'react'
import { DynamicField } from './DynamicFieldEditor'

interface TemplateImagePreviewProps {
  templateImage: string
  dynamicFields: DynamicField[]
  width?: number
  height?: number
  scale?: number
}

export default function TemplateImagePreview({
  templateImage,
  dynamicFields,
  width = 800,
  height = 600,
  scale = 1,
}: TemplateImagePreviewProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const imgRef = useRef<HTMLImageElement>(null)
  const [imageLoaded, setImageLoaded] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!canvasRef.current || !imgRef.current || !templateImage) {
      setImageLoaded(false)
      return
    }

    const canvas = canvasRef.current
    const imgElement = imgRef.current
    const ctx = canvas.getContext('2d')
    if (!ctx) {
      setError('Could not get canvas context')
      return
    }

    // Handle when image loads
    const handleImageLoad = () => {
      try {
        // Set canvas size to match image aspect ratio
        const aspectRatio = imgElement.width / imgElement.height
        const canvasWidth = width
        const canvasHeight = canvasWidth / aspectRatio

        canvas.width = canvasWidth * scale
        canvas.height = canvasHeight * scale
        ctx.scale(scale, scale)

        // Draw template image from the DOM element
        ctx.drawImage(imgElement, 0, 0, canvasWidth, canvasHeight)

        // Draw dynamic fields
        dynamicFields.forEach((field) => {
          // Draw field background box with semi-transparent color
          ctx.fillStyle = 'rgba(59, 130, 246, 0.1)' // Light blue background
          ctx.strokeStyle = 'rgba(59, 130, 246, 0.5)' // Blue border
          ctx.lineWidth = 2
          ctx.fillRect(field.x, field.y, field.width, field.height)
          ctx.strokeRect(field.x, field.y, field.width, field.height)

          // Draw field label
          ctx.fillStyle = field.fontColor
          ctx.font = `${field.isBold ? 'bold' : ''} ${field.isItalic ? 'italic' : ''} ${field.fontSize}px ${field.fontFamily}`
          ctx.textAlign = field.textAlign as CanvasTextAlign
          ctx.textBaseline = 'middle'

          const x =
            field.textAlign === 'center'
              ? field.x + field.width / 2
              : field.textAlign === 'right'
                ? field.x + field.width - 5
                : field.x + 5

          const y = field.y + field.height / 2

          // Draw placeholder text with field name
          ctx.fillText(`[${field.label}]`, x, y)
        })

        setImageLoaded(true)
        setError(null)
      } catch (err) {
        const errorMsg = err instanceof Error ? err.message : 'Unknown error'
        setError(`Error drawing canvas: ${errorMsg}`)
        console.error('Error drawing on canvas:', err)
      }
    }

    const handleImageError = () => {
      const errorMsg = `Failed to load template image. Check the URL and ensure the bucket allows public read access.`
      setError(errorMsg)
      console.error(errorMsg, {
        templateImage,
        urlLength: templateImage?.length,
        urlPreview: templateImage?.substring(0, 100),
      })
      setImageLoaded(false)
    }

    // Add event listeners
    imgElement.addEventListener('load', handleImageLoad, { once: true })
    imgElement.addEventListener('error', handleImageError, { once: true })

    // Set the source - this will trigger the load/error events
    // Using public URL from Supabase storage
    imgElement.src = templateImage

    // Cleanup
    return () => {
      imgElement.removeEventListener('load', handleImageLoad)
      imgElement.removeEventListener('error', handleImageError)
    }
  }, [templateImage, dynamicFields, width, height, scale])

  if (!templateImage) {
    return (
      <div className="w-full h-full bg-gray-100 rounded-lg flex items-center justify-center border-2 border-dashed border-gray-300">
        <p className="text-gray-500">No template image selected</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="w-full bg-red-50 border border-red-200 rounded-lg p-4 flex flex-col items-center justify-center">
        <p className="text-red-700 font-medium">Preview Error</p>
        <p className="text-red-600 text-sm">{error}</p>
      </div>
    )
  }

  return (
    <div className="w-full flex flex-col items-center gap-4">
      {/* Hidden image element used for loading and drawing to canvas */}
      <img ref={imgRef} className="hidden" alt="template" />

      <canvas
        ref={canvasRef}
        className="w-full border border-gray-300 rounded-lg shadow-sm bg-white"
      />
      {!imageLoaded && <div className="text-sm text-gray-500">Loading preview...</div>}
      <div className="text-xs text-gray-500 text-center">
        <p>Blue boxes show field positions on the certificate</p>
        <p className="mt-1">
          Fields will be populated with actual data when certificates are generated
        </p>
      </div>
    </div>
  )
}
