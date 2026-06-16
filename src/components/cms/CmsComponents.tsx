// ============================================
// REUSABLE CMS FRONTEND COMPONENTS
// Display content from CMS API
// ============================================

'use client'

import React, { useEffect, useState } from 'react'
import Link from 'next/link'
import type { Page, Post, Category } from '@/types/cms'

interface PageCardProps {
  page: Page
}

export function PageCard({ page }: PageCardProps) {
  return (
    <article className="bg-white rounded-lg shadow hover:shadow-lg transition-shadow">
      {page.featured_image_id && (
        <div className="h-48 bg-gray-200 rounded-t-lg overflow-hidden">
          <img
            src={`/api/media/${page.featured_image_id}`}
            alt={page.title}
            className="w-full h-full object-cover"
          />
        </div>
      )}
      <div className="p-6">
        <h3 className="text-xl font-bold text-gray-900 mb-2">{page.title}</h3>
        {page.excerpt && <p className="text-gray-600 text-sm mb-4 line-clamp-3">{page.excerpt}</p>}
        <Link
          href={`/pages/${page.slug}`}
          className="text-blue-600 hover:text-blue-900 font-medium text-sm"
        >
          Read More →
        </Link>
      </div>
    </article>
  )
}

interface PostCardProps {
  post: Post
  showCategory?: boolean
}

export function PostCard({ post, showCategory }: PostCardProps) {
  return (
    <article className="bg-white rounded-lg shadow hover:shadow-lg transition-shadow overflow-hidden">
      {post.featured_image_id && (
        <div className="h-48 bg-gray-200 overflow-hidden">
          <img
            src={`/api/media/${post.featured_image_id}`}
            alt={post.title}
            className="w-full h-full object-cover hover:scale-105 transition-transform"
          />
        </div>
      )}
      <div className="p-6">
        <div className="flex items-center justify-between mb-3">
          <span className="text-xs font-semibold text-gray-600">
            {new Date(post.published_at || post.created_at).toLocaleDateString()}
          </span>
          {post.featured && (
            <span className="bg-yellow-100 text-yellow-800 text-xs font-semibold px-2 py-1 rounded">
              Featured
            </span>
          )}
        </div>
        <h3 className="text-xl font-bold text-gray-900 mb-2">{post.title}</h3>
        {post.excerpt && <p className="text-gray-600 text-sm mb-4 line-clamp-2">{post.excerpt}</p>}
        <div className="flex items-center justify-between">
          <Link
            href={`/blog/${post.slug}`}
            className="text-blue-600 hover:text-blue-900 font-medium text-sm"
          >
            Read Article →
          </Link>
          <span className="text-gray-500 text-xs">{post.view_count} views</span>
        </div>
      </div>
    </article>
  )
}

interface PageContentProps {
  page: Page
}

export function PageContent({ page }: PageContentProps) {
  return (
    <article className="max-w-4xl mx-auto">
      {page.featured_image_id && (
        <div className="mb-8 rounded-lg overflow-hidden">
          <img
            src={`/api/media/${page.featured_image_id}`}
            alt={page.title}
            className="w-full h-96 object-cover"
          />
        </div>
      )}

      <header className="mb-8">
        <h1 className="text-4xl font-bold text-gray-900 mb-4">{page.title}</h1>
        {page.meta_description && <p className="text-lg text-gray-600">{page.meta_description}</p>}
        <div className="text-sm text-gray-500 mt-4">
          Published {new Date(page.published_at || page.created_at).toLocaleDateString()}
        </div>
      </header>

      {page.content && (
        <div className="prose prose-lg max-w-none">
          <div dangerouslySetInnerHTML={{ __html: page.content }} />
        </div>
      )}
    </article>
  )
}

interface PostContentProps {
  post: Post
  relatedPosts?: Post[]
}

