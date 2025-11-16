import { sendRegistrationEmail } from '@/lib/email/emailService'

export interface RegistrationEmailPayload {
  email: string
  fullName: string
  role: 'student' | 'teacher' | 'parent' | 'admin' | 'business_admin' | 'super_admin'
  status: string
}

export async function POST(req: Request) {
  try {
    const payload: RegistrationEmailPayload = await req.json()

    // Validate required fields
    if (!payload.email || !payload.fullName || !payload.role) {
      return Response.json(
        { error: 'Missing required fields: email, fullName, or role' },
        { status: 400 },
      )
    }

    // Send the registration email
    const emailSent = await sendRegistrationEmail({
      email: payload.email,
      fullName: payload.fullName,
      role: payload.role,
      registrationDate: new Date().toISOString(),
      status: payload.status || 'active',
    })

    if (!emailSent) {
      console.warn('Email notification could not be sent, but registration completed')
      // Don't fail the registration if email fails - log it but continue
      return Response.json({
        success: true,
        message: 'User registered successfully. Email notification could not be sent.',
      })
    }

    return Response.json({
      success: true,
      message: 'User registered successfully. Notification email sent.',
    })
  } catch (error) {
    console.error('Registration email endpoint error:', error)
    return Response.json({ error: 'Failed to process registration email' }, { status: 500 })
  }
}
