import express from 'express'
import cors from 'cors'
import { createClient } from '@supabase/supabase-js'
import crypto from 'crypto'
import dotenv from 'dotenv'
import fs from 'fs'

// File logging setup
const logFile = './server-debug.log'
fs.writeFileSync(logFile, `=== Server started at ${new Date().toISOString()} ===\n`)

function writeLog(msg) {
  console.log(msg)
  fs.appendFileSync(logFile, msg + '\n')
}

writeLog('🚀 Starting dev-server.mjs...')

dotenv.config({ path: '.env.local' })
writeLog('✅ Environment loaded')

// In-memory cache for checkout data (indexed by registration_id)
// This allows the confirmation page to retrieve checkout info after manual redirect from SumUp
const checkoutCache = new Map()

// Create persistent checkout sessions table if it doesn't exist
async function ensureCheckoutSessionsTable(supabase) {
  try {
    const { data, error } = await supabase
      .from('checkout_sessions')
      .select('id')
      .limit(1)
    
    if (error && error.code === 'PGRST116') {
      // Table doesn't exist, but we'll try to insert and let it fail gracefully
      console.warn('⚠️  checkout_sessions table may not exist - using in-memory cache instead')
    }
  } catch (err) {
    console.warn('⚠️  Could not verify checkout_sessions table:', err)
  }
}

const app = express()
const PORT = 3001
const appBaseUrl =
  process.env.VITE_APP_URL ||
  process.env.URL ||
  process.env.DEPLOY_PRIME_URL ||
  'https://eyogigurukul.com'
const internalApiBaseUrl = process.env.INTERNAL_API_BASE_URL || `http://127.0.0.1:${PORT}`

console.log('✅ Express app created')

app.use(cors())
app.use(express.json())
console.log('✅ Middleware configured')

// General request logging
app.use((req, res, next) => {
  console.log(`\n📨 [${new Date().toISOString()}] ${req.method} ${req.path}`)
  next()
})

const supabaseUrl = process.env.VITE_SUPABASE_URL
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceRoleKey) {
  console.error('Missing Supabase configuration')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceRoleKey)

// Email service mock
function sendPasswordCreationEmail(email, firstName, token) {
  const setPasswordUrl = `${appBaseUrl}/members/set-password?token=${token}`
  
  console.log(`
========================================
PASSWORD CREATION EMAIL
========================================
To: ${email}
Subject: Create Your eYogi Member Password

Hi ${firstName},

Welcome to eYogi! Your membership registration is almost complete.

Please create your password by clicking the link below:
${setPasswordUrl}

This link will expire in 24 hours.

Token: ${token}

Best regards,
The eYogi Team
========================================
  `)
}

// Helper function to create SumUp checkout
async function createSumUpCheckout(apiKey, checkoutData) {
  console.log('🔄 Creating SumUp checkout...')
  console.log(`   API Key: ${apiKey ? apiKey.substring(0, 10) + '...' : 'EMPTY'}`)
  console.log(`   Merchant: ${checkoutData.merchant_code}`)
  console.log(`   Amount: ${checkoutData.amount} ${checkoutData.currency}`)
  
  // Properly format the request body for SumUp API
  const requestBody = {
    amount: checkoutData.amount, // SumUp expects amount in EUR, not cents
    currency: checkoutData.currency,
    checkout_reference: checkoutData.checkout_reference,
    description: checkoutData.description,
    merchant_code: checkoutData.merchant_code,
    return_url: checkoutData.return_url,
    redirect_url: checkoutData.redirect_url || checkoutData.return_url,
    success_url: checkoutData.success_url || checkoutData.return_url,
    cancel_url: checkoutData.cancel_url || checkoutData.return_url,
    customer_email: checkoutData.email,
    hosted_checkout: checkoutData.hosted_checkout || { enabled: true },
    locale: 'en-IE',
  }
  
  console.log('📤 SumUp Request Body:')
  console.log(JSON.stringify(requestBody, null, 2))
  
  const response = await fetch('https://api.sumup.com/v0.1/checkouts', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(requestBody),
  })

  if (!response.ok) {
    const error = await response.text()
    console.error('❌ SumUp API Response Error:')
    console.error(`   Status: ${response.status}`)
    console.error(`   Body: ${error}`)
    throw new Error(`SumUp API error (${response.status}): ${error}`)
  }

  const data = await response.json()
  console.log('✅ SumUp checkout created:', data.id)
  console.log('📊 SumUp Full Response:')
  console.log(JSON.stringify(data, null, 2))
  return data
}

