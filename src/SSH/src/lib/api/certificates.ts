import { Certificate } from '@/types'

const STORAGE_KEY = 'eyogi_certificates'

export async function getStudentCertificates(studentId: string): Promise<Certificate[]> {
  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 200))
  
  const certificates = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]')
  const courses = JSON.parse(localStorage.getItem('eyogi_courses') || '[]')
  const gurukuls = JSON.parse(localStorage.getItem('eyogi_gurukuls') || '[]')
  
  return certificates
    .filter((cert: Certificate) => cert.student_id === studentId)
    .map((cert: Certificate) => {
      const course = courses.find((c: any) => c.id === cert.course_id)
      const gurukul = course ? gurukuls.find((g: any) => g.id === course.gurukul_id) : null
      
      return {
        ...cert,
        course: course ? { ...course, gurukul } : null
      }
    })
}

export async function downloadCertificate(certificateId: string): Promise<void> {
  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 300))
  
  // In a real app, this would trigger a file download
  console.log('Downloading certificate:', certificateId)
}

export async function issueCertificate(enrollmentId: string): Promise<Certificate> {
  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 400))
  
  const enrollments = JSON.parse(localStorage.getItem('eyogi_enrollments') || '[]')
  const certificates = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]')
  
  const enrollment = enrollments.find((e: any) => e.id === enrollmentId)
  if (!enrollment) {
    throw new Error('Enrollment not found')
  }
  
  if (enrollment.status !== 'completed') {
    throw new Error('Can only issue certificates for completed courses')
  }
  
  if (enrollment.certificate_issued) {
    throw new Error('Certificate already issued for this enrollment')
  }
  
  const certificateNumber = `CERT-${Date.now()}`
  const verificationCode = Math.random().toString(36).substr(2, 9).toUpperCase()
  
  const newCertificate: Certificate = {
    id: Math.random().toString(36).substr(2, 9) + Date.now().toString(36),
    enrollment_id: enrollmentId,
    student_id: enrollment.student_id,
    course_id: enrollment.course_id,
    certificate_number: certificateNumber,
    template_id: 'default-template',
    issued_at: new Date().toISOString(),
    issued_by: 'system', // In real app, this would be the current user ID
    verification_code: verificationCode,
    certificate_data: {
      student_name: enrollment.student?.full_name,
      course_title: enrollment.course?.title,
      completion_date: enrollment.completed_at || new Date().toISOString()
    },
    file_url: `https://certificates.eyogigurukul.com/${certificateNumber}.pdf`,
    created_at: new Date().toISOString()
  }
  
  certificates.push(newCertificate)
  localStorage.setItem(STORAGE_KEY, JSON.stringify(certificates))
  
  // Update enrollment to mark certificate as issued
  const enrollmentIndex = enrollments.findIndex((e: any) => e.id === enrollmentId)
  if (enrollmentIndex !== -1) {
    enrollments[enrollmentIndex].certificate_issued = true
    enrollments[enrollmentIndex].certificate_url = newCertificate.file_url
    localStorage.setItem('eyogi_enrollments', JSON.stringify(enrollments))
  }
  
  return newCertificate
}

export async function bulkIssueCertificates(enrollmentIds: string[]): Promise<Certificate[]> {
  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 600))
  
  const certificates: Certificate[] = []
  
  for (const enrollmentId of enrollmentIds) {
    try {
      const certificate = await issueCertificate(enrollmentId)
      certificates.push(certificate)
    } catch (error) {
      console.error(`Failed to issue certificate for enrollment ${enrollmentId}:`, error)
    }
  }
  
  return certificates
}