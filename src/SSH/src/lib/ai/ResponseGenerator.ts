import { User } from '@/types'
import { SearchResult } from './SemanticSearch'
import { DidYouKnowService } from './DidYouKnowService'

export interface ResponseContext {
  message: string
  persona: string
  intent: string
  confidence: number
  searchResults: SearchResult[]
  user: User | null
  conversationHistory: Array<{ user: string; bot: string; timestamp: Date }>
}

export class ResponseGenerator {
  private didYouKnowService: DidYouKnowService

  constructor() {
    this.didYouKnowService = new DidYouKnowService()
  }

  private responseTemplates: Record<string, Record<string, string[]>> = {
    greeting: {
      student: [
        '🙏 Namaste! Welcome back to your learning journey! How can I help you today?',
        'Hello there! Ready to explore some amazing Vedic wisdom? What would you like to know?',
        "Hi! Great to see you here. I'm excited to help you with your learning adventure! ✨",
      ],
      parent: [
        "🙏 Namaste! I'm here to help you find the perfect learning experience for your child. What can I assist you with?",
        "Hello! I'd be happy to help you explore our age-appropriate courses and answer any questions about your child's learning journey.",
        'Hi there! As a parent, you want the best education for your child. Let me help you discover our wonderful courses! 👨‍👩‍👧‍👦',
      ],
      prospective_student: [
        "🙏 Welcome to eYogi Gurukul! I'm excited to help you discover the perfect course for your learning journey. What interests you most?",
        "Hello! Ready to explore ancient wisdom through modern learning? I'm here to guide you through our amazing course offerings! ✨",
        'Hi! Welcome to our community of learners. Let me help you find the perfect Gurukul and course for your interests! 🌟',
      ],
      general_visitor: [
        "🙏 Namaste! Welcome to eYogi Gurukul. I'm here to answer any questions about our platform, courses, or Vedic education. How can I help?",
        "Hello! Thanks for visiting eYogi Gurukul. I'd love to help you learn more about our unique approach to ancient wisdom education!",
        "Hi there! Curious about Vedic learning? I'm here to share information about our courses, Gurukuls, and educational philosophy! 🕉️",
      ],
    },
    did_you_know: {
      student: [
        '🌟 I love sharing fascinating knowledge! Here are some amazing facts that will expand your understanding:',
        '✨ Ready for some mind-blowing wisdom? Let me share some incredible facts with you:',
        '🧠 Time for some knowledge expansion! Here are some fascinating discoveries:',
      ],
      parent: [
        "📚 I'd be delighted to share some educational facts that you and your child might find interesting:",
        '🌟 Here are some wonderful facts about Vedic wisdom that make great conversation starters with children:',
        '✨ Let me share some amazing knowledge that showcases the depth of our educational content:',
      ],
      prospective_student: [
        "🎓 Here are some incredible facts that showcase the depth and richness of what you'll learn with us:",
        '🌟 Let me share some fascinating knowledge that demonstrates the value of Vedic education:',
        '✨ Ready to be amazed? Here are some mind-expanding facts about ancient wisdom:',
      ],
      general_visitor: [
        "🕉️ I'd love to share some fascinating facts about Vedic wisdom and ancient knowledge:",
        '🌟 Here are some incredible discoveries that showcase the depth of ancient Indian knowledge:',
        '✨ Let me share some amazing facts that will give you a taste of what we teach:',
      ],
    },
    course_inquiry: {
      student: [
        'Great question about our courses! Based on your profile, here are some perfect matches for you:',
        "I'd love to help you find the ideal course! Let me share some options that align with your learning level:",
        'Excellent! Let me guide you through our course offerings that would be perfect for your learning journey:',
      ],
      parent: [
        'I understand you want the best learning experience for your child. Here are age-appropriate courses I recommend:',
        "As a parent, you'll appreciate our carefully designed age-specific curriculum. Let me show you suitable options:",
        "Perfect! I can help you find courses that are both educational and engaging for your child's age group:",
      ],
      prospective_student: [
        "Wonderful! I'm excited to introduce you to our comprehensive course catalog. Here's what we offer:",
        'Great interest in learning! Let me share our amazing course options that could be perfect for you:',
        'Fantastic! Our courses are designed for learners of all backgrounds. Here are some excellent starting points:',
      ],
    },
    enrollment_process: {
      student: [
        "The enrollment process is simple and straightforward! Here's how you can join any course:",
        "Ready to enroll? I'll walk you through the easy steps to start your learning journey:",
        'Enrolling is quick and easy! Let me guide you through the process step by step:',
      ],
      parent: [
        "I'll explain our secure and parent-friendly enrollment process for your child:",
        "As a parent, you'll appreciate our safe and transparent enrollment system. Here's how it works:",
        'Our enrollment process includes special protections for young learners. Let me explain:',
      ],
      prospective_student: [
        "Ready to begin your learning adventure? Here's our simple enrollment process:",
        "I'm excited to help you join our community! The enrollment process is designed to be smooth and welcoming:",
        'Let me walk you through how easy it is to start learning with us:',
      ],
    },
    pricing_fees: {
      student: [
        "Here's our transparent pricing structure designed to make quality education accessible:",
        'Our fees are structured to provide excellent value for authentic Vedic education:',
        'Let me break down our affordable pricing options for you:',
      ],
      parent: [
        "I understand budget is important for families. Here's our fair and transparent pricing:",
        'Our pricing reflects the quality of education while remaining accessible to families:',
        "As a parent, you'll appreciate our value-focused pricing structure:",
      ],
      prospective_student: [
        'Our pricing is designed to make quality Vedic education accessible to everyone:',
        "Here's our investment in your spiritual and educational growth:",
        'Let me share our affordable pricing options that deliver exceptional value:',
      ],
    },
    gurukul_information: {
      student: [
        'Great question about our Gurukuls! Each one offers a unique learning experience:',
        "I'd love to tell you about our specialized Gurukuls and what makes each one special:",
        'Our Gurukuls are designed to provide deep, focused learning in different areas of Vedic knowledge:',
      ],
      parent: [
        "As a parent, you'll appreciate how each Gurukul provides age-appropriate, structured learning:",
        'Our Gurukuls offer safe, educational environments for children to explore ancient wisdom:',
        "Each Gurukul is carefully designed with your child's developmental needs in mind:",
      ],
      prospective_student: [
        'Welcome! Let me introduce you to our amazing Gurukuls and their unique specializations:',
        'Our Gurukul system offers multiple pathways to explore Vedic knowledge:',
        'Each Gurukul provides a comprehensive learning journey in its specialized area:',
      ],
    },
    certificate_info: {
      student: [
        "Certificates are a wonderful way to showcase your learning achievements! Here's what you need to know:",
        "I'm excited to tell you about our beautiful digital certificates and how to earn them:",
        'Your hard work deserves recognition! Let me explain our certificate system:',
      ],
      parent: [
        "Your child's achievements will be properly recognized with our professional certificates:",
        "We provide authentic, verifiable certificates that showcase your child's learning:",
        "Our certificate system ensures your child's educational achievements are properly documented:",
      ],
      prospective_student: [
        "You'll earn beautiful, verifiable certificates upon completing our courses:",
        'Our certificates are more than just documents - they represent authentic learning achievements:',
        'Let me tell you about the valuable certificates you can earn through our programs:',
      ],
    },
    about_eyogi: {
      student: [
        "I'm happy to share the inspiring story behind eYogi Gurukul and our mission:",
        'Let me tell you about the vision that drives our educational platform:',
        "eYogi Gurukul has a beautiful mission that you're now part of as a student:",
      ],
      parent: [
        "As a parent, you'll appreciate the values and mission that guide our educational approach:",
        "Let me share why eYogi Gurukul is the right choice for your child's spiritual education:",
        "Our organization's values align with providing safe, authentic education for children:",
      ],
      prospective_student: [
        'Welcome! Let me share the inspiring vision behind eYogi Gurukul:',
        "I'd love to tell you about our mission and what makes eYogi Gurukul special:",
        'Discover the beautiful philosophy that guides our educational approach:',
      ],
    },
  }

