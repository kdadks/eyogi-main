'use server'

import { EmailTemplate } from '@/resend/emailTemplate'
import { Resend } from 'resend'

// Initialize Resend only if API key is available
function getResendInstance() {
  const apiKey = process.env.RESEND_API_KEY
  if (!apiKey) {
    throw new Error('RESEND_API_KEY environment variable is not configured')
  }
  return new Resend(apiKey)
}

type FormData = {
  name: string
  email: string
  message: string
  subject: string
}

export async function POST(req: Request) {
  const { name, email, message, subject }: FormData = await req.json()

  try {
    // Check if Resend is configured
    if (!process.env.RESEND_API_KEY) {
      return Response.json(
        { error: 'Email service is not configured. Please contact the administrator.' },
        { status: 503 }
      )
    }

    const resend = getResendInstance()
    const { data, error } = await resend.emails.send({
      from: 'onboarding@resend.dev',
      to: ['Test@test.com'],
      subject: 'Contact from website',
      react: EmailTemplate({ name, subject, message, email }),
    })

    if (error) {
      return Response.json({ error }, { status: 500 })
    }

    return Response.json(data)
  } catch (error) {
    console.error('Email send error:', error)
    return Response.json(
      { error: 'Failed to send email. Please try again later.' },
      { status: 500 }
    )
  }
}
