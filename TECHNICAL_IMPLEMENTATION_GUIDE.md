# Technical Implementation Guide

## Setup Instructions for Developers

---

## Phase 1: Supabase Foundation Setup

### 1.1 Create Supabase Project

```bash
# Create account at https://supabase.com
# Create new project:
# - Name: eyogi-production
# - Database Password: [generate strong password]
# - Region: [closest to your users]
```

### 1.2 Get Credentials

After project created:
```bash
# From Supabase Dashboard → Settings → API
cp .env.example .env.local

# Fill in these values:
NEXT_PUBLIC_SUPABASE_URL=https://[project-id].supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=[anon-key]
SUPABASE_SERVICE_ROLE_KEY=[service-role-key]
```

### 1.3 Set Up Storage Buckets

```sql
-- Via Supabase Dashboard → Storage → New Bucket

Buckets to create:
1. media (public)
   - Allow file types: jpg, jpeg, png, gif, webp, pdf, doc, docx
   - Max file size: 10MB

2. course-materials (authenticated users only)
   - Allow file types: all
   - Max file size: 100MB

3. user-uploads (authenticated users only)
   - Allow file types: all
   - Max file size: 50MB
```

### 1.4 Create Database Tables

```bash
# Save all SQL from Part 2 of MIGRATION_PLAN.md
# Run via Supabase SQL Editor

# Create tables in order:
1. users
2. pages, posts, categories, media, settings
3. courses, lessons, assignments, submissions, enrollments
4. forms, form_submissions, memberships
```

### 1.5 Set Up RLS Policies

```bash
# Run all RLS policies from Part 2 of MIGRATION_PLAN.md
# Enable RLS on all tables:

ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE pages ENABLE ROW LEVEL SECURITY;
ALTER TABLE posts ENABLE ROW LEVEL SECURITY;
-- ... (all other tables)
```

### 1.6 Configure Authentication

```bash
# Supabase Dashboard → Authentication → Providers

# Enable:
- Email/Password (built-in)
- Google OAuth
- GitHub OAuth (optional)

# Redirect URLs:
- Development: http://localhost:3000/auth/callback
- Production: https://eyogi.com/auth/callback

# Email Settings:
- Auth → Email Templates
- Customize confirmation & password reset emails
```

### 1.7 Verify Setup

```bash
# Test connection from Next.js
npm install @supabase/supabase-js
npm install @supabase/auth-helpers-nextjs

# Create test file: src/lib/supabase/test.ts
import { createClient } from '@supabase/supabase-js'

export async function testConnection() {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
  
  const { data, error } = await supabase
    .from('users')
    .select('count()', { count: 'exact', head: true })
  
  if (error) throw error
  return data
}
```

---

## Phase 2: API Layer Development

### 2.1 Project Setup

```bash
# Install dependencies
yarn add @supabase/supabase-js
yarn add @supabase/auth-helpers-nextjs
yarn add zustand swr react-hook-form zod
yarn add lexical @lexical/react

# Dev dependencies
yarn add -D @types/node @types/react typescript
```

### 2.2 Create Supabase Utilities

#### src/lib/supabase/client.ts
```typescript
import { createBrowserClient } from '@supabase/auth-helpers-nextjs'

export const createClient = () =>
  createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
```

#### src/lib/supabase/server.ts
```typescript
import { createServerClient, serializeCookieHeader } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'

export const createServerSupabase = () => {
  const cookieStore = cookies()

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get: (name: string) => cookieStore.get(name)?.value,
        set: (name: string, value: string, options) => {
          cookieStore.set(name, value, options)
        },
        remove: (name: string, options) => {
          cookieStore.delete(name)
        },
      },
    }
  )
}
```

### 2.3 Create API Routes

#### src/app/api/auth/login/route.ts
```typescript
import { createServerSupabase } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  const { email, password } = await req.json()

  const supabase = createServerSupabase()

  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  })

  if (error) {
    return NextResponse.json(
      { error: error.message },
      { status: 400 }
    )
  }

  return NextResponse.json(data)
}
```