  generateResponse(context: ResponseContext): string {
    const { message, persona, intent, searchResults, user } = context

    // Handle "Did You Know" queries specially
    if (intent === 'did_you_know') {
      return this.generateDidYouKnowResponse(message, persona)
    }

    // Get appropriate response template
    const templates = this.responseTemplates[intent]?.[persona] ||
      this.responseTemplates[intent]?.['general_visitor'] || [
        "I'd be happy to help you with that! Let me provide you with the information you need:",
      ]

    const template = templates[Math.floor(Math.random() * templates.length)]

    // Build response based on search results
    let response = template

    if (searchResults.length > 0) {
      response += '\n\n'

      // Add relevant information from search results
      const topResults = searchResults.slice(0, 3)
      topResults.forEach((result, index) => {
        if (index === 0) {
          response += `📚 **${result.title}**\n${result.content}\n\n`

          // Add navigation links for course and gurukul results
          if (result.type === 'course' && result.metadata?.course) {
            response += `🔗 [View Course Details](/courses/${result.metadata.course.id})\n\n`
          } else if (result.type === 'gurukul' && result.metadata?.gurukul) {
            response += `🔗 [Explore ${result.metadata.gurukul.name}](/gurukuls/${result.metadata.gurukul.slug})\n\n`
          }
        } else {
          response += `• **${result.title}**: ${this.truncateContent(result.content, 100)}\n\n`
        }
      })

      // Add general navigation links based on intent
      response += this.addIntentBasedLinks(intent)
    } else {
      // Fallback responses when no search results
      response += this.generateFallbackResponse(intent)
    }

    // Add personalized touches
    response = this.addPersonalizedTouches(response, user, persona, intent)

    // Add helpful suggestions
    response += this.generateSuggestions(intent)

    return response.trim()
  }

