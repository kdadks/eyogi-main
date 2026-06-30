/**
 * SumUp Configuration
 * Determines sandbox vs production environment based on domain
 */

export interface SumUpConfig {
  apiKey: string
  merchantCode: string
  environment: 'sandbox' | 'production'
  checkoutUrl: string
  apiUrl: string
}

/**
 * Detect if current environment is production or sandbox
 * Production: eyogigurukul.com domain
 * Sandbox: localhost or any *.netlify.app domain
 */
export function isProductionEnvironment(): boolean {
  // Client-side detection
  if (typeof window !== 'undefined') {
    const hostname = window.location.hostname
    // Production domain
    if (hostname === 'eyogigurukul.com' || hostname === 'www.eyogigurukul.com') {
      return true
    }
    // Sandbox domains
    if (hostname === 'localhost' || hostname.endsWith('.netlify.app')) {
      return false
    }
  }

  // Server-side detection
  const vercelUrl = process.env.VERCEL_URL
  if (vercelUrl) {
    if (vercelUrl.includes('eyogigurukul.com')) {
      return true
    }
    // Netlify preview or other deployment
    return false
  }

  // Default to sandbox for safety
  return false
}

/**
 * Get SumUp configuration based on environment
 */
export function getSumUpConfig(): SumUpConfig {
  const isProduction = isProductionEnvironment()

  if (isProduction) {
    const apiKey = import.meta.env.VITE_SUMUP_PRODUCTION_KEY
    const merchantCode = import.meta.env.VITE_SUMUP_PRODUCTION_MERCHANT_CODE

    if (!apiKey || !merchantCode) {
      throw new Error('SumUp production credentials not configured')
    }

    return {
      apiKey,
      merchantCode,
      environment: 'production',
      checkoutUrl: 'https://api.sumup.com/v0.1/checkouts',
      apiUrl: 'https://api.sumup.com/v0.1',
    }
  } else {
    const apiKey = import.meta.env.VITE_SUMUP_SANDBOX_KEY
    const merchantCode = import.meta.env.VITE_SUMUP_SANDBOX_MERCHANT_CODE

    if (!apiKey || !merchantCode) {
      throw new Error('SumUp sandbox credentials not configured')
    }

    return {
      apiKey,
      merchantCode,
      environment: 'sandbox',
      checkoutUrl: 'https://api.sumup.com/v0.1/checkouts',
      apiUrl: 'https://api.sumup.com/v0.1',
    }
  }
}

/**
 * Verify environment and warn if misconfigured
 */
export function validateSumUpConfig(): boolean {
  try {
    const config = getSumUpConfig()
    console.log(`SumUp configured for ${config.environment} environment`)
    return true
  } catch (error) {
    console.error('SumUp configuration error:', error)
    return false
  }
}
