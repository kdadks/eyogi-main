import React, { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { supabaseAdmin } from '../../lib/supabase'

interface CertificateData {
  student_name: string
  course_title: string
  certificate_number: string
  verification_code: string
  completion_date: string
  template_name?: string
}

export default function CertificateViewer() {
  const { certificateNumber } = useParams<{ certificateNumber: string }>()
  const [certificateData, setCertificateData] = useState<CertificateData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchCertificateData = async () => {
      if (!certificateNumber) {
        setError('Certificate number not provided')
        setLoading(false)
        return
      }

      console.log('Loading certificate:', certificateNumber)

      try {
        // Extract certificate info from the certificate number
        // Format: CERT-timestamp-enrollmentId
        const parts = certificateNumber.replace('.pdf', '').split('-')
        if (parts.length !== 3) {
          setError('Invalid certificate number format')
          setLoading(false)
          return
        }

        // Find certificate by certificate number
        const { data: certificates, error: fetchError } = await supabaseAdmin
          .from('certificates')
          .select(
            `
            *,
            courses(*),
            profiles!certificates_student_id_fkey(*)
          `,
          )
          .eq('certificate_number', certificateNumber)

        if (fetchError) {
          console.error('Error fetching certificate:', fetchError)
          setError('Error loading certificate data')
          setLoading(false)
          return
        }

        if (!certificates || certificates.length === 0) {
          setError('Certificate not found')
          setLoading(false)
          return
        }

        const certificate = certificates[0]
        const profile = certificate.profiles
        const course = certificate.courses

        // Get template info if template_id exists
        let templateName = 'Standard Certificate'
        if (certificate.template_id) {
          try {
            const { data: template } = await supabaseAdmin
              .from('certificate_templates')
              .select('name')
              .eq('id', certificate.template_id)
              .single()

            if (template) {
              templateName = template.name
            }
          } catch (error) {
            console.warn('Could not fetch template name:', error)
          }
        }

        setCertificateData({
          student_name: profile?.full_name || 'Student Name',
          course_title: course?.title || 'Course Title',
          certificate_number: certificateNumber.replace('.pdf', ''),
          verification_code: certificate.verification_code || 'N/A',
          completion_date: certificate.issue_date || certificate.completion_date,
          template_name: templateName,
        })
      } catch (err) {
        console.error('Error:', err)
        setError('Failed to load certificate')
      } finally {
        setLoading(false)
      }
    }

    fetchCertificateData()
  }, [certificateNumber])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading certificate: {certificateNumber}</p>
          <p className="mt-2 text-sm text-gray-500">Certificate viewer is working!</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="text-center">
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
            <p className="font-bold">Error</p>
            <p>{error}</p>
          </div>
        </div>
      </div>
    )
  }

  if (!certificateData) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="text-center">
          <p className="text-gray-600">Certificate data not available</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-100 py-8">
      <div className="max-w-4xl mx-auto px-4">
        {/* Certificate */}
        <div className="bg-white shadow-2xl rounded-lg overflow-hidden">
          {/* Header */}
          <div className="bg-gradient-to-r from-blue-600 to-purple-600 px-8 py-6 text-white text-center">
            <h1 className="text-3xl font-bold mb-2">eYogi SSH Gurukul</h1>
            <h2 className="text-xl font-semibold">Certificate of Completion</h2>
          </div>

          {/* Certificate Content */}
          <div className="px-8 py-12">
            <div className="text-center mb-8">
              <p className="text-lg text-gray-600 mb-6">This is to certify that</p>
              <h3 className="text-4xl font-bold text-gray-800 mb-6 border-b-2 border-gray-300 pb-2 inline-block">
                {certificateData.student_name}
              </h3>
              <p className="text-lg text-gray-600 mb-6">has successfully completed the course</p>
              <h4 className="text-2xl font-semibold text-blue-600 mb-8">
                {certificateData.course_title}
              </h4>
              <p className="text-gray-600 mb-6">
                on {new Date(certificateData.completion_date).toLocaleDateString()}
              </p>
            </div>

            {/* Certificate Details */}
            <div className="flex justify-between items-center border-t pt-6">
              <div className="text-left">
                <p className="text-sm text-gray-600">Certificate Number:</p>
                <p className="font-semibold">{certificateData.certificate_number}</p>
              </div>
              <div className="text-center">
                <p className="text-sm text-gray-600">Template:</p>
                <p className="font-semibold">{certificateData.template_name}</p>
              </div>
              <div className="text-right">
                <p className="text-sm text-gray-600">Verification Code:</p>
                <p className="font-semibold">{certificateData.verification_code}</p>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="bg-gray-50 px-8 py-4 text-center text-sm text-gray-600">
            <p>This certificate verifies successful completion of the course.</p>
            <p className="mt-1">Verify authenticity at: ssh.eyogigurukul.com</p>
          </div>
        </div>

        {/* Print Button */}
        <div className="text-center mt-6">
          <button
            onClick={() => window.print()}
            className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded inline-flex items-center"
          >
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z"
              />
            </svg>
            Print Certificate
          </button>
        </div>
      </div>
    </div>
  )
}
