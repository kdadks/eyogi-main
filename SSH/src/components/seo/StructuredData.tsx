import { Course } from '../../types'
export interface OrganizationSchema {
  '@context': 'https://schema.org'
  '@type': 'EducationalOrganization'
  name: string
  description: string
  url: string
  logo: string
  sameAs: string[]
  address: {
    '@type': 'PostalAddress'
    streetAddress: string
    addressLocality: string
    addressCountry: string
  }
  contactPoint: {
    '@type': 'ContactPoint'
    telephone: string
    contactType: string
    email: string
  }
  foundingDate: string
  keywords: string
  educationalCredentialAwarded: string
  hasCredential: string[]
}
export interface CourseSchema {
  '@context': 'https://schema.org'
  '@type': 'Course'
  name: string
  description: string
  provider: {
    '@type': 'EducationalOrganization'
    name: string
    url: string
  }
  courseCode: string
  educationalLevel: string
  teaches: string[]
  timeRequired: string
  coursePrerequisites?: string
  aggregateRating?: {
    '@type': 'AggregateRating'
    ratingValue: number
    reviewCount: number
  }
  offers: {
    '@type': 'Offer'
    price: string
    priceCurrency: string
    availability: string
  }
  inLanguage: string
  keywords: string
  about: {
    '@type': 'Thing'
    name: string
  }[]
}
export interface WebsiteSchema {
  '@context': 'https://schema.org'
  '@type': 'WebSite'
  name: string
  description: string
  url: string
  potentialAction: {
    '@type': 'SearchAction'
    target: {
      '@type': 'EntryPoint'
      urlTemplate: string
    }
    'query-input': string
  }
  keywords: string
  inLanguage: string[]
  about: {
    '@type': 'Thing'
    name: string
  }[]
}
export interface BreadcrumbSchema {
  '@context': 'https://schema.org'
  '@type': 'BreadcrumbList'
  itemListElement: Array<{
    '@type': 'ListItem'
    position: number
    name: string
    item: string
  }>
}
export function generateOrganizationSchema(): OrganizationSchema {
  return {
    '@context': 'https://schema.org',
    '@type': 'EducationalOrganization',
    name: 'eYogi Gurukul',
    description:
      'Premier online platform for authentic Hindu education, Vedic learning, and Sanatan Dharma studies. Learn Sanskrit, Hindu philosophy, mantras, yoga, and traditional Hindu culture through expert-led courses.',
    url: 'https://eyogi-gurukul.vercel.app',
    logo: '/Images/Logo.png',
    sameAs: [
      'https://facebook.com/eyogigurukul',
      'https://twitter.com/eyogigurukul',
      'https://youtube.com/eyogigurukul',
      'https://instagram.com/eyogigurukul',
    ],
    address: {
      '@type': 'PostalAddress',
      streetAddress: 'Dublin Technology Centre',
      addressLocality: 'Dublin',
      addressCountry: 'Ireland',
    },
    contactPoint: {
      '@type': 'ContactPoint',
      telephone: '+353-1-234-5678',
      contactType: 'Customer Service',
      email: 'info@eyogigurukul.com',
    },
    foundingDate: '2024',
    keywords:
      'Hindu Education, Vedic Learning, Sanatan Dharma, Sanskrit, Hindu Philosophy, Yoga, Mantras, Hindu Culture, Traditional Hindu Education, Online Gurukul',
    educationalCredentialAwarded: 'Certificate of Completion in Vedic Studies',
    hasCredential: [
      'Hindu Philosophy Certification',
      'Sanskrit Language Proficiency',
      'Mantra Studies Certificate',
      'Yoga Teacher Training',
      'Vedic Studies Diploma',
    ],
  }
}
export function generateCourseSchema(course: Course): CourseSchema {
  return {
    '@context': 'https://schema.org',
    '@type': 'Course',
    name: course.title,
    description: course.description,
    provider: {
      '@type': 'EducationalOrganization',
      name: 'eYogi Gurukul',
      url: 'https://eyogi-gurukul.vercel.app',
    },
    courseCode: course.course_number,
    educationalLevel: course.level,
    teaches: course.learning_outcomes,
    timeRequired: `P${course.duration_weeks}W`,
    coursePrerequisites: course.prerequisites || undefined,
    aggregateRating: {
      '@type': 'AggregateRating',
      ratingValue: 4.8,
      reviewCount: 150,
    },
    offers: {
      '@type': 'Offer',
      price: course.price.toString(),
      priceCurrency: 'EUR',
      availability: 'https://schema.org/InStock',
    },
    inLanguage: 'en',
    keywords: `Hindu Education, Vedic Learning, ${course.title}, Hindu Course, Sanatan Dharma, ${course.gurukul?.name}`,
    about: [
      { '@type': 'Thing', name: 'Hindu Religion' },
      { '@type': 'Thing', name: 'Vedic Philosophy' },
      { '@type': 'Thing', name: 'Sanatan Dharma' },
      { '@type': 'Thing', name: 'Hindu Culture' },
    ],
  }
}
export function generateWebsiteSchema(): WebsiteSchema {
  return {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: 'eYogi Gurukul - Hindu Education & Vedic Learning Platform',
    description:
      'Comprehensive online platform for authentic Hindu education, Vedic studies, and Sanatan Dharma learning. Expert-led courses in Sanskrit, Hindu philosophy, mantras, yoga, and traditional Hindu culture.',
    url: 'https://eyogi-gurukul.vercel.app',
    potentialAction: {
      '@type': 'SearchAction',
      target: {
        '@type': 'EntryPoint',
        urlTemplate: 'https://eyogi-gurukul.vercel.app/courses?search={search_term_string}',
      },
      'query-input': 'required name=search_term_string',
    },
    keywords:
      'Hindu Education, Hinduism Learning, Vedic Studies, Sanatan Dharma, Hindu Philosophy, Sanskrit Learning, Hindu Culture, Indian Hindu Traditions, Hindu Religion Online, Vedic Wisdom, Hindu Gurukul, Traditional Hindu Education',
    inLanguage: ['en', 'hi', 'sa'],
    about: [
      { '@type': 'Thing', name: 'Hindu Religion' },
      { '@type': 'Thing', name: 'Hinduism' },
      { '@type': 'Thing', name: 'Vedic Philosophy' },
      { '@type': 'Thing', name: 'Sanatan Dharma' },
      { '@type': 'Thing', name: 'Hindu Culture' },
      { '@type': 'Thing', name: 'Indian Hindu Culture' },
      { '@type': 'Thing', name: 'Sanskrit Language' },
      { '@type': 'Thing', name: 'Hindu Education' },
      { '@type': 'Thing', name: 'Vedic Learning' },
      { '@type': 'Thing', name: 'Hindu Traditions' },
    ],
  }
}
export function generateBreadcrumbSchema(
  items: Array<{ name: string; url: string }>,
): BreadcrumbSchema {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.name,
      item: `https://eyogi-gurukul.vercel.app${item.url}`,
    })),
  }
}
