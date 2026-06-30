/**
 * SumUp Checkout Creation Utility
 * Server-side implementation for creating SumUp checkouts
 */

interface CheckoutRequest {
  amount: number
  currency: string
  checkout_reference: string
  description: string
  merchant_code: string
  return_url: string
  redirect_url?: string
  email: string
  hosted_checkout?: { enabled: boolean }
}

interface CheckoutResponse {
  id: string
  checkout_url: string
  hosted_checkout_url?: string
  status: string
}

/**
 * Create a SumUp checkout
 * This must be called from the server to keep API key secure
 */
export async function createSumUpCheckout(
  apiKey: string,
  checkoutData: CheckoutRequest
): Promise<CheckoutResponse> {
  try {
    const response = await fetch('https://api.sumup.com/v0.1/checkouts', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        amount: checkoutData.amount, // Amount in EUR from database
        currency: checkoutData.currency,
        checkout_reference: checkoutData.checkout_reference,
        description: checkoutData.description,
        merchant_code: checkoutData.merchant_code,
        return_url: checkoutData.return_url,
        redirect_url: checkoutData.redirect_url || checkoutData.return_url,
        customer_email: checkoutData.email,
        hosted_checkout: checkoutData.hosted_checkout || { enabled: true },
        // Additional settings for better UX
        locale: 'en-IE',
      }),
    })

    if (!response.ok) {
      const errorData = await response.json()
      throw new Error(`SumUp API error: ${errorData.error_message || 'Unknown error'}`)
    }

    const data = await response.json()

    return {
      id: data.id,
      checkout_url: data.checkout_url,
      hosted_checkout_url: data.hosted_checkout_url,
      status: data.status,
    }
  } catch (error) {
    console.error('Error creating SumUp checkout:', error)
    throw error
  }
}

/**
 * Verify SumUp webhook signature
 * For webhook validation (optional but recommended)
 */
export function verifySumUpSignature(
  payload: string,
  signature: string,
  apiKey: string
): boolean {
  const crypto = require('crypto')
  const hash = crypto
    .createHmac('sha256', apiKey)
    .update(payload)
    .digest('hex')
  return hash === signature
}