#### src/app/api/content/pages/route.ts
```typescript
import { createServerSupabase } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

// GET: Fetch all published pages (or all if admin)
export async function GET(req: NextRequest) {
  const supabase = createServerSupabase()
  const { searchParams } = new URL(req.url)
  const published = searchParams.get('published') !== 'false'

  let query = supabase.from('pages').select('*')

  if (published) {
    query = query.eq('status', 'published')
  }

  const { data, error } = await query.order('created_at', { ascending: false })

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 })
  }

  return NextResponse.json(data)
}

// POST: Create new page (admin only)
export async function POST(req: NextRequest) {
  const supabase = createServerSupabase()
  const { data: { user }, error: authError } = await supabase.auth.getUser()

  if (authError || !user || user.user_metadata?.role !== 'admin') {
    return NextResponse.json(
      { error: 'Unauthorized' },
      { status: 401 }
    )
  }

  const { title, slug, content, excerpt, status } = await req.json()

  const { data, error } = await supabase
    .from('pages')
    .insert({
      title,
      slug,
      content,
      excerpt,
      status,
      created_by: user.id,
    })
    .select()
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 })
  }

  return NextResponse.json(data, { status: 201 })
}
```

#### src/app/api/media/upload/route.ts
```typescript
import { createServerSupabase } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  const supabase = createServerSupabase()
  const { data: { user }, error: authError } = await supabase.auth.getUser()

  if (authError || !user) {
    return NextResponse.json(
      { error: 'Unauthorized' },
      { status: 401 }
    )
  }

  const formData = await req.formData()
  const file = formData.get('file') as File

  if (!file) {
    return NextResponse.json(
      { error: 'No file provided' },
      { status: 400 }
    )
  }

  const fileBuffer = Buffer.from(await file.arrayBuffer())
  const fileName = `${Date.now()}-${file.name}`
  const bucketName = 'media'

  // Upload to Supabase Storage
  const { data: storageData, error: storageError } = await supabase.storage
    .from(bucketName)
    .upload(fileName, fileBuffer)

  if (storageError) {
    return NextResponse.json(
      { error: storageError.message },
      { status: 400 }
    )
  }

  // Get public URL
  const { data: publicUrlData } = supabase.storage
    .from(bucketName)
    .getPublicUrl(fileName)

  // Create media record in database
  const { data: mediaData, error: mediaError } = await supabase
    .from('media')
    .insert({
      filename: file.name,
      mime_type: file.type,
      size_bytes: file.size,
      storage_path: storageData.path,
      uploaded_by: user.id,
    })
    .select()
    .single()

  if (mediaError) {
    return NextResponse.json(
      { error: mediaError.message },
      { status: 400 }
    )
  }

  return NextResponse.json({
    ...mediaData,
    publicUrl: publicUrlData.publicUrl,
  })
}
```

### 2.4 Create Custom Hooks

#### src/hooks/useAuth.ts
```typescript
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Session } from '@supabase/supabase-js'

export function useAuth() {
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
      setLoading(false)
    })

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session)
    })

    return () => subscription.unsubscribe()
  }, [supabase.auth])

  return { session, loading }
}
```

#### src/hooks/useSupabase.ts
```typescript
import { useCallback, useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'

interface UseSupabaseOptions<T> {
  table: string
  select?: string
  filter?: { column: string; value: string | number; operator: string }[]
  limit?: number
  orderBy?: { column: string; ascending: boolean }
}

export function useSupabase<T>({
  table,
  select = '*',
  filter = [],
  limit = 100,
  orderBy,
}: UseSupabaseOptions<T>) {
  const [data, setData] = useState<T[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const supabase = createClient()

  const fetchData = useCallback(async () => {
    try {
      setLoading(true)
      let query = supabase.from(table).select(select)

      // Apply filters
      filter.forEach(({ column, value, operator }) => {
        query = query[operator](column, value) as any
      })

      // Apply ordering
      if (orderBy) {
        query = query.order(orderBy.column, { ascending: orderBy.ascending })
      }

      // Apply limit
      query = query.limit(limit)

      const { data, error } = await query

      if (error) throw error
      setData(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error')
    } finally {
      setLoading(false)
    }
  }, [supabase, table, select, filter, limit, orderBy])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  return { data, loading, error, refetch: fetchData }
}
```

