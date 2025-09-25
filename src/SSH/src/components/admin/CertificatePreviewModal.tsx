import React, { useState, useEffect, useCallback } from 'react'
import { XMarkIcon, ArrowDownTrayIcon } from '@heroicons/react/24/outline'
import { Button } from '@/components/ui/Button'
import {
  generateCertificatePreview,
  generateCertificatePDF,
  CertificateData,
} from '@/lib/pdf/certificateGenerator'
import { CertificateTemplate } from '@/types'
import toast from 'react-hot-toast'
interface CertificatePreviewModalProps {
  isOpen: boolean
  onClose: () => void
  certificateData: CertificateData
  template?: CertificateTemplate
}
export default function CertificatePreviewModal({
  isOpen,
  onClose,
  certificateData,
  template,
}: CertificatePreviewModalProps) {
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [downloading, setDownloading] = useState(false)
  const loadPreview = useCallback(async () => {
    setLoading(true)
    try {
      const preview = await generateCertificatePreview(certificateData)
      setPreviewUrl(preview)
    } catch (error) {
      toast.error('Failed to generate certificate preview')
    } finally {
      setLoading(false)
    }
  }, [certificateData])
  useEffect(() => {
    if (isOpen && certificateData) {
      loadPreview()
    }
  }, [isOpen, certificateData, loadPreview])
  const handleDownload = async () => {
    setDownloading(true)
    try {
      const pdfBlob = await generateCertificatePDF(certificateData, template)
      const url = window.URL.createObjectURL(pdfBlob)
      const link = document.createElement('a')
      link.href = url
      link.download = `certificate-${certificateData.studentName.replace(/\s+/g, '-')}-${certificateData.courseId}.pdf`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      window.URL.revokeObjectURL(url)
      toast.success('Certificate downloaded successfully')
    } catch (error) {
      toast.error('Failed to download certificate')
    } finally {
      setDownloading(false)
    }
  }
  if (!isOpen) return null
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-xl font-bold text-gray-900">Certificate Preview</h2>
          <div className="flex items-center space-x-2">
            <Button
              onClick={handleDownload}
              disabled={downloading || loading}
              className="bg-orange-600 hover:bg-orange-700"
            >
              <ArrowDownTrayIcon className="h-4 w-4 mr-2" />
              {downloading ? 'Downloading...' : 'Download PDF'}
            </Button>
            <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg">
              <XMarkIcon className="h-5 w-5" />
            </button>
          </div>
        </div>
        {/* Preview Content */}
        <div className="p-6 overflow-auto max-h-[calc(90vh-120px)]">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="spinner w-8 h-8"></div>
              <span className="ml-3 text-gray-600">Generating preview...</span>
            </div>
          ) : previewUrl ? (
            <div className="flex justify-center">
              <iframe
                src={previewUrl}
                className="w-full h-[600px] border rounded-lg shadow-lg"
                title="Certificate Preview"
              />
            </div>
          ) : (
            <div className="text-center py-12">
              <p className="text-gray-600">Failed to generate preview</p>
              <Button onClick={loadPreview} className="mt-4">
                Try Again
              </Button>
            </div>
          )}
        </div>
        {/* Certificate Details */}
        <div className="px-6 pb-6">
          <div className="bg-gray-50 rounded-lg p-4">
            <h3 className="font-semibold text-gray-900 mb-2">Certificate Details</h3>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-gray-600">Student:</span>
                <span className="ml-2 font-medium">{certificateData.studentName}</span>
              </div>
              <div>
                <span className="text-gray-600">Student ID:</span>
                <span className="ml-2 font-medium">{certificateData.studentId}</span>
              </div>
              <div>
                <span className="text-gray-600">Course:</span>
                <span className="ml-2 font-medium">{certificateData.courseName}</span>
              </div>
              <div>
                <span className="text-gray-600">Course ID:</span>
                <span className="ml-2 font-medium">{certificateData.courseId}</span>
              </div>
              <div>
                <span className="text-gray-600">Gurukul:</span>
                <span className="ml-2 font-medium">{certificateData.gurukulName}</span>
              </div>
              <div>
                <span className="text-gray-600">Completion Date:</span>
                <span className="ml-2 font-medium">
                  {new Date(certificateData.completionDate).toLocaleDateString()}
                </span>
              </div>
              <div>
                <span className="text-gray-600">Certificate Number:</span>
                <span className="ml-2 font-medium font-mono">
                  {certificateData.certificateNumber}
                </span>
              </div>
              <div>
                <span className="text-gray-600">Verification Code:</span>
                <span className="ml-2 font-medium font-mono">
                  {certificateData.verificationCode}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
