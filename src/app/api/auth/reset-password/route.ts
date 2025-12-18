import { sendPasswordResetEmail } from '@/lib/email/graphEmailService'

export interface PasswordResetEmailPayload {
  email: string
  resetToken: string
  fullName?: string
}

export async function POST(req: Request) {
  try {
    const payload: PasswordResetEmailPayload = await req.json()

    // Validate required fields
    if (!payload.email || !payload.resetToken) {
      return Response.json(
        { error: 'Missing required fields: email or resetToken' },
        { status: 400 },
      )
    }

    // Construct reset URL
    const resetUrl = `${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:5173'}/reset-password?token=${payload.resetToken}`

    // Send the password reset email
    const emailSent = await sendPasswordResetEmail({
      email: payload.email,
      resetUrl,
      fullName: payload.fullName,
    })

    if (!emailSent) {
      console.warn('Password reset email could not be sent')
      return Response.json(
        {
          success: false,
          message: 'Failed to send password reset email',
        },
        { status: 500 },
      )
    }

    return Response.json({
      success: true,
      message: 'Password reset email sent successfully',
    })
  } catch (error) {
    console.error('Password reset email endpoint error:', error)
    return Response.json({ error: 'Failed to process password reset request' }, { status: 500 })
  }
}
