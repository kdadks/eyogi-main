import { useEffect } from 'react'
import { useLocation } from 'react-router-dom'

interface SEOData {
  title: string
  description: string
  keywords: string[]
  canonicalUrl?: string
  ogImage?: string
  structuredData?: object
}

export function useSEO(seoData: SEOData) {
  const location = useLocation()

  useEffect(() => {
    // Update page title
    document.title = seoData.title

    // Update meta description
    const metaDescription = document.querySelector('meta[name="description"]')
    if (metaDescription) {
      metaDescription.setAttribute('content', seoData.description)
    }

    // Update canonical URL
    const canonicalLink = document.querySelector('link[rel="canonical"]')
    if (canonicalLink) {
      canonicalLink.setAttribute('href', seoData.canonicalUrl || window.location.href)
    }

    // Add structured data
    if (seoData.structuredData) {
      const existingScript = document.querySelector('script[type="application/ld+json"]')
      if (existingScript) {
        existingScript.remove()
      }

      const script = document.createElement('script')
      script.type = 'application/ld+json'
      script.textContent = JSON.stringify(seoData.structuredData)
      document.head.appendChild(script)
    }
  }, [seoData, location])
}

export function generatePageSEO(
  title: string,
  description: string,
  additionalKeywords: string[] = [],
  path?: string
): SEOData {
  const baseKeywords = [
    'Hindu', 'Hinduism', 'Vedic', 'Hindu Religion', 'Hindu Culture',
    'Indian Hindu Culture', 'Sanatan', 'Sanatan Dharma', 'Hindu Education',
    'Vedic Learning', 'Hindu Philosophy', 'Hindu Traditions', 'Hindu Online Learning'
  ]

  return {
    title: `${title} | eYogi Gurukul - Hindu Education & Vedic Learning`,
    description,
    keywords: [...baseKeywords, ...additionalKeywords],
    canonicalUrl: path,
    structuredData: {
      "@context": "https://schema.org",
      "@type": "WebPage",
      name: title,
      description,
      url: `https://eyogi-gurukul.vercel.app${path || ''}`,
      isPartOf: {
        "@type": "WebSite",
        name: "eYogi Gurukul",
        url: "https://eyogi-gurukul.vercel.app"
      },
      about: [
        { "@type": "Thing", name: "Hindu Religion" },
        { "@type": "Thing", name: "Vedic Philosophy" },
        { "@type": "Thing", name: "Sanatan Dharma" }
      ]
    }
  }
}