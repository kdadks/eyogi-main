# eYogi Gurukul - Developer Onboarding Guide

A Next.js 15 + PayloadCMS 3.9 application with PostgreSQL backend, built for content management and educational platform delivery.

### Prerequisites (Required)

- **Node.js**: 18.20.2 or higher (or Node.js 20.9.0+)
- **Package Manager**: yarn
- **Database**: PostgreSQL 13+ (local or cloud)
- **Git**: For version control

### 1. Clone & Install

```bash
git clone https://github.com/TutusBOT/eyogi.git
cd eyogi
yarn install
```

### 2. Environment Setup (.env)

Create `.env` file in the root directory:

**Complete `.env` configuration:**

```bash
# ===== DATABASE =====
# Neon PostgreSQL connection string
DATABASE_URI=postgresql://username:password@ep-xxx-xxx.us-east-1.aws.neon.tech/neondb?sslmode=require

# ===== PAYLOADCMS =====
# Secret key for PayloadCMS (generate a random 32+ char string)
PAYLOAD_SECRET=your-super-secret-key-minimum-32-characters-long

# ===== NEXT.JS =====
# Your site URL (important for image optimization and SEO)
NEXT_PUBLIC_SERVER_URL=http://localhost:3000

# ===== FILE UPLOADS =====
# UploadThing credentials for file/media management
UPLOADTHING_TOKEN=your-uploadthing-token

# ===== EMAIL =====
# Resend API key for contact forms and notifications
RESEND_API_KEY=your-resend-api-key

# ===== OPTIONAL =====
# Disable image optimization in problematic environments
# DISABLE_IMAGE_OPTIMIZE=1
```

### 3. Database Setup

#### ✅ Production Database (Already Configured)

**The project uses a Neon PostgreSQL database that is already set up and hosted.**

- **Database Provider**: Neon (Serverless PostgreSQL)
- **Status**: ✅ Already configured and running
- **Access**: You'll receive the `DATABASE_URI` connection string

**What you need to do:**

1. Get the `DATABASE_URI` connection string
2. Add it to your `.env` file:

```bash
DATABASE_URI=postgresql://username:password@ep-xxx-xxx.us-east-1.aws.neon.tech/neondb?sslmode=require
```

**⚠️ Important Notes:**

- The production Neon database is shared - be careful with migrations and data changes

**Access points after setup:**

- **Frontend**: http://localhost:3000
- **Admin Panel**: http://localhost:3000/admin
- **API**: http://localhost:3000/api

## 🛠️ External Service Setup

### UploadThing (File Uploads) - Current Implementation

**This project currently uses UploadThing for media management, but it's not the only option.**

**Current Setup (UploadThing):**

1. Go to https://uploadthing.com
2. Copy token to `UPLOADTHING_TOKEN` in `.env`
3. Configure allowed file types in dashboard

**Alternative Storage Options:**
If you want to change the file storage provider, PayloadCMS supports multiple storage adapters:

- **AWS S3**: Enterprise-grade cloud storage
- **Google Cloud Storage**: Google's cloud storage solution
- **Cloudinary**: Image and video management with transformations
- **Local Storage**: Store files on your server filesystem
- **Custom Storage**: Build your own storage adapter

**📖 How to Change Storage Providers:**

- **PayloadCMS Storage Documentation**: https://payloadcms.com/docs/upload/overview
- **Storage Adapters Guide**: https://payloadcms.com/docs/upload/storage-adapters
- **Configuration Examples**: https://payloadcms.com/docs/upload/storage-adapters#available-storage-adapters

**⚠️ Note:** Changing storage providers requires:

1. Installing the appropriate storage adapter package
2. Updating `src/payload.config.ts` configuration
3. Migrating existing media files
4. Updating environment variables

### Resend (Email Service) - Current Implementation

**This project currently uses Resend for email functionality, but alternatives exist.**

**Current Setup (Resend):**

1. Go to https://resend.com
2. Generate API key
3. Add to `RESEND_API_KEY` in `.env`

**Alternative Email Providers:**

- **SendGrid**: Popular email service with good deliverability
- **Mailgun**: Developer-focused email API
- **Amazon SES**: AWS email service
- **Nodemailer**: Direct SMTP integration
- **Custom Email API**: Build your own email integration

**📖 How to Change Email Providers:**

- **PayloadCMS Email Documentation**: https://payloadcms.com/docs/email/overview
- **Email Configuration Guide**: https://payloadcms.com/docs/email/email

## 📊 Database Schema & Management

### Understanding the Database Structure

