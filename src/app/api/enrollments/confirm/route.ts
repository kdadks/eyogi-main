import { sendEnrollmentConfirmationEmail } from '@/lib/email/emailService'

export interface EnrollmentConfirmationEmailPayload {
  studentEmail: string
  studentFullName: string
  courseName: string
  courseDescription?: string
}

export async function POST(req: Request) {
  try {
    const payload: EnrollmentConfirmationEmailPayload = await req.json()

    // Validate required fields
    if (!payload.studentEmail || !payload.studentFullName || !payload.courseName) {
      return Response.json(
        { error: 'Missing required fields: studentEmail, studentFullName, or courseName' },
        { status: 400 },
      )
    }

    // Send the enrollment confirmation email
    const emailSent = await sendEnrollmentConfirmationEmail({
      studentEmail: payload.studentEmail,
      studentFullName: payload.studentFullName,
      courseName: payload.courseName,
      courseDescription: payload.courseDescription,
      confirmationDate: new Date().toISOString(),
    })

    if (!emailSent) {
      console.warn('Enrollment confirmation email could not be sent, but enrollment was approved')
      // Don't fail the enrollment if email fails - log it but continue
      return Response.json({
        success: true,
        message: 'Enrollment confirmed successfully. Confirmation email could not be sent.',
      })
    }

    return Response.json({
      success: true,
      message: 'Enrollment confirmed successfully. Confirmation email sent to student.',
    })
  } catch (error) {
    console.error('Enrollment confirmation email endpoint error:', error)
    return Response.json(
      { error: 'Failed to process enrollment confirmation email' },
      { status: 500 },
    )
  }
}