  private generateDidYouKnowResponse(message: string, persona: string): string {
    const templates =
      this.responseTemplates.did_you_know[persona] ||
      this.responseTemplates.did_you_know['general_visitor']
    const template = templates[Math.floor(Math.random() * templates.length)]

    let response = template + '\n\n'

    // Check if user is asking about a specific topic
    const specificQuery = this.extractSpecificQuery(message)

    if (specificQuery) {
      // Search for facts related to the specific query
      const searchResults = this.didYouKnowService.searchFacts(specificQuery, 3)

      if (searchResults.length > 0) {
        response += `🎯 **Facts about "${specificQuery}":**\n\n`
        searchResults.forEach((result, index) => {
          response += `${index + 1}. ${result.content}\n\n`
        })
      } else {
        // Fallback to random facts from related category
        const category = this.getCategoryFromQuery(specificQuery)
        const randomFacts = this.didYouKnowService.getRandomFactsByCategory(category, 3)

        response += `🌟 **Here are some amazing facts related to your interest:**\n\n`
        randomFacts.forEach((fact, index) => {
          response += `${index + 1}. ${fact}\n\n`
        })
      }
    } else {
      // General "Did You Know" request - provide random facts
      const randomFacts = [
        this.didYouKnowService.getRandomFact(),
        this.didYouKnowService.getRandomFact(),
        this.didYouKnowService.getRandomFact(),
      ]

      response += `🎲 **Random Amazing Facts:**\n\n`
      randomFacts.forEach((fact, index) => {
        response += `${index + 1}. ${fact}\n\n`
      })
    }

    // Add exploration links
    response += '🔗 **Explore More:**\n'
    response += '• [Browse All Courses](/courses) - Discover courses on these topics\n'
    response += '• [Explore Gurukuls](/gurukuls) - Learn more about our specialized schools\n'
    response += '• [About eYogi](/about) - Understand our educational philosophy\n\n'

    // Add suggestion for more facts
    response +=
      "💡 Want to learn more? Ask me about specific topics like 'Sanskrit facts', 'Yoga wisdom', 'Hindu philosophy', or 'Mantra science'!"

    return response
  }

  private extractSpecificQuery(message: string): string {
    const lowerMessage = message.toLowerCase()

    // Look for specific topic mentions
    const topics = [
      'sanskrit',
      'yoga',
      'hinduism',
      'hindu',
      'philosophy',
      'mantra',
      'mantras',
      'meditation',
      'dharma',
      'karma',
      'festival',
      'festivals',
      'ayurveda',
      'vedic',
      'vedas',
      'guru',
      'gurukul',
      'om',
      'namaste',
      'chakra',
      'chakras',
      'pranayama',
      'asana',
      'asanas',
      'bhagavad gita',
      'upanishads',
      'ramayana',
      'mahabharata',
      'diwali',
      'holi',
      'navratri',
      'ganesh',
      'shiva',
      'vishnu',
      'brahma',
      'lakshmi',
      'saraswati',
      'hanuman',
      'krishna',
      'rama',
    ]

    for (const topic of topics) {
      if (lowerMessage.includes(topic)) {
        return topic
      }
    }

    // Look for "about X" patterns
    const aboutMatch = lowerMessage.match(/about\s+(\w+)/i)
    if (aboutMatch) {
      return aboutMatch[1]
    }

    // Look for "X facts" patterns
    const factsMatch = lowerMessage.match(/(\w+)\s+facts?/i)
    if (factsMatch) {
      return factsMatch[1]
    }

    return ''
  }

