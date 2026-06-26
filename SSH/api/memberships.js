/**
 * Membership Registration API
 * POST /api/memberships/register
 * 
 * Handles new member registration and initiates SumUp payment
 */

import { Router } from 'express'
import { createClient } from '@supabase/supabase-js'
import { sendWelcomeEmail, sendReceiptEmail } from '../../src/lib/memberships/membershipEmailService.js'

const router = Router()

// Initialize Supabase client
const supabase = createClient(
  process.env.VITE_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// Subscription prices
const SUBSCRIPTION_PRICES = {
  monthly: { amount: 11.0, currency: 'EUR' },
  annual: { amount: 120.0, currency: 'EUR' },
}

/**
 * Generate unique member ID: eYogi-MMYYYY-XXXX
 */
async function generateMemberId(): Promise<string> {
  try {
    const now = new Date()
    const month = String(now.getMonth() + 1).padStart(2, '0')
    const year = now.getFullYear()
    const monthKey = `${month}${year}`

    // Get current counter for this month
    let { data: counterRecord } = await supabase
      .from('memberships_id_counter')
      .select('counter')
      .eq('month', monthKey)
      .single()

    let counter = 1
    if (counterRecord) {
      counter = (counterRecord.counter || 0) + 1

      // Update counter
      await supabase
        .from('memberships_id_counter')
        .update({ counter })
        .eq('month', monthKey)
    } else {
      // Insert new counter
      await supabase
        .from('memberships_id_counter')
        .insert({ month: monthKey, counter: 1 })
    }

    // Format: eYogi-MMYYYY-XXXX
    const paddedCounter = String(counter).padStart(4, '0')
    const memberId = `eYogi-${monthKey}-${paddedCounter}`

    return memberId
  } catch (error) {
    console.error('Error generating member ID:', error)
    throw new Error('Failed to generate member ID')
  }
}

/**
 * Calculate renewal date
 */
function calculateRenewalDate(subscriptionType: 'monthly' | 'annual'): Date {
  const renewalDate = new Date()
  const months = subscriptionType === 'monthly' ? 1 : 12
  renewalDate.setMonth(renewalDate.getMonth() + months)
  return renewalDate
}

/**
 * POST /api/memberships/register
 */
router.post('/register', async (req, res) => {
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
      country,
      subscriptionType,
    } = req.body

    // Validation
    if (!firstName?.trim()) {
      return res.status(400).json({ error: 'First name is required' })
    }
    if (!lastName?.trim()) {
      return res.status(400).json({ error: 'Last name is required' })
    }
    if (!email?.trim()) {
      return res.status(400).json({ error: 'Email is required' })
    }
    if (!subscriptionType || !['monthly', 'annual'].includes(subscriptionType)) {
      return res.status(400).json({ error: 'Valid subscription type is required' })
    }

    // Check for existing email
    const { data: existingMember } = await supabase
      .from('members')
      .select('id')
      .eq('email', email.trim().toLowerCase())
      .single()

    if (existingMember) {
      return res.status(400).json({ error: 'Email already registered' })
    }

    // Generate member ID
    const memberId = await generateMemberId()

    // Calculate renewal date
    const renewalDate = calculateRenewalDate(subscriptionType)

    // Get subscription price
    const price = SUBSCRIPTION_PRICES[subscriptionType as keyof typeof SUBSCRIPTION_PRICES]
    if (!price) {
      return res.status(400).json({ error: 'Invalid subscription type' })
    }

    // Create member record
    const { data: newMember, error: memberError } = await supabase
      .from('members')
      .insert({
        member_id: memberId,
        first_name: firstName.trim(),
        last_name: lastName.trim(),
        email: email.trim().toLowerCase(),
        phone: phone?.trim() || null,
        address_line_1: addressLine1?.trim() || null,
        city: city?.trim() || null,
        state: state?.trim() || null,
        postal_code: postalCode?.trim() || null,
        country: country?.trim() || null,
        subscription_type: subscriptionType,
        status: 'pending',
        renewal_date: renewalDate.toISOString(),
      })
      .select()
      .single()

    if (memberError) {
      console.error('Error creating member:', memberError)
      return res.status(500).json({ error: 'Failed to create member' })
    }

    // Create subscription record
    const { data: subscription, error: subscriptionError } = await supabase
      .from('memberships_subscriptions')
      .insert({
        member_id: newMember.id,
        subscription_type: subscriptionType,
        price_amount: price.amount,
        price_currency: price.currency,
        start_date: new Date().toISOString(),
        end_date: renewalDate.toISOString(),
        auto_renewal: true,
        status: 'pending',
      })
      .select()
      .single()

    if (subscriptionError) {
      console.error('Error creating subscription:', subscriptionError)
      return res.status(500).json({ error: 'Failed to create subscription' })
    }

    // Create transaction record (pending)
    const checkoutReference = `member-${newMember.id}-${Date.now()}`
    const { data: transaction, error: transactionError } = await supabase
      .from('memberships_transactions')
      .insert({
        member_id: newMember.id,
        subscription_id: subscription.id,
        amount: price.amount,
        currency: price.currency,
        type: 'payment',
        status: 'pending',
        checkout_reference: checkoutReference,
      })
      .select()
      .single()

    if (transactionError) {
      console.error('Error creating transaction:', transactionError)
      return res.status(500).json({ error: 'Failed to create transaction' })
    }

    // Create SumUp checkout
    try {
      const sumupResponse = await fetch('https://api.sumup.com/v0.1/checkouts', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${process.env.SUMUP_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          checkout_reference: checkoutReference,
          amount: Math.round(price.amount * 100), // SumUp expects amount in cents
          currency: price.currency,
          pay_to_email: process.env.SUMUP_EMAIL,
          description: `eYogi ${subscriptionType === 'monthly' ? 'Monthly' : 'Annual'} Membership`,
          return_urls: {
            success_url: `${process.env.VITE_APP_URL || 'http://localhost:3001'}/membership/confirmation`,
            failure_url: `${process.env.VITE_APP_URL || 'http://localhost:3001'}/membership?error=payment_failed`,
          },
        }),
      })

      const sumupData = await sumupResponse.json()

      if (!sumupResponse.ok) {
        console.error('SumUp error:', sumupData)
        return res.status(400).json({ error: 'Failed to create payment checkout' })
      }

      // Update transaction with SumUp payment ID
      await supabase
        .from('memberships_transactions')
        .update({ payment_id: sumupData.id })
        .eq('id', transaction.id)

      // Return success with checkout URL
      return res.status(200).json({
        success: true,
        data: {
          memberId,
          checkoutUrl: sumupData.checkout_url,
          checkoutId: sumupData.id,
          amount: price.amount,
          currency: price.currency,
          subscriptionType,
        },
      })
    } catch (sumupError) {
      console.error('Error creating SumUp checkout:', sumupError)
      return res.status(500).json({ error: 'Failed to create payment checkout' })
    }
  } catch (error) {
    console.error('Registration error:', error)
    return res.status(500).json({ error: 'Registration failed' })
  }
})