### 2.5 Testing

```bash
# Create test file: src/__tests__/api.test.ts

import { createClient } from '@supabase/supabase-js'

describe('API Tests', () => {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  it('should connect to Supabase', async () => {
    const { data, error } = await supabase.from('users').select('count()', { count: 'exact', head: true })
    expect(error).toBeNull()
  })

  it('should create a page', async () => {
    const { data, error } = await supabase
      .from('pages')
      .insert({
        title: 'Test Page',
        slug: 'test-page',
        content: {},
        status: 'draft',
      })
      .select()
      .single()

    expect(error).toBeNull()
    expect(data?.title).toBe('Test Page')
  })
})

# Run tests
yarn test
```

---

## Phase 3: Admin CMS Development

### 3.1 Create CMS Layout

#### src/app/dashboard/layout.tsx
```typescript
import { redirect } from 'next/navigation'
import { createServerSupabase } from '@/lib/supabase/server'
import AdminHeader from '@/components/admin/Header'
import AdminSidebar from '@/components/admin/Sidebar'

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = createServerSupabase()
  const { data: { user }, error } = await supabase.auth.getUser()

  if (error || !user || user.user_metadata?.role !== 'admin') {
    redirect('/auth/login')
  }

  return (
    <div className="flex h-screen">
      <AdminSidebar />
      <div className="flex-1 flex flex-col">
        <AdminHeader user={user} />
        <main className="flex-1 overflow-auto p-6">
          {children}
        </main>
      </div>
    </div>
  )
}
```

### 3.2 Create Pages Management

#### src/app/dashboard/pages/page.tsx
```typescript
'use client'

import { useState } from 'react'
import { useSupabase } from '@/hooks/useSupabase'
import DataTable from '@/components/admin/DataTable'
import Button from '@/components/ui/Button'
import Link from 'next/link'

export default function PagesPage() {
  const { data: pages, loading, refetch } = useSupabase({
    table: 'pages',
    select: 'id, title, slug, status, updated_at',
    orderBy: { column: 'updated_at', ascending: false },
  })

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Pages</h1>
        <Link href="/dashboard/pages/new">
          <Button>New Page</Button>
        </Link>
      </div>

      <DataTable
        columns={[
          { key: 'title', label: 'Title' },
          { key: 'slug', label: 'Slug' },
          { key: 'status', label: 'Status' },
          { key: 'updated_at', label: 'Updated' },
        ]}
        data={pages}
        loading={loading}
        onRefresh={refetch}
        rowAction={(row) => `/dashboard/pages/${row.id}/edit`}
      />
    </div>
  )
}
```

