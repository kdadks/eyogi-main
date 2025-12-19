import { sendWelcomeEmail } from '@/lib/email/graphEmailService'

export interface WelcomeEmailPayload {
  email: string
  fullName: string
  loginLink: string
  role: 'student' | 'teacher' | 'parent' | 'admin' | 'business_admin' | 'super_admin'
}

export async function POST(req: Request) {
  try {
    const payload: WelcomeEmailPayload = await req.json()

    const result = await sendWelcomeEmail({
      email: payload.email,
      fullName: payload.fullName,
      loginLink: payload.loginLink,
      role: payload.role,
    })

    if (result) {
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
