'use server'

import { sendContactFormEmail } from '@/lib/email/emailService'

type FormData = {
  name: string
  email: string
  message: string
  subject: string
}

export async function POST(req: Request) {
  try {
    const { name, email, message, subject }: FormData = await req.json()

    // Validate required fields
    if (!name || !email || !message || !subject) {
      return Response.json(
        { error: 'Missing required fields: name, email, message, or subject' },
        { status: 400 },
      )
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      return Response.json({ error: 'Invalid email format' }, { status: 400 })
    }

    // Validate message length (prevent spam)
    if (message.length > 5000) {
      return Response.json(
        { error: 'Message is too long (maximum 5000 characters)' },
        { status: 400 },
      )
    }

    // Send the contact form email
    const emailSent = await sendContactFormEmail({
      senderName: name,
      senderEmail: email,
      subject: subject,
      message: message,
      submissionDate: new Date().toISOString(),
    })

    if (!emailSent) {
      console.warn('Contact form email could not be sent')
      return Response.json(
        { error: 'Email service is currently unavailable. Please try again later.' },
        { status: 503 },
      )
    }

    return Response.json({
      success: true,
      message: 'Your message has been sent successfully. We will get back to you soon!',
    })
  } catch (error) {
    console.error('Contact form submission error:', error)
    return Response.json(
      { error: 'Failed to process your message. Please try again later.' },
      { status: 500 },
    )
  }
}
