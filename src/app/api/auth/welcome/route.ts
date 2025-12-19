import { sendWelcomeEmail } from '@/lib/email/emailService'

export interface WelcomeEmailPayload {
  email: string
  fullName: string
  loginLink: string
  role: 'student' | 'teacher' | 'parent' | 'admin' | 'business_admin' | 'super_admin'
}

export async function POST(req: Request) {
  try {
    const payload: WelcomeEmailPayload = await req.json()

    console.log('Welcome email API called with payload:', {
      email: payload.email,
      fullName: payload.fullName,
      role: payload.role,
      loginLink: payload.loginLink,
    })

    const result = await sendWelcomeEmail({
      email: payload.email,
      fullName: payload.fullName,
      loginLink: payload.loginLink,
      role: payload.role,
    })

    if (result) {
      console.log('Welcome email sent successfully to:', payload.email)
      return new Response(
        JSON.stringify({
          success: true,
          message: 'Welcome email sent successfully',
        }),
        {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        },
      )
    } else {
      console.error('Failed to send welcome email to:', payload.email)
      return new Response(
        JSON.stringify({
          success: false,
          message: 'Failed to send welcome email',
        }),
        {
          status: 500,
          headers: { 'Content-Type': 'application/json' },
        },
      )
    }
  } catch (error) {
    console.error('Error in welcome email API:', error)
    return new Response(
      JSON.stringify({
        success: false,
        message: 'Internal server error',
        error: error instanceof Error ? error.message : 'Unknown error',
      }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      },
    )
  }
}