#### src/app/dashboard/pages/[id]/edit/page.tsx
```typescript
'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import RichTextEditor from '@/components/admin/Editor/RichTextEditor'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import Select from '@/components/ui/Select'
import TextArea from '@/components/ui/TextArea'

export default function EditPagePage({ params }: { params: { id: string } }) {
  const [page, setPage] = useState(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const supabase = createClient()

  useEffect(() => {
    fetchPage()
  }, [params.id])

  async function fetchPage() {
    const { data, error } = await supabase
      .from('pages')
      .select()
      .eq('id', params.id)
      .single()

    if (error) {
      console.error('Error fetching page:', error)
    } else {
      setPage(data)
    }
    setLoading(false)
  }

  async function savePage() {
    if (!page) return

    setSaving(true)
    const { error } = await supabase
      .from('pages')
      .update(page)
      .eq('id', params.id)

    if (error) {
      console.error('Error saving page:', error)
    } else {
      alert('Page saved successfully!')
    }
    setSaving(false)
  }

  if (loading) return <div>Loading...</div>
  if (!page) return <div>Page not found</div>

  return (
    <div className="max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold mb-6">Edit Page</h1>

      <div className="bg-white rounded-lg shadow p-6 space-y-6">
        <div>
          <label className="block text-sm font-medium mb-2">Title</label>
          <Input
            value={page.title}
            onChange={(e) => setPage({ ...page, title: e.target.value })}
            placeholder="Page title"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">Slug</label>
          <Input
            value={page.slug}
            onChange={(e) => setPage({ ...page, slug: e.target.value })}
            placeholder="page-slug"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">Excerpt</label>
          <TextArea
            value={page.excerpt}
            onChange={(e) => setPage({ ...page, excerpt: e.target.value })}
            placeholder="Short summary of the page"
            rows={3}
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">Content</label>
          <RichTextEditor
            value={page.content}
            onChange={(content) => setPage({ ...page, content })}
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-2">Status</label>
            <Select
              value={page.status}
              onChange={(e) => setPage({ ...page, status: e.target.value })}
            >
              <option value="draft">Draft</option>
              <option value="published">Published</option>
              <option value="archived">Archived</option>
            </Select>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Meta Title (SEO)</label>
            <Input
              value={page.meta_title || ''}
              onChange={(e) => setPage({ ...page, meta_title: e.target.value })}
              placeholder="SEO title (60 chars max)"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">Meta Description (SEO)</label>
          <TextArea
            value={page.meta_description || ''}
            onChange={(e) => setPage({ ...page, meta_description: e.target.value })}
            placeholder="SEO description (160 chars max)"
            rows={3}
          />
        </div>

        <div className="flex gap-4">
          <Button onClick={savePage} loading={saving}>
            Save Page
          </Button>
          <Button variant="outline">Cancel</Button>
        </div>
      </div>
    </div>
  )
}
```

### 3.3 Create SSH Admin Panel

Similar structure for SSH admin:
- `src/app/ssh-admin/courses/` - Course management
- `src/app/ssh-admin/lessons/` - Lesson management
- `src/app/ssh-admin/students/` - Student management
- `src/app/ssh-admin/grading/` - Grading interface

---

## Phase 4: Data Migration

### 4.1 Export Current Data

```bash
# From Neon (Payload CMS)
pg_dump -h [neon-host] -U [user] [database] > payload_backup.sql

# From current Supabase (SSH)
pg_dump -h [supabase-host] -U postgres [database] > ssh_backup.sql
```

### 4.2 Create Migration Script

#### scripts/migrate-data.ts
```typescript
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

async function migrateUsers() {
  // Fetch from old database
  // Transform data
  // Insert into new Supabase
  console.log('Migrating users...')
  
  const { error } = await supabase
    .from('users')
    .insert([
      // Transformed user data
    ])

  if (error) {
    console.error('Error migrating users:', error)
  } else {
    console.log('Users migrated successfully')
  }
}

async function migratePages() {
  console.log('Migrating pages...')
  // Similar pattern
}

async function migratePosts() {
  console.log('Migrating posts...')
  // Similar pattern
}

async function migrateMedia() {
  console.log('Migrating media files...')
  // Download from UploadThing
  // Upload to Supabase Storage
  // Create media records
}

async function runMigration() {
  try {
    await migrateUsers()
    await migratePages()
    await migratePosts()
    await migrateMedia()
    console.log('Migration completed!')
  } catch (error) {
    console.error('Migration failed:', error)
  }
}

runMigration()
```

### 4.3 Run Migration

```bash
# Install dependencies
npm install -D ts-node

# Run migration
npx ts-node scripts/migrate-data.ts
```

---

## Phase 5: Frontend Integration

### 5.1 Update Routes

Move all routes according to directory structure in Part 5 of MIGRATION_PLAN.md

