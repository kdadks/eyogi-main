/**
 * Local Email Service Test Script
 * Run with: node test-email.mjs
 */

import { Client } from '@microsoft/microsoft-graph-client'
import { ClientSecretCredential } from '@azure/identity'
import 'isomorphic-fetch'
import dotenv from 'dotenv'

// Load environment variables
dotenv.config()

const requiredEnvVars = [
  'MICROSOFT_TENANT_ID',
  'MICROSOFT_CLIENT_ID',
  'MICROSOFT_CLIENT_SECRET',
  'MICROSOFT_FROM_EMAIL',
]

// Validate environment variables
console.log('🔍 Checking environment variables...')
const missingVars = requiredEnvVars.filter((varName) => !process.env[varName])
if (missingVars.length > 0) {
  console.error('❌ Missing required environment variables:')
  missingVars.forEach((varName) => console.error(`   - ${varName}`))
  process.exit(1)
}
console.log('✅ All required environment variables found\n')

// Create Graph client
function getGraphClient() {
  const credential = new ClientSecretCredential(
    process.env.MICROSOFT_TENANT_ID,
    process.env.MICROSOFT_CLIENT_ID,
    process.env.MICROSOFT_CLIENT_SECRET,
  )

  return Client.initWithMiddleware({
    authProvider: {
      getAccessToken: async () => {
        const tokenResponse = await credential.getToken('https://graph.microsoft.com/.default')
        return tokenResponse.token
      },
    },
  })
}

// Send test email
async function sendTestEmail(testEmail) {
  try {
    console.log('📧 Initializing Microsoft Graph client...')
    const client = getGraphClient()

    console.log(`📤 Sending test email to: ${testEmail}`)

    const sendMail = {
      message: {
        subject: 'Test Email from eYogi Gurukul',
        body: {
          contentType: 'HTML',
          content: `
            <!DOCTYPE html>
            <html>
            <head>
              <style>
                body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
                .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 20px; border-radius: 10px 10px 0 0; }
                .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
                .button { background: #667eea; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block; margin: 20px 0; }
                .footer { text-align: center; margin-top: 30px; font-size: 12px; color: #666; }
              </style>
            </head>
            <body>
              <div class="container">
                <div class="header">
                  <h1>✅ Email Service Test Successful</h1>
                </div>
                <div class="content">
                  <h2>Microsoft Graph API Integration Working</h2>
                  <p>This is a test email to verify that the Microsoft Graph API email service is configured correctly.</p>
                  
                  <p><strong>Configuration Details:</strong></p>
                  <ul>
                    <li>Tenant ID: ${process.env.MICROSOFT_TENANT_ID}</li>
                    <li>From Email: ${process.env.MICROSOFT_FROM_EMAIL}</li>
                    <li>Test Time: ${new Date().toLocaleString()}</li>
                  </ul>
                  
                  <p>If you received this email, your email service is working properly! 🎉</p>
                  
                  <div class="footer">
                    <p>eYogi Gurukul - Student Management System</p>
                    <p>© ${new Date().getFullYear()} All rights reserved</p>
                  </div>
                </div>
              </div>
            </body>
            </html>
          `,
        },
        toRecipients: [
          {
            emailAddress: {
              address: testEmail,
            },
          },
        ],
      },
    }

    await client.api(`/users/${process.env.MICROSOFT_FROM_EMAIL}/sendMail`).post(sendMail)

    console.log('✅ Test email sent successfully!')
    console.log(`📬 Check inbox for: ${testEmail}`)
    return true
  } catch (error) {
    console.error('❌ Error sending test email:', error)
    if (error.statusCode === 401) {
      console.error('   Authentication failed. Check your credentials.')
    } else if (error.statusCode === 403) {
      console.error('   Permission denied. Make sure Mail.Send API permission is granted.')
    }
    return false
  }
}

// Main execution
async function main() {
  console.log('🚀 Starting Microsoft Graph Email Service Test\n')
  console.log('='.repeat(60))

  // Get test email from command line or use default
  const testEmail = process.argv[2] || 'office@eyogigurukul.com'

  const success = await sendTestEmail(testEmail)

  console.log('='.repeat(60))
  if (success) {
    console.log('\n✅ Email service test completed successfully!')
    console.log('\nNext steps:')
    console.log('1. Check the recipient inbox for the test email')
    console.log('2. If email not received, check Azure AD API permissions')
    console.log('3. Ensure Mail.Send permission is granted and admin consented')
  } else {
    console.log('\n❌ Email service test failed!')
    console.log('\nTroubleshooting:')
    console.log('1. Verify Azure AD app registration credentials')
    console.log('2. Check API permissions in Azure Portal')
    console.log('3. Ensure Mail.Send permission is granted')
    console.log('4. Check service account mailbox is active')
  }

  process.exit(success ? 0 : 1)
}

main()
