import jsPDF from 'jspdf'
import * as pdfjsLib from 'pdfjs-dist'
import { CertificateTemplate } from '@/types'

// Set up PDF.js worker
if (typeof window !== 'undefined') {
  const workerSrc = new URL('pdfjs-dist/build/pdf.worker.min.mjs', import.meta.url).href
  pdfjsLib.GlobalWorkerOptions.workerSrc = workerSrc
}

/**
 * Compress an image to reduce file size before embedding in PDF
 * @param imageUrl URL or data URL of the image
 * @param maxWidth Maximum width in pixels (default: 1400 for A4 landscape at ~150 DPI)
 * @param quality JPEG quality 0-1 (default: 0.65 for good balance)
 * @returns Compressed image as data URL
 */
async function compressImage(
  imageUrl: string,
  maxWidth: number = 1400,
  quality: number = 0.65,
): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.crossOrigin = 'anonymous'

    img.onload = () => {
      try {
        const canvas = document.createElement('canvas')
        const ctx = canvas.getContext('2d')

        if (!ctx) {
          reject(new Error('Failed to get canvas context'))
          return
        }

        // Calculate new dimensions while maintaining aspect ratio
        let width = img.width
        let height = img.height

        if (width > maxWidth) {
          height = (height * maxWidth) / width
          width = maxWidth
        }

        canvas.width = width
        canvas.height = height

        // Draw and compress
        ctx.drawImage(img, 0, 0, width, height)

        // Convert to JPEG with compression
        const compressedDataUrl = canvas.toDataURL('image/jpeg', quality)
        resolve(compressedDataUrl)
      } catch (error) {
        reject(error)
      }
    }

    img.onerror = () => reject(new Error(`Failed to load image: ${imageUrl}`))
    img.src = imageUrl
  })
}

export interface CertificateData {
  studentName: string
  studentId: string
  courseName: string
  courseId: string
  gurukulName: string
  completionDate: string
  certificateNumber: string
  verificationCode: string
}
export interface CertificateDesign {
  logos: {
    eyogiLogo: string
    sshLogo: string
  }
  signatures: {
    viceChancellor: string
    president: string
  }
  layout: {
    width: number
    height: number
    margin: number
  }
  colors: {
    primary: string
    secondary: string
    text: string
  }
}
const defaultDesign: CertificateDesign = {
  logos: {
    eyogiLogo: '/eyogiLogo.png',
    sshLogo: '/ssh-app/Images/Logo.png',
  },
  signatures: {
    viceChancellor: '',
    president: '',
  },
  layout: {
    width: 297, // A4 landscape width in mm
    height: 210, // A4 landscape height in mm
    margin: 20,
  },
  colors: {
    primary: '#FF6B35',
    secondary: '#2563EB',
    text: '#1F2937',
  },
}
export class CertificateGenerator {
  private pdf: jsPDF
  private design: CertificateDesign
  constructor(design?: Partial<CertificateDesign>) {
    this.design = { ...defaultDesign, ...design }
    this.pdf = new jsPDF({
      orientation: 'landscape',
      unit: 'mm',
      format: 'a4',
      compress: true, // Enable PDF compression
    })
  }
  async generateCertificate(data: CertificateData, template?: CertificateTemplate): Promise<Blob> {
    try {
      console.log('=== Certificate Generation Started ===')
      console.log('Template ID:', template?.id)
      console.log('Template Name:', template?.name)
      console.log('Template type check:', {
        hasTemplateData: !!template?.template_data,
        templateType: template?.template_data?.template_type,
        hasTemplatePdf: !!template?.template_data?.template_pdf,
        templatePdfLength: template?.template_data?.template_pdf?.length || 0,
      })
      
      // Check if this is a PDF-based template (required approach)
      if (template?.template_data?.template_pdf || template?.template_data?.template_type === 'pdf') {
        console.log('Generating PDF-based certificate using PDF template')
        console.log('Template data:', {
          hasPdfTemplate: !!template.template_data.template_pdf,
          pdfDimensions: template.template_data.pdf_dimensions,
          dynamicFieldsCount: template.template_data.dynamic_fields?.length || 0,
          dynamicFields: template.template_data.dynamic_fields?.map(f => f.name) || [],
        })
        console.log('Certificate data:', data)
        return await this.generatePdfBasedCertificate(data, template)
      }

      // Fallback: generate design-based certificate (no template)
      console.log('No PDF template found, generating design-based certificate')
      // Set up the certificate layout with decorative elements
      this.setupCertificate()
      // Add header with logos
      await this.addHeader(template)
      // Add main certificate content
      this.addCertificateContent(data, template)
      // Add decorative elements
      this.addDecorativeElements()
      // Add signatures
      await this.addSignatures(template)
      // Add footer with verification details
      this.addFooter(data)
      // Return as blob for download
      return this.pdf.output('blob')
    } catch (error) {
      console.error('Error in generateCertificate:', error)
      throw error
    }
  }