// TEST ENDPOINT
app.get('/api/test', (req, res) => {
  console.log('TEST ENDPOINT HIT')
  res.json({ status: 'ok', message: 'Test endpoint working' })
})

// POST /api/members/checkout
// Create payment checkout first, then register member after payment
app.post('/api/members/checkout', async (req, res) => {
  console.log('\n📥 [CHECKOUT] Request received')
  console.log('📥 [CHECKOUT] Body:', req.body)
  
  try {
    const {
      firstName,
      lastName,
      email,
      phone,
      addressLine1,
      city,
      state,
      postalCode,
      country = 'Ireland',
      membershipType = 'monthly',
    } = req.body

    console.log(`📥 [CHECKOUT] Parsed fields - firstName: ${firstName}, lastName: ${lastName}, email: ${email}, type: ${membershipType}`)

    // Validate required fields
    if (!firstName || !lastName || !email || !membershipType) {
      console.error(`❌ [CHECKOUT] Validation failed - Missing required fields`)
      return res.status(400).json({
        error: 'Missing required fields: firstName, lastName, email, membershipType',
      })
    }
    console.log(`✅ [CHECKOUT] Validation passed`)

    // Check if member already exists
    console.log(`🔍 [CHECKOUT] Checking if member exists with email: ${email}`)
    const { data: existingMembers } = await supabase
      .from('members')
      .select('id')
      .eq('email', email.toLowerCase())

    if (existingMembers && existingMembers.length > 0) {
      console.error(`❌ [CHECKOUT] Member already exists with email: ${email}`)
      return res.status(400).json({ error: 'A member with this email already exists' })
    }
    console.log(`✅ [CHECKOUT] Member check passed - email is unique`)

    // Get membership pricing from settings
    console.log(`💰 [CHECKOUT] Fetching price for type: ${membershipType}`)
    const priceKey = membershipType === 'annual' ? 'membership_annual_price' : 'membership_monthly_price'
    let priceSettings = []
    try {
      const result = await supabase
        .schema('gurukul_main')
        .from('settings')
        .select('value')
        .eq('key', priceKey)
      
      if (result.error) {
        console.error(`❌ [CHECKOUT] Error fetching price setting (${priceKey}):`, result.error)
      } else {
        priceSettings = result.data || []
      }
    } catch (err) {
      console.error(`❌ [CHECKOUT] Exception fetching price setting (${priceKey}):`, err)
    }

    const priceSetting = priceSettings && priceSettings.length > 0 ? priceSettings[0] : null
    let amount = priceSetting?.value ? parseFloat(priceSetting.value) : (membershipType === 'annual' ? 120 : 11)
    
    console.log(`✅ [CHECKOUT] Membership price: €${amount} (${membershipType})`)

    // Get SumUp configuration
    console.log(`🔐 [CHECKOUT] Fetching SumUp settings...`)
    let sumupSettings = []
    try {
      const result = await supabase
        .schema('gurukul_main')
        .from('settings')
        .select('key, value')
        .in('key', ['sumup_environment', 'sumup_api_key_sandbox', 'sumup_api_key_production', 'sumup_merchant_code'])
      
      if (result.error) {
        console.error('❌ [CHECKOUT] Error fetching SumUp settings:', result.error)
      } else {
        sumupSettings = result.data || []
      }
    } catch (err) {
      console.error('❌ [CHECKOUT] Exception fetching SumUp settings:', err)
    }

    const settingsMap = {}
    sumupSettings?.forEach(s => { settingsMap[s.key] = s.value })

    const isProduction = settingsMap['sumup_environment'] === 'production'
    const apiKey = isProduction ? settingsMap['sumup_api_key_production'] : settingsMap['sumup_api_key_sandbox']
    const merchantCode = settingsMap['sumup_merchant_code']

    console.log(`\n🔐 [CHECKOUT] SumUp Configuration:`)
    console.log(`   Environment: ${settingsMap['sumup_environment'] || 'NOT SET'}`)
    console.log(`   API Key (${isProduction ? 'Production' : 'Sandbox'}): ${apiKey ? apiKey.substring(0, 10) + '...' : 'EMPTY'}`)
    console.log(`   Merchant Code: ${merchantCode || 'EMPTY'}\n`)

    // Create a pending registration record
    const registrationId = crypto.randomBytes(16).toString('hex')
    console.log(`📝 [CHECKOUT] Created registration ID: ${registrationId}`)
    
    const registrationData = {
      id: registrationId,
      firstName,
      lastName,
      email,
      phone,
      addressLine1,
      city,
      state,
      postalCode,
      country,
      membershipType,
      amount,
      currency: 'EUR',
      status: 'pending_payment',
      created_at: new Date().toISOString(),
      expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
    }

    // Will set return URL - we'll include checkout_id after SumUp creates it
    let returnUrl = `${appBaseUrl}/membership/confirmation?registration_id=${registrationId}`

    // Development Mode: If SumUp not configured, bypass payment for testing
    if (!apiKey || !merchantCode) {
      console.log('\n⚠️  [CHECKOUT] DEV MODE: SumUp not configured, bypassing payment')
      console.log('⚠️  [CHECKOUT] Registration will proceed directly without payment gateway\n')
      
      const devCheckoutId = `dev_${registrationId}`
      
      console.log(`✅ [CHECKOUT] Returning dev mode checkout response`)
      return res.status(200).json({
        success: true,
        checkout_url: `${returnUrl}&checkout_id=${devCheckoutId}&dev_mode=true`,
        checkout_id: devCheckoutId,
        registration_id: registrationId,
        registration_data: registrationData,
        amount,
        currency: 'EUR',
        membershipType,
        dev_mode: true,
      })
    }

    // Production Mode: Create actual SumUp checkout
    console.log(`\n🔄 [CHECKOUT] Creating SumUp checkout...`)
    console.log(`📌 [CHECKOUT] Return URL: ${returnUrl}`)
    let checkout
    try {
      // Create checkout - SumUp will redirect to return_url after payment
      // SumUp should pass checkout_id or reference back to return_url
      checkout = await createSumUpCheckout(apiKey, {
        checkout_reference: registrationId,
        amount: amount,
        currency: 'EUR',
        merchant_code: merchantCode,
        description: `eYogi ${membershipType === 'annual' ? 'Annual' : 'Monthly'} Membership`,
        return_url: returnUrl,
        redirect_url: returnUrl,
        success_url: returnUrl,
        cancel_url: returnUrl,
        email: email,
        hosted_checkout: { 
          enabled: true,
        },
      })
      
      console.log(`✅ [CHECKOUT] Checkout created with ID: ${checkout.id}`)
    } catch (sumupError) {
      // If SumUp fails (e.g., invalid API key), fall back to dev mode
      console.warn('\n⚠️  [CHECKOUT] SumUp API error - falling back to dev mode')
      console.warn(`⚠️  [CHECKOUT] Reason: ${sumupError instanceof Error ? sumupError.message : String(sumupError)}`)
      console.warn('⚠️  [CHECKOUT] Returning dev mode checkout for testing\n')
      
      const devCheckoutId = `dev_fallback_${registrationId}`
      
      return res.status(200).json({
        success: true,
        checkout_url: `${returnUrl}?checkout_id=${devCheckoutId}&dev_mode=true`,
        checkout_id: devCheckoutId,
        registration_id: registrationId,
        registration_data: registrationData,
        amount,
        currency: 'EUR',
        membershipType,
        dev_mode: true,
        fallback_reason: 'SumUp API error - please check your API credentials',
      })
    }

    console.log(`✅ [CHECKOUT] Checkout created successfully`)
    
    // Use the hosted_checkout_url from SumUp API response
    console.log(`📊 [CHECKOUT] Checkout object keys: ${Object.keys(checkout).join(', ')}`)
    console.log(`📊 [CHECKOUT] Checkout ID value: ${checkout.id}`)
    console.log(`📊 [CHECKOUT] Checkout hosted_checkout_url: ${checkout.hosted_checkout_url}`)
    
    const checkoutUrl = checkout.hosted_checkout_url || checkout.hosted_checkout?.url
    if (!checkoutUrl) {
      console.error('❌ [CHECKOUT] Missing hosted_checkout_url from SumUp response')
      console.error('📊 [CHECKOUT] Full checkout object:', JSON.stringify(checkout, null, 2))
      throw new Error('SumUp API did not return hosted_checkout_url. Hosted checkout may not be enabled.')
    }
    
    console.log(`🔗 [CHECKOUT] Hosted Checkout URL: ${checkoutUrl}`)
    console.log(`🔗 [CHECKOUT] Checkout ID for response: ${checkout.id}`)
    
    // Build final return URL with both registration_id and checkout_id
    // This allows us to verify payment when user returns from SumUp
    const finalReturnUrl = `${appBaseUrl}/membership/confirmation?registration_id=${registrationId}&checkout_id=${checkout.id}`
    
    // Cache the checkout data for later retrieval (if user manually clicks back from SumUp)
    const responseData = {
      success: true,
      checkout_url: checkoutUrl,
      checkout_id: checkout.id,
      registration_id: registrationId,
      registration_data: registrationData,
      amount,
      currency: 'EUR',
      membershipType,
      dev_mode: false,
    }
    checkoutCache.set(registrationId, responseData)
    console.log(`✅ [CHECKOUT] Cached checkout data for registration_id: ${registrationId}`)
    
    // Auto-clear cache entry after 2 hours
    setTimeout(() => {
      checkoutCache.delete(registrationId)
      console.log(`🧹 [CHECKOUT] Cleaned up cache for registration_id: ${registrationId}`)
    }, 2 * 60 * 60 * 1000)
    
    return res.status(200).json(responseData)
  } catch (error) {
    console.error('\n❌ [CHECKOUT] Membership checkout error:')
    console.error('❌ [CHECKOUT] Error type:', error?.constructor?.name || 'Unknown')
    console.error('❌ [CHECKOUT] Error message:', error instanceof Error ? error.message : String(error))
    if (error instanceof Error && error.stack) {
      console.error('❌ [CHECKOUT] Full stack trace:')
      console.error(error.stack)
    }
    console.log('❌ [CHECKOUT] Sending error response to client')
    
    // Log detailed error info
    const errorMessage = error instanceof Error ? error.message : String(error)
    console.error(`❌ [CHECKOUT] Details: ${errorMessage}`)
    
    return res.status(500).json({
      error: 'Failed to create checkout',
      message: errorMessage,
      details: process.env.NODE_ENV === 'development' ? error : undefined,
    })
  }
})

