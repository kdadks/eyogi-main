import nodemailer from 'nodemailer'
import dotenv from 'dotenv'

// Load environment variables
dotenv.config()

async function testSMTP() {
  console.log('🔧 Testing SMTP Configuration...\n')

  const config = {
    host: process.env.SMTP_HOST,
    port: parseInt(process.env.SMTP_PORT, 10),
    user: process.env.SMTP_USER,
    from_email: process.env.SMTP_FROM_EMAIL,
    from_name: process.env.SMTP_FROM_NAME,
  }

  console.log('Configuration:')
  console.log('  Host:', config.host)
  console.log('  Port:', config.port)
  console.log('  User:', config.user)
  console.log('  From:', `${config.from_name} <${config.from_email}>`)
  console.log()

  // Check required variables
  if (
    !process.env.SMTP_HOST ||
    !process.env.SMTP_PORT ||
    !process.env.SMTP_USER ||
    !process.env.SMTP_PASS
  ) {
    console.error('❌ Missing required SMTP environment variables')
    process.exit(1)
  }

  try {
    // Create transporter
    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: parseInt(process.env.SMTP_PORT, 10),
      secure: parseInt(process.env.SMTP_PORT, 10) === 465,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
      tls: {
        rejectUnauthorized: false,
      },
    })

    console.log('⏳ Verifying SMTP connection...')
    await transporter.verify()
    console.log('✅ SMTP connection verified successfully!\n')

    console.log('📧 Sending test email...')
    const info = await transporter.sendMail({
      from: `${process.env.SMTP_FROM_NAME} <${process.env.SMTP_FROM_EMAIL}>`,
      to: process.env.SMTP_USER, // Send to self for testing
      subject: 'SMTP Test - eYogi Gurukul',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h1 style="color: #f97316;">✅ SMTP Test Successful</h1>
          <p>Your SMTP configuration is working correctly!</p>
          <div style="background: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3 style="margin-top: 0;">Configuration Details:</h3>
            <p><strong>Host:</strong> ${process.env.SMTP_HOST}</p>
            <p><strong>Port:</strong> ${process.env.SMTP_PORT}</p>
            <p><strong>User:</strong> ${process.env.SMTP_USER}</p>
            <p><strong>From:</strong> ${process.env.SMTP_FROM_NAME} &lt;${process.env.SMTP_FROM_EMAIL}&gt;</p>
          </div>
          <p><strong>Test Time:</strong> ${new Date().toLocaleString()}</p>
          <p style="color: #059669;">This email confirms that your eYogi Gurukul email service is ready to send password reset emails and other notifications.</p>
        </div>
      `,
    })

    console.log('✅ Test email sent successfully!')
    console.log('   Message ID:', info.messageId)
    console.log('   Recipient:', process.env.SMTP_USER)
    console.log('\n🎉 All tests passed! Your SMTP configuration is working perfectly.')
  } catch (error) {
    console.error('\n❌ SMTP Test Failed:')
    console.error('   Error:', error.message)
    if (error.code) {
      console.error('   Code:', error.code)
    }
    if (error.response) {
      console.error('   Response:', error.response)
    }
    console.log('\n💡 Common issues:')
    console.log('   - Check username and password are correct')
    console.log('   - Verify Office 365 account allows SMTP access')
    console.log('   - Ensure port 587 is not blocked by firewall')
    console.log('   - For Office 365, you may need to enable "Authenticated SMTP"')
    process.exit(1)
  }
}

testSMTP()
