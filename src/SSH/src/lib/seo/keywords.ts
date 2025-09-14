// SEO Keywords for Hindu/Vedic content optimization
export const PRIMARY_KEYWORDS = [
  // Core Hindu Keywords
  'Hindu',
  'Hinduism', 
  'Hindu Religion',
  'Hindu Culture',
  'Indian Hindu Culture',
  'Sanatan',
  'Sanatan Dharma',
  'Vedic',
  'Vedic Education',
  'Vedic Learning',
  'Vedic Wisdom',
  'Vedic Philosophy',
  'Vedic Studies',
  'Vedic Knowledge',
  'Vedic Traditions',
  'Vedic Science',
  'Vedic Lifestyle'
]

export const SECONDARY_KEYWORDS = [
  // Educational Keywords
  'Hindu Education',
  'Hindu Learning',
  'Hindu Courses',
  'Hindu Online Learning',
  'Hindu Education Online',
  'Hindu Spiritual Education',
  'Hindu Heritage Learning',
  'Traditional Hindu Education',
  'Authentic Hindu Teaching',
  'Hindu Values Education',
  'Hindu Philosophy Education',
  'Hindu Culture Education',
  'Hindu Religion Courses',
  'Hindu Studies Online',
  'Hindu Knowledge Online',
  
  // Gurukul Keywords
  'Hindu Gurukul',
  'Hindu Gurukul Online',
  'Traditional Gurukul',
  'Vedic Gurukul',
  'Online Gurukul',
  'Gurukul System',
  'Gurukul Education',
  'Authentic Gurukul',
  'Modern Gurukul',
  
  // Subject-Specific Keywords
  'Sanskrit Learning',
  'Sanskrit Courses',
  'Sanskrit Online',
  'Hindu Philosophy',
  'Hindu Philosophy Courses',
  'Mantra Learning',
  'Mantra Education',
  'Hindu Mantras',
  'Yoga Philosophy',
  'Hindu Yoga',
  'Traditional Yoga',
  
  // Cultural Keywords
  'Hindu Traditions',
  'Hindu Practices',
  'Hindu Festivals',
  'Hindu Rituals',
  'Hindu Customs',
  'Hindu Heritage',
  'Hindu Values',
  'Hindu Ethics',
  'Hindu Spirituality',
  'Hindu Mythology',
  'Hindu Scriptures',
  'Hindu Texts',
  
  // Dharma Keywords
  'Dharma Education',
  'Dharmic Living',
  'Dharma Learning',
  'Dharma Philosophy',
  'Dharma Principles',
  'Dharma Values',
  'Dharma Wisdom',
  'Dharma Studies'
]

export const LONG_TAIL_KEYWORDS = [
  // Question-based Keywords
  'What is Hinduism',
  'Learn Hindu Religion Online',
  'Hindu Philosophy for Beginners',
  'How to Learn Sanskrit',
  'Hindu Culture for Kids',
  'Vedic Education for Children',
  'Online Hindu Courses',
  'Best Hindu Learning Platform',
  'Authentic Hindu Education',
  'Traditional Hindu Learning',
  
  // Location-based Keywords
  'Hindu Education Ireland',
  'Hindu Courses Dublin',
  'Hindu Learning Europe',
  'Vedic Education Ireland',
  'Hindu Culture Ireland',
  'Sanskrit Learning Ireland',
  
  // Age-specific Keywords
  'Hindu Education for Children',
  'Hindu Learning for Kids',
  'Hindu Philosophy for Teens',
  'Hindu Culture for Youth',
  'Vedic Education for Adults',
  'Hindu Courses for Families',
  
  // Comparison Keywords
  'Best Hindu Education Platform',
  'Top Vedic Learning Site',
  'Authentic Hindu Courses',
  'Traditional vs Modern Hindu Education',
  'Online vs Offline Hindu Learning',
  
  // Problem-solving Keywords
  'Learn Hindu Religion from Home',
  'Hindu Education During COVID',
  'Remote Hindu Learning',
  'Virtual Hindu Classes',
  'Online Hindu Gurukul',
  'Digital Hindu Education'
]

export const CONTENT_KEYWORDS = [
  // Content-specific Keywords
  'Hindu Stories',
  'Hindu Legends',
  'Hindu History',
  'Hindu Calendar',
  'Hindu Astrology',
  'Hindu Mathematics',
  'Hindu Science',
  'Hindu Medicine',
  'Hindu Art',
  'Hindu Music',
  'Hindu Dance',
  'Hindu Architecture',
  
  // Spiritual Keywords
  'Hindu Meditation',
  'Hindu Prayer',
  'Hindu Worship',
  'Hindu Devotion',
  'Hindu Bhakti',
  'Hindu Karma',
  'Hindu Dharma',
  'Hindu Moksha',
  'Hindu Enlightenment',
  'Hindu Self-Realization',
  
  // Practical Keywords
  'Hindu Daily Practices',
  'Hindu Lifestyle',
  'Hindu Diet',
  'Hindu Fasting',
  'Hindu Ceremonies',
  'Hindu Weddings',
  'Hindu Baby Names',
  'Hindu Parenting',
  'Hindu Family Values'
]

export function getKeywordsForPage(pageType: string, additionalKeywords: string[] = []): string[] {
  const baseKeywords = [...PRIMARY_KEYWORDS, ...SECONDARY_KEYWORDS.slice(0, 10)]
  
  switch (pageType) {
    case 'home':
      return [...baseKeywords, ...LONG_TAIL_KEYWORDS.slice(0, 15), ...additionalKeywords]
    case 'courses':
      return [...baseKeywords, 'Hindu Courses', 'Vedic Courses', 'Hindu Education Programs', ...additionalKeywords]
    case 'gurukuls':
      return [...baseKeywords, 'Hindu Gurukul', 'Vedic Gurukul', 'Traditional Gurukul', ...additionalKeywords]
    case 'about':
      return [...baseKeywords, 'About Hindu Education', 'Hindu Learning Mission', ...additionalKeywords]
    case 'contact':
      return [...baseKeywords, 'Hindu Education Support', 'Contact Hindu Learning', ...additionalKeywords]
    default:
      return [...baseKeywords, ...additionalKeywords]
  }
}

export function generateMetaDescription(pageType: string, customDescription?: string): string {
  if (customDescription) return customDescription

  const descriptions = {
    home: 'Learn authentic Hindu traditions, Vedic philosophy, Sanskrit, mantras, and yoga through comprehensive online courses. Discover Sanatan Dharma wisdom with expert teachers in our traditional Gurukul system.',
    courses: 'Explore comprehensive Hindu education courses covering Vedic philosophy, Sanskrit, mantras, yoga, and Sanatan Dharma. Expert-led online classes for all age groups from traditional Gurukuls.',
    gurukuls: 'Discover our 5 specialized Hindu Gurukuls offering authentic Vedic education: Hinduism, Mantra, Philosophy, Sanskrit, and Yoga & Wellness. Traditional Gurukul system meets modern online learning.',
    about: 'Discover eYogi Gurukul\'s mission to connect ancient Hindu wisdom with modern learning. Learn about our authentic Vedic education approach, expert teachers, and global community of Sanatan Dharma learners.',
    contact: 'Contact eYogi Gurukul for questions about Hindu courses, Vedic education, enrollment, or Sanatan Dharma learning. Get support for your spiritual education journey.'
  }

  return descriptions[pageType as keyof typeof descriptions] || descriptions.home
}