  private getCategoryFromQuery(query: string): string {
    const categoryMap: Record<string, string> = {
      sanskrit: 'sanskrit',
      yoga: 'yoga',
      hinduism: 'hinduism',
      hindu: 'hinduism',
      philosophy: 'philosophy',
      mantra: 'mantras',
      mantras: 'mantras',
      meditation: 'meditation',
      festival: 'festivals',
      festivals: 'festivals',
      science: 'science',
      culture: 'culture',
      ayurveda: 'science',
      vedic: 'hinduism',
      vedas: 'hinduism',
    }

    return categoryMap[query.toLowerCase()] || 'hinduism'
  }

  private addIntentBasedLinks(intent: string): string {
    const linkSets: Record<string, string> = {
      course_inquiry:
        '\n🔗 **Helpful Links:**\n• [Browse All Courses](/courses)\n• [Explore Gurukuls](/gurukuls)\n• [About Our Education](/about)\n',
      enrollment_process:
        '\n🔗 **Get Started:**\n• [Create Account](/auth/signup)\n• [Sign In](/auth/signin)\n• [Browse Courses](/courses)\n',
      gurukul_information:
        '\n🔗 **Explore More:**\n• [All Gurukuls](/gurukuls)\n• [Hinduism Gurukul](/gurukuls/hinduism)\n• [Philosophy Gurukul](/gurukuls/philosophy)\n• [Sanskrit Gurukul](/gurukuls/sanskrit)\n• [Mantra Gurukul](/gurukuls/mantra)\n• [Yoga & Wellness](/gurukuls/yoga-wellness)\n',
      pricing_fees:
        '\n🔗 **View Details:**\n• [Course Pricing](/courses)\n• [Contact Us](/contact)\n',
      certificate_info:
        '\n🔗 **Learn More:**\n• [About Certificates](/about)\n• [Student Dashboard](/dashboard/student)\n',
      about_eyogi: '\n🔗 **Discover More:**\n• [About Us](/about)\n• [Contact Us](/contact)\n',
      contact_info: '\n🔗 **Contact Options:**\n• [Contact Form](/contact)\n• [About Us](/about)\n',
      student_progress:
        '\n🔗 **Your Dashboard:**\n• [Student Dashboard](/dashboard/student)\n• [Browse More Courses](/courses)\n',
      did_you_know:
        '\n🔗 **Learn More:**\n• [Browse Courses](/courses)\n• [Explore Gurukuls](/gurukuls)\n• [About eYogi](/about)\n',
    }

    return linkSets[intent] || ''
  }

  private generateFallbackResponse(intent: string): string {
    const fallbacks: Record<string, string> = {
      course_inquiry:
        '\n\nWe offer comprehensive courses across 5 specialized Gurukuls: Hinduism, Mantra, Philosophy, Sanskrit, and Yoga & Wellness. Each Gurukul has courses for different age groups from 4 years to adult learners.\n\n🔗 **Quick Links:**\n• [Browse All Courses](/courses)\n• [Explore Gurukuls](/gurukuls)\n• [About Our Education](/about)',
      enrollment_process:
        "\n\nTo enroll: 1) Create your account, 2) Browse courses by age/interest, 3) Click 'Enroll Now', 4) Complete payment, 5) Get teacher approval, 6) Start learning!\n\n🔗 **Get Started:**\n• [Create Account](/auth/signup)\n• [Browse Courses](/courses)\n• [Sign In](/auth/signin)",
      gurukul_information:
        '\n\nOur 5 Gurukuls each specialize in different aspects of Vedic knowledge: Hinduism (traditions & philosophy), Mantra (sacred sounds), Philosophy (ancient wisdom), Sanskrit (sacred language), and Yoga & Wellness (holistic health).',
      pricing_fees:
        '\n\nOur courses range from €35-€100 depending on level and duration. Elementary (€35-40), Basic (€50-60), Intermediate (€75-85), Advanced (€100+). We offer family discounts and early bird pricing!\n\n🔗 **View Pricing:**\n• [See All Course Prices](/courses)\n• [Contact for Discounts](/contact)',
      certificate_info:
        '\n\nAll students receive beautiful digital certificates upon course completion. Certificates include verification codes, can be downloaded as PDF, shared on social media, and are recognized for their authentic Vedic education content.',
      contact_info:
        "\n\nYou can reach us at info@eyogigurukul.com, call +353 1 234 5678 (Mon-Fri 9AM-6PM IST), or use this chat for immediate assistance. We're based in Dublin, Ireland but serve students globally!\n\n🔗 **Contact Options:**\n• [Contact Form](/contact)\n• [About Us](/about)",
      about_eyogi:
        "\n\neYogi Gurukul bridges ancient Vedic wisdom with modern learning technology. We create 'eYogis' - practitioners who connect spiritual science with contemporary life, building peace and harmony while respecting all cultures.",
      did_you_know:
        "\n\nI have access to over 1000 fascinating facts about Vedic wisdom, ancient knowledge, and spiritual practices! You can ask me for facts about specific topics like 'Sanskrit facts', 'Yoga wisdom', 'Hindu traditions', 'Philosophy insights', or just say 'surprise me with a fact'!",
      technical_support:
        '\n\nFor technical issues: try refreshing your browser, check your internet connection, or clear your browser cache. For persistent problems, contact support@eyogigurukul.com with details about your issue.',
    }

    return (
      fallbacks[intent] ||
      "\n\nI'm here to help with any questions about eYogi Gurukul, our courses, enrollment, or Vedic education in general!"
    )
  }