// POST /api/members/register
// Complete registration after successful payment
app.post('/api/members/register', async (req, res) => {
  try {
    const {
      registrationId,
      checkoutId,
      firstName,
      lastName,
      email,
      phone,
      addressLine1,
      city,
      state,
      postalCode,
      country = 'Ireland',
      membershipType = 'monthly',
      amount,
    } = req.body

    // Validate required fields
    if (!firstName || !lastName || !email || !membershipType) {
      return res.status(400).json({
        error: 'Missing required fields',
      })
    }

    // Generate member number
    const memberNumber = `M${Date.now().toString().slice(-8)}${Math.random().toString(36).substring(2, 6).toUpperCase()}`
    console.log(`✅ [REGISTER] Generated member number: ${memberNumber}`)

    // Calculate expiry date
    const joinedDate = new Date()
    let expiryDate = new Date(joinedDate)
    if (membershipType === 'annual') {
      expiryDate.setFullYear(expiryDate.getFullYear() + 1)
    } else {
      expiryDate.setMonth(expiryDate.getMonth() + 1)
    }
    console.log(`✅ [REGISTER] Calculated expiry date: ${expiryDate.toISOString()}`)

    // Generate password reset token
    const passwordToken = crypto.randomBytes(32).toString('hex')
    const tokenExpiry = new Date()
    tokenExpiry.setHours(tokenExpiry.getHours() + 24)

    // Create member record
    const { data: member, error: memberError } = await supabase
      .schema('gurukul_main')
      .from('members')
      .insert({
        first_name: firstName.trim(),
        last_name: lastName.trim(),
        email: email.toLowerCase().trim(),
        phone: phone?.trim() || null,
        address_line_1: addressLine1?.trim() || null,
        city: city?.trim() || null,
        state: state?.trim() || null,
        postal_code: postalCode?.trim() || null,
        country: country?.trim() || 'Ireland',
        member_number: memberNumber,
        membership_type: membershipType,
        status: 'active', // Active since payment succeeded
        joined_date: joinedDate.toISOString(),
        expiry_date: expiryDate,
        auto_renew: true,
        password_reset_token: passwordToken,
        password_reset_expires: tokenExpiry.toISOString(),
      })
      .select()
      .single()

    if (memberError) {
      console.error('Failed to create member:', memberError)
      return res.status(500).json({
        error: 'Failed to create member',
        details: memberError.message,
      })
    }

    // Create payment record
    if (checkoutId && amount) {
      await supabase
        .schema('gurukul_main')
        .from('member_payments')
        .insert({
        member_id: member.id,
        amount: amount,
        currency: 'EUR',
        payment_type: membershipType === 'annual' ? 'annual_membership' : 'monthly_membership',
        status: 'completed',
        payment_date: new Date().toISOString(),
        payment_method: 'sumup',
        transaction_id: checkoutId,
      })
    }

    // Send password creation email
    try {
      sendPasswordCreationEmail(email, firstName, passwordToken)
    } catch (emailError) {
      console.error('Failed to send password creation email:', emailError)
    }

    return res.status(200).json({
      success: true,
      member: {
        id: member.id,
        memberNumber: member.member_number,
        email: member.email,
        firstName: member.first_name,
        lastName: member.last_name,
        membershipType: member.membership_type,
        status: member.status,
      },
      message: 'Registration successful! Please check your email to create your password.',
    })
  } catch (error) {
    console.error('Member registration error:', error)
    return res.status(500).json({
      error: 'Failed to register member',
      message: error instanceof Error ? error.message : 'Unknown error',
    })
  }
})