PayloadCMS automatically creates and manages database tables based on your collections:

```typescript
// Collections (src/collections/)
;-pages - // Static pages (About, Contact, etc.)
  posts - // Blog posts and articles
  media - // File uploads (images, videos, PDFs)
  categories - // Post categories
  categoriesFaq - // FAQ categories
  Faq - // FAQ entries
  users - // Admin users
  membership - // Membership information
  formLinks - // External form links
  // Globals (site-wide content)
  about -
  us - // About page content
  privacy -
  policy - // Privacy policy content
  donation - // Donation page content
  // Plugin-generated collections
  forms - // Form builder forms
  form -
  submissions - // Form submissions
  search - // Search index
  redirects // URL redirects
```

**💡 Neon Database Features:**

- **Serverless**: Automatically scales and pauses when not in use
- **Branching**: Create database branches for testing (available in Neon dashboard)
- **Backups**: Automatic backups managed by Neon
- **SSL Required**: All connections must use SSL
- **Connection Pooling**: Built-in connection pooling for performance

## 🏗️ Architecture Overview

### Core Stack

- **Framework**: Next.js 15.1.0 (App Router) + React 19
- **CMS**: PayloadCMS 3.9.0 with TypeScript
- **Database**: PostgreSQL via `@payloadcms/db-postgres`
- **Storage**: UploadThing integration for media management
- **Styling**: Tailwind CSS + Radix UI primitives
- **Rich Text**: Lexical Editor with custom features
- **Validation**: Zod schemas + React Hook Form
- **Animations**: Framer Motion + Motion library

### PayloadCMS Configuration

```typescript
// src/payload.config.ts
export default buildConfig({
  collections: [Pages, Posts, Media, Categories, CategoriesFaq, Faq, Users, Membership, FormLinks],
  globals: [AboutUs, PrivacyPolicy, Donation],
  plugins: [...plugins, uploadthingStorage({...})],
  db: postgresAdapter({ pool: { connectionString: process.env.DATABASE_URI }}),
  editor: defaultLexical,
})
```

## 📁 Project Structure

```
src/
├── app/                           # Next.js App Router
│   ├── (frontend)/               # Public pages with layout
│   │   ├── about/page.tsx        # About page
│   │   ├── faq/[slug]/page.tsx   # Dynamic FAQ pages
│   │   └── hinduism/page.tsx     # Blog posts listing
│   ├── (payload)/                # PayloadCMS admin UI
│   └── api/                      # API routes
│       └── form-submissions/     # Form handling endpoint
├── blocks/                       # PayloadCMS Block components
│   ├── ArchiveBlock/            # Post archive with filtering
│   ├── CallToAction/            # CTA sections
│   ├── Code/                    # Syntax highlighted code blocks
│   ├── Content/                 # Rich text content blocks
│   ├── Form/                    # Dynamic form builder
│   ├── MediaBlock/              # Image/video embed blocks
│   └── RenderBlocks.tsx         # Block renderer component
├── collections/                  # PayloadCMS Collections
│   ├── Categories.ts            # Blog post categories
│   ├── Media.ts                 # File upload collection
│   ├── Pages/                   # Static pages collection
│   ├── Posts/                   # Blog posts collection
│   ├── Users/                   # Authentication users
│   ├── aboutUs/AboutUs.ts       # Global about page content
│   ├── faq/                     # FAQ collections
│   ├── forms/                   # Form links collection
│   └── membership/              # Membership collection
├── components/                   # React Components
│   ├── ui/                      # Base UI components (Radix)
│   ├── AboutUs/                 # About page specific components
│   ├── AdminBar/                # CMS admin toolbar
│   ├── Blogs/                   # Blog listing components
│   ├── CollectionArchive/       # Post archive display
│   ├── Faq/                     # FAQ components
│   ├── Hero/                    # Hero section variants
│   ├── Media/                   # Media display components
│   ├── RichText/                # Lexical renderer
│   └── SlideIn/                 # Animation components
├── fields/                       # PayloadCMS Custom Fields
│   ├── defaultLexical.ts        # Lexical editor config
│   ├── link.ts                  # Link field schema
│   └── slug/                    # Auto-slug generation
├── hooks/                        # PayloadCMS Hooks & React hooks
│   ├── formatSlug.ts            # Slug formatting hook
│   ├── populatePublishedAt.ts   # Auto-populate publish date
│   ├── revalidate*.ts           # ISR revalidation hooks
│   └── use-toast.ts             # Toast notification hook
├── plugins/                      # PayloadCMS Plugin Configuration
│   └── index.ts                 # Plugin registration & config
├── providers/                    # React Context Providers
│   ├── HeaderTheme/             # Theme context
│   ├── Theme/                   # Global theme provider
│   └── TransitionRouter.tsx     # Page transition provider
├── search/                       # Search Plugin Configuration
│   ├── beforeSync.ts            # Pre-search indexing hook
│   ├── fieldOverrides.ts        # Search field configuration
│   └── Search.tsx               # Search UI component
└── utilities/                    # Helper Functions
    ├── canUseDOM.ts             # SSR detection
    ├── cn.ts                    # ClassNames utility
    ├── formatDateTime.ts        # Date formatting
    ├── generateMeta.ts          # SEO meta generation
    ├── generatePreviewPath.ts   # Preview URL generation
    └── getURL.ts                # URL helpers (client/server)
```

