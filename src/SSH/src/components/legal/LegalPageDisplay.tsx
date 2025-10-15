import React, { useState, useEffect } from 'react'
import { useParams, Navigate } from 'react-router-dom'
import { getPageBySlug } from '../../lib/api/pages'
import { Page } from '../../types'
import { Card, CardContent } from '../ui/Card'
import Footer from '../layout/Footer'
import { sanitizeRichHtml } from '../../utils/sanitize'

interface LegalPageProps {
  slug?: string // Optional prop for direct slug passing
}

export default function LegalPageDisplay({ slug: propSlug }: LegalPageProps = {}) {
  const { slug: paramSlug } = useParams<{ slug: string }>()
  const slug = propSlug || paramSlug

  const [page, setPage] = useState<Page | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const loadPage = async () => {
      if (!slug) {
        setError('Page not found')
        setLoading(false)
        return
      }

      try {
        setLoading(true)
        setError(null)
        const pageData = await getPageBySlug(slug)

        if (!pageData) {
          setError('Page not found')
        } else {
          setPage(pageData)

          // Update page title for SEO
          if (pageData.seo_title) {
            document.title = `${pageData.seo_title} | eYogi Gurukul`
          } else {
            document.title = `${pageData.title} | eYogi Gurukul`
          }

          // Update meta description for SEO
          if (pageData.seo_description) {
            const metaDescription = document.querySelector('meta[name="description"]')
            if (metaDescription) {
              metaDescription.setAttribute('content', pageData.seo_description)
            } else {
              const meta = document.createElement('meta')
              meta.name = 'description'
              meta.content = pageData.seo_description
              document.head.appendChild(meta)
            }
          }

          // Update meta keywords for SEO
          if (pageData.seo_keywords && pageData.seo_keywords.length > 0) {
            const metaKeywords = document.querySelector('meta[name="keywords"]')
            if (metaKeywords) {
              metaKeywords.setAttribute('content', pageData.seo_keywords.join(', '))
            } else {
              const meta = document.createElement('meta')
              meta.name = 'keywords'
              meta.content = pageData.seo_keywords.join(', ')
              document.head.appendChild(meta)
            }
          }
        }
      } catch (err) {
        console.error('Error loading page:', err)
        setError('Failed to load page')
      } finally {
        setLoading(false)
      }
    }

    loadPage()
  }, [slug])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      // Reset document title
      document.title = 'eYogi Gurukul'
    }
  }, [])

  if (!slug) {
    return <Navigate to="/404" replace />
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-red-50">
        <div className="py-12">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
            <Card className="shadow-xl">
              <CardContent className="p-8">
                <div className="animate-pulse">
                  <div className="h-8 bg-gray-200 rounded w-3/4 mb-4"></div>
                  <div className="h-4 bg-gray-200 rounded w-1/2 mb-6"></div>
                  <div className="space-y-3">
                    <div className="h-4 bg-gray-200 rounded"></div>
                    <div className="h-4 bg-gray-200 rounded w-5/6"></div>
                    <div className="h-4 bg-gray-200 rounded w-4/6"></div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
        <Footer />
      </div>
    )
  }

  if (error || !page) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-red-50">
        <div className="py-12">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
            <Card className="shadow-xl">
              <CardContent className="p-8 text-center">
                <div className="text-gray-400 mb-4">
                  <svg
                    className="h-16 w-16 mx-auto"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                    />
                  </svg>
                </div>
                <h1 className="text-2xl font-bold text-gray-900 mb-2">Page Not Found</h1>
                <p className="text-gray-600 mb-6">
                  {error || 'The page you are looking for does not exist or has been moved.'}
                </p>
                <a
                  href="/"
                  className="inline-flex items-center px-4 py-2 border border-transparent text-base font-medium rounded text-white bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500"
                >
                  Return Home
                </a>
              </CardContent>
            </Card>
          </div>
        </div>
        <Footer />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-red-50">
      <div className="py-12">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <Card className="shadow-xl">
            <CardContent className="p-8">
              {/* Page Header */}
              <div className="mb-8">
                <h1 className="text-3xl font-bold text-gray-900 mb-4">{page.title}</h1>

                {/* SEO description is in meta tags only, not displayed on page */}

                <div className="flex items-center text-sm text-gray-500 space-x-4">
                  <span>
                    Published on{' '}
                    {new Date(page.published_at || page.created_at).toLocaleDateString()}
                  </span>
                  {page.updated_at && new Date(page.updated_at) > new Date(page.created_at) && (
                    <span>Last updated {new Date(page.updated_at).toLocaleDateString()}</span>
                  )}
                </div>
              </div>

              {/* Page Content */}
              <div className="prose prose-lg max-w-none">
                {page.content && typeof page.content === 'object' && page.content.html ? (
                  <div
                    className="text-gray-700 leading-relaxed"
                    style={{
                      lineHeight: '1.7',
                      fontSize: '16px',
                    }}
                    dangerouslySetInnerHTML={{ __html: sanitizeRichHtml(String(page.content.html)) }}
                  />
                ) : (
                  <div
                    className="text-gray-700 leading-relaxed whitespace-pre-wrap"
                    style={{ lineHeight: '1.7' }}
                  >
                    {String(page.content)}
                  </div>
                )}
              </div>

              {/* Page Footer */}
              <div className="mt-12 pt-8 border-t border-gray-200">
                <div className="text-sm text-gray-500">
                  <p>This page is part of eYogi Gurukul's legal documentation.</p>
                  {page.updated_at && (
                    <p className="mt-1">
                      Last reviewed: {new Date(page.updated_at).toLocaleDateString()}
                    </p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
      <Footer />
    </div>
  )
}

// Alternative component for embedding in other pages
export function LegalPageEmbed({ slug }: { slug: string }) {
  const [page, setPage] = useState<Page | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const loadPage = async () => {
      try {
        const pageData = await getPageBySlug(slug)
        setPage(pageData)
      } catch (error) {
        console.error('Error loading page:', error)
      } finally {
        setLoading(false)
      }
    }

    loadPage()
  }, [slug])

  if (loading) {
    return (
      <div className="animate-pulse">
        <div className="h-6 bg-gray-200 rounded w-3/4 mb-3"></div>
        <div className="h-4 bg-gray-200 rounded w-full mb-2"></div>
        <div className="h-4 bg-gray-200 rounded w-5/6"></div>
      </div>
    )
  }

  if (!page) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-500">Content not available</p>
      </div>
    )
  }

  return (
    <div>
      <h3 className="text-xl font-bold text-gray-900 mb-4">{page.title}</h3>
      <div className="prose prose-sm max-w-none">
        {page.content && typeof page.content === 'object' && page.content.html ? (
          <div
            style={{ lineHeight: '1.6' }}
            dangerouslySetInnerHTML={{ __html: sanitizeRichHtml(String(page.content.html)) }}
          />
        ) : (
          <div className="whitespace-pre-wrap leading-relaxed">{String(page.content)}</div>
        )}
      </div>
    </div>
  )
}
