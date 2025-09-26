import { getCourses } from '@/lib/api/courses'
import { getGurukuls } from '@/lib/api/gurukuls'
import { Course, Gurukul } from '@/types'
export interface SearchResult {
  type: 'course' | 'gurukul' | 'general_info' | 'faq'
  title: string
  content: string
  relevanceScore: number
  metadata?: {
    category: string
    id?: string
    course?: Course
    gurukul?: Gurukul
  }
}
export class SemanticSearch {
  private knowledgeBase: Array<{
    id: string
    type: 'course' | 'gurukul' | 'general_info' | 'faq'
    title: string
    content: string
    keywords: string[]
    category: string
  }> = []
  constructor() {
    this.initializeKnowledgeBase()
  }
  private initializeKnowledgeBase() {
    this.knowledgeBase = [
      // About eYogi Gurukul
      {
        id: 'about-eyogi-1',
        type: 'general_info',
        title: 'What is eYogi Gurukul?',
        content:
          'eYogi Gurukul is an innovative online educational platform that connects ancient Vedic wisdom with modern learning methods. The "e" in eYogi represents the bridge between traditional Gurukul education and digital technology. We offer comprehensive courses in Hindu philosophy, Sanskrit, mantras, yoga, and spiritual practices for students of all ages.',
        keywords: ['eyogi', 'gurukul', 'about', 'mission', 'vision', 'vedic', 'ancient wisdom'],
        category: 'about',
      },
      {
        id: 'about-eyogi-2',
        type: 'general_info',
        title: 'eYogi Mission and Vision',
        content:
          'Our mission is to preserve and share authentic Vedic knowledge through modern educational technology. We believe in creating eYogis - practitioners who connect ancient spiritual science with contemporary life, fostering peace and harmony globally while respecting all cultures.',
        keywords: [
          'mission',
          'vision',
          'eyogi',
          'vedic knowledge',
          'spiritual',
          'peace',
          'harmony',
        ],
        category: 'about',
      },
      // Enrollment Process
      {
        id: 'enrollment-1',
        type: 'faq',
        title: 'How to Enroll in Courses',
        content:
          'To enroll in courses: 1) Create an account on our platform, 2) Browse available courses by age group and interest, 3) Click "Enroll Now" on your chosen course, 4) Complete payment process, 5) Wait for teacher approval (usually within 24 hours), 6) Access your course materials in the student dashboard.\n\n🔗 **Quick Links:** [Create Account](/auth/signup) • [Browse Courses](/courses) • [Sign In](/auth/signin)',
        keywords: ['enroll', 'enrollment', 'register', 'sign up', 'join course', 'admission'],
        category: 'enrollment',
      },
      {
        id: 'enrollment-2',
        type: 'faq',
        title: 'Enrollment Requirements',
        content:
          'Most courses have minimal requirements. Age-appropriate courses are available from 4 years to adult learners. For students under 18, parent/guardian consent is required. Some advanced courses may require completion of prerequisite courses.',
        keywords: ['requirements', 'prerequisites', 'age', 'consent', 'guardian', 'parent'],
        category: 'enrollment',
      },
      // Course Information
      {
        id: 'courses-1',
        type: 'general_info',
        title: 'Course Structure and Levels',
        content:
          'Our courses are structured in 4 levels: Elementary (4-7 years), Basic (8-11 years), Intermediate (12-15 years), and Advanced (16-19 years). Each course typically runs for 4-8 weeks with weekly classes. Course numbers follow the format: Elementary (000-999), Basic (1000-1999), Intermediate (2000-2999), Advanced (3000-3999).\n\n🔗 **Explore:** [View All Courses](/courses) • [Filter by Level](/courses?level=basic)',
        keywords: [
          'course structure',
          'levels',
          'elementary',
          'basic',
          'intermediate',
          'advanced',
          'age groups',
        ],
        category: 'courses',
      },
      {
        id: 'courses-2',
        type: 'general_info',
        title: 'Course Delivery Methods',
        content:
          'We offer three delivery methods: Remote (online classes via video conferencing), Physical (in-person classes at select locations), and Hybrid (combination of online and in-person sessions). Most courses are delivered remotely to accommodate global students.',
        keywords: ['delivery', 'online', 'remote', 'physical', 'hybrid', 'video', 'in-person'],
        category: 'courses',
      },
      // Gurukul Information
      {
        id: 'gurukul-hinduism',
        type: 'gurukul',
        title: 'Hinduism Gurukul',
        content:
          'The Hinduism Gurukul offers comprehensive courses on Hindu traditions, philosophy, festivals, and practices. Students learn about dharma, karma, meditation, sacred texts, and how to apply ancient wisdom in modern life. Courses range from basic concepts for children to advanced philosophical studies.\n\n🔗 [Explore Hinduism Gurukul](/gurukuls/hinduism)',
        keywords: ['hinduism', 'hindu', 'dharma', 'karma', 'meditation', 'festivals', 'traditions'],
        category: 'gurukuls',
      },
      {
        id: 'gurukul-mantra',
        type: 'gurukul',
        title: 'Mantra Gurukul',
        content:
          'The Mantra Gurukul focuses on the sacred science of mantras. Students learn proper pronunciation, meanings, and the transformative power of sacred sounds. Courses cover basic mantras for beginners to advanced mantra meditation practices.\n\n🔗 [Explore Mantra Gurukul](/gurukuls/mantra)',
        keywords: [
          'mantra',
          'sacred sounds',
          'pronunciation',
          'meditation',
          'chanting',
          'sanskrit mantras',
        ],
        category: 'gurukuls',
      },
      {
        id: 'gurukul-philosophy',
        type: 'gurukul',
        title: 'Philosophy Gurukul',
        content:
          'The Philosophy Gurukul explores ancient philosophical traditions and their relevance to modern life. Students study different schools of Hindu philosophy, ethics, metaphysics, and practical wisdom for spiritual growth and daily living.\n\n🔗 [Explore Philosophy Gurukul](/gurukuls/philosophy)',
        keywords: [
          'philosophy',
          'philosophical',
          'ethics',
          'metaphysics',
          'wisdom',
          'spiritual growth',
        ],
        category: 'gurukuls',
      },
      {
        id: 'gurukul-sanskrit',
        type: 'gurukul',
        title: 'Sanskrit Gurukul',
        content:
          'The Sanskrit Gurukul offers structured programs to master the sacred language of Sanskrit. From alphabet and basic grammar to reading ancient texts, students develop proficiency in this foundational language of Vedic literature.\n\n🔗 [Explore Sanskrit Gurukul](/gurukuls/sanskrit)',
        keywords: ['sanskrit', 'language', 'alphabet', 'grammar', 'devanagari', 'ancient texts'],
        category: 'gurukuls',
      },
      {
        id: 'gurukul-yoga',
        type: 'gurukul',
        title: 'Yoga & Wellness Gurukul',
        content:
          'The Yoga & Wellness Gurukul integrates physical, mental, and spiritual wellness through traditional yoga practices. Students learn asanas, pranayama, meditation, and holistic health approaches based on ancient Ayurvedic principles.\n\n🔗 [Explore Yoga & Wellness Gurukul](/gurukuls/yoga-wellness)',
        keywords: ['yoga', 'wellness', 'asanas', 'pranayama', 'meditation', 'ayurveda', 'health'],
        category: 'gurukuls',
      },
      // Certificates
      {
        id: 'certificates-1',
        type: 'faq',
        title: 'Certificate Information',
        content:
          'All students receive digital certificates upon successful course completion. Certificates include verification codes for authenticity, can be downloaded as PDF, and shared on social media. Certificates are issued by qualified teachers and include course details, completion date, and student information.\n\n🔗 **For Students:** [View My Certificates](/dashboard/student#certificates)',
        keywords: [
          'certificate',
          'certification',
          'digital certificate',
          'verification',
          'download',
          'authentic',
        ],
        category: 'certificates',
      },
      // Pricing
      {
        id: 'pricing-1',
        type: 'faq',
        title: 'Course Pricing Structure',
        content:
          'Course fees vary by level and duration. Elementary courses start from €35, Basic courses from €50, Intermediate from €75, and Advanced from €100. We offer family discounts for multiple enrollments and early bird pricing for advance bookings.\n\n🔗 **View Pricing:** [Browse Courses with Prices](/courses) • [Contact for Discounts](/contact)',
        keywords: [
          'pricing',
          'fees',
          'cost',
          'elementary',
          'basic',
          'intermediate',
          'advanced',
          'discount',
        ],
        category: 'pricing',
      },
      // Contact Information
      {
        id: 'contact-1',
        type: 'general_info',
        title: 'Contact Information',
        content:
          'You can reach us at info@eyogigurukul.com or call +353 1 234 5678 (Mon-Fri 9AM-6PM IST). Our headquarters is located in Dublin, Ireland. For immediate assistance, use our AI chatbot available 24/7 or submit a contact form on our website.',
        keywords: ['contact', 'email', 'phone', 'address', 'dublin', 'ireland', 'support'],
        category: 'contact',
      },
      // Technical Support
      {
        id: 'tech-support-1',
        type: 'faq',
        title: 'Common Technical Issues',
        content:
          "For login issues, try resetting your password. If you can't access courses, check your enrollment status in the dashboard. For video playback issues, ensure stable internet connection. Contact technical support at support@eyogigurukul.com for persistent issues.",
        keywords: ['technical', 'login', 'password', 'access', 'video', 'internet', 'support'],
        category: 'technical',
      },
      // Did You Know Information
      {
        id: 'did-you-know-1',
        type: 'general_info',
        title: 'Educational Facts Database',
        content:
          'I have access to over 1000 fascinating facts about Vedic wisdom, ancient knowledge, Sanskrit, Yoga, Hindu philosophy, mantras, festivals, and spiritual practices. You can ask me for facts about specific topics or request random interesting knowledge to expand your understanding!',
        keywords: [
          'did you know',
          'facts',
          'knowledge',
          'wisdom',
          'interesting',
          'educational',
          'learn',
        ],
        category: 'education',
      },
    ]
  }
  async search(query: string, intent: string): Promise<SearchResult[]> {
    // Simulate API delay
    await new Promise((resolve) => setTimeout(resolve, 200))
    const queryWords = query.toLowerCase().split(' ')
    const results: SearchResult[] = []
    // Search knowledge base
    this.knowledgeBase.forEach((item) => {
      let relevanceScore = 0
      // Keyword matching
      item.keywords.forEach((keyword) => {
        if (query.toLowerCase().includes(keyword)) {
          relevanceScore += keyword.length > 5 ? 3 : 2
        }
      })
      // Content matching
      queryWords.forEach((word) => {
        if (word.length > 2 && item.content.toLowerCase().includes(word)) {
          relevanceScore += 1
        }
      })
      // Title matching (higher weight)
      queryWords.forEach((word) => {
        if (word.length > 2 && item.title.toLowerCase().includes(word)) {
          relevanceScore += 3
        }
      })
      // Intent-based boosting
      if (this.isIntentRelevant(intent, item.category)) {
        relevanceScore *= 1.5
      }
      if (relevanceScore > 0) {
        results.push({
          type: item.type,
          title: item.title,
          content: item.content,
          relevanceScore,
          metadata: { category: item.category, id: item.id },
        })
      }
    })
    // Search live course data
    try {
      const courses = await getCourses()
      const gurukuls = await getGurukuls()
      // Search courses
      courses.forEach((course) => {
        let relevanceScore = 0
        queryWords.forEach((word) => {
          if (word.length > 2) {
            if (course.title.toLowerCase().includes(word)) relevanceScore += 3
            if (course.description.toLowerCase().includes(word)) relevanceScore += 2
            if (course.course_number.toLowerCase().includes(word)) relevanceScore += 4
            if (course.level.toLowerCase().includes(word)) relevanceScore += 2
          }
        })
        if (relevanceScore > 0) {
          results.push({
            type: 'course',
            title: course.title,
            content: `${course.description} (Course: ${course.course_number}, Level: ${course.level}, Duration: ${course.duration_weeks} weeks, Fee: €${course.price})`,
            relevanceScore,
            metadata: { course, category: 'courses' },
          })
        }
      })
      // Search gurukuls
      gurukuls.forEach((gurukul) => {
        let relevanceScore = 0
        queryWords.forEach((word) => {
          if (word.length > 2) {
            if (gurukul.name.toLowerCase().includes(word)) relevanceScore += 3
            if (gurukul.description.toLowerCase().includes(word)) relevanceScore += 2
            if (gurukul.slug.toLowerCase().includes(word)) relevanceScore += 2
          }
        })
        if (relevanceScore > 0) {
          results.push({
            type: 'gurukul',
            title: gurukul.name,
            content: gurukul.description,
            relevanceScore,
            metadata: { gurukul, category: 'gurukuls' },
          })
        }
      })
    } catch {
      // Ignore errors in semantic search
    }
    // Sort by relevance and return top results
    return results.sort((a, b) => b.relevanceScore - a.relevanceScore).slice(0, 5)
  }
  private isIntentRelevant(intent: string, category: string): boolean {
    const intentCategoryMap: Record<string, string[]> = {
      course_inquiry: ['courses', 'gurukuls'],
      enrollment_process: ['enrollment', 'courses'],
      gurukul_information: ['gurukuls'],
      pricing_fees: ['pricing', 'courses'],
      certificate_info: ['certificates'],
      technical_support: ['technical'],
      contact_info: ['contact'],
      about_eyogi: ['about'],
      did_you_know: ['education', 'about'],
    }
    return intentCategoryMap[intent]?.includes(category) || false
  }
}