## 🔧 PayloadCMS Implementation Details

### Collections Architecture

#### Content Collections

```typescript
// Posts Collection with rich text and relationships
export const Posts: CollectionConfig<'posts'> = {
  slug: 'posts',
  fields: [
    { name: 'title', type: 'text', required: true },
    {
      name: 'content',
      type: 'richText',
      editor: lexicalEditor({
        features: ({ rootFeatures }) => [
          ...rootFeatures,
          HeadingFeature({ enabledHeadingSizes: ['h1', 'h2', 'h3', 'h4', 'h5', 'h6'] }),
          BlocksFeature({ blocks: [Code, MediaBlock] }),
          FixedToolbarFeature(),
          InlineToolbarFeature(),
          HorizontalRuleFeature(),
        ],
      }),
    },
    {
      name: 'categories',
      type: 'relationship',
      relationTo: 'categories',
      hasMany: true,
    },
  ],
  hooks: {
    beforeChange: [populatePublishedAt],
    afterChange: [revalidatePost],
    afterDelete: [revalidateDelete],
  },
}
```

#### Global Content Management

```typescript
// Global configuration for site-wide content
export const AboutUs: GlobalConfig = {
  slug: 'about-us',
  fields: [
    {
      name: 'whatIsGurukul',
      type: 'group',
      fields: [
        { name: 'description', type: 'richText', editor: lexicalEditor({...}) },
        { name: 'photo', type: 'relationship', relationTo: 'media' },
      ],
    },
    {
      name: 'gallery',
      type: 'group',
      fields: [
        {
          name: 'galleryImages',
          type: 'array',
          fields: [{ name: 'image', type: 'relationship', relationTo: 'media' }],
        },
        {
          name: 'ytLinks',
          type: 'array',
          fields: [{ name: 'Link', type: 'text' }],
        },
      ],
    },
  ],
  hooks: { afterChange: [revalidateAboutUs] },
}
```

### Block-Based Content System

#### Dynamic Block Rendering

```typescript
// RenderBlocks component handles all block types
export const RenderBlocks: React.FC<{ blocks: Block[] }> = ({ blocks }) => {
  const blockComponents = {
    archive: ArchiveBlock,
    callToAction: CallToActionBlock,
    content: ContentBlock,
    mediaBlock: MediaBlock,
    formBlock: FormBlock,
    code: CodeBlock,
  }

  return blocks?.map((block, index) => {
    const BlockComponent = blockComponents[block.blockType]
    return BlockComponent ? <BlockComponent key={index} {...block} /> : null
  })
}
```

#### Block Configuration Examples

```typescript
// Archive Block with conditional fields
export const Archive: Block = {
  slug: 'archive',
  fields: [
    {
      name: 'populateBy',
      type: 'select',
      options: [
        { label: 'Collection', value: 'collection' },
        { label: 'Individual Selection', value: 'selection' },
      ],
    },
    {
      name: 'categories',
      type: 'relationship',
      relationTo: 'categories',
      hasMany: true,
      admin: {
        condition: (_, siblingData) => siblingData.populateBy === 'collection',
      },
    },
  ],
}
```

### Plugin System

