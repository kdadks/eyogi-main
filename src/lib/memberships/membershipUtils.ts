/**
 * Membership Utilities - Member ID generation and pricing
 */

import { browserClient } from '@/lib/supabase/browser'

/**
 * Generate unique member ID in format: eYogi-MMYYYY-XXXX
 * MM = current month (01-12)
 * YYYY = current year
 * XXXX = sequential counter for that month
 */
export async function generateMemberId(): Promise<string> {
  try {
    const now = new Date()
    const month = String(now.getMonth() + 1).padStart(2, '0')
    const year = now.getFullYear()
    const monthKey = `${month}${year}`

    // Increment counter for this month
    const { data, error } = await browserClient
      .from('memberships_id_counter')
      .select('counter')
      .eq('month', monthKey)
      .single()

    let counter = 1
    if (data && !error) {
      counter = (data.counter || 0) + 1
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
 * Validate member ID format
 */
export function validateMemberId(memberId: string): boolean {
  const pattern = /^eYogi-\d{2}\d{4}-\d{4}$/
  return pattern.test(memberId)
}

/**
 * Parse member ID to extract components
 */
export function parseMemberId(memberId: string) {
  const match = memberId.match(/^eYogi-(\d{2})(\d{4})-(\d{4})$/)
  if (!match) {
    throw new Error('Invalid member ID format')
  }
  return {
    month: match[1],
    year: match[2],
    counter: match[3],
  }
}

/**
 * Subscription pricing
 */
export const SUBSCRIPTION_PRICES = {
  monthly: {
    amount: 12.0,
    currency: 'EUR',
    durationMonths: 1,
  },
  annual: {
    amount: 120.0,
    currency: 'EUR',
    durationMonths: 12,
  },
}

export function getSubscriptionPrice(type: 'monthly' | 'annual') {
  const price = SUBSCRIPTION_PRICES[type]
  if (!price) {
    throw new Error(`Unknown subscription type: ${type}`)
  }
  return price
}

/**
 * Calculate renewal date based on subscription type
 */
export function calculateRenewalDate(subscriptionType: 'monthly' | 'annual', startDate: Date = new Date()): Date {
  const price = getSubscriptionPrice(subscriptionType)
  const renewalDate = new Date(startDate)
  renewalDate.setMonth(renewalDate.getMonth() + price.durationMonths)
  return renewalDate
}

/**
 * Format currency amount
 */
export function formatCurrency(amount: number, currency: string = 'EUR'): string {
  return new Intl.NumberFormat('de-DE', {
    style: 'currency',
    currency: currency,
  }).format(amount)
}

/**
 * Calculate savings for annual subscription
 */
export function calculateSavings(): {
  monthlyTotal: number
  annualPrice: number
  savings: number
  savingsPercent: number
} {
  const monthlyPrice = SUBSCRIPTION_PRICES.monthly.amount
  const annualPrice = SUBSCRIPTION_PRICES.annual.amount
  const monthlyTotal = monthlyPrice * 12
  const savings = monthlyTotal - annualPrice
  const savingsPercent = (savings / monthlyTotal) * 100

  return {
    monthlyTotal,
    annualPrice,
    savings: Math.round(savings * 100) / 100,
    savingsPercent: Math.round(savingsPercent * 10) / 10,
  }
}