// POST /api/donations/checkout
// Create payment checkout for donations
app.post('/api/donations/checkout', async (req, res) => {
  console.log('\n📥 [DONATION] Request received')
  console.log('📥 [DONATION] Body:', req.body)
  
  try {
    const { amount, firstName, lastName, email, phone } = req.body

    console.log(`📥 [DONATION] Parsed fields - firstName: ${firstName}, lastName: ${lastName}, email: ${email}, amount: €${amount}`)

    // Validate required fields
    if (!firstName || !lastName || !email || !amount) {
      console.error(`❌ [DONATION] Validation failed - Missing required fields`)
      return res.status(400).json({ error: 'Missing required fields: firstName, lastName, email, amount' })
    }

    if (amount < 5) {
      console.error(`❌ [DONATION] Validation failed - Minimum donation is €5`)
      return res.status(400).json({ error: 'Minimum donation amount is €5' })
    }

    console.log(`✅ [DONATION] Validation passed`)

    // Get SumUp configuration
    console.log(`🔐 [DONATION] Fetching SumUp settings...`)
    const { data: sumupSettings, error: sumupError } = await supabase
      .schema('gurukul_main')
      .from('settings')
      .select('key, value')
      .in('key', ['sumup_environment', 'sumup_api_key_sandbox', 'sumup_api_key_production', 'sumup_merchant_code'])

    if (sumupError) {
      console.error('❌ [DONATION] Error fetching SumUp settings:', sumupError)
    }

    const settingsMap = {}
    sumupSettings?.forEach(s => { settingsMap[s.key] = s.value })

    const isProduction = settingsMap['sumup_environment'] === 'production'
    const apiKey = isProduction ? settingsMap['sumup_api_key_production'] : settingsMap['sumup_api_key_sandbox']
    const merchantCode = settingsMap['sumup_merchant_code']

    console.log(`\n🔐 [DONATION] SumUp Configuration:`)
    console.log(`   Environment: ${settingsMap['sumup_environment'] || 'NOT SET'}`)
    console.log(`   API Key: ${apiKey ? apiKey.substring(0, 10) + '...' : 'EMPTY'}`)
    console.log(`   Merchant Code: ${merchantCode || 'EMPTY'}\n`)

    // Create a donation ID for checkout reference
    const donationId = crypto.randomBytes(16).toString('hex')
    console.log(`📝 [DONATION] Created donation ID: ${donationId}`)

    // Return URL includes donation_id so success page can find cached data
    const returnUrl = `${appBaseUrl}/donation/success?donation_id=${donationId}`

    // Cache donation info for later retrieval
    const donationData = {
      donation_id: donationId,
      amount,
      firstName,
      lastName,
      email,
      phone,
      createdAt: new Date(),
    }
    // Store with auto-cleanup after 2 hours
    checkoutCache.set(`donation_${donationId}`, donationData)
    setTimeout(() => {
      checkoutCache.delete(`donation_${donationId}`)
    }, 2 * 60 * 60 * 1000)

    // Development Mode: If SumUp not configured, bypass payment for testing
    if (!apiKey || !merchantCode) {
      console.log('\n⚠️  [DONATION] DEV MODE: SumUp not configured, bypassing payment')
      console.log('⚠️  [DONATION] Donation will proceed directly without payment gateway\n')
      
      console.log(`✅ [DONATION] Returning dev mode checkout response`)
      return res.status(200).json({
        success: true,
        checkout_url: `${returnUrl}&status=completed&dev_mode=true`,
        checkout_id: donationId,
        donation_id: donationId,
        amount,
        currency: 'EUR',
        dev_mode: true,
      })
    }

    // Production Mode: Create actual SumUp checkout
    console.log(`\n🔄 [DONATION] Creating SumUp checkout...`)
    const checkout = await createSumUpCheckout(apiKey, {
      checkout_reference: donationId,
      amount: amount,
      currency: 'EUR',
      merchant_code: merchantCode,
      description: `Donation to eYogi Gurukul`,
      return_url: returnUrl,
      redirect_url: returnUrl,
      email: email,
      hosted_checkout: { enabled: true },
    })

    console.log(`✅ [DONATION] Checkout created`)
    
    const checkoutUrl = checkout.hosted_checkout_url || checkout.hosted_checkout?.url
    if (!checkoutUrl) {
      console.error('❌ [DONATION] Missing hosted_checkout_url from SumUp response')
      throw new Error('SumUp API did not return hosted_checkout_url')
    }
    
    console.log(`🔗 [DONATION] Hosted Checkout URL: ${checkoutUrl}`)
    
    // Cache the checkout mapping for the success page using the SumUp checkout ID
    checkoutCache.set(`donation_${checkout.id}`, donationData)
    
    // Return checkout response with checkout_id that will be used to retrieve cached data
    return res.status(200).json({
      success: true,
      checkout_url: checkoutUrl,
      checkout_id: checkout.id,
      donation_id: donationId,
      amount,
      currency: 'EUR',
    })
  } catch (error) {
    console.error('❌ [DONATION] Error:', error)
    res.status(500).json({
      error: 'Failed to create donation checkout',
      message: error instanceof Error ? error.message : 'Unknown error',
    })
  }
})

