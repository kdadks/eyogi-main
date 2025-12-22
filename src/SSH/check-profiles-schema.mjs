import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.VITE_SUPABASE_URL
const supabaseServiceRoleKey = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceRoleKey) {
  console.error('Missing Supabase credentials')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceRoleKey)

async function checkProfilesSchema() {
  console.log('Checking profiles table schema...\n')

  // Get a sample row to see all columns
  const { data, error } = await supabase.from('profiles').select('*').limit(1).single()

  if (error) {
    console.error('Error fetching profile:', error)
    return
  }

  if (data) {
    console.log('Available columns in profiles table:')
    console.log('=====================================')
    Object.keys(data).forEach((column) => {
      console.log(`- ${column}: ${typeof data[column]} (value: ${JSON.stringify(data[column])})`)
    })
  } else {
    console.log('No data found in profiles table')
  }

  // Check children table structure
  console.log('\n\nChecking children table schema...\n')
  const { data: childData, error: childError } = await supabase
    .from('children')
    .select('*')
    .limit(1)
    .single()

  if (childError) {
    console.error('Error fetching children:', childError)
  } else if (childData) {
    console.log('Available columns in children table:')
    console.log('=====================================')
    Object.keys(childData).forEach((column) => {
      console.log(
        `- ${column}: ${typeof childData[column]} (value: ${JSON.stringify(childData[column])})`,
      )
    })
  } else {
    console.log('No data found in children table')
  }
}

checkProfilesSchema()
