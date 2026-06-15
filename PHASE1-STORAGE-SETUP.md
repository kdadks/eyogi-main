# Phase 1: Storage Configuration Guide

**Status**: Implementation Ready  
**Date**: 2026-06-15  
**Project**: gwugapcoknxqqluocjzl.supabase.co

---

## Storage Overview

### Three Buckets to Create
1. **media** - Blog, page images (PUBLIC)
2. **course-materials** - Course files (AUTHENTICATED)
3. **user-uploads** - Student assignments (USER-SCOPED)

---

## Part 1: Create Storage Buckets

### Via Supabase Dashboard

1. Go to: **Storage** → **Buckets**
2. Click: **New Bucket**

#### Bucket 1: `media` (Public)

**Settings**:
- Name: `media`
- Make it public: **YES**
- File size limit: `10 MB`
- Allowed MIME types:
  ```
  image/jpeg
  image/png
  image/gif
  image/webp
  application/pdf
  application/msword
  application/vnd.openxmlformats-officedocument.wordprocessingml.document
  ```

**Usage**: Blog posts, page featured images, public media

#### Bucket 2: `course-materials` (Private)

**Settings**:
- Name: `course-materials`
- Make it public: **NO**
- File size limit: `100 MB`
- Allowed MIME types: **ALL** (or restrict if needed)

**Usage**: Course videos, documents, learning materials

#### Bucket 3: `user-uploads` (Private, User-Scoped)

**Settings**:
- Name: `user-uploads`
- Make it public: **NO**
- File size limit: `50 MB`
- Allowed MIME types: **ALL**

**Usage**: Student assignment submissions, profile pictures

---

## Part 2: Configure CORS (Cross-Origin Resource Sharing)

CORS allows your frontend to upload/download files from browser.

1. Go to: **Storage** → **Configuration**
2. Edit **CORS allowed origins**
3. Add these origins:

```json
[
  "http://localhost:3000",
  "http://localhost:3001",
  "https://[YOUR-PRODUCTION-DOMAIN]",
  "https://www.[YOUR-PRODUCTION-DOMAIN]"
]
```

**Do this later when you have production domain.**

---

## Part 3: Storage URLs & Access

### Public Bucket (`media`)
```
Files are publicly accessible at:
https://gwugapcoknxqqluocjzl.supabase.co/storage/v1/object/public/media/filename.jpg
```

### Private Buckets (`course-materials`, `user-uploads`)
```
Files require:
1. Valid JWT token from auth
2. RLS policy allowing access
3. Generated via signed URL or backend proxy

Signed URL example:
https://gwugapcoknxqqluocjzl.supabase.co/storage/v1/object/sign/course-materials/filename.pdf?token=eyJ...
```

---

## Part 4: File Upload Implementation

### Single File Upload Endpoint

