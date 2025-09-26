/**
 * Script to update password_hash for existing users
 * Run with: node update-password.js <email> <new_password>
 */

import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'

// Load environment variables
dotenv.config()

const supabaseUrl = process.env.VITE_SUPABASE_URL
const supabaseServiceRoleKey = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceRoleKey) {
  console.error('❌ Missing Supabase environment variables')
  process.exit(1)
}

// Create Supabase admin client
const supabaseAdmin = createClient(supabaseUrl, supabaseServiceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
})

// Simple password hashing function (matches the one in WebsiteAuthContext)
const hashPassword = async (password) => {
  const encoder = new TextEncoder()
  const data = encoder.encode(password + 'eyogi-salt-2024')
  const hash = await crypto.subtle.digest('SHA-256', data)
  return Array.from(new Uint8Array(hash))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('')
}

async function updateUserPassword(email, newPassword) {
  try {
    console.log(`Updating password for user: ${email}`)

    // Find the user
    const { data: userData, error: findError } = await supabaseAdmin
      .from('profiles')
      .select('*')
      .eq('email', email.toLowerCase())
      .single()

    if (findError || !userData) {
      console.error('❌ User not found:', findError?.message)
      return
    }

    console.log('✅ Found user:', userData.id)

    // Hash the new password
    const passwordHash = await hashPassword(newPassword)

    // Update the password_hash
    const { error: updateError } = await supabaseAdmin
      .from('profiles')
      .update({ password_hash: passwordHash })
      .eq('id', userData.id)

    if (updateError) {
      console.error('❌ Failed to update password:', updateError.message)
      return
    }

    console.log('✅ Password updated successfully!')
    console.log(`User ${email} can now login with the new password.`)
  } catch (error) {
    console.error('❌ Error:', error.message)
  }
}

// Get command line arguments
const [, , email, newPassword] = process.argv

if (!email || !newPassword) {
  console.log('Usage: node update-password.js <email> <new_password>')
  console.log('Example: node update-password.js support@it-wala.com mypassword123')
  process.exit(1)
}

updateUserPassword(email, newPassword)