  private addPersonalizedTouches(
    response: string,
    user: User | null,
    persona: string,
    intent: string,
  ): string {
    if (user) {
      const firstName = user.full_name?.split(' ')[0] || 'friend'

      if (intent === 'student_progress' && user.role === 'student') {
        response += `\n\n🎯 ${firstName}, you can check your detailed progress in your student dashboard where you'll find all your enrolled courses, completion status, and certificates!`
      }

      if (intent === 'course_inquiry' && user.age) {
        const ageGroup = this.getAgeGroupForAge(user.age)
        response += `\n\n💡 Based on your age (${user.age}), I recommend looking at our ${ageGroup} level courses which are perfectly designed for your learning stage!`
      }
    }

    if (persona === 'parent') {
      response += `\n\n👨‍👩‍👧‍👦 As a parent, you'll be pleased to know that all our courses include progress reports and we maintain open communication about your child's learning journey.`
    }

    return response
  }

  private generateSuggestions(intent: string): string {
    const suggestions: Record<string, string[]> = {
      course_inquiry: [
        'Would you like me to recommend courses based on a specific age group?',
        'Are you interested in a particular Gurukul or subject area?',
        'Would you like to know about course schedules and duration?',
        'Shall I help you find courses that match your learning level?',
      ],
      enrollment_process: [
        'Would you like me to guide you through creating an account?',
        'Do you have questions about payment options?',
        'Would you like to know about our approval process?',
        'Need help understanding the enrollment timeline?',
      ],
      pricing_fees: [
        'Would you like information about family discounts?',
        'Are you interested in our early bird pricing?',
        'Do you need details about payment plans?',
        'Shall I explain our refund policy?',
      ],
      gurukul_information: [
        'Would you like to explore a specific Gurukul in detail?',
        'Are you interested in the teaching methodology?',
        'Would you like to know about our teachers and their qualifications?',
        'Shall I help you choose the right Gurukul for your interests?',
      ],
      certificate_info: [
        'Would you like to see examples of our certificates?',
        'Are you interested in the verification process?',
        'Shall I explain how to share your certificates professionally?',
      ],
      did_you_know: [
        'Would you like to learn about a specific topic like Sanskrit, Yoga, or Hindu philosophy?',
        'Are you interested in facts about festivals, mantras, or ancient science?',
        'Shall I share more wisdom about meditation, dharma, or spiritual practices?',
        'Would you like to explore facts about specific Gurukuls or courses?',
      ],
      about_eyogi: [
        'Would you like to know more about our teaching philosophy?',
        'Are you interested in our global community of learners?',
        'Shall I tell you about our founders and team?',
      ],
    }

    const intentSuggestions = suggestions[intent]
    if (intentSuggestions && intentSuggestions.length > 0) {
      const randomSuggestion =
        intentSuggestions[Math.floor(Math.random() * intentSuggestions.length)]
      return `\n\n❓ ${randomSuggestion}`
    }

    return '\n\n💬 Feel free to ask me anything else about eYogi Gurukul!'
  }

  private truncateContent(content: string, maxLength: number): string {
    if (content.length <= maxLength) return content
    return content.substring(0, maxLength) + '...'
  }

  private getAgeGroupForAge(age: number): string {
    if (age >= 4 && age <= 7) return 'Elementary'
    if (age >= 8 && age <= 11) return 'Basic'
    if (age >= 12 && age <= 15) return 'Intermediate'
    if (age >= 16 && age <= 19) return 'Advanced'
    return 'Adult Learning'
  }
}