// Helper: Check SumUp checkout status
async function checkSumUpCheckoutStatus(apiKey, checkoutId) {
  try {
    console.log(`🔍 [VERIFY] Checking SumUp checkout status for: ${checkoutId}`)
    
    const response = await fetch(`https://api.sumup.com/v0.1/checkouts/${checkoutId}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
    })

    if (!response.ok) {
      const error = await response.text()
      console.error(`❌ [VERIFY] SumUp API error: ${response.status} - ${error}`)
      return null
    }

    const data = await response.json()
    console.log(`✅ [VERIFY] Checkout status: ${data.status}`)
    console.log(`📊 [VERIFY] Transactions: ${data.transactions?.length || 0}`)
    
    return data
  } catch (error) {
    console.error('❌ [VERIFY] Error checking checkout status:', error)
    return null
  }
}

// POST /api/members/register with payment verification
app.post('/api/members/register-with-payment', async (req, res) => {
  console.log('\n📥 [MEMBER-REGISTER] Request received')
  console.log('📥 [MEMBER-REGISTER] Body:', req.body)

  try {
    const { checkoutId, registrationData, membershipType, amount, isDevMode } = req.body

    if (!checkoutId || !registrationData) {
      console.error('❌ [MEMBER-REGISTER] Missing required fields')
      return res.status(400).json({ error: 'Missing checkoutId or registrationData' })
    }

    console.log(`✅ [MEMBER-REGISTER] Validating payment for checkout: ${checkoutId}`)

    // Check if in dev mode
    const isDevCheckout = isDevMode || checkoutId.startsWith('dev_') || checkoutId.startsWith('dev_fallback_')
    
    if (!isDevCheckout) {
      // Get SumUp config
      const { data: sumupSettings } = await supabase
        .schema('gurukul_main')
        .from('settings')
        .select('key, value')
        .in('key', ['sumup_environment', 'sumup_api_key_sandbox', 'sumup_api_key_production'])

      const settingsMap = {}
      sumupSettings?.forEach(s => { settingsMap[s.key] = s.value })

      const isProduction = settingsMap['sumup_environment'] === 'production'
      const apiKey = isProduction ? settingsMap['sumup_api_key_production'] : settingsMap['sumup_api_key_sandbox']

      if (apiKey) {
        // Only verify if SumUp is configured
        console.log(`🔍 [MEMBER-REGISTER] SumUp configured - verifying payment`)
        const checkout = await checkSumUpCheckoutStatus(apiKey, checkoutId)
        
        if (checkout) {
          // Check if payment was completed
          const isPaid = checkout.transactions && checkout.transactions.length > 0 && 
                         checkout.transactions.some(t => t.status === 'SUCCESSFUL')
          
          if (!isPaid) {
            console.error(`❌ [MEMBER-REGISTER] Payment not completed. Status: ${checkout.status}`)
            return res.status(400).json({ error: 'Payment was not completed. Please try again.' })
          }
          
          console.log(`✅ [MEMBER-REGISTER] Payment verified successfully`)
        } else {
          // Payment verification failed - but allow registration to proceed in fallback mode
          console.warn(`⚠️  [MEMBER-REGISTER] Could not verify checkout - proceeding with fallback mode`)
        }
      } else {
        console.log(`⚠️  [MEMBER-REGISTER] SumUp not configured - proceeding with fallback mode`)
      }
    } else {
      console.log(`✅ [MEMBER-REGISTER] Dev mode - skipping SumUp verification`)
    }

    // Continue with member registration
    // This calls the existing member registration logic
    const registerResponse = await fetch(`${internalApiBaseUrl}/api/members/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...registrationData,
        membershipType,
        amount,
        checkoutId,
      }),
    })
    
    const registerData = await registerResponse.json()
    if (registerResponse.ok) {
      console.log(`✅ [MEMBER-REGISTER] Member registration completed successfully`)
    } else {
      console.error(`❌ [MEMBER-REGISTER] Member registration failed:`, registerData)
    }
    return res.status(registerResponse.status).json(registerData)
  } catch (error) {
    console.error('❌ [MEMBER-REGISTER] Error:', error)
    res.status(500).json({
      error: 'Failed to complete registration',
      message: error instanceof Error ? error.message : 'Unknown error',
    })
  }
})

