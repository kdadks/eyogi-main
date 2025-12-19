import { supabaseAdmin } from './supabase'
import { decryptField } from './encryption'

/**
 * Generate a secure random token for password reset using Web Crypto API
 */
export function generateResetToken(): string {
  // Generate 32 random bytes using Web Crypto API
  const array = new Uint8Array(32)
  crypto.getRandomValues(array)
  // Convert to hex string
  return Array.from(array, (byte) => byte.toString(16).padStart(2, '0')).join('')
}

/**
 * Calculate token expiry time (24 hours from now)
 */
export function getTokenExpiry(): Date {
  const expiry = new Date()
  expiry.setHours(expiry.getHours() + 24)
  return expiry
}

/**
 * Request a password reset for a user email
 * Creates a reset token and stores it in the profiles table
 */
export async function requestPasswordReset(
  email: string,
): Promise<{ success: boolean; error?: string }> {
  try {
    // Check if user exists in profiles table
    const { data: profile, error: profileError } = await supabaseAdmin
      .from('profiles')
      .select('id, email, full_name')
      .eq('email', email)
      .single()

    if (profileError || !profile) {
      // Don't reveal whether email exists for security
      return { success: true }
    }

    // Generate reset token and expiry
    const resetToken = generateResetToken()
    const resetTokenExpiry = getTokenExpiry()

    // Store token in profiles table
    const { error: updateError } = await supabaseAdmin
      .from('profiles')
      .update({
        reset_token: resetToken,
        reset_token_expiry: resetTokenExpiry.toISOString(),
      })
      .eq('id', profile.id)

    if (updateError) {
      console.error('Error storing reset token:', updateError)
      return { success: false, error: 'Failed to generate reset token' }
    }

    // Send email with reset link via API
    try {
      // Decrypt full_name before sending to email service
      const decryptedFullName = profile.full_name ? decryptField(profile.full_name) : null

      const response = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: profile.email,
          resetToken,
          fullName: decryptedFullName,
        }),
      })

      if (!response.ok) {
        console.error('Failed to send reset email')
        // Don't fail the whole operation if email fails
      }
    } catch (emailError) {
      console.error('Error sending reset email:', emailError)
      // Continue even if email fails
    }

    return { success: true }
  } catch (error) {
    console.error('Error in requestPasswordReset:', error)
    return { success: false, error: 'An error occurred' }
  }
}

/**
 * Validate a password reset token
 * Returns the user ID if token is valid and not expired
 */
export async function validateResetToken(
  token: string,
): Promise<{ valid: boolean; userId?: string; error?: string }> {
  try {
    const { data: profile, error } = await supabaseAdmin
      .from('profiles')
      .select('id, reset_token_expiry')
      .eq('reset_token', token)
      .single()

    if (error || !profile) {
      return { valid: false, error: 'Invalid or expired reset token' }
    }

    // Check if token has expired
    const now = new Date()
    const expiry = new Date(profile.reset_token_expiry)

    if (now > expiry) {
      return { valid: false, error: 'Reset token has expired' }
    }

    return { valid: true, userId: profile.id }
  } catch (error) {
    console.error('Error validating reset token:', error)
    return { valid: false, error: 'An error occurred' }
  }
}

/**
 * Simple password hashing function (same as WebsiteAuthContext)
 */
const hashPassword = async (password: string): Promise<string> => {
  const encoder = new TextEncoder()
  const data = encoder.encode(password + 'eyogi-salt-2024')
  const hash = await crypto.subtle.digest('SHA-256', data)
  return Array.from(new Uint8Array(hash))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('')
}

/**
 * Reset password using a valid token
 */
export async function resetPasswordWithToken(
  token: string,
  newPassword: string,
): Promise<{ success: boolean; error?: string }> {
  try {
    // Validate token first
    const { valid, userId, error: validationError } = await validateResetToken(token)

    if (!valid || !userId) {
      return { success: false, error: validationError || 'Invalid token' }
    }

    // Hash password using same method as signup
    const hashedPassword = await hashPassword(newPassword)

    // Update password and clear reset token
    const { error: updateError } = await supabaseAdmin
      .from('profiles')
      .update({
        password: hashedPassword,
        reset_token: null,
        reset_token_expiry: null,
      })
      .eq('id', userId)

    if (updateError) {
      console.error('Error resetting password:', updateError)
      return { success: false, error: 'Failed to reset password' }
    }

    return { success: true }
  } catch (error) {
    console.error('Error in resetPasswordWithToken:', error)
    return { success: false, error: 'An error occurred' }
  }
}