  /**
   * Generate certificate from PDF template
   * Field positions are in mm - directly usable in jsPDF
   */
  private async generatePdfBasedCertificate(
    data: CertificateData,
    template: CertificateTemplate,
  ): Promise<Blob> {
    try {
      const pdfTemplateUrl = template.template_data?.template_pdf
      if (!pdfTemplateUrl) {
        throw new Error('PDF template URL not found')
      }

      // Load the PDF template
      let arrayBuffer: ArrayBuffer
      if (pdfTemplateUrl.startsWith('data:')) {
        // Data URL - extract base64 and decode
        const base64 = pdfTemplateUrl.split(',')[1]
        const binaryString = atob(base64)
        const bytes = new Uint8Array(binaryString.length)
        for (let i = 0; i < binaryString.length; i++) {
          bytes[i] = binaryString.charCodeAt(i)
        }
        arrayBuffer = bytes.buffer
      } else {
        // Regular URL - fetch it
        const response = await fetch(pdfTemplateUrl)
        arrayBuffer = await response.arrayBuffer()
      }

      // Load PDF with PDF.js
      const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer })
      const pdfDoc = await loadingTask.promise
      
      // Get first page
      const page = await pdfDoc.getPage(1)
      const viewport = page.getViewport({ scale: 1 })
      
      // Get dimensions in mm (PDF points to mm: 1 point = 0.352778 mm)
      const widthMm = viewport.width * 0.352778
      const heightMm = viewport.height * 0.352778
      
      console.log('PDF template dimensions:', widthMm.toFixed(1), 'x', heightMm.toFixed(1), 'mm')
      
      // Render PDF page to canvas at high resolution for embedding
      const scale = 3 // High resolution for quality
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
      
      // Convert canvas to image and compress
      const imageDataUrl = canvas.toDataURL('image/jpeg', 0.85)
      
      // Determine orientation and create jsPDF
      const orientation = widthMm > heightMm ? 'landscape' : 'portrait'
      this.pdf = new jsPDF({
        orientation,
        unit: 'mm',
        format: [widthMm, heightMm],
        compress: true,
      })
      
      // Add PDF as background image
      this.pdf.addImage(imageDataUrl, 'JPEG', 0, 0, widthMm, heightMm)
      
      // Get dynamic fields from template
      const dynamicFields = template.template_data?.dynamic_fields || []
      console.log('Dynamic fields count:', dynamicFields.length)