// GET /api/members/checkout-status/:registrationId
// Retrieves cached checkout data (used when sessionStorage is empty after manual redirect from SumUp)
app.get('/api/members/checkout-status/:registrationId', (req, res) => {
  const { registrationId } = req.params
  console.log(`\n📨 GET /api/members/checkout-status/${registrationId}`)
  
  const cachedData = checkoutCache.get(registrationId)
  if (!cachedData) {
    console.log(`❌ [CHECKOUT-STATUS] No cached data for registration_id: ${registrationId}`)
    return res.status(404).json({
      error: 'Checkout data not found',
      message: 'Please complete the checkout process again',
    })
  }
  
  console.log(`✅ [CHECKOUT-STATUS] Retrieved cached checkout data for registration_id: ${registrationId}`)
  return res.status(200).json({
    success: true,
    checkout: cachedData,
  })
})

// GET /api/donations/checkout-status/:checkoutId - Retrieve cached donation checkout data
app.get('/api/donations/checkout-status/:checkoutId', (req, res) => {
  const { checkoutId } = req.params
  
  if (!checkoutId) {
    return res.status(400).json({ error: 'Checkout ID is required' })
  }

  console.log(`🔍 [DONATION] Retrieving checkout status for: ${checkoutId}`)
  
  const cachedData = checkoutCache.get(`donation_${checkoutId}`)
  
  if (!cachedData) {
    console.warn(`⚠️  [DONATION] No cached data found for: ${checkoutId}`)
    return res.status(404).json({ error: 'Checkout data not found' })
  }

  console.log(`✅ [DONATION] Found cached checkout data`)
  return res.status(200).json({
    success: true,
    checkout: cachedData,
  })
})

