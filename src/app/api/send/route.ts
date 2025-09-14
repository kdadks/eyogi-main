'use server'

import { EmailTemplate } from '@/resend/emailTemplate'
import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY)

type FormData = {
  name: string
  email: string
  message: string
  subject: string
}

export async function POST(req: Request) {
  const { name, email, message, subject }: FormData = await req.json()

  try {
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
    return Response.json({ error }, { status: 500 })
  }
}
