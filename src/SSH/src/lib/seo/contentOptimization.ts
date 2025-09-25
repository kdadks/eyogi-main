// Content optimization utilities for SEO
export class ContentOptimizer {
  private primaryKeywords = [
    'Hindu', 'Hinduism', 'Vedic', 'Hindu Religion', 'Hindu Culture',
    'Indian Hindu Culture', 'Sanatan', 'Sanatan Dharma'
  ]
  // Optimize content for target keywords
  optimizeContent(content: string, targetKeywords: string[] = []): string {
    let optimizedContent = content
    const allKeywords = [...this.primaryKeywords, ...targetKeywords]
    // Ensure primary keywords appear naturally in content
    allKeywords.forEach(keyword => {
      if (!optimizedContent.toLowerCase().includes(keyword.toLowerCase())) {
        // Add keyword naturally if missing
        optimizedContent = this.insertKeywordNaturally(optimizedContent, keyword)
      }
    })
    return optimizedContent
  }
  // Generate SEO-friendly URLs
  generateSEOUrl(title: string, includeKeywords: boolean = true): string {
    let slug = title
      .toLowerCase()
      .replace(/[^\w\s-]/g, '')
      .replace(/[\s_-]+/g, '-')
      .replace(/^-+|-+$/g, '')
    if (includeKeywords) {
      // Add relevant keywords to URL if not present
      const keywordToAdd = this.selectRelevantKeyword(title)
      if (keywordToAdd && !slug.includes(keywordToAdd.toLowerCase())) {
        slug = `${keywordToAdd.toLowerCase()}-${slug}`
      }
    }
    return slug
  }
  // Generate meta descriptions with keywords
  generateMetaDescription(content: string, maxLength: number = 160): string {
    // Ensure primary keywords are included
    let description = content.substring(0, maxLength - 50)
    // Add primary keywords if not present
    const missingKeywords = this.primaryKeywords.filter(keyword => 
      !description.toLowerCase().includes(keyword.toLowerCase())
    ).slice(0, 2)
    if (missingKeywords.length > 0) {
      description += ` Learn ${missingKeywords.join(', ')}.`
    }
    return description.substring(0, maxLength)
  }
  // Generate keyword-rich headings
  generateSEOHeading(baseHeading: string, level: 'h1' | 'h2' | 'h3' = 'h1'): string {
    const keywordVariations = {
      h1: ['Hindu Education', 'Vedic Learning', 'Sanatan Dharma'],
      h2: ['Hindu Courses', 'Vedic Wisdom', 'Hindu Culture'],
      h3: ['Hindu Traditions', 'Vedic Philosophy', 'Hindu Heritage']
    }
    const keywords = keywordVariations[level]
    const relevantKeyword = this.selectRelevantKeyword(baseHeading, keywords)
    if (relevantKeyword && !baseHeading.toLowerCase().includes(relevantKeyword.toLowerCase())) {
      return `${baseHeading} - ${relevantKeyword}`
    }
    return baseHeading
  }
  // Check keyword density
  calculateKeywordDensity(content: string, keyword: string): number {
    const words = content.toLowerCase().split(/\s+/)
    const keywordWords = keyword.toLowerCase().split(/\s+/)
    let count = 0
    for (let i = 0; i <= words.length - keywordWords.length; i++) {
      const phrase = words.slice(i, i + keywordWords.length).join(' ')
      if (phrase === keyword.toLowerCase()) {
        count++
      }
    }
    return (count / words.length) * 100
  }
  // Generate alt text for images
  generateImageAlt(context: string, includeKeywords: boolean = true): string {
    let altText = context
    if (includeKeywords) {
      const relevantKeyword = this.selectRelevantKeyword(context)
      if (relevantKeyword && !altText.toLowerCase().includes(relevantKeyword.toLowerCase())) {
        altText = `${relevantKeyword} - ${altText}`
      }
    }
    return altText
  }
  // Private helper methods
  private insertKeywordNaturally(content: string, keyword: string): string {
    // Find natural insertion points (end of sentences, paragraphs)
    const sentences = content.split('. ')
    if (sentences.length > 1) {
      const insertIndex = Math.floor(sentences.length / 2)
      sentences[insertIndex] += ` Our ${keyword} education program`
      return sentences.join('. ')
    }
    return content
  }
  private selectRelevantKeyword(content: string, keywords: string[] = this.primaryKeywords): string {
    const contentLower = content.toLowerCase()
    // Find most relevant keyword based on content context
    for (const keyword of keywords) {
      const keywordWords = keyword.toLowerCase().split(' ')
      if (keywordWords.some(word => contentLower.includes(word))) {
        return keyword
      }
    }
    return keywords[0] // Default to first keyword
  }
}
// Content templates for SEO optimization
export const SEOContentTemplates = {
  // Homepage content blocks
  heroSection: {
    title: "Learn Authentic Hindu Traditions & Vedic Wisdom Online",
    subtitle: "Discover Sanatan Dharma through Expert-Led Courses",
    description: "Connect with ancient Hindu wisdom through our comprehensive online Gurukul system. Learn Sanskrit, Hindu philosophy, mantras, yoga, and traditional Hindu culture from certified teachers."
  },
  // Course page content
  coursesPage: {
    title: "Hindu Education Courses & Vedic Learning Programs",
    subtitle: "Comprehensive Sanatan Dharma Education for All Ages",
    description: "Explore our extensive catalog of Hindu education courses covering Vedic philosophy, Sanskrit language, Hindu mantras, yoga practices, and traditional Hindu culture. Expert-led classes for elementary to advanced levels."
  },
  // Gurukul page content
  gurukulPage: {
    title: "Traditional Hindu Gurukuls - Authentic Vedic Education Centers",
    subtitle: "5 Specialized Gurukuls for Comprehensive Hindu Learning",
    description: "Experience traditional Gurukul education online through our specialized centers: Hinduism Gurukul, Sanskrit Gurukul, Philosophy Gurukul, Mantra Gurukul, and Yoga & Wellness Gurukul."
  },
  // About page content
  aboutPage: {
    title: "About eYogi Gurukul - Hindu Education & Vedic Learning Mission",
    subtitle: "Preserving Sanatan Dharma Through Modern Technology",
    description: "Learn about our mission to bridge ancient Hindu wisdom with modern educational technology. Discover how we preserve and share authentic Vedic knowledge globally."
  }
}
export const contentOptimizer = new ContentOptimizer()
