import { NextResponse } from 'next/server'
import nodemailer from 'nodemailer'

export async function GET() {
  try {
    // Check environment variables
    const config = {
      SMTP_HOST: process.env.SMTP_HOST,
      SMTP_PORT: process.env.SMTP_PORT,
      SMTP_USER: process.env.SMTP_USER,
      SMTP_PASS: process.env.SMTP_PASS ? '***SET***' : undefined,
      SMTP_FROM_NAME: process.env.SMTP_FROM_NAME,
      SMTP_FROM_EMAIL: process.env.SMTP_FROM_EMAIL,
      REGISTRATION_EMAIL_TO: process.env.REGISTRATION_EMAIL_TO,
    }

    console.log('Email Configuration:', config)

    // Check if all required variables are set
    const missing: string[] = []
    if (!process.env.SMTP_HOST) missing.push('SMTP_HOST')
    if (!process.env.SMTP_PORT) missing.push('SMTP_PORT')
    if (!process.env.SMTP_USER) missing.push('SMTP_USER')
    if (!process.env.SMTP_PASS) missing.push('SMTP_PASS')

    if (missing.length > 0) {
      return NextResponse.json(
        {
          status: 'error',
          message: 'Missing required environment variables',
          missing,
          config,
        },
        { status: 500 },
      )
    }

    // Create test transporter
    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: parseInt(process.env.SMTP_PORT!, 10),
      secure: parseInt(process.env.SMTP_PORT!, 10) === 465,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
      tls: {
        rejectUnauthorized: false,
      },
    })

    // Verify connection
    await transporter.verify()
    console.log('✓ SMTP connection verified')

    // Send test email
    const testEmail = {
      from: `${process.env.SMTP_FROM_NAME || 'eYogi Gurukul'} <${process.env.SMTP_FROM_EMAIL || process.env.SMTP_USER}>`,
      to: process.env.REGISTRATION_EMAIL_TO || process.env.SMTP_USER,
      subject: 'Test Email - eYogi Gurukul',
      html: `
        <h1>Email Test Successful</h1>
        <p>This is a test email from eYogi Gurukul.</p>
        <p><strong>Time:</strong> ${new Date().toISOString()}</p>
        <p><strong>Environment:</strong> ${process.env.NODE_ENV}</p>
      `,
    }

    const info = await transporter.sendMail(testEmail)
    console.log('✓ Test email sent:', info.messageId)

    return NextResponse.json({
      status: 'success',
      message: 'Email sent successfully',
      messageId: info.messageId,
      to: testEmail.to,
      config,
    })
  } catch (error) {
    console.error('Email test error:', error)
    return NextResponse.json(
      {
        status: 'error',
        message: error instanceof Error ? error.message : 'Unknown error',
        details: String(error),
      },
      { status: 500 },
    )
  }
}