```typescript
// src/app/api/media/upload/route.ts
import { createServerSupabase } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  const supabase = createServerSupabase()
  
  // Get authenticated user
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const formData = await req.formData()
  const file = formData.get('file') as File
  const bucket = formData.get('bucket') as string || 'media'

  if (!file) {
    return NextResponse.json({ error: 'No file provided' }, { status: 400 })
  }

  // Validate file size
  const MAX_SIZES = {
    media: 10 * 1024 * 1024, // 10MB
    'course-materials': 100 * 1024 * 1024, // 100MB
    'user-uploads': 50 * 1024 * 1024 // 50MB
  }

  if (file.size > MAX_SIZES[bucket as keyof typeof MAX_SIZES]) {
    return NextResponse.json(
      { error: `File too large. Max: ${MAX_SIZES[bucket as keyof typeof MAX_SIZES] / 1024 / 1024}MB` },
      { status: 413 }
    )
  }

  // Generate unique filename
  const timestamp = Date.now()
  const fileName = `${timestamp}-${file.name.replace(/\s+/g, '-')}`
  
  // For user-uploads, nest under user ID
  const filePath = bucket === 'user-uploads' 
    ? `${user.id}/${fileName}`
    : fileName

  // Upload to Supabase Storage
  const fileBuffer = Buffer.from(await file.arrayBuffer())
  const { data: uploadData, error: uploadError } = await supabase.storage
    .from(bucket)
    .upload(filePath, fileBuffer, {
      contentType: file.type,
      upsert: false
    })

  if (uploadError) {
    return NextResponse.json(
      { error: uploadError.message },
      { status: 400 }
    )
  }

  // Get public or signed URL
  let fileUrl: string
  
  if (bucket === 'media') {
    // Public URL (no expiry)
    const { data: publicData } = supabase.storage
      .from(bucket)
      .getPublicUrl(filePath)
    fileUrl = publicData.publicUrl
  } else {
    // Signed URL (expires in 7 days)
    const { data: signedData } = await supabase.storage
      .from(bucket)
      .createSignedUrl(filePath, 7 * 24 * 60 * 60) // 7 days
    fileUrl = signedData?.signedUrl || ''
  }

  // Create media record in database
  const { data: mediaRecord, error: dbError } = await supabase
    .from('media')
    .insert({
      filename: file.name,
      mime_type: file.type,
      size_bytes: file.size,
      storage_path: filePath,
      uploaded_by: user.id
    })
    .select()
    .single()

  if (dbError) {
    console.error('Database error:', dbError)
    // Note: File already uploaded, but we couldn't create record
  }

  return NextResponse.json({
    success: true,
    file: {
      id: mediaRecord?.id,
      filename: file.name,
      size: file.size,
      url: fileUrl,
      storagePath: filePath,
      bucket: bucket,
      createdAt: new Date()
    }
  })
}
```

### Client-Side Upload

```typescript
// src/hooks/useFileUpload.ts
import { useState } from 'react'

export function useFileUpload() {
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const upload = async (
    file: File,
    bucket: 'media' | 'course-materials' | 'user-uploads' = 'media'
  ) => {
    try {
      setUploading(true)
      setError(null)

      const formData = new FormData()
      formData.append('file', file)
      formData.append('bucket', bucket)

      const response = await fetch('/api/media/upload', {
        method: 'POST',
        body: formData
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Upload failed')
      }

      const data = await response.json()
      return data.file

    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error'
      setError(message)
      throw err
    } finally {
      setUploading(false)
    }
  }

  return { upload, uploading, error }
}
```

### React Component Example

```typescript
// src/components/admin/FileUploader.tsx
'use client'

import { useState } from 'react'
import { useFileUpload } from '@/hooks/useFileUpload'

export function FileUploader() {
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const { upload, uploading, error } = useFileUpload()

  async function handleUpload() {
    if (!selectedFile) return

    try {
      const result = await upload(selectedFile, 'media')
      console.log('Upload successful:', result)
      alert('File uploaded successfully!')
    } catch (err) {
      console.error('Upload error:', err)
    }
  }

  return (
    <div className="space-y-4">
      <input
        type="file"
        onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
        disabled={uploading}
      />

      {error && <p className="text-red-600">{error}</p>}

      <button
        onClick={handleUpload}
        disabled={!selectedFile || uploading}
      >
        {uploading ? 'Uploading...' : 'Upload'}
      </button>
    </div>
  )
}
```

---

## Part 5: File Download & Retrieval

### Download Public File

```typescript
// Public files can be accessed directly
const imageUrl = 'https://gwugapcoknxqqluocjzl.supabase.co/storage/v1/object/public/media/filename.jpg'
```

### Download Private File (with Signed URL)

```typescript
// src/lib/supabase/storage.ts
import { createClient } from '@/lib/supabase/client'

export async function getSignedUrl(
  bucket: string,
  filePath: string,
  expiresIn: number = 3600 // 1 hour
) {
  const supabase = createClient()

  const { data, error } = await supabase.storage
    .from(bucket)
    .createSignedUrl(filePath, expiresIn)

  if (error) throw error
  return data.signedUrl
}

export async function downloadFile(
  bucket: string,
  filePath: string
) {
  const supabase = createClient()

  const { data, error } = await supabase.storage
    .from(bucket)
    .download(filePath)

  if (error) throw error
  return data
}
```

