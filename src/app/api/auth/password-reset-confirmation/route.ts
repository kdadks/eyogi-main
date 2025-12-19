import { NextRequest, NextResponse } from 'next/server'
import { sendPasswordResetConfirmationEmail } from '@/lib/email/graphEmailService'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { email, fullName } = body

    if (!email) {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 })
    }

    if (!fullName) {
      return NextResponse.json({ error: 'Full name is required' }, { status: 400 })
    }

    const emailSent = await sendPasswordResetConfirmationEmail(email, fullName)

    if (!emailSent) {
      return NextResponse.json({ error: 'Failed to send confirmation email' }, { status: 500 })
    }

    return NextResponse.json(
      { message: 'Password reset confirmation email sent successfully' },
      { status: 200 },
    )
  } catch (error) {
    console.error('Error in password reset confirmation API:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
