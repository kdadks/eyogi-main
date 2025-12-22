'use server'

import { sendEmail } from '@/lib/email/graphEmailService'

interface SendEmailRequest {
  to: string
  subject: string
  message: string
}

/**
 * Generate HTML template for bulk communication email
 */
function generateBulkEmailHTML(message: string): string {
  // Sanitize message and convert line breaks to HTML
  const sanitizedMessage = message
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/\n/g, '<br>')

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <style>
        body {
          font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
          line-height: 1.6;
          color: #333;
          margin: 0;
          padding: 0;
          background-color: #f4f4f4;
        }
        .container {
          max-width: 600px;
          margin: 20px auto;
          background: white;
          border-radius: 10px;
          overflow: hidden;
          box-shadow: 0 0 20px rgba(0,0,0,0.1);
        }
        .header {
          background: linear-gradient(135deg, #f97316 0%, #dc2626 100%);
          color: white;
          padding: 30px;
          text-align: center;
        }
        .header h1 {
          margin: 0;
          font-size: 28px;
          font-weight: 600;
        }
        .content {
          padding: 30px;
        }
        .message-box {
          background: #f9fafb;
          border-left: 4px solid #f97316;
          padding: 20px;
          margin: 20px 0;
          border-radius: 4px;
        }
        .message-content {
          margin: 0;
          white-space: pre-wrap;
          word-wrap: break-word;
        }
        .footer {
          background: #f9fafb;
          padding: 20px;
          text-align: center;
          font-size: 14px;
          color: #6b7280;
          border-top: 1px solid #e5e7eb;
        }
        .footer p {
          margin: 5px 0;
        }
        .footer a {
          color: #f97316;
          text-decoration: none;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>📧 Message from eYogi Gurukul</h1>
        </div>
        
        <div class="content">
          <div class="message-box">
            <p class="message-content">${sanitizedMessage}</p>
          </div>
          
          <p style="margin-top: 30px;">
            If you have any questions or concerns, please feel free to contact us.
          </p>
        </div>
        
        <div class="footer">
          <p><strong>eYogi Gurukul</strong></p>
          <p>Your partner in education and personal growth</p>
          <p>
            <a href="${process.env.NEXT_PUBLIC_SITE_URL || 'https://eyogigurukul.com'}">Visit our website</a>
          </p>
        </div>
      </div>
    </body>
    </html>
  `
}

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as SendEmailRequest

    if (!body.to || !body.subject || !body.message) {
      return Response.json({ error: 'Missing required fields' }, { status: 400 })
    }

    const htmlContent = generateBulkEmailHTML(body.message)

    const emailSent = await sendEmail({
      to: body.to,
      subject: body.subject,
      body: htmlContent,
    })

    if (!emailSent) {
      console.warn('Bulk email could not be sent')
      return Response.json(
        { error: 'Email service is currently unavailable. Please try again later.' },
        { status: 503 },
      )
    }

    return Response.json({
      success: true,
      message: 'Email sent successfully',
    })
  } catch (error) {
    console.error('Bulk email error:', error)
    return Response.json(
      { error: 'Failed to send email. Please try again later.' },
      { status: 500 },
    )
  }
}
