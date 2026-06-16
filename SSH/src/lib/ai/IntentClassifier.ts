export type IntentType =
  | 'course_inquiry'
  | 'enrollment_process'
  | 'gurukul_information'
  | 'pricing_fees'
  | 'certificate_info'
  | 'technical_support'
  | 'contact_info'
  | 'about_eyogi'
  | 'student_progress'
  | 'schedule_classes'
  | 'payment_issues'
  | 'age_appropriate'
  | 'teacher_info'
  | 'platform_features'
  | 'greeting'
  | 'goodbye'
  | 'did_you_know'
  | 'general_question'
export interface IntentResult {
  intent: IntentType
  confidence: number
  entities?: Record<string, string>
}
export class IntentClassifier {
  private intentPatterns: Record<IntentType, string[]> = {
    course_inquiry: [
      'what courses',
      'available courses',
      'course catalog',
      'course list',
      'subjects offered',
      'what can i learn',
      'course options',
      'curriculum',
      'syllabus',
      'course content',
      'hinduism course',
      'sanskrit course',
      'mantra course',
      'philosophy course',
      'yoga course',
    ],
    enrollment_process: [
      'how to enroll',
      'enrollment process',
      'register for course',
      'sign up for',
      'join course',
      'admission process',
      'application',
      'how to apply',
      'enrollment steps',
    ],
    gurukul_information: [
      'what is gurukul',
      'gurukul information',
      'different gurukuls',
      'gurukul types',
      'hinduism gurukul',
      'mantra gurukul',
      'philosophy gurukul',
      'sanskrit gurukul',
      'yoga gurukul',
      'about gurukuls',
      'gurukul details',
    ],
    pricing_fees: [
      'course fees',
      'pricing',
      'cost',
      'how much',
      'price',
      'payment',
      'tuition',
      'fee structure',
      'course cost',
      'enrollment fee',
      'charges',
      'money',
    ],
    certificate_info: [
      'certificate',
      'certification',
      'diploma',
      'completion certificate',
      'how to get certificate',
      'certificate requirements',
      'digital certificate',
      'certificate download',
      'verify certificate',
    ],
    technical_support: [
      'technical issue',
      'login problem',
      'website not working',
      'bug',
      'error',
      'cant access',
      'password reset',
      'account locked',
      'technical help',
    ],
    contact_info: [
      'contact',
      'phone number',
      'email address',
      'office location',
      'address',
      'how to reach',
      'customer service',
      'support team',
      'get in touch',
    ],
    about_eyogi: [
      'about eyogi',
      'what is eyogi',
      'eyogi mission',
      'company information',
      'history',
      'founders',
      'vision',
      'values',
      'about us',
      'organization',
    ],
    student_progress: [
      'my progress',
      'my grades',
      'my courses',
      'my enrollment',
      'my certificate',
      'course progress',
      'completion status',
      'my dashboard',
      'my account',
    ],
    schedule_classes: [
      'class schedule',
      'when are classes',
      'class timing',
      'timetable',
      'class calendar',
      'next class',
      'upcoming classes',
      'session timing',
    ],
    payment_issues: [
      'payment failed',
      'payment problem',
      'refund',
      'billing issue',
      'transaction failed',
      'payment not processed',
      'invoice',
      'receipt',
    ],
    age_appropriate: [
      'age group',
      'suitable for age',
      'age appropriate',
      'for children',
      'for kids',
      'for teens',
      'for adults',
      'age requirements',
      'minimum age',
    ],
    teacher_info: [
      'teacher information',
      'instructor details',
      'who teaches',
      'teacher qualifications',
      'faculty',
      'teaching staff',
      'instructor profile',
      'teacher experience',
    ],
    platform_features: [
      'platform features',
      'how it works',
      'website features',
      'learning platform',
      'online learning',
      'digital classroom',
      'virtual learning',
      'e-learning',
    ],
    greeting: [
      'hello',
      'hi',
      'hey',
      'good morning',
      'good afternoon',
      'good evening',
      'namaste',
      'greetings',
      'howdy',
      "what's up",
    ],
    goodbye: [
      'goodbye',
      'bye',
      'see you',
      'thanks',
      'thank you',
      "that's all",
      'no more questions',
      'end chat',
      'exit',
      'close',
    ],
    did_you_know: [
      'did you know',
      'tell me something interesting',
      'fun fact',
      'interesting fact',
      'teach me something',
      'share knowledge',
      'random fact',
      'cool fact',
      'something about',
      'fact about',
      'tell me about',
      'interesting thing',
      'knowledge',
      'wisdom',
      'learn something new',
      'surprise me',
      'educational fact',
      'vedic fact',
      'hindu fact',
      'sanskrit fact',
      'yoga fact',
      'philosophy fact',
      'mantra fact',
      'spiritual fact',
    ],
    general_question: [
      'help',
      'information',
      'tell me',
      'explain',
      'what',
      'how',
      'why',
      'when',
      'where',
    ],
  }
  classifyIntent(message: string, persona: string): IntentResult {
    const lowerMessage = message.toLowerCase()
    const scores: Record<IntentType, number> = {} as Record<IntentType, number>
    // Calculate scores for each intent
    Object.entries(this.intentPatterns).forEach(([intent, patterns]) => {
      let score = 0
      patterns.forEach((pattern) => {
        if (lowerMessage.includes(pattern)) {
          score += this.calculatePatternScore(pattern, lowerMessage)
        }
      })
      scores[intent as IntentType] = score
    })
    // Apply persona-based weighting
    this.applyPersonaWeighting(scores, persona)
    // Find the highest scoring intent
    const sortedIntents = Object.entries(scores)
      .sort(([, a], [, b]) => b - a)
      .filter(([, score]) => score > 0)
    if (sortedIntents.length === 0) {
      return { intent: 'general_question', confidence: 0.5 }
    }
    const [topIntent, topScore] = sortedIntents[0]
    const confidence = Math.min(topScore / 10, 1) // Normalize to 0-1
    // Extract entities
    const entities = this.extractEntities(message)
    return {
      intent: topIntent as IntentType,
      confidence,
      entities,
    }
  }
  private calculatePatternScore(pattern: string, message: string): number {
    const words = pattern.split(' ')
    let score = 0
    words.forEach((word) => {
      if (message.includes(word)) {
        score += word.length > 3 ? 2 : 1 // Longer words get higher scores
      }
    })
    // Exact phrase match gets bonus
    if (message.includes(pattern)) {
      score += 3
    }
    return score
  }
  private applyPersonaWeighting(scores: Record<IntentType, number>, persona: string) {
    switch (persona) {
      case 'student':
        scores.student_progress *= 1.5
        scores.certificate_info *= 1.3
        scores.schedule_classes *= 1.3
        break
      case 'parent':
        scores.age_appropriate *= 1.5
        scores.pricing_fees *= 1.3
        scores.contact_info *= 1.2
        break
      case 'teacher':
        scores.platform_features *= 1.3
        scores.technical_support *= 1.2
        break
      case 'prospective_student':
        scores.enrollment_process *= 1.5
        scores.pricing_fees *= 1.4
        scores.course_inquiry *= 1.3
        break
    }
  }
  private extractEntities(message: string): Record<string, string> {
    const entities: Record<string, string> = {}
    const lowerMessage = message.toLowerCase()
    // Extract course-related entities
    const courseNumbers = message.match(/[CM]\d{4}/g)
    if (courseNumbers) {
      entities.course_number = courseNumbers[0]
    }
    // Extract gurukul names
    const gurukuls = ['hinduism', 'mantra', 'philosophy', 'sanskrit', 'yoga']
    gurukuls.forEach((gurukul) => {
      if (lowerMessage.includes(gurukul)) {
        entities.gurukul = gurukul
      }
    })
    // Extract age mentions
    const ageMatch = message.match(/(\d+)\s*(?:years?\s*old|age)/i)
    if (ageMatch) {
      entities.age = ageMatch[1]
    }
    // Extract level mentions
    const levels = ['elementary', 'basic', 'intermediate', 'advanced']
    levels.forEach((level) => {
      if (lowerMessage.includes(level)) {
        entities.level = level
      }
    })
    return entities
  }
}
