/**
 * Script to create an admin profile for existing Supabase Auth user
 * This ensures any existing Supabase authenticated user can access the admin console
 */

import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'

// Load environment variables
dotenv.config()

const supabaseUrl = process.env.VITE_SUPABASE_URL
const supabaseServiceRoleKey = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceRoleKey) {
  console.error('❌ Missing Supabase environment variables')
  console.log(
    'Please ensure VITE_SUPABASE_URL and VITE_SUPABASE_SERVICE_ROLE_KEY are set in your .env file',
  )
  process.exit(1)
}

// Create Supabase admin client
const supabaseAdmin = createClient(supabaseUrl, supabaseServiceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
})

async function setupAdminAccess() {
  // Get your existing Supabase auth user email
  const adminEmail = 'admin@eyogigurukul.com' // Replace with your actual Supabase Auth user email
  const adminName = 'Super Admin User'

  console.log('Setting up super admin access for existing Supabase user...')

  try {
    // Step 1: Find the existing Supabase Auth user
    console.log('1. Finding existing Supabase Auth user...')
    const { data: authUsers, error: authError } = await supabaseAdmin.auth.admin.listUsers()

    if (authError) {
      console.error('Failed to list users:', authError)
      return
    }

    const existingUser = authUsers.users.find((user) => user.email === adminEmail)

    if (!existingUser) {
      console.error(`❌ No Supabase Auth user found with email: ${adminEmail}`)
      console.log(
        'Please ensure you have a user in Supabase Auth, or update the adminEmail in this script',
      )
      return
    }

    console.log('✅ Found existing auth user:', existingUser.id)

    // Step 2: Check if profile already exists
    console.log('2. Checking if profile already exists...')
    const { data: existingProfile } = await supabaseAdmin
      .from('profiles')
      .select('*')
      .eq('id', existingUser.id)
      .single()

    if (existingProfile) {
      console.log('✅ Profile already exists:', existingProfile.id)
      console.log(`Current role: ${existingProfile.role}`)

      if (['admin', 'business_admin', 'super_admin'].includes(existingProfile.role)) {
        console.log('🎉 User already has admin privileges!')
        console.log(`You can login to the admin console at: http://localhost:5174/admin/login`)
        console.log(`Email: ${adminEmail}`)
        return
      } else {
        console.log('⚠️  User exists but does not have admin role. Updating role...')
        // Update existing profile to give admin access
        const { error: updateError } = await supabaseAdmin
          .from('profiles')
          .update({ role: 'super_admin' })
          .eq('id', existingUser.id)

        if (updateError) {
          console.error('Failed to update user role:', updateError)
          return
        }
        console.log('✅ User role updated to super_admin')
      }
    } else {
      // Step 3: Create new profile record
      console.log('3. Creating new profile record...')
      const profileData = {
        id: existingUser.id, // Use the same ID as the auth user
        email: adminEmail,
        full_name: adminName,
        role: 'super_admin',
        status: 'active',
        password_hash: null, // Not needed for Supabase Auth users
        phone: null,
        date_of_birth: null,
        preferences: {},
        address_line_1: null,
        address_line_2: null,
        city: null,
        state: null,
        zip_code: null,
        country: null,
        emergency_contact: null,
        avatar_url: null,
        student_id: null,
        teacher_id: null,
        parent_id: null,
      }

      const { data: profileResult, error: profileError } = await supabaseAdmin
        .from('profiles')
        .insert(profileData)
        .select()
        .single()

      if (profileError) {
        console.error('Failed to create profile:', profileError)
        return
      }

      console.log('✅ Profile created:', profileResult.id)
    }

    console.log('\n🎉 Admin access setup successfully!')
    console.log('You can now login to the admin console at: http://localhost:5174/admin/login')
    console.log(`Email: ${adminEmail}`)
  } catch (error) {
    console.error('❌ Error setting up admin access:', error)
  }
}

// Run the script
setupAdminAccess()
