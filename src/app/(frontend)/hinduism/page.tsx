import { createClient } from '@supabase/supabase-js'
import { CollectionArchive } from '@/components/CollectionArchive'
import Hero from '@/components/Hero/page'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  {
    db: { schema: 'gurukul_main' },
  },
)

interface Post {
  id: string
  title: string
  slug: string
  excerpt: string
  content: string
  published_at: string
  created_at: string
  updated_at: string
  created_by: string
}

export const revalidate = 3600 // Revalidate every hour

export const metadata = {
  title: 'Hinduism',
  description: 'Explore content about Hinduism, Vedic wisdom, and Sanatana Dharma',
}

export default async function HinduismPage() {
  try {
    const { data: posts, error } = await supabase
      .from('posts')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching posts:', error)
      return (
        <div className="flex flex-col gap-16 w-full">
          <Hero />
          <div className="px-4 lg:px-8 py-16">
            <h1 className="text-4xl font-bold mb-4">Hinduism</h1>
            <p className="text-lg text-gray-600">No posts available at this time.</p>
          </div>
        </div>
      )
    }

    const mappedPosts = (posts || []).map((post: Post) => ({
      id: post.id,
      title: post.title,
      slug: post.slug,
      description: post.excerpt,
      body: [{ type: 'text', text: post.content }],
      publishedAt: post.published_at,
      createdAt: post.created_at,
      updatedAt: post.updated_at,
    }))

    return (
      <div className="flex flex-col gap-16 w-full">
        <Hero />
        <div className="px-4 lg:px-8 py-16">
          <h1 className="text-4xl font-bold mb-8">Hinduism</h1>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            <CollectionArchive posts={mappedPosts} />
          </div>
        </div>
      </div>
    )
  } catch (error) {
    console.error('Error loading page:', error)
    return (
      <div className="flex flex-col gap-16 w-full">
        <Hero />
        <div className="px-4 lg:px-8 py-16">
          <h1 className="text-4xl font-bold mb-4">Hinduism</h1>
          <p className="text-lg text-gray-600">Error loading content. Please try again later.</p>
        </div>
      </div>
    )
  }
}
