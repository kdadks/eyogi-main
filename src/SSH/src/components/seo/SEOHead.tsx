import React from 'react'

interface SEOHeadProps {
  title?: string
  description?: string
  keywords?: string[]
  canonicalUrl?: string
  ogImage?: string
  ogType?: 'website' | 'article' | 'course' | 'profile'
  structuredData?: object | object[]
  noIndex?: boolean
}

export default function SEOHead({
  title,
  description,
  keywords = [],
  canonicalUrl,
  ogImage,
  ogType = 'website',
  structuredData,
  noIndex = false
}: SEOHeadProps) {
  const siteTitle = 'eYogi Gurukul - Ancient Hindu Wisdom, Modern Vedic Learning'
  const siteDescription = 'Learn authentic Hindu traditions, Vedic philosophy, Sanskrit, mantras, and yoga through comprehensive online courses. Discover Sanatan Dharma wisdom with expert teachers in our traditional Gurukul system.'
  const siteUrl = typeof window !== 'undefined' ? window.location.origin : 'https://eyogi-gurukul.vercel.app'
  
  const fullTitle = title ? `${title} | ${siteTitle}` : siteTitle
  const fullDescription = description || siteDescription
  const fullCanonicalUrl = canonicalUrl ? `${siteUrl}${canonicalUrl}` : siteUrl
  const fullOgImage = ogImage || `${siteUrl}/og-image.jpg`
  
  // Core SEO keywords for Hindu/Vedic content
  const coreKeywords = [
    'Hindu', 'Hinduism', 'Vedic', 'Hindu Religion', 'Hindu Culture', 
    'Indian Hindu Culture', 'Sanatan', 'Sanatan Dharma', 'Vedic Education',
    'Hindu Philosophy', 'Hindu Traditions', 'Hindu Learning', 'Vedic Wisdom',
    'Hindu Courses', 'Vedic Studies', 'Hindu Gurukul', 'Sanatan Dharma Education',
    'Hindu Online Learning', 'Vedic Knowledge', 'Hindu Spiritual Education',
    'Traditional Hindu Education', 'Authentic Hindu Teaching', 'Hindu Heritage',
    'Vedic Philosophy', 'Hindu Scriptures', 'Dharma Education', 'Hindu Values',
    'Sanskrit Learning', 'Mantra Education', 'Yoga Philosophy', 'Hindu Festivals',
    'Hindu Rituals', 'Hindu Practices', 'Vedic Science', 'Hindu Mythology',
    'Hindu Ethics', 'Dharmic Living', 'Hindu Spirituality', 'Vedic Lifestyle'
  ]
  
  const allKeywords = [...coreKeywords, ...keywords].join(', ')

  React.useEffect(() => {
    // Update document title
    document.title = fullTitle

    // Update meta description
    const metaDescription = document.querySelector('meta[name="description"]')
    if (metaDescription) {
      metaDescription.setAttribute('content', fullDescription)
    } else {
      const meta = document.createElement('meta')
      meta.name = 'description'
      meta.content = fullDescription
      document.head.appendChild(meta)
    }

    // Update keywords
    const metaKeywords = document.querySelector('meta[name="keywords"]')
    if (metaKeywords) {
      metaKeywords.setAttribute('content', allKeywords)
    } else {
      const meta = document.createElement('meta')
      meta.name = 'keywords'
      meta.content = allKeywords
      document.head.appendChild(meta)
    }

    // Update canonical URL
    let canonicalLink = document.querySelector('link[rel="canonical"]')
    if (canonicalLink) {
      canonicalLink.setAttribute('href', fullCanonicalUrl)
    } else {
      canonicalLink = document.createElement('link')
      canonicalLink.rel = 'canonical'
      canonicalLink.href = fullCanonicalUrl
      document.head.appendChild(canonicalLink)
    }

    // Update Open Graph tags
    const updateOGTag = (property: string, content: string) => {
      let ogTag = document.querySelector(`meta[property="${property}"]`)
      if (ogTag) {
        ogTag.setAttribute('content', content)
      } else {
        ogTag = document.createElement('meta')
        ogTag.setAttribute('property', property)
        ogTag.setAttribute('content', content)
        document.head.appendChild(ogTag)
      }
    }

    updateOGTag('og:title', fullTitle)
    updateOGTag('og:description', fullDescription)
    updateOGTag('og:type', ogType)
    updateOGTag('og:url', fullCanonicalUrl)
    updateOGTag('og:image', fullOgImage)
    updateOGTag('og:site_name', 'eYogi Gurukul')

    // Update Twitter Card tags
    const updateTwitterTag = (name: string, content: string) => {
      let twitterTag = document.querySelector(`meta[name="${name}"]`)
      if (twitterTag) {
        twitterTag.setAttribute('content', content)
      } else {
        twitterTag = document.createElement('meta')
        twitterTag.setAttribute('name', name)
        twitterTag.setAttribute('content', content)
        document.head.appendChild(twitterTag)
      }
    }

    updateTwitterTag('twitter:card', 'summary_large_image')
    updateTwitterTag('twitter:title', fullTitle)
    updateTwitterTag('twitter:description', fullDescription)
    updateTwitterTag('twitter:image', fullOgImage)

    // Update robots meta
    const robotsTag = document.querySelector('meta[name="robots"]')
    const robotsContent = noIndex ? 'noindex, nofollow' : 'index, follow, max-snippet:-1, max-image-preview:large, max-video-preview:-1'
    if (robotsTag) {
      robotsTag.setAttribute('content', robotsContent)
    } else {
      const meta = document.createElement('meta')
      meta.name = 'robots'
      meta.content = robotsContent
      document.head.appendChild(meta)
    }

    // Add structured data
    if (structuredData) {
      // Remove existing structured data
      const existingScripts = document.querySelectorAll('script[type="application/ld+json"]')
      existingScripts.forEach(script => script.remove())

      // Add new structured data
      const schemaArray = Array.isArray(structuredData) ? structuredData : [structuredData]
      schemaArray.forEach((schema, index) => {
        const script = document.createElement('script')
        script.type = 'application/ld+json'
        script.textContent = JSON.stringify(schema, null, 2)
        script.id = `structured-data-${index}`
        document.head.appendChild(script)
      })
    }
  }, [fullTitle, fullDescription, allKeywords, fullCanonicalUrl, fullOgImage, ogType, structuredData, noIndex])

  return null
}