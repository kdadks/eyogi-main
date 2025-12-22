'use server'

import { sendEmail } from '@/lib/email/graphEmailService'

interface SendEmailRequest {
  to: string
  subject: string
  message: string
}

/**
 * Generate HTML template for bulk communication email
 * Uses table-based layout for maximum email client compatibility
 */
function generateBulkEmailHTML(message: string): string {
  // Sanitize message and convert line breaks to HTML
  const sanitizedMessage = message
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/\n/g, '<br>')

  return `
    <!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">
    <html xmlns="http://www.w3.org/1999/xhtml">
    <head>
      <meta http-equiv="Content-Type" content="text/html; charset=UTF-8" />
      <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      <meta name="x-apple-disable-message-reformatting" />
      <title>Message from eYogi Gurukul</title>
      <!--[if mso]>
      <style type="text/css">
        body, table, td, a {font-family: Arial, sans-serif !important;}
      </style>
      <![endif]-->
    </head>
    <body style="background-color: #f5f5f5; margin: 0; padding: 0; font-family: Arial, Helvetica, sans-serif; -webkit-font-smoothing: antialiased; -webkit-text-size-adjust: none;">
      <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="background-color: #f5f5f5;">
        <tr>
          <td align="center" style="padding: 40px 10px;">
            <!--[if mso]>
            <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="600">
            <tr>
            <td>
            <![endif]-->
            <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="max-width: 600px; background-color: #ffffff;">
              <!-- Logo -->
              <tr>
                <td align="center" style="padding: 30px 20px 20px 20px;">
                  <img src="https://eyogigurukul.com/ssh-app/Images/SSH_Logo.png" width="180" height="auto" alt="eYogi Gurukul" style="display: block; border: 0; max-width: 100%; height: auto;" />
                </td>
              </tr>
              <!-- Content -->
              <tr>
                <td style="padding: 20px 40px 40px 40px;">
                  <h2 style="color: #2c5f2d; margin: 0; padding: 0 0 20px 0; font-size: 24px; font-weight: bold; font-family: Arial, Helvetica, sans-serif; line-height: 1.3;">Message from eYogi Gurukul</h2>
                  
                  <!-- Message Box -->
                  <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="margin: 20px 0;">
                    <tr>
                      <td style="padding: 20px; background-color: #f8f9fa; border-left: 4px solid #2c5f2d;">
                        <p style="margin: 0; padding: 0; line-height: 24px; color: #333333; font-size: 16px; font-family: Arial, Helvetica, sans-serif; word-wrap: break-word;">
                          ${sanitizedMessage}
                        </p>
                      </td>
                    </tr>
                  </table>
                  
                  <p style="margin: 0; padding: 25px 0 10px 0; line-height: 24px; color: #333333; font-size: 16px; font-family: Arial, Helvetica, sans-serif;">
                    If you have any questions or concerns, please feel free to contact us at
                    <a href="mailto:office@eyogigurukul.com" style="color: #2c5f2d; text-decoration: underline;">office@eyogigurukul.com</a>
                  </p>
                  <p style="margin: 0; padding: 20px 0 0 0; color: #666666; font-size: 14px; font-family: Arial, Helvetica, sans-serif; line-height: 21px;">&mdash; Team eYogi Gurukul</p>
                </td>
              </tr>
              <!-- Footer -->
              <tr>
                <td style="padding: 20px 40px; background-color: #f8f9fa; border-top: 1px solid #e5e7eb;">
                  <p style="margin: 0; padding: 0 0 5px 0; text-align: center; font-size: 14px; color: #666666; font-family: Arial, Helvetica, sans-serif; line-height: 21px;">
                    <strong>eYogi Gurukul</strong>
                  </p>
                  <p style="margin: 0; padding: 0 0 5px 0; text-align: center; font-size: 14px; color: #666666; font-family: Arial, Helvetica, sans-serif; line-height: 21px;">
                    Your partner in education and personal growth
                  </p>
                  <p style="margin: 0; padding: 0; text-align: center; font-size: 14px; font-family: Arial, Helvetica, sans-serif; line-height: 21px;">
                    <a href="${process.env.NEXT_PUBLIC_SITE_URL || 'https://eyogigurukul.com'}" style="color: #2c5f2d; text-decoration: underline;">Visit our website</a>
                  </p>
                </td>
              </tr>
            </table>
            <!--[if mso]>
            </td>
            </tr>
            </table>
            <![endif]-->
          </td>
        </tr>
      </table>
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