export function PostContent({ post, relatedPosts }: PostContentProps) {
  return (
    <article className="max-w-4xl mx-auto">
      {post.featured_image_id && (
        <div className="mb-8 rounded-lg overflow-hidden">
          <img
            src={`/api/media/${post.featured_image_id}`}
            alt={post.title}
            className="w-full h-96 object-cover"
          />
        </div>
      )}

      <header className="mb-8 border-b border-gray-200 pb-8">
        <h1 className="text-4xl font-bold text-gray-900 mb-4">{post.title}</h1>

        <div className="flex items-center justify-between flex-wrap gap-4">
          <div className="text-sm text-gray-600">
            Published {new Date(post.published_at || post.created_at).toLocaleDateString()}
          </div>
          <div className="flex items-center gap-4">
            <span className="text-sm text-gray-600">👁️ {post.view_count} views</span>
            {post.featured && (
              <span className="bg-yellow-100 text-yellow-800 text-xs font-semibold px-2 py-1 rounded">
                Featured
              </span>
            )}
          </div>
        </div>
      </header>

      {post.content && (
        <div className="prose prose-lg max-w-none mb-8">
          <div dangerouslySetInnerHTML={{ __html: post.content }} />
        </div>
      )}

      {relatedPosts && relatedPosts.length > 0 && (
        <aside className="border-t border-gray-200 pt-8">
          <h3 className="text-2xl font-bold text-gray-900 mb-6">Related Posts</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {relatedPosts.map((p) => (
              <PostCard key={p.id} post={p} />
            ))}
          </div>
        </aside>
      )}
    </article>
  )
}

interface PostGridProps {
  initialPosts?: Post[]
  categoryId?: string
  limit?: number
  showPagination?: boolean
}

export function PostGrid({
  initialPosts,
  categoryId,
  limit = 12,
  showPagination = true,
}: PostGridProps) {
  const [posts, setPosts] = useState<Post[]>(initialPosts || [])
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [loading, setLoading] = useState(!initialPosts)

  useEffect(() => {
    if (initialPosts) return // Use initial data if provided

    const fetchPosts = async () => {
      setLoading(true)
      try {
        const params = new URLSearchParams({
          page: String(page),
          limit: String(limit),
        })
        if (categoryId) params.append('category', categoryId)

        const res = await fetch(`/api/cms/posts?${params}`)
        const data = await res.json()

        if (data.success) {
          setPosts(data.data)
          setTotalPages(data.pagination.pages)
        }
      } catch (error) {
        console.error('Failed to fetch posts:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchPosts()
  }, [page, limit, categoryId, initialPosts])

  return (
    <div>
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="bg-gray-200 rounded-lg h-64 animate-pulse" />
          ))}
        </div>
      ) : posts.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-gray-500 text-lg">No posts found</p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {posts.map((post) => (
              <PostCard key={post.id} post={post} showCategory />
            ))}
          </div>

          {showPagination && totalPages > 1 && (
            <div className="mt-12 flex justify-center items-center space-x-2">
              <button
                onClick={() => setPage(Math.max(1, page - 1))}
                disabled={page === 1}
                className="px-4 py-2 border border-gray-300 rounded disabled:opacity-50"
              >
                ← Previous
              </button>

              {[...Array(totalPages)].map((_, i) => (
                <button
                  key={i + 1}
                  onClick={() => setPage(i + 1)}
                  className={`px-4 py-2 rounded ${
                    page === i + 1
                      ? 'bg-blue-600 text-white'
                      : 'border border-gray-300 hover:border-gray-400'
                  }`}
                >
                  {i + 1}
                </button>
              ))}

              <button
                onClick={() => setPage(Math.min(totalPages, page + 1))}
                disabled={page === totalPages}
                className="px-4 py-2 border border-gray-300 rounded disabled:opacity-50"
              >
                Next →
              </button>
            </div>
          )}
        </>
      )}
    </div>
  )
}

interface CategoryFilterProps {
  categories: Category[]
  selectedId?: string
  onSelect: (id?: string) => void
}

export function CategoryFilter({ categories, selectedId, onSelect }: CategoryFilterProps) {
  return (
    <div className="flex flex-wrap gap-2 mb-6">
      <button
        onClick={() => onSelect()}
        className={`px-4 py-2 rounded font-medium transition-colors ${
          !selectedId ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-900 hover:bg-gray-200'
        }`}
      >
        All
      </button>
      {categories.map((cat) => (
        <button
          key={cat.id}
          onClick={() => onSelect(cat.id)}
          className={`px-4 py-2 rounded font-medium transition-colors ${
            selectedId === cat.id
              ? 'bg-blue-600 text-white'
              : 'bg-gray-100 text-gray-900 hover:bg-gray-200'
          }`}
        >
          {cat.name}
        </button>
      ))}
    </div>
  )
}
