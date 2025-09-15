import { User } from '@/types'

export type PersonaType = 'student' | 'parent' | 'teacher' | 'prospective_student' | 'general_visitor'

export class PersonaDetector {
  private studentKeywords = [
    'my course', 'my enrollment', 'my certificate', 'my progress', 'my dashboard',
    'i enrolled', 'i completed', 'my student id', 'my grades', 'my assignments'
  ]

  private parentKeywords = [
    'my child', 'my daughter', 'my son', 'for my kid', 'child safety',
    'parent portal', 'guardian', 'family', 'age appropriate', 'supervision'
  ]

  private teacherKeywords = [
    'my students', 'teaching', 'curriculum', 'lesson plan', 'grading',
    'classroom', 'instructor', 'pedagogy', 'assessment', 'student progress'
  ]

  private prospectiveKeywords = [
    'how to enroll', 'course fees', 'admission', 'requirements', 'application',
    'interested in', 'want to join', 'thinking about', 'considering', 'pricing'
  ]

  detectPersona(message: string, user: User | null): PersonaType {
    const lowerMessage = message.toLowerCase()

    // If user is logged in, use their role as primary indicator
    if (user) {
      if (user.role === 'student') {
        // Check if they're asking about their own stuff vs general questions
        if (this.containsKeywords(lowerMessage, this.studentKeywords)) {
          return 'student'
        }
        // Student asking general questions
        return 'student'
      }
      if (user.role === 'teacher') return 'teacher'
      if (user.role === 'admin') return 'teacher' // Treat admin as teacher for chat purposes
    }

    // For non-logged-in users, detect based on message content
    if (this.containsKeywords(lowerMessage, this.parentKeywords)) {
      return 'parent'
    }

    if (this.containsKeywords(lowerMessage, this.teacherKeywords)) {
      return 'teacher'
    }

    if (this.containsKeywords(lowerMessage, this.prospectiveKeywords)) {
      return 'prospective_student'
    }

    if (this.containsKeywords(lowerMessage, this.studentKeywords)) {
      return 'student'
    }

    return 'general_visitor'
  }

  private containsKeywords(message: string, keywords: string[]): boolean {
    return keywords.some(keyword => message.includes(keyword))
  }

  getPersonaContext(persona: PersonaType): string {
    const contexts = {
      student: 'You are speaking with a current student who is enrolled in courses.',
      parent: 'You are speaking with a parent or guardian inquiring about courses for their child.',
      teacher: 'You are speaking with an instructor or educator.',
      prospective_student: 'You are speaking with someone interested in enrolling in courses.',
      general_visitor: 'You are speaking with a general visitor exploring the platform.'
    }
    return contexts[persona]
  }
}