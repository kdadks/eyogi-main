/**
 * UploadThing API Test Script
 * Tests the /api/uploadthing endpoint locally and in production
 */

import fetch from 'node-fetch'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// Test configurations
const PRODUCTION_URL = 'https://www.eyogigurukul.com'
const LOCAL_URL = 'http://localhost:3000'

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
}

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`)
}

// Test 1: Check config endpoint
async function testConfigEndpoint(baseUrl) {
  log(`\n📋 Testing Config Endpoint: ${baseUrl}/api/uploadthing/config`, 'cyan')
  log('='.repeat(70), 'cyan')

  try {
    const response = await fetch(`${baseUrl}/api/uploadthing/config`)

    if (!response.ok) {
      log(`❌ Config endpoint failed: ${response.status} ${response.statusText}`, 'red')
      return false
    }

    const data = await response.json()
    log('✅ Config endpoint responded successfully', 'green')
    log('\nConfiguration Status:', 'blue')
    log(
      `  Token: ${data.token?.configured ? '✅ Configured' : '❌ Not Set'}`,
      data.token?.configured ? 'green' : 'red',
    )
    log(`  Token Length: ${data.token?.length || 0} characters`)
    log(`  Token Preview: ${data.token?.preview || 'N/A'}`)
    log(
      `  Secret: ${data.secret?.configured ? '✅ Configured' : '❌ Not Set'}`,
      data.secret?.configured ? 'green' : 'red',
    )
    log(`  Secret Length: ${data.secret?.length || 0} characters`)
    log(`  Environment: ${data.env}`)
    log(
      `  Recommendation: ${data.recommendation}`,
      data.recommendation.includes('NOT CONFIGURED') ? 'red' : 'green',
    )

    return data.token?.configured || data.secret?.configured
  } catch (error) {
    log(`❌ Error testing config endpoint: ${error.message}`, 'red')
    return false
  }
}

// Test 2: Test the uploadthing route existence
async function testUploadThingRoute(baseUrl) {
  log(`\n🔍 Testing UploadThing Route: ${baseUrl}/api/uploadthing`, 'cyan')
  log('='.repeat(70), 'cyan')

  try {
    // Test GET request (should return 405 or route handler response)
    const response = await fetch(`${baseUrl}/api/uploadthing`, {
      method: 'GET',
    })

    log(`  GET Response Status: ${response.status}`, response.ok ? 'green' : 'yellow')

    if (response.status === 404) {
      log('❌ Route not found - API endpoint may not be deployed', 'red')
      return false
    }

    log('✅ UploadThing route exists', 'green')
    return true
  } catch (error) {
    log(`❌ Error testing route: ${error.message}`, 'red')
    return false
  }
}

// Test 3: Test full upload flow with actual file
async function testFullUpload(baseUrl) {
  log(`\n📤 Testing Full Upload Flow: ${baseUrl}/api/uploadthing`, 'cyan')
  log('='.repeat(70), 'cyan')

  try {
    // Step 1: Get upload URL
    log('  Step 1: Requesting upload URL...', 'blue')
    const testPayload = {
      files: [
        {
          name: 'test.png',
          size: 1024,
          type: 'image/png',
        },
      ],
    }

    const response = await fetch(
      `${baseUrl}/api/uploadthing?actionType=upload&slug=imageUploader`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(testPayload),
      },
    )

    log(`  Response Status: ${response.status}`, response.ok ? 'green' : 'red')

    if (!response.ok) {
      const errorText = await response.text()
      log('❌ Failed to get upload URL', 'red')
      log(`  Error: ${errorText}`, 'red')
      return false
    }

    const uploadData = await response.json()
    log('✅ Got upload URL', 'green')

    if (!uploadData || !uploadData[0] || !uploadData[0].url) {
      log('❌ Invalid response format', 'red')
      log(`  Response: ${JSON.stringify(uploadData)}`, 'yellow')
      return false
    }

    const uploadUrl = uploadData[0].url
    log(`  Upload URL: ${uploadUrl.substring(0, 60)}...`, 'blue')

    // Step 2: Try to upload to the URL
    log('\n  Step 2: Uploading file to UploadThing...', 'blue')

    // Create a simple test file buffer
    const testFileContent = Buffer.from('fake-png-data-for-testing')

    const uploadResponse = await fetch(uploadUrl, {
      method: 'PUT',
      headers: {
        'Content-Type': 'image/png',
      },
      body: testFileContent,
    })

    log(`  Upload Status: ${uploadResponse.status}`, uploadResponse.ok ? 'green' : 'red')

    if (!uploadResponse.ok) {
      const errorText = await uploadResponse.text()
      log('❌ File upload to UploadThing failed', 'red')
      log(`  Error: ${errorText.substring(0, 200)}`, 'red')
      return false
    }

    log('✅ File uploaded successfully to UploadThing', 'green')
    return true
  } catch (error) {
    log(`❌ Error during upload flow: ${error.message}`, 'red')
    if (error.cause) {
      log(`  Cause: ${error.cause.message}`, 'yellow')
    }
    return false
  }
}

// Test 4: Check environment variables locally
async function checkLocalEnv() {
  log(`\n🔐 Checking Local Environment Variables`, 'cyan')
  log('='.repeat(70), 'cyan')

  const envPath = path.join(__dirname, '.env')

  if (!fs.existsSync(envPath)) {
    log('❌ .env file not found', 'red')
    return false
  }

  const envContent = fs.readFileSync(envPath, 'utf-8')
  const hasToken = envContent.includes('UPLOADTHING_TOKEN=')
  const hasSecret = envContent.includes('UPLOADTHING_SECRET=')

  log(
    `  UPLOADTHING_TOKEN: ${hasToken ? '✅ Found in .env' : '❌ Not found'}`,
    hasToken ? 'green' : 'red',
  )
  log(
    `  UPLOADTHING_SECRET: ${hasSecret ? '✅ Found in .env' : '❌ Not found'}`,
    hasSecret ? 'green' : 'red',
  )

  if (hasToken) {
    const tokenMatch = envContent.match(/UPLOADTHING_TOKEN=(.+)/)
    if (tokenMatch) {
      const token = tokenMatch[1].trim()
      log(`  Token Length: ${token.length} characters`)
      log(`  Token Preview: ${token.substring(0, 10)}...${token.substring(token.length - 10)}`)
    }
  }

  return hasToken || hasSecret
}

// Main test runner
async function runTests() {
  log('\n🚀 UploadThing API Test Suite', 'magenta')
  log('='.repeat(70), 'magenta')
  log(`Started at: ${new Date().toLocaleString()}\n`)

  const environment = process.argv[2] || 'production'
  const baseUrl = environment === 'local' ? LOCAL_URL : PRODUCTION_URL

  log(`Testing Environment: ${environment.toUpperCase()}`, 'blue')
  log(`Base URL: ${baseUrl}\n`, 'blue')

  const results = {
    config: false,
    route: false,
    fullUpload: false,
    env: false,
  }

  // Run tests
  if (environment === 'local') {
    results.env = await checkLocalEnv()
  }

  results.config = await testConfigEndpoint(baseUrl)
  results.route = await testUploadThingRoute(baseUrl)
  results.fullUpload = await testFullUpload(baseUrl)

  // Summary
  log('\n' + '='.repeat(70), 'magenta')
  log('📊 TEST SUMMARY', 'magenta')
  log('='.repeat(70), 'magenta')

  if (environment === 'local') {
    log(
      `  Local Environment: ${results.env ? '✅ PASS' : '❌ FAIL'}`,
      results.env ? 'green' : 'red',
    )
  }
  log(
    `  Config Endpoint: ${results.config ? '✅ PASS' : '❌ FAIL'}`,
    results.config ? 'green' : 'red',
  )
  log(`  Route Exists: ${results.route ? '✅ PASS' : '❌ FAIL'}`, results.route ? 'green' : 'red')
  log(
    `  Upload Action: ${results.action ? '✅ PASS' : '❌ FAIL'}`,
    results.action ? 'green' : 'red',
  )

  const allPassed = Object.values(results).every((r) => r === true)

  log('\n' + '='.repeat(70), 'magenta')
  if (allPassed) {
    log('✅ ALL TESTS PASSED - UploadThing is configured correctly!', 'green')
  } else {
    log('❌ SOME TESTS FAILED - Check the issues above', 'red')

    log('\n💡 Troubleshooting Tips:', 'yellow')
    if (!results.config) {
      log('  1. Ensure UPLOADTHING_TOKEN is set in Vercel environment variables', 'yellow')
      log('  2. Redeploy after adding environment variables', 'yellow')
    }
    if (!results.route) {
      log('  3. Check that the API route is deployed correctly', 'yellow')
      log('  4. Verify vercel.json configuration includes API routes', 'yellow')
    }
    if (!results.fullUpload) {
      log('  5. Check UploadThing SDK version compatibility', 'yellow')
      log('  6. Verify the token format matches UploadThing requirements', 'yellow')
      log('  7. Check network connectivity to UploadThing servers', 'yellow')
    }
  }

  log('\n' + '='.repeat(70), 'magenta')
  process.exit(allPassed ? 0 : 1)
}

// Run the tests
runTests().catch((error) => {
  log(`\n❌ Fatal Error: ${error.message}`, 'red')
  console.error(error)
  process.exit(1)
})