/**
 * POST /api/memberships/send-email
 * Send transactional emails for memberships
 */
router.post('/send-email', async (req, res) => {
  try {
    const { to, subject, html, emailType } = req.body

    if (!to || !subject || !html) {
      return res.status(400).json({ error: 'Missing required email fields' })
    }

    // Check if SMTP is configured
    if (!process.env.EMAIL_USER || !process.env.EMAIL_PASSWORD || !process.env.EMAIL_HOST) {
      console.warn('Email not configured - skipping send')
      return res.status(200).json({ message: 'Email service not configured' })
    }

    // Import nodemailer
    const nodemailer = (await import('nodemailer')).default

    // Create transporter
    const transporter = nodemailer.createTransport({
      host: process.env.EMAIL_HOST,
      port: parseInt(process.env.EMAIL_PORT || '587'),
      secure: process.env.EMAIL_SECURE === 'true',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASSWORD,
      },
    })

    // Send email
    const mailOptions = {
      from: process.env.EMAIL_FROM || process.env.EMAIL_USER,
      to,
      subject,
      html,
      replyTo: process.env.EMAIL_REPLY_TO || process.env.EMAIL_FROM,
    }

    const info = await transporter.sendMail(mailOptions)

    console.log(`Email sent: ${info.messageId}`)

    return res.status(200).json({
      success: true,
      message: 'Email sent successfully',
      messageId: info.messageId,
    })
  } catch (error) {
    console.error('Email sending error:', error)
    return res.status(500).json({ error: 'Failed to send email' })
  }
})

export default router