---

## Part 6: Delete Files

### Delete Single File

```typescript
// src/app/api/media/delete/[id]/route.ts
import { createServerSupabase } from '@/lib/supabase/server'

export async function DELETE(
  req: Request,
  { params }: { params: { id: string } }
) {
  const supabase = createServerSupabase()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // Get media record
  const { data: media, error: getError } = await supabase
    .from('media')
    .select('*')
    .eq('id', params.id)
    .single()

  if (getError || !media) {
    return Response.json({ error: 'File not found' }, { status: 404 })
  }

  // Check permissions (user uploaded it or is admin)
  if (media.uploaded_by !== user.id && user.user_metadata?.role !== 'admin') {
    return Response.json({ error: 'Forbidden' }, { status: 403 })
  }

  // Delete from storage
  const { error: deleteError } = await supabase.storage
    .from('media')
    .remove([media.storage_path])

  if (deleteError) {
    return Response.json({ error: deleteError.message }, { status: 400 })
  }

  // Delete from database
  const { error: dbError } = await supabase
    .from('media')
    .delete()
    .eq('id', params.id)

  if (dbError) {
    return Response.json({ error: dbError.message }, { status: 400 })
  }

  return Response.json({ success: true })
}
```

---

## Part 7: Storage Policies (RLS)

See **PHASE1-RLS-POLICIES.md** for complete RLS setup.

Key policies:
- Public read for `media` bucket
- Authenticated read for `course-materials`
- User-scoped write/read for `user-uploads`

---

## Part 8: Testing Storage

### Test Upload via API
```bash
# Create test file
echo "test content" > test.txt

# Upload to media bucket
curl -X POST http://localhost:3000/api/media/upload \
  -F "file=@test.txt" \
  -F "bucket=media" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

### Verify in Supabase Dashboard

1. Go to: **Storage** → **media**
2. Should see uploaded file
3. Click file to get public URL
4. Test URL in browser

---

## Part 9: Security Checklist

- [ ] Three buckets created (media, course-materials, user-uploads)
- [ ] File size limits configured
- [ ] Allowed MIME types set
- [ ] CORS configured for development
- [ ] RLS policies set up (see PHASE1-RLS-POLICIES.md)
- [ ] Upload endpoint validates file size
- [ ] Upload endpoint validates MIME type
- [ ] Upload endpoint checks user authentication
- [ ] Delete endpoint checks permissions
- [ ] No direct file paths exposed to client
- [ ] Public URLs only for public bucket

---

## Troubleshooting

### Issue: File upload returns 403
**Check**:
1. User is authenticated (JWT token valid)
2. RLS policy allows insert on storage.objects
3. File path doesn't have special characters

### Issue: CORS errors on browser upload
**Check**:
1. CORS origins configured in Storage → Configuration
2. Origin includes protocol (http:// or https://)
3. No trailing slash on origin
4. Browser cache cleared

### Issue: Can't download private files
**Check**:
1. User authenticated with valid JWT
2. Signed URL not expired
3. RLS policy allows read on storage.objects
4. User ID in path matches current user (for user-uploads)

---

## Next Phase

After storage configured:
1. ✅ Environment variables set
2. ✅ Authentication configured
3. ✅ Storage configured
4. ⏭️ **Next**: Configure RLS Policies (PHASE1-RLS-POLICIES.md)
5. ⏭️ Then: Complete Phase 1 Checklist

---

## Files in Phase 1

- PHASE1-ENV-TEMPLATE.md
- PHASE1-AUTH-SETUP.md
- **PHASE1-STORAGE-SETUP.md** ← You are here
- PHASE1-RLS-POLICIES.md
- PHASE1-CHECKLIST.md
