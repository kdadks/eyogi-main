// Alternative: Update WebsiteAuthContext.tsx to explicitly generate UUID for website users
// Add this import at the top of the file:
import { v4 as uuidv4 } from 'uuid'

// Then in the signUp function, modify the insert to include an explicit id:
const { error: createError } = await supabaseAdmin
  .from('profiles')
  .insert({
    id: uuidv4(), // Explicitly generate UUID for website users
    email: userData.email.toLowerCase(),
    password_hash: passwordHash,
    full_name: userData.full_name,
    role: userData.role,
    status: 'active',
    phone: userData.phone || null,
    date_of_birth: userData.date_of_birth || null,
    preferences: {},
    address: null,
    emergency_contact: null,
    avatar_url: null,
    student_id: null,
    parent_id: null,
  })
  .select()
  .single()

// Note: You'll need to install uuid if not already available:
// npm install uuid
// npm install @types/uuid --save-dev