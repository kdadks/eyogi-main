// Pre-built schema generators for common use cases
export const CommonSchemas = {
  // FAQ Schema for better search snippets
  generateFAQSchema: (faqs: Array<{ question: string; answer: string }>) => ({
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faqs.map((faq) => ({
      '@type': 'Question',
      name: faq.question,
      acceptedAnswer: {
        '@type': 'Answer',
        text: faq.answer,
      },
    })),
  }),
  // Article Schema for blog posts
  generateArticleSchema: (article: {
    title: string
    description: string
    author: string
    datePublished: string
    dateModified: string
    url: string
    image?: string
  }) => ({
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: article.title,
    description: article.description,
    author: {
      '@type': 'Person',
      name: article.author,
    },
    publisher: {
      '@type': 'Organization',
      name: 'eYogi Gurukul',
      logo: {
        '@type': 'ImageObject',
        url: '/Images/Logo.png',
      },
    },
    datePublished: article.datePublished,
    dateModified: article.dateModified,
    url: article.url,
    image: article.image,
    mainEntityOfPage: {
      '@type': 'WebPage',
      '@id': article.url,
    },
    about: [
      { '@type': 'Thing', name: 'Hindu Education' },
      { '@type': 'Thing', name: 'Vedic Learning' },
      { '@type': 'Thing', name: 'Sanatan Dharma' },
    ],
  }),
  // Local Business Schema
  generateLocalBusinessSchema: () => ({
    '@context': 'https://schema.org',
    '@type': 'LocalBusiness',
    name: 'eYogi Gurukul',
    description:
      'Premier online Hindu education platform offering authentic Vedic learning and Sanatan Dharma courses.',
    url: 'https://eyogi-gurukul.vercel.app',
    telephone: '+353-1-234-5678',
    email: 'info@eyogigurukul.com',
    address: {
      '@type': 'PostalAddress',
      addressLocality: 'Dublin',
      addressCountry: 'Ireland',
    },
    geo: {
      '@type': 'GeoCoordinates',
      latitude: '53.3498',
      longitude: '-6.2603',
    },
    openingHours: 'Mo-Fr 09:00-18:00',
    priceRange: '€35-€100',
    servesCuisine: 'Educational Services',
    serviceArea: {
      '@type': 'GeoCircle',
      geoMidpoint: {
        '@type': 'GeoCoordinates',
        latitude: '53.3498',
        longitude: '-6.2603',
      },
      geoRadius: '50000',
    },
  }),
  // Review Schema
  generateReviewSchema: (
    reviews: Array<{
      author: string
      rating: number
      reviewBody: string
      datePublished: string
    }>,
  ) => ({
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: 'eYogi Gurukul',
    aggregateRating: {
      '@type': 'AggregateRating',
      ratingValue: '4.8',
      reviewCount: reviews.length.toString(),
      bestRating: '5',
      worstRating: '1',
    },
    review: reviews.map((review) => ({
      '@type': 'Review',
      author: {
        '@type': 'Person',
        name: review.author,
      },
      reviewRating: {
        '@type': 'Rating',
        ratingValue: review.rating.toString(),
        bestRating: '5',
        worstRating: '1',
      },
      reviewBody: review.reviewBody,
      datePublished: review.datePublished,
    })),
  }),
}