// POST /api/donations/save - Create/update donation record in database after successful payment
app.post('/api/donations/save', async (req, res) => {
  try {
    const { donation_id, amount, firstName, lastName, email, phone, status = 'completed', payment_method = 'SumUp' } = req.body

    if (!donation_id || !amount || !firstName || !lastName || !email) {
      return res.status(400).json({ error: 'Missing required fields' })
    }

    console.log(`💾 [DONATION] Saving donation to database: ${donation_id}`)

    // Try to get existing donation
    const { data: existing, error: fetchError } = await supabase
      .schema('gurukul_main')
      .from('donations')
      .select('id')
      .eq('id', donation_id)
      .single()

    let result
    if (existing) {
      // Update existing donation
      console.log(`📝 [DONATION] Updating existing donation: ${donation_id}`)
      const { data, error } = await supabase
        .schema('gurukul_main')
        .from('donations')
        .update({
          status,
          payment_method,
          updated_at: new Date().toISOString(),
        })
        .eq('id', donation_id)
        .select()

      if (error) {
        console.error('❌ [DONATION] Error updating donation:', error)
        throw error
      }
      result = data
    } else {
      // Create new donation
      console.log(`✨ [DONATION] Creating new donation: ${donation_id}`)
      const { data, error } = await supabase
        .schema('gurukul_main')
        .from('donations')
        .insert([
          {
            id: donation_id,
            donor_first_name: firstName,
            donor_last_name: lastName,
            donor_email: email,
            donor_phone: phone || null,
            amount,
            currency: 'EUR',
            status,
            payment_method,
            donation_date: new Date().toISOString(),
            transaction_id: donation_id,
            notes: null,
          },
        ])
        .select()

      if (error) {
        console.error('❌ [DONATION] Error creating donation:', error)
        throw error
      }
      result = data
    }

    console.log(`✅ [DONATION] Donation saved successfully`)
    return res.status(200).json({
      success: true,
      donation: result?.[0] || null,
    })
  } catch (error) {
    console.error('❌ [DONATION] Error saving donation:', error)
    return res.status(500).json({ error: error.message })
  }
})

