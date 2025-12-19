import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

// Load SSH environment
dotenv.config({ path: join(__dirname, 'src', 'SSH', '.env') })

const supabaseUrl = process.env.VITE_SUPABASE_URL
const supabaseKey = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing environment variables')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
})

console.log('Creating media bucket in Supabase storage...\n')

// Create the bucket
const { data: bucket, error: createError } = await supabase.storage.createBucket('media', {
  public: true,
  fileSizeLimit: 10485760, // 10MB
})

if (createError) {
  if (createError.message.includes('already exists')) {
    console.log('✅ Bucket "media" already exists')
  } else {
    console.error('❌ Error creating bucket:', createError)
    process.exit(1)
  }
} else {
  console.log('✅ Successfully created bucket "media"')
}

// List all buckets to verify
const { data: buckets, error: listError } = await supabase.storage.listBuckets()

if (listError) {
  console.error('Error listing buckets:', listError)
} else {
  console.log('\nAll storage buckets:')
  buckets.forEach((b) => {
    console.log(`  - ${b.name} (public: ${b.public})`)
  })
}

console.log('\n✨ Done!')
