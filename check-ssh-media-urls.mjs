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
  console.error('Missing environment variables:')
  console.error('VITE_SUPABASE_URL:', supabaseUrl ? 'Set' : 'Missing')
  console.error('VITE_SUPABASE_SERVICE_ROLE_KEY:', supabaseKey ? 'Set' : 'Missing')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

console.log('Checking SSH media files...\n')

const { data, error } = await supabase
  .from('media_files')
  .select('id, filename, file_url')
  .limit(10)

if (error) {
  console.error('Error:', error)
} else {
  console.log('Sample media file URLs:')
  data.forEach((file) => {
    const isUploadThing =
      file.file_url?.includes('uploadthing') || file.file_url?.includes('utfs.io')
    const isSupabase = file.file_url?.includes('supabase') || file.file_url?.includes('ufs.sh')
    console.log(`\n${file.filename}:`)
    console.log(`  URL: ${file.file_url}`)
    console.log(`  Type: ${isUploadThing ? 'UploadThing' : isSupabase ? 'Supabase' : 'Unknown'}`)
  })

  // Count totals
  const { count: uploadThingCount } = await supabase
    .from('media_files')
    .select('*', { count: 'exact', head: true })
    .or('file_url.ilike.%uploadthing%,file_url.ilike.%utfs.io%')

  const { count: supabaseCount } = await supabase
    .from('media_files')
    .select('*', { count: 'exact', head: true })
    .or('file_url.ilike.%supabase%,file_url.ilike.%ufs.sh%')

  const { count: totalCount } = await supabase
    .from('media_files')
    .select('*', { count: 'exact', head: true })

  console.log(`\n\nSummary:`)
  console.log(`Total media files: ${totalCount}`)
  console.log(`UploadThing URLs: ${uploadThingCount}`)
  console.log(`Supabase URLs: ${supabaseCount}`)
}