// GET /api/members - Fetch all members (uses service role to bypass RLS)
app.get('/api/members', async (req, res) => {
  try {
    const { data, error } = await supabase
      .schema('gurukul_main')
      .from('members')
      .select('id, email, first_name, last_name, phone, status, membership_type, joined_date, expiry_date, member_number')
      .order('joined_date', { ascending: false })

    if (error) {
      console.error('❌ Error fetching members:', error)
      return res.status(500).json({ error: error.message })
    }

    console.log(`✅ Fetched ${data?.length || 0} members`)
    return res.status(200).json({
      success: true,
      members: data || [],
      count: data?.length || 0,
    })
  } catch (err) {
    console.error('❌ Exception fetching members:', err)
    return res.status(500).json({ error: err.message })
  }
})

// DELETE /api/members/:memberId - Delete a member from the database
app.delete('/api/members/:memberId', async (req, res) => {
  try {
    const { memberId } = req.params

    if (!memberId) {
      return res.status(400).json({ error: 'Member ID is required' })
    }

    console.log(`🗑️  Deleting member: ${memberId}`)

    const { data, error } = await supabase
      .schema('gurukul_main')
      .from('members')
      .delete()
      .eq('id', memberId)
      .select()

    if (error) {
      console.error('❌ Error deleting member:', error)
      return res.status(500).json({ error: error.message })
    }

    console.log(`✅ Member deleted successfully: ${memberId}`)
    return res.status(200).json({
      success: true,
      message: 'Member deleted successfully',
      deletedMember: data,
    })
  } catch (err) {
    console.error('❌ Exception deleting member:', err)
    return res.status(500).json({ error: err.message })
  }
})

// PUT /api/members/:memberId - Update a member
app.put('/api/members/:memberId', async (req, res) => {
  try {
    const { memberId } = req.params
    const { first_name, last_name, email, phone, status, membership_type, expiry_date } = req.body

    if (!memberId) {
      return res.status(400).json({ error: 'Member ID is required' })
    }

    console.log(`✏️  Updating member: ${memberId}`)

    const updateData = {}
    if (first_name !== undefined) updateData.first_name = first_name
    if (last_name !== undefined) updateData.last_name = last_name
    if (email !== undefined) updateData.email = email
    if (phone !== undefined) updateData.phone = phone
    if (status !== undefined) updateData.status = status
    if (membership_type !== undefined) updateData.membership_type = membership_type
    if (expiry_date !== undefined) updateData.expiry_date = expiry_date

    const { data, error } = await supabase
      .schema('gurukul_main')
      .from('members')
      .update(updateData)
      .eq('id', memberId)
      .select()

    if (error) {
      console.error('❌ Error updating member:', error)
      return res.status(500).json({ error: error.message })
    }

    console.log(`✅ Member updated successfully: ${memberId}`)
    return res.status(200).json({
      success: true,
      message: 'Member updated successfully',
      updatedMember: data?.[0],
    })
  } catch (err) {
    console.error('❌ Exception updating member:', err)
    return res.status(500).json({ error: err.message })
  }
})

app.listen(PORT, () => {
  console.log(`
✅ API server running on port ${PORT}
Available endpoints:
  GET    /api/members
  POST   /api/members/checkout
  POST   /api/members/register
  POST   /api/members/register-with-payment
  POST   /api/donations/checkout
  DELETE /api/members/:memberId
  PUT    /api/members/:memberId
  `)
})

// Keep the server running
process.stdin.resume()

// Handle graceful shutdown
process.on('SIGINT', () => {
  console.log('\n✋ Shutting down dev server...')
  process.exit(0)
})

// Handle any unhandled errors
process.on('uncaughtException', (error) => {
  console.error('❌ Uncaught Exception:', error)
})

process.on('unhandledRejection', (reason, promise) => {
  console.error('❌ Unhandled Rejection at:', promise, 'reason:', reason)
})