```typescript
// Plugin configuration with overrides
export const plugins: Plugin[] = [
  searchPlugin({
    collections: ['posts'],
    beforeSync: beforeSyncWithSearch,
    searchOverrides: {
      admin: { hidden: true },
      fields: ({ defaultFields }) => [...defaultFields, ...searchFields],
    },
  }),
  formBuilderPlugin({
    fields: { payment: false },
    formSubmissionOverrides: { admin: { hidden: true } },
    formOverrides: {
      admin: { hidden: true },
      fields: ({ defaultFields }) =>
        defaultFields.map((field) => {
          if ('name' in field && field.name === 'confirmationMessage') {
            return {
              ...field,
              editor: lexicalEditor({
                features: ({ rootFeatures }) => [
                  ...rootFeatures,
                  FixedToolbarFeature(),
                  HeadingFeature({ enabledHeadingSizes: ['h1', 'h2', 'h3', 'h4'] }),
                ],
              }),
            }
          }
          return field
        }),
    },
  }),
  redirectsPlugin({ collections: ['pages', 'posts'], overrides: { admin: { hidden: true } } }),
  seoPlugin({ generateTitle, generateURL }),
]
```

## 🔌 API Architecture

### Form Submission Endpoint

```typescript
// app/api/form-submissions/route.ts
export async function POST(request: Request) {
  const payload = await getPayload({ config: configPromise })
  const data = await request.json()

  const result = await payload.create({
    collection: 'form-submissions',
    data: {
      form: data.form,
      submissionData: data.submissionData,
    },
  })

  return Response.json(result)
}
```

### Dynamic Page Generation

```typescript
// app/(frontend)/faq/[slug]/page.tsx
export default async function Page({ params }: { params: Promise<{ slug?: string }> }) {
  const { slug = '' } = await params
  const payload = await getPayload({ config: configPromise })

  const result = await payload.find({
    collection: 'Faq',
    where: { slug: { equals: slug } },
    limit: 1,
  })

  return <FaqPage data={result.docs[0]} />
}
```

### Environment Variables for Production

```bash
# Production database (replace with your cloud DB)
DATABASE_URI=postgresql://user:pass@prod-host:5432/eyogi_prod

# Production URL (your actual domain)
NEXT_PUBLIC_SERVER_URL=https://yourdomain.com

# Same secrets as development
PAYLOAD_SECRET=your-production-secret-32-chars-minimum
UPLOADTHING_TOKEN=your-uploadthing-token
RESEND_API_KEY=your-resend-api-key
```

#

## 📚 Learning Resources

### PayloadCMS Documentation

- **Official Docs**: https://payloadcms.com/docs
- **Collections**: https://payloadcms.com/docs/configuration/collections
- **Blocks**: https://payloadcms.com/docs/fields/blocks
- **Hooks**: https://payloadcms.com/docs/hooks/overview

### Next.js Resources

- **App Router**: https://nextjs.org/docs/app
- **API Routes**: https://nextjs.org/docs/app/building-your-application/routing/route-handlers
- **Image Optimization**: https://nextjs.org/docs/app/building-your-application/optimizing/images

### Environment Configuration

```bash
# Required environment variables
DATABASE_URI=postgresql://user:password@localhost:5432/eyogi
PAYLOAD_SECRET=your-secret-key
NEXT_PUBLIC_SERVER_URL=http://localhost:3000
UPLOADTHING_SECRET=your-uploadthing-secret
UPLOADTHING_APP_ID=your-uploadthing-app-id
RESEND_API_KEY=your-resend-api-key
```

### Development Commands

```bash
# Install dependencies
yarn install

# Generate TypeScript types from PayloadCMS schema
yarn generate:types

# Development server with Turbo
yarn dev

# Production build
npm build && npm start
```

### TypeScript Integration

```typescript
// Generated types from PayloadCMS schema
export interface Config {
  collections: {
    pages: Page
    posts: Post
    media: Media
    categories: Category
    // ... other collections
  }
  globals: {
    'about-us': AboutUs
    'privacy-policy': PrivacyPolicy
    donation: Donation
  }
}
```

### Performance Optimizations

- **ISR (Incremental Static Regeneration)**: Automatic revalidation via PayloadCMS hooks
- **Image Optimization**: Next.js Image component with UploadThing CDN
- **Code Splitting**: Automatic route-based splitting via App Router
- **Caching**: PostgreSQL connection pooling and query optimization

### Security Features

- **CSRF Protection**: Built-in Next.js CSRF protection
- **Input Validation**: Zod schemas for form validation
- **Media Security**: UploadThing handles file validation and CDN delivery

## 🔍 Key Technical Features

- **Type Safety**: Full TypeScript coverage with generated types from PayloadCMS schema
- **Real-time Preview**: Live preview functionality for content editors
- **SEO Optimization**: Automated meta tag generation and XML sitemap
- **Accessibility**: ARIA-compliant components using Radix UI primitives
- **Performance**: Optimized builds with Bundle Analyzer integration
- **Error Handling**: Comprehensive error boundaries and logging
- **Testing**: ESLint configuration with strict TypeScript rules
