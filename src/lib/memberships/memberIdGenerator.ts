/**
 * Member ID Generation Utility
 * Format: eYogi-MMYYYY-XXXX
 * MM: Month (01-12)
 * YYYY: Year (4 digits)
 * XXXX: Sequential 4-digit counter per month
 */

import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL || '',
  import.meta.env.VITE_SUPABASE_SERVICE_ROLE_KEY || '',
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  }
)

/**
 * Generates a unique member ID in the format eYogi-MMYYYY-XXXX
 */
export async function generateMemberId(): Promise<string> {
  try {
    const now = new Date()
    const month = String(now.getMonth() + 1).padStart(2, '0')
    const year = now.getFullYear()
    const monthKey = `${month}${year}`

    // Get the current counter for this month
    const { data: counterData, error: fetchError } = await supabase
      .from('memberships_id_counter')
      .select('counter')
      .eq('month', monthKey)
      .single()

    if (fetchError && fetchError.code !== 'PGRST116') {
      // PGRST116 means no rows found, which is fine
      throw fetchError
    }

    let nextCounter = 1
    if (counterData) {
      nextCounter = counterData.counter + 1
    }

    // Update or insert the counter
    if (counterData) {
      await supabase
        .from('memberships_id_counter')
        .update({ counter: nextCounter, updated_at: new Date().toISOString() })
        .eq('month', monthKey)
    } else {
      await supabase.from('memberships_id_counter').insert({
        month: monthKey,
        counter: nextCounter,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
    }

    // Format the counter as 4-digit string
    const paddedCounter = String(nextCounter).padStart(4, '0')

    return `eYogi-${monthKey}-${paddedCounter}`
  } catch (error) {
    console.error('Error generating member ID:', error)
    throw new Error('Failed to generate member ID')
  }
}

/**
 * Validates a member ID format
 */
export function validateMemberId(memberId: string): boolean {
  const pattern = /^eYogi-\d{2}\d{4}-\d{4}$/
  return pattern.test(memberId)
}

/**
 * Parses a member ID to extract month, year, and counter
 */
export function parseMemberId(memberId: string) {
  const pattern = /^eYogi-(\d{2})(\d{4})-(\d{4})$/
  const match = memberId.match(pattern)

  if (!match) {
    return null
  }

  return {
    month: parseInt(match[1], 10),
    year: parseInt(match[2], 10),
    counter: parseInt(match[3], 10),
  }
}

/**
 * Formats date for subscription calculations
 */
export function calculateRenewalDate(subscriptionType: 'monthly' | 'annual', startDate: Date = new Date()): Date {
  const renewalDate = new Date(startDate)

  if (subscriptionType === 'monthly') {
    renewalDate.setMonth(renewalDate.getMonth() + 1)
  } else if (subscriptionType === 'annual') {
    renewalDate.setFullYear(renewalDate.getFullYear() + 1)
  }

  return renewalDate
}

/**
 * Formats currency amount
 */
export function formatCurrency(amount: number, currency: string = 'EUR'): string {
  const formatter = new Intl.NumberFormat('de-DE', {
    style: 'currency',
    currency: currency,
  })
  return formatter.format(amount)
}

/**
 * Subscription pricing
 */
export const SUBSCRIPTION_PRICES = {
  monthly: {
    amount: 11.0,
    currency: 'EUR',
    period: 'month',
    description: 'Monthly Membership',
  },
  annual: {
    amount: 120.0,
    currency: 'EUR',
    period: 'year',
    description: 'Annual Membership',
  },
} as const

/**
 * Get subscription description
 */
export function getSubscriptionDescription(type: 'monthly' | 'annual'): string {
  return SUBSCRIPTION_PRICES[type].description
}

/**
 * Get subscription price
 */
export function getSubscriptionPrice(type: 'monthly' | 'annual'): number {
  return SUBSCRIPTION_PRICES[type].amount
}
