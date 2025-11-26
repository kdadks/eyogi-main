import jsPDF from 'jspdf'
import * as pdfjsLib from 'pdfjs-dist'
import { CertificateTemplate } from '@/types'

// Set up PDF.js worker
if (typeof window !== 'undefined') {
  const workerSrc = new URL('pdfjs-dist/build/pdf.worker.min.mjs', import.meta.url).href
  pdfjsLib.GlobalWorkerOptions.workerSrc = workerSrc
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
    })
  }
  async generateCertificate(data: CertificateData, template?: CertificateTemplate): Promise<Blob> {
    try {
      // Check if this is an image-based template
      if (template?.template_data?.template_image) {
        console.log('Generating image-based certificate using template image')
        return await this.generateImageBasedCertificate(data, template)
      }

      // Otherwise, generate design-based certificate
      console.log('Generating design-based certificate')
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

  private async generateImageBasedCertificate(
    data: CertificateData,
    template: CertificateTemplate,
  ): Promise<Blob> {
    try {
      const { width, height } = this.design.layout

      // Load and add the template image as the background
      const templateImageUrl = template.template_data?.template_image
      if (!templateImageUrl) {
        throw new Error('Template image URL not found')
      }

      console.log('Loading template image:', templateImageUrl)

      // Fetch the image
      const response = await fetch(templateImageUrl)
      if (!response.ok) {
        throw new Error(`Failed to fetch template image: ${response.statusText}`)
      }

      const blob = await response.blob()
      const arrayBuffer = await blob.arrayBuffer()
      const uint8Array = new Uint8Array(arrayBuffer)
      const binaryString = Array.from(uint8Array)
        .map((byte) => String.fromCharCode(byte))
        .join('')
      const base64String = btoa(binaryString)

      // Determine image format
      const format = templateImageUrl.toLowerCase().includes('.png') ? 'PNG' : 'JPEG'

      // Add the template image as the background
      this.pdf.addImage(
        `data:image/${format.toLowerCase()};base64,${base64String}`,
        format,
        0,
        0,
        width,
        height,
      )

      // Get dynamic fields from template
      const dynamicFields = template.template_data?.dynamic_fields || []

      // If dynamic fields are configured, use them
      if (dynamicFields.length > 0) {
        console.log('Rendering certificate with dynamic fields:', dynamicFields.length)

        // Load the template image to get actual dimensions
        const img = new Image()
        img.src = templateImageUrl
        await new Promise((resolve, reject) => {
          img.onload = resolve
          img.onerror = reject
        })

        const templateWidth = img.naturalWidth
        const templateHeight = img.naturalHeight
        console.log('Template dimensions:', templateWidth, 'x', templateHeight)

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

        // Render each dynamic field
        for (const field of dynamicFields) {
          const value = fieldValues[field.name] || ''
          if (!value) continue

          // Convert pixel positions to PDF mm based on actual template dimensions
          // Fields are positioned in pixels on the template image
          const xPos = (field.x / templateWidth) * width
          const yPos = (field.y / templateHeight) * height
          const fieldWidth = (field.width / templateWidth) * width

          console.log(`Rendering field ${field.name} at x:${xPos}, y:${yPos} (original: ${field.x}, ${field.y})`)

          // Parse color (hex to RGB) and apply formatting
          const color = this.hexToRgb(field.fontColor || '#000000')
          this.pdf.setTextColor(color.r, color.g, color.b)

          // Set font with proper style
          // Map common font families to jsPDF supported fonts
          let pdfFont = 'helvetica'
          const fontFamily = (field.fontFamily || 'Arial').toLowerCase()

          if (fontFamily.includes('times') || fontFamily.includes('serif')) {
            pdfFont = 'times'
          } else if (fontFamily.includes('courier') || fontFamily.includes('mono')) {
            pdfFont = 'courier'
          } else {
            pdfFont = 'helvetica' // Default for Arial, Helvetica, Sans-serif, etc.
          }

          const fontStyle = field.isBold && field.isItalic ? 'bolditalic' :
                           field.isBold ? 'bold' :
                           field.isItalic ? 'italic' : 'normal'
          this.pdf.setFont(pdfFont, fontStyle)

          // Scale font size appropriately
          const scaledFontSize = (field.fontSize || 12) * (width / templateWidth)
          this.pdf.setFontSize(scaledFontSize)

          // Calculate text position based on alignment within the field width
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

      // Get template dimensions (reuse from above if available)
      let templateWidth = 700  // Default fallback
      let templateHeight = 500 // Default fallback

      if (dynamicFields.length > 0) {
        // Already loaded above
        const img = new Image()
        img.src = templateImageUrl
        try {
          await new Promise((resolve, reject) => {
            img.onload = resolve
            img.onerror = reject
            setTimeout(reject, 1000) // Timeout after 1s
          })
          templateWidth = img.naturalWidth
          templateHeight = img.naturalHeight
        } catch (error) {
          console.warn('Could not load template dimensions, using defaults')
        }
      }

      // Render Secretary signature if configured
      if (template.template_data?.signature_positions?.secretary) {
        const secretaryPos = template.template_data.signature_positions.secretary
        const secretaryName = template.template_data.signatures?.vice_chancellor_name || 'President'
        const secretarySigData = template.template_data.signatures?.vice_chancellor_signature_data

        // Convert pixel positions to PDF mm based on actual template dimensions
        const xPos = (secretaryPos.x / templateWidth) * width
        const yPos = (secretaryPos.y / templateHeight) * height
        const sigWidth = (secretaryPos.width / templateWidth) * width
        const sigHeight = (secretaryPos.height / templateHeight) * height

        try {
          if (secretarySigData) {
            // Add signature image
            this.pdf.addImage(secretarySigData, 'PNG', xPos, yPos, sigWidth, sigHeight)
          }
        } catch (error) {
          console.warn('Failed to add secretary signature:', error)
        }

        // Add secretary name below signature
        this.pdf.setFont('helvetica', 'bold')
        const scaledFontSize = 10 * (width / templateWidth)
        this.pdf.setFontSize(scaledFontSize)
        this.pdf.setTextColor(0, 0, 0)
        const nameWidth = this.pdf.getTextWidth(secretaryName)
        this.pdf.text(secretaryName, xPos + (sigWidth - nameWidth) / 2, yPos + sigHeight + 4)
      }

      // Render Chancellor signature if configured
      if (template.template_data?.signature_positions?.chancellor) {
        const chancellorPos = template.template_data.signature_positions.chancellor
        const chancellorName = template.template_data.signatures?.president_name || 'Chancellor'
        const chancellorSigData = template.template_data.signatures?.president_signature_data

        // Convert pixel positions to PDF mm based on actual template dimensions
        const xPos = (chancellorPos.x / templateWidth) * width
        const yPos = (chancellorPos.y / templateHeight) * height
        const sigWidth = (chancellorPos.width / templateWidth) * width
        const sigHeight = (chancellorPos.height / templateHeight) * height

        try {
          if (chancellorSigData) {
            // Add signature image
            this.pdf.addImage(chancellorSigData, 'PNG', xPos, yPos, sigWidth, sigHeight)
          }
        } catch (error) {
          console.warn('Failed to add chancellor signature:', error)
        }

        // Add chancellor name below signature
        this.pdf.setFont('helvetica', 'bold')
        const scaledFontSize = 10 * (width / templateWidth)
        this.pdf.setFontSize(scaledFontSize)
        this.pdf.setTextColor(0, 0, 0)
        const nameWidth = this.pdf.getTextWidth(chancellorName)
        this.pdf.text(chancellorName, xPos + (sigWidth - nameWidth) / 2, yPos + sigHeight + 4)
      }

      // Render text message if configured
      if (template.template_data?.text_message) {
        const textMsg = template.template_data.text_message

        // Convert pixel positions to PDF mm based on actual template dimensions
        const xPos = (textMsg.x / templateWidth) * width
        const yPos = (textMsg.y / templateHeight) * height
        const msgWidth = (textMsg.width / templateWidth) * width

        // Parse color
        const color = this.hexToRgb(textMsg.fontColor || '#000000')
        this.pdf.setTextColor(color.r, color.g, color.b)

        // Map font family to jsPDF supported fonts
        let pdfFont = 'helvetica'
        const fontFamily = (textMsg.fontFamily || 'Arial').toLowerCase()

        if (fontFamily.includes('times') || fontFamily.includes('serif') || fontFamily.includes('georgia')) {
          pdfFont = 'times'
        } else if (fontFamily.includes('courier') || fontFamily.includes('mono')) {
          pdfFont = 'courier'
        } else {
          pdfFont = 'helvetica' // Default for Arial, Helvetica, Sans-serif, etc.
        }

        // Set font with proper style
        const fontStyle = textMsg.isBold && textMsg.isItalic ? 'bolditalic' :
                         textMsg.isBold ? 'bold' :
                         textMsg.isItalic ? 'italic' : 'normal'
        this.pdf.setFont(pdfFont, fontStyle)

        // Scale font size
        const scaledFontSize = (textMsg.fontSize || 12) * (width / templateWidth)
        this.pdf.setFontSize(scaledFontSize)

        // Split text if it's too long for the width
        const lines = this.pdf.splitTextToSize(textMsg.text, msgWidth)

        // Render text with proper alignment
        lines.forEach((line: string, index: number) => {
          const lineWidth = this.pdf.getTextWidth(line)
          let textX = xPos

          // Apply text alignment
          const textAlign = textMsg.textAlign || 'center'
          if (textAlign === 'center') {
            textX = xPos + (msgWidth - lineWidth) / 2
          } else if (textAlign === 'right') {
            textX = xPos + msgWidth - lineWidth
          }
          // For 'left', textX remains as xPos

          this.pdf.text(line, textX, yPos + (index * scaledFontSize * 0.4))
        })
      }

      // Only use fallback if no dynamic fields configured
      if (dynamicFields.length === 0) {
        // Fallback: Use default hardcoded positions if no dynamic fields configured
        console.log('No dynamic fields found, using default positions')

        // Add student name
        this.pdf.setFont('helvetica', 'bold')
        this.pdf.setFontSize(26)
        this.pdf.setTextColor(37, 99, 235) // Blue
        const nameWidth = this.pdf.getTextWidth(data.studentName)
        this.pdf.text(data.studentName, (width - nameWidth) / 2, 120)

        // Add course name
        this.pdf.setFontSize(16)
        this.pdf.setTextColor(255, 107, 53) // Orange
        const courseWidth = this.pdf.getTextWidth(data.courseName)
        this.pdf.text(data.courseName, (width - courseWidth) / 2, 145)

        // Add completion date
        this.pdf.setFontSize(12)
        this.pdf.setTextColor(31, 41, 55) // Dark gray
        const completionDateText = `Date: ${new Date(data.completionDate).toLocaleDateString()}`
        const dateWidth = this.pdf.getTextWidth(completionDateText)
        this.pdf.text(completionDateText, (width - dateWidth) / 2, 170)

        // Add certificate number and verification code at bottom
        this.pdf.setFontSize(10)
        this.pdf.setTextColor(100, 100, 100)
        this.pdf.text(`Certificate #: ${data.certificateNumber}`, 20, height - 15)
        this.pdf.text(`Verification Code: ${data.verificationCode}`, width - 120, height - 15)
      }

      return this.pdf.output('blob')
    } catch (error) {
      console.error('Error generating image-based certificate:', error)
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