      if (dynamicFields.length > 0) {
        console.log('Rendering dynamic fields on PDF template...')

        // Map certificate data to field values
        const fieldValues: Record<string, string> = {
          student_name: data.studentName,
          student_id: data.studentId,
          course_name: data.courseName,
          course_id: data.courseId,
          gurukul_name: data.gurukulName,
          completion_date: new Date(data.completionDate).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
          }),
          certificate_number: data.certificateNumber,
          verification_code: data.verificationCode,
        }
        console.log('Field values:', fieldValues)

        // Render each dynamic field - positions are already in mm!
        for (const field of dynamicFields) {
          const value = fieldValues[field.name] || ''
          console.log(`Field "${field.name}": value="${value}", position=(${field.x}mm, ${field.y}mm)`)
          if (!value) continue

          // Field positions are directly in mm - no conversion needed!
          const xPos = field.x
          const fieldWidth = field.width || 50
          
          // Font size conversion: the visual editor shows font size in pixels
          // but jsPDF uses points. We need to scale appropriately.
          // In the visual editor, font sizes are relative to the preview image
          // which is scaled from mm. We stored the fontSize as-is, so use it directly.
          const fontSize = field.fontSize || 12

          // Parse color
          const color = this.hexToRgb(field.fontColor || '#000000')
          this.pdf.setTextColor(color.r, color.g, color.b)

          // Set font
          let pdfFont = 'helvetica'
          const fontFamily = (field.fontFamily || 'helvetica').toLowerCase()
          if (fontFamily.includes('times') || fontFamily.includes('serif')) {
            pdfFont = 'times'
          } else if (fontFamily.includes('courier') || fontFamily.includes('mono')) {
            pdfFont = 'courier'
          }

          const fontStyle =
            field.isBold && field.isItalic
              ? 'bolditalic'
              : field.isBold
                ? 'bold'
                : field.isItalic
                  ? 'italic'
                  : 'normal'
          this.pdf.setFont(pdfFont, fontStyle)

          // Set font size
          this.pdf.setFontSize(fontSize)

          // In jsPDF, text() positions at the baseline of the text
          // The y coordinate from the editor is the TOP of the text box
          // We need to add an offset to account for the font ascent
          // Font ascent is approximately 70-80% of the font size
          // Font size in points, and 1 point = 0.3528 mm
          const fontHeightMm = fontSize * 0.3528
          const baselineOffset = fontHeightMm * 0.75 // Approximate ascent
          const yPos = field.y + baselineOffset

          console.log(`  Rendering at: (${xPos.toFixed(2)}mm, ${yPos.toFixed(2)}mm), width: ${fieldWidth}mm, fontSize: ${fontSize}pt, baselineOffset: ${baselineOffset.toFixed(2)}mm`)

          // Calculate text position based on alignment
          let textX = xPos
          const textWidth = this.pdf.getTextWidth(value)

          if (field.textAlign === 'center') {
            textX = xPos + (fieldWidth - textWidth) / 2
          } else if (field.textAlign === 'right') {
            textX = xPos + fieldWidth - textWidth
          }

          // Render the text
          this.pdf.text(value, textX, yPos)
        }
      }

      // Render signatures if configured
      const signaturePositions = template.template_data?.signature_positions

      if (signaturePositions?.secretary) {
        const pos = signaturePositions.secretary
        const name = template.template_data?.signatures?.vice_chancellor_name || 'Secretary'
        const sigData = template.template_data?.signatures?.vice_chancellor_signature_data

        try {
          if (sigData) {
            this.pdf.addImage(sigData, 'PNG', pos.x, pos.y, pos.width, pos.height)
          }
          // Add name below signature
          this.pdf.setFont('helvetica', 'bold')
          this.pdf.setFontSize(10)
          this.pdf.setTextColor(0, 0, 0)
          const nameWidth = this.pdf.getTextWidth(name)
          this.pdf.text(name, pos.x + (pos.width - nameWidth) / 2, pos.y + pos.height + 4)
        } catch (error) {
          console.warn('Failed to add secretary signature:', error)
        }
      }

      if (signaturePositions?.chancellor) {
        const pos = signaturePositions.chancellor
        const name = template.template_data?.signatures?.president_name || 'Chancellor'
        const sigData = template.template_data?.signatures?.president_signature_data

        try {
          if (sigData) {
            this.pdf.addImage(sigData, 'PNG', pos.x, pos.y, pos.width, pos.height)
          }
          // Add name below signature
          this.pdf.setFont('helvetica', 'bold')
          this.pdf.setFontSize(10)
          this.pdf.setTextColor(0, 0, 0)
          const nameWidth = this.pdf.getTextWidth(name)
          this.pdf.text(name, pos.x + (pos.width - nameWidth) / 2, pos.y + pos.height + 4)
        } catch (error) {
          console.warn('Failed to add chancellor signature:', error)
        }
      }

      console.log('PDF certificate generation complete')
      return this.pdf.output('blob')
    } catch (error) {
      console.error('Error generating PDF-based certificate:', error)
      throw error
    }
  }

  // Helper function to convert hex color to RGB
  private hexToRgb(hex: string): { r: number; g: number; b: number } {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex)
    return result
      ? {
          r: parseInt(result[1], 16),
          g: parseInt(result[2], 16),
          b: parseInt(result[3], 16),
        }
      : { r: 0, g: 0, b: 0 }
  }
  async generatePreview(data: CertificateData, template?: CertificateTemplate): Promise<string> {
    await this.generateCertificate(data, template)
    const dataUrl = this.pdf.output('dataurlstring')

    // Convert PDF to PNG image using PDF.js
    try {
      const imageUrl = await this.convertPdfToImage(dataUrl)
      return imageUrl
    } catch {
      return dataUrl
    }
  }

  private async convertPdfToImage(pdfDataUrl: string): Promise<string> {
    // Load the PDF
    const pdf = await pdfjsLib.getDocument(pdfDataUrl).promise

    // Get first page
    const page = await pdf.getPage(1)

    // Get page viewport
    const scale = 2 // Higher scale = higher quality
    const viewport = page.getViewport({ scale })

    // Create canvas
    const canvas = document.createElement('canvas')
    canvas.width = viewport.width
    canvas.height = viewport.height
    const context = canvas.getContext('2d')
    if (!context) throw new Error('Failed to get canvas context')

    // Render page to canvas
    const renderContext = {
      canvasContext: context,
      viewport: viewport,
      canvas: canvas,
    }
    await page.render(renderContext).promise

    // Convert canvas to PNG data URL
    const imageUrl = canvas.toDataURL('image/png')
    return imageUrl
  }
  private setupCertificate() {
    const { width, height } = this.design.layout
    // Add background gradient effect with multiple layers
    this.pdf.setFillColor(252, 248, 227) // Light cream background
    this.pdf.rect(0, 0, width, height, 'F')
    // Add decorative outer border with gradient effect
    this.pdf.setLineWidth(4)
    this.pdf.setDrawColor(255, 107, 53) // Orange primary color
    this.pdf.rect(8, 8, width - 16, height - 16)
    // Add elegant inner border
    this.pdf.setLineWidth(1)
    this.pdf.setDrawColor(37, 99, 235) // Blue secondary color
    this.pdf.rect(12, 12, width - 24, height - 24)
    // Add ornamental corner decorations
    this.addCornerDecorations()
  }
  private async addHeader(template?: CertificateTemplate) {
    const { width } = this.design.layout
    // Add logos if available
    await this.addLogos(template)
    // Add institution name
    this.pdf.setFontSize(16)
    this.pdf.setTextColor(37, 99, 235) // Blue
    this.pdf.setFont('helvetica', 'bold')
    const institutionText =
      template?.template_data?.custom_text?.header_text || 'eYogi Gurukul - Excellence in Learning'
    const instWidth = this.pdf.getTextWidth(institutionText)
    this.pdf.text(institutionText, (width - instWidth) / 2, 35)
    // Certificate title with elegant styling
    this.pdf.setFontSize(28)
    this.pdf.setTextColor(255, 107, 53) // Orange primary
    this.pdf.setFont('helvetica', 'bold')
    const title = template?.template_data?.custom_text?.title || 'CERTIFICATE OF ACHIEVEMENT'
    const titleWidth = this.pdf.getTextWidth(title)
    this.pdf.text(title, (width - titleWidth) / 2, 50)
    // Add elegant decorative elements under title
    this.addTitleDecorations(width)
  }
  private addCertificateContent(data: CertificateData, template?: CertificateTemplate) {
    const { width } = this.design.layout
    let yPosition = 75
    // "This is to certify that" text with elegant styling
    this.pdf.setFontSize(16)
    this.pdf.setTextColor(31, 41, 55) // Dark gray
    this.pdf.setFont('helvetica', 'normal')
    const certifyText = template?.template_data?.custom_text?.subtitle || 'We hereby certify that'
    const certifyWidth = this.pdf.getTextWidth(certifyText)
    this.pdf.text(certifyText, (width - certifyWidth) / 2, yPosition)
    yPosition += 20
    // Student name with elegant underline
    this.pdf.setFontSize(26)
    this.pdf.setFont('helvetica', 'bold')
    this.pdf.setTextColor(37, 99, 235) // Blue
    const nameWidth = this.pdf.getTextWidth(data.studentName)
    const nameX = (width - nameWidth) / 2
    this.pdf.text(data.studentName, nameX, yPosition)
    // Add elegant underline for student name
    this.pdf.setLineWidth(0.8)
    this.pdf.setDrawColor(255, 107, 53)
    this.pdf.line(nameX - 10, yPosition + 3, nameX + nameWidth + 10, yPosition + 3)
    yPosition += 25
    // Course completion text
    this.pdf.setFontSize(16)
    this.pdf.setFont('helvetica', 'normal')
    this.pdf.setTextColor(31, 41, 55)
    const completedText = 'has successfully completed the course'
    const completedWidth = this.pdf.getTextWidth(completedText)
    this.pdf.text(completedText, (width - completedWidth) / 2, yPosition)
    yPosition += 20
    // Course name with decorative box
    this.pdf.setFontSize(20)
    this.pdf.setFont('helvetica', 'bold')
    this.pdf.setTextColor(255, 107, 53) // Orange
    const courseWidth = this.pdf.getTextWidth(data.courseName)
    const courseX = (width - courseWidth) / 2
    // Add decorative background for course name
    this.pdf.setFillColor(255, 107, 53, 0.1)
    this.pdf.roundedRect(courseX - 15, yPosition - 8, courseWidth + 30, 12, 3, 3, 'F')
    this.pdf.text(data.courseName, courseX, yPosition)
    yPosition += 20
    // Gurukul name with icon-like decoration
    this.pdf.setFontSize(14)
    this.pdf.setFont('helvetica', 'italic')
    this.pdf.setTextColor(31, 41, 55)
    const gurukulText = `at ${data.gurukulName}`
    const gurukulWidth = this.pdf.getTextWidth(gurukulText)
    this.pdf.text(gurukulText, (width - gurukulWidth) / 2, yPosition)
    yPosition += 20
    // Completion date with decorative elements
    this.pdf.setFontSize(12)
    this.pdf.setFont('helvetica', 'normal')
    this.pdf.setTextColor(107, 114, 128) // Gray
    const dateText = `Completed on ${new Date(data.completionDate).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    })}`
    const dateWidth = this.pdf.getTextWidth(dateText)
    this.pdf.text(dateText, (width - dateWidth) / 2, yPosition)
  }
  private async addSignatures(template?: CertificateTemplate) {
    const { width, height } = this.design.layout
    const yPosition = height - 55 // Moved down from -70 to -55
    // Add decorative seal/emblem - positioned further right above President signature
    const presidentX = width * 0.72
    this.addOfficialSeal(presidentX + 10, yPosition - 25, template)
    // Signature placeholders with elegant styling
    this.pdf.setFontSize(11)
    this.pdf.setFont('helvetica', 'normal')
    this.pdf.setTextColor(31, 41, 55)
    // Vice Chancellor signature
    const vcX = width * 0.28
    try {
      if (template?.template_data?.signatures?.vice_chancellor_signature_data) {
        this.pdf.addImage(
          template.template_data.signatures.vice_chancellor_signature_data,
          'JPEG',
          vcX - 25,
          yPosition - 15,
          50,
          15,
        )
      } else {
        // Fallback signature line
        this.pdf.setLineWidth(0.5)
        this.pdf.setDrawColor(107, 114, 128)
        this.pdf.line(vcX - 35, yPosition, vcX + 35, yPosition)
      }
    } catch {
      // Image loading failed, fallback handled above
    }
    this.pdf.setFont('helvetica', 'bold')
    this.pdf.text('Dr. Vice Chancellor', vcX - 25, yPosition + 8)
    this.pdf.setFont('helvetica', 'normal')
    this.pdf.setFontSize(9)
    this.pdf.text('Academic Authority', vcX - 20, yPosition + 14)
    // President signature
    const presX = width * 0.72
    try {
      if (template?.template_data?.signatures?.president_signature_data) {
        this.pdf.addImage(
          template.template_data.signatures.president_signature_data,
          'JPEG',
          presX - 25,
          yPosition - 15,
          50,
          15,
        )
      } else {
        // Fallback signature line
        this.pdf.setLineWidth(0.5)
        this.pdf.setDrawColor(107, 114, 128)
        this.pdf.line(presX - 35, yPosition, presX + 35, yPosition)
      }
    } catch {
      // Image loading failed, fallback handled above
    }
    this.pdf.setFontSize(11)
    this.pdf.setFont('helvetica', 'bold')
    this.pdf.text('President', presX - 15, yPosition + 8)
    this.pdf.setFont('helvetica', 'normal')
    this.pdf.setFontSize(9)
    this.pdf.text('eYogi Gurukul', presX - 18, yPosition + 14)
  }
  private addFooter(data: CertificateData) {
    const { width, height } = this.design.layout
    // Certificate details with elegant formatting (positioned properly at bottom)
    this.pdf.setFontSize(8)
    this.pdf.setFont('helvetica', 'normal')
    this.pdf.setTextColor(107, 114, 128) // Lighter gray
    // Left side details - moved more to the right for better positioning
    this.pdf.text(`Certificate No: ${data.certificateNumber}`, 60, height - 28)
    this.pdf.text(`Student ID: ${data.studentId}`, 60, height - 23)
    this.pdf.text(`Course ID: ${data.courseId}`, 60, height - 18)
    // Right side verification details - moved even further right
    this.pdf.text(`Verification Code: ${data.verificationCode}`, width - 90, height - 28)
    this.pdf.text(
      `Issue Date: ${new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}`,
      width - 90,
      height - 23,
    )
    this.pdf.text(`Verify at: verify.eyogigurukul.com`, width - 90, height - 18)
    // Add subtle separator line above footer
    this.pdf.setLineWidth(0.3)
    this.pdf.setDrawColor(199, 210, 254)
    this.pdf.line(20, height - 35, width - 20, height - 35)
  }
  private addCornerDecorations() {
    const { width, height } = this.design.layout
    // Add ornamental corner elements
    this.pdf.setFillColor(255, 107, 53, 0.3)
    // Top left corner
    this.pdf.circle(20, 20, 8, 'F')
    this.pdf.setFillColor(37, 99, 235, 0.3)
    this.pdf.circle(20, 20, 5, 'F')
    // Top right corner
    this.pdf.setFillColor(255, 107, 53, 0.3)
    this.pdf.circle(width - 20, 20, 8, 'F')
    this.pdf.setFillColor(37, 99, 235, 0.3)
    this.pdf.circle(width - 20, 20, 5, 'F')
    // Bottom left corner
    this.pdf.setFillColor(255, 107, 53, 0.3)
    this.pdf.circle(20, height - 20, 8, 'F')
    this.pdf.setFillColor(37, 99, 235, 0.3)
    this.pdf.circle(20, height - 20, 5, 'F')
    // Bottom right corner
    this.pdf.setFillColor(255, 107, 53, 0.3)
    this.pdf.circle(width - 20, height - 20, 8, 'F')
    this.pdf.setFillColor(37, 99, 235, 0.3)
    this.pdf.circle(width - 20, height - 20, 5, 'F')
  }
  private addTitleDecorations(width: number) {
    // Add decorative flourishes under the title
    this.pdf.setLineWidth(2)
    this.pdf.setDrawColor(255, 107, 53)
    // Central decorative element
    this.pdf.line(width / 2 - 40, 56, width / 2 - 10, 56)
    this.pdf.line(width / 2 + 10, 56, width / 2 + 40, 56)
    // Add small decorative circles
    this.pdf.setFillColor(255, 107, 53)
    this.pdf.circle(width / 2 - 5, 56, 2, 'F')
    this.pdf.circle(width / 2, 56, 3, 'F')
    this.pdf.circle(width / 2 + 5, 56, 2, 'F')
  }
  private addDecorativeElements() {
    const { width, height } = this.design.layout
    // Add side decorative borders
    this.pdf.setLineWidth(1)
    this.pdf.setDrawColor(255, 107, 53, 0.5)
    // Left side decoration
    for (let y = 60; y < height - 80; y += 10) {
      this.pdf.line(25, y, 30, y)
    }
    // Right side decoration
    for (let y = 60; y < height - 80; y += 10) {
      this.pdf.line(width - 30, y, width - 25, y)
    }
  }
  private async addLogos(template?: CertificateTemplate) {
    const { width } = this.design.layout
    try {
      // Left logo (eYogi)
      if (template?.template_data?.logos?.eyogi_logo_data) {
        this.pdf.addImage(template.template_data.logos.eyogi_logo_data, 'JPEG', 30, 18, 25, 25)
      } else {
        // Fallback placeholder
        this.pdf.setFillColor(255, 107, 53, 0.1)
        this.pdf.roundedRect(30, 18, 25, 25, 3, 3, 'F')
        this.pdf.setFontSize(8)
        this.pdf.setTextColor(255, 107, 53)
        this.pdf.text('eYogi', 37, 33)
      }
      // Right logo (SSH)
      if (template?.template_data?.logos?.ssh_logo_data) {
        this.pdf.addImage(
          template.template_data.logos.ssh_logo_data,
          'JPEG',
          width - 55,
          18,
          25,
          25,
        )
      } else {
        // Fallback placeholder
        this.pdf.setFillColor(37, 99, 235, 0.1)
        this.pdf.roundedRect(width - 55, 18, 25, 25, 3, 3, 'F')
        this.pdf.setFontSize(8)
        this.pdf.setTextColor(37, 99, 235)
        this.pdf.text('SSH', width - 47, 33)
      }
    } catch {
      // Fall back to placeholders if image loading fails
    }
  }
  private addOfficialSeal(x: number, y: number, template?: CertificateTemplate) {
    try {
      if (template?.template_data?.seal?.official_seal_data) {
        this.pdf.addImage(
          template.template_data.seal.official_seal_data,
          'JPEG',
          x - 15,
          y - 15,
          30,
          30,
        )
      } else {
        // Fallback placeholder seal
        this.pdf.setFillColor(255, 107, 53, 0.1)
        this.pdf.circle(x, y, 15, 'F')
        this.pdf.setLineWidth(1)
        this.pdf.setDrawColor(255, 107, 53)
        this.pdf.circle(x, y, 15)
        this.pdf.circle(x, y, 12)
        this.pdf.setFontSize(6)
        this.pdf.setTextColor(255, 107, 53)
        this.pdf.text('OFFICIAL', x - 8, y - 2)
        this.pdf.text('SEAL', x - 5, y + 3)
      }
    } catch {
      // Image loading failed, fallback handled above
    }
  }
}
export async function generateCertificatePDF(
  data: CertificateData,
  template?: CertificateTemplate,
): Promise<Blob> {
  const generator = new CertificateGenerator()
  return await generator.generateCertificate(data, template)
}
export async function generateCertificatePreview(
  data: CertificateData,
  template?: CertificateTemplate,
): Promise<string> {
  const generator = new CertificateGenerator()
  return await generator.generatePreview(data, template)
}