### 5.2 Remove Payload CMS

```bash
# Delete files
rm -rf src/payload.config.ts
rm -rf src/(payload)
rm -rf src/SSH (old Vite app)

# Remove from package.json
# - payload
# - @payloadcms/db-postgres
# - uploadthing
# - @uploadthing/react
```

### 5.3 Update Next.js Config

#### next.config.js
```javascript
/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '[project-id].supabase.co',
        pathname: '/storage/v1/object/public/**',
      },
    ],
  },
  // Remove old SSH build config
}

module.exports = nextConfig
```

### 5.4 Test All Routes

```bash
# Start dev server
yarn dev

# Test routes:
# - http://localhost:3000/              (home)
# - http://localhost:3000/dashboard     (admin)
# - http://localhost:3000/ssh-app       (student)
# - http://localhost:3000/ssh-admin     (teacher)
# - http://localhost:3000/api/auth      (auth)
# - http://localhost:3000/api/content   (content)
```

---

## Phase 6: Testing

### 6.1 Unit Tests

```bash
yarn test
```

### 6.2 Integration Tests

```bash
# Test API routes
yarn test:api

# Test database queries
yarn test:db

# Test authentication
yarn test:auth
```

### 6.3 E2E Tests

```bash
yarn test:e2e
```

---

## Phase 7: Deployment

### 7.1 Production Supabase Setup

```bash
# Create production project
# Set up backups
# Configure SSL
# Configure monitoring
```

### 7.2 Vercel Deployment

```bash
# Link to Vercel
vercel link

# Set environment variables
vercel env add NEXT_PUBLIC_SUPABASE_URL
vercel env add NEXT_PUBLIC_SUPABASE_ANON_KEY
vercel env add SUPABASE_SERVICE_ROLE_KEY

# Deploy
vercel --prod
```

### 7.3 Monitor

```bash
# Check logs
vercel logs

# Monitor errors
# (Via Sentry if configured)

# Check performance
# (Via Vercel Analytics)
```

---

## Useful Commands

```bash
# Development
yarn dev                 # Start dev server
yarn build              # Build for production
yarn lint               # Run linter
yarn test               # Run tests

# Supabase
supabase status         # Check Supabase status
supabase db push        # Push schema changes
supabase functions deploy # Deploy edge functions

# Database
npm run migrate          # Run migrations
npm run seed            # Seed development data

# Deployment
vercel deploy           # Deploy to staging
vercel --prod           # Deploy to production
```

---

## Troubleshooting

### Issue: "Row-level security (RLS) violation"
**Solution**: Check RLS policies for the table. Make sure user has permission.

### Issue: "File upload fails"
**Solution**: Check storage bucket configuration and CORS settings.

### Issue: "Auth not working"
**Solution**: Verify auth redirect URLs and JWT settings.

### Issue: "Database connection timeout"
**Solution**: Check connection pooling and database status.

### Issue: "Performance is slow"
**Solution**: Add database indexes, enable caching, optimize queries.

---

## Next Steps

1. **Week 1**: Complete Phase 1 (Supabase setup)
2. **Week 2-3**: Complete Phase 2 (API development)
3. **Week 3-4**: Complete Phase 3 (CMS development)
4. **Week 4-5**: Complete Phase 4 (Data migration)
5. **Week 5-6**: Complete Phase 5 (Frontend integration)
6. **Week 6-7**: Complete Phase 6 (Testing)
7. **Week 7-8**: Complete Phase 7 (Deployment)

---

## Questions?

Refer to:
- [MIGRATION_PLAN.md](../MIGRATION_PLAN.md) - Complete plan
- [IMPLEMENTATION_QUICK_REFERENCE.md](../IMPLEMENTATION_QUICK_REFERENCE.md) - Quick reference
- Supabase Docs: https://supabase.com/docs
- Next.js Docs: https://nextjs.org/docs
- GitHub Issues: Create issue with details
