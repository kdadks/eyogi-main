import { createClient } from '@/lib/supabase/client'

export interface MediaFolder {
  id: string
  name: string
  slug: string
  parent_id: string | null
  created_at: string
}

export interface MediaRecord {
  id: string
  filename: string
  original_name: string
  mime_type: string | null
  size_bytes: number | null
  storage_path: string
  public_url: string
  alt_text: string | null
  width: number | null
  height: number | null
  folder_id: string | null
  uploaded_by: string | null
  created_at: string
}

function slugify(name: string): string {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')
}

function uniqueFilename(original: string): string {
  const ext = original.includes('.') ? `.${original.split('.').pop()}` : ''
  const base = original.replace(/\.[^.]+$/, '').replace(/[^a-z0-9]/gi, '-').toLowerCase()
  return `${base}-${Date.now()}${ext}`
}

export async function uploadMedia(file: File, folderId?: string | null): Promise<MediaRecord | null> {
  const supabase = createClient()
  const filename = uniqueFilename(file.name)
  const storagePath = folderId ? `${folderId}/${filename}` : filename

  const { error: storageError } = await supabase.storage
    .from('media')
    .upload(storagePath, file, { contentType: file.type, upsert: false })

  if (storageError) {
    console.error('Storage upload error:', storageError)
    return null
  }

  const { data: urlData } = supabase.storage.from('media').getPublicUrl(storagePath)
  const publicUrl = urlData?.publicUrl ?? ''

  const { data, error } = await supabase
    .from('media')
    .insert({
      filename,
      original_name: file.name,
      mime_type: file.type,
      size_bytes: file.size,
      storage_path: storagePath,
      public_url: publicUrl,
      folder_id: folderId ?? null,
    })
    .select()
    .single()

  if (error) {
    console.error('Media DB insert error:', error)
    return null
  }

  return data as MediaRecord
}

export async function listMedia(folderId?: string | null): Promise<MediaRecord[]> {
  const supabase = createClient()
  let query = supabase.from('media').select('*').order('created_at', { ascending: false })
  if (folderId !== undefined) {
    query = folderId ? query.eq('folder_id', folderId) : query.is('folder_id', null)
  }
  const { data, error } = await query
  if (error) { console.error('listMedia error:', error); return [] }
  return (data ?? []) as MediaRecord[]
}

export async function deleteMedia(id: string, storagePath: string): Promise<void> {
  const supabase = createClient()
  await supabase.storage.from('media').remove([storagePath])
  await supabase.from('media').delete().eq('id', id)
}

export async function updateMediaAlt(id: string, altText: string): Promise<void> {
  const supabase = createClient()
  await supabase.from('media').update({ alt_text: altText }).eq('id', id)
}

export async function listFolders(): Promise<MediaFolder[]> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('media_folders')
    .select('*')
    .order('name', { ascending: true })
  if (error) { console.error('listFolders error:', error); return [] }
  return (data ?? []) as MediaFolder[]
}

export async function createFolder(name: string, parentId?: string | null): Promise<MediaFolder | null> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('media_folders')
    .insert({ name, slug: slugify(name), parent_id: parentId ?? null })
    .select()
    .single()
  if (error) { console.error('createFolder error:', error); return null }
  return data as MediaFolder
}

export async function deleteFolder(id: string): Promise<void> {
  const supabase = createClient()
  await supabase.from('media_folders').delete().eq('id', id)
}
