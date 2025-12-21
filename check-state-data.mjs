// Check state data in database
import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

// Load environment variables from SSH folder
dotenv.config({ path: join(__dirname, 'src', 'SSH', '.env') })

const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey =
  process.env.VITE_SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing Supabase credentials')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function checkStateData() {
  console.log('\n=== Checking Parent and Child State Data ===\n')

  // Get parent profile with role 'parent'
  const { data: parents, error: parentError } = await supabase
    .from('profiles')
    .select('id, email, full_name, state, city, country')
    .eq('role', 'parent')
    .order('created_at', { ascending: false })
    .limit(5)

  if (parentError) {
    console.error('Error fetching parents:', parentError)
    return
  }

  console.log('Recent Parents:')
  parents.forEach((parent, i) => {
    console.log(`\n${i + 1}. Parent:`)
    console.log(`   Email: ${parent.email}`)
    console.log(`   Name: ${parent.full_name}`)
    console.log(`   Country: ${parent.country}`)
    console.log(`   State: ${parent.state}`)
    console.log(`   City: ${parent.city}`)
  })

  console.log('\n' + '='.repeat(50) + '\n')

  // Get recent children
  const { data: children, error: childError } = await supabase
    .from('profiles')
    .select('id, student_id, full_name, parent_id, state, city, country, created_at')
    .eq('role', 'student')
    .not('parent_id', 'is', null)
    .order('created_at', { ascending: false })
    .limit(10)

  if (childError) {
    console.error('Error fetching children:', childError)
    return
  }

  console.log('Recent Children:')
  for (const child of children) {
    // Get parent info
    const { data: parent } = await supabase
      .from('profiles')
      .select('email, full_name, state, city, country')
      .eq('id', child.parent_id)
      .single()

    console.log(`\n- Child:`)
    console.log(`  Name: ${child.full_name}`)
    console.log(`  Student ID: ${child.student_id}`)
    console.log(`  Country: ${child.country}`)
    console.log(`  State: ${child.state}`)
    console.log(`  City: ${child.city}`)
    console.log(`  Created: ${new Date(child.created_at).toLocaleString()}`)
    if (parent) {
      console.log(`  Parent: ${parent.full_name} (${parent.email})`)
      console.log(`  Parent State: ${parent.state}`)
      console.log(`  Parent City: ${parent.city}`)
    }
  }

  console.log('\n' + '='.repeat(50) + '\n')
}

checkStateData()
  .then(() => {
    console.log('\nDone!')
    process.exit(0)
  })
  .catch((error) => {
    console.error('Error:', error)
    process.exit(1)
  })
