import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'

dotenv.config({ path: '.env.local' })

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
)

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
    const isSupabase = file.file_url?.includes('supabase')
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
    .ilike('file_url', '%supabase%')

  const { count: totalCount } = await supabase
    .from('media_files')
    .select('*', { count: 'exact', head: true })

  console.log(`\n\nSummary:`)
  console.log(`Total media files: ${totalCount}`)
  console.log(`UploadThing URLs: ${uploadThingCount}`)
  console.log(`Supabase URLs: ${supabaseCount}`)
}
