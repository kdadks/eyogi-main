'use server'

import { sendCertificateIssuedEmail } from '@/lib/email/emailService'

type CertificateIssuedData = {
  parentEmail: string
  studentName: string
  courseName: string
  certificateUrl: string
}

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as CertificateIssuedData

    if (!body.parentEmail || !body.studentName || !body.courseName || !body.certificateUrl) {
      return Response.json({ error: 'Missing required fields' }, { status: 400 })
    }

    const emailSent = await sendCertificateIssuedEmail({
      parentEmail: body.parentEmail,
      studentName: body.studentName,
      courseName: body.courseName,
      certificateUrl: body.certificateUrl,
    })

    if (!emailSent) {
      console.warn('Certificate issued email could not be sent')
      return Response.json(
        { error: 'Email service is currently unavailable. Please try again later.' },
        { status: 503 },
      )
    }

    return Response.json({
      success: true,
      message: 'Certificate issued email sent successfully',
    })
  } catch (error) {
    console.error('Certificate issued email error:', error)
    return Response.json(
      { error: 'Failed to send certificate email. Please try again later.' },
      { status: 500 },
    )
  }
}
