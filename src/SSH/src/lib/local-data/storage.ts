// Local storage utilities for handling data without Supabase
export interface LocalUser {
  id: string
  email: string
  full_name?: string
  avatar_url?: string
  role: 'student' | 'teacher' | 'admin'
  age?: number
  phone?: string
  address?: string
  parent_guardian_name?: string
  parent_guardian_email?: string
  parent_guardian_phone?: string
  student_id?: string
  created_at: string
  updated_at: string
}

export interface LocalSession {
  user: LocalUser
  access_token: string
  expires_at: number
}

// Generate unique IDs
export function generateId(): string {
  return Math.random().toString(36).substr(2, 9) + Date.now().toString(36)
}

// Generate student ID
export function generateStudentId(): string {
  const year = new Date().getFullYear()
  const existingUsers = getStoredUsers()
  const currentYearUsers = existingUsers.filter((u) => u.student_id?.startsWith(`EYG-${year}-`))
  const nextNumber = currentYearUsers.length + 1
  return `EYG-${year}-${nextNumber.toString().padStart(4, '0')}`
}

// Storage keys
const STORAGE_KEYS = {
  USERS: 'eyogi_users',
  CURRENT_SESSION: 'eyogi_session',
  GURUKULS: 'eyogi_gurukuls',
  COURSES: 'eyogi_courses',
  ENROLLMENTS: 'eyogi_enrollments',
  CERTIFICATES: 'eyogi_certificates',
}

// User management
export function getStoredUsers(): LocalUser[] {
  const users = localStorage.getItem(STORAGE_KEYS.USERS)
  return users ? JSON.parse(users) : []
}

export function storeUser(user: LocalUser): void {
  const users = getStoredUsers()
  const existingIndex = users.findIndex((u) => u.id === user.id)

  if (existingIndex >= 0) {
    users[existingIndex] = { ...user, updated_at: new Date().toISOString() }
  } else {
    users.push(user)
  }

  localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(users))
}

export function findUserByEmail(email: string): LocalUser | null {
  const users = getStoredUsers()
  return users.find((u) => u.email === email) || null
}

export function findUserById(id: string): LocalUser | null {
  const users = getStoredUsers()
  return users.find((u) => u.id === id) || null
}

// Session management
export function getCurrentSession(): LocalSession | null {
  const session = localStorage.getItem(STORAGE_KEYS.CURRENT_SESSION)
  if (!session) return null

  const parsed = JSON.parse(session)
  if (Date.now() > parsed.expires_at) {
    localStorage.removeItem(STORAGE_KEYS.CURRENT_SESSION)
    return null
  }

  return parsed
}

export function storeSession(user: LocalUser): LocalSession {
  const session: LocalSession = {
    user,
    access_token: generateId(),
    expires_at: Date.now() + 24 * 60 * 60 * 1000, // 24 hours
  }

  localStorage.setItem(STORAGE_KEYS.CURRENT_SESSION, JSON.stringify(session))
  return session
}

export function clearSession(): void {
  localStorage.removeItem(STORAGE_KEYS.CURRENT_SESSION)
}

// Initialize default data
export function initializeDefaultData(): void {
  // Initialize test users if not exists
  if (!localStorage.getItem(STORAGE_KEYS.USERS)) {
    const testUsers: LocalUser[] = [
      {
        id: 'test-student-1',
        email: 'student@test.com',
        full_name: 'Test Student',
        avatar_url: undefined,
        role: 'student',
        age: 16,
        phone: '+353 1 234 5678',
        address: 'Dublin, Ireland',
        parent_guardian_name: undefined,
        parent_guardian_email: undefined,
        parent_guardian_phone: undefined,
        student_id: 'EYG-2025-0001',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
      {
        id: 'test-teacher-1',
        email: 'teacher@test.com',
        full_name: 'Dr. Priya Sharma',
        avatar_url: undefined,
        role: 'teacher',
        age: 35,
        phone: '+353 1 234 5679',
        address: 'Dublin, Ireland',
        parent_guardian_name: undefined,
        parent_guardian_email: undefined,
        parent_guardian_phone: undefined,
        student_id: undefined,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
      {
        id: 'test-admin-1',
        email: 'admin@test.com',
        full_name: 'Admin User',
        avatar_url: undefined,
        role: 'admin',
        age: 40,
        phone: '+353 1 234 5680',
        address: 'Dublin, Ireland',
        parent_guardian_name: undefined,
        parent_guardian_email: undefined,
        parent_guardian_phone: undefined,
        student_id: undefined,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
    ]
    localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(testUsers))
  }

  // Initialize gurukuls if not exists
  if (!localStorage.getItem(STORAGE_KEYS.GURUKULS)) {
    const defaultGurukuls = [
      {
        id: 'gurukul-1',
        name: 'Hinduism Gurukul',
        slug: 'hinduism',
        description:
          'Explore the rich traditions, philosophy, and practices of Hinduism through comprehensive courses designed for all age groups.',
        image_url: 'https://images.unsplash.com/photo-1582510003544-4d00b7f74220?w=800',
        is_active: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
      {
        id: 'gurukul-2',
        name: 'Mantra Gurukul',
        slug: 'mantra',
        description:
          'Learn the sacred science of mantras, their pronunciation, meanings, and transformative power in spiritual practice.',
        image_url: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800',
        is_active: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
      {
        id: 'gurukul-3',
        name: 'Philosophy Gurukul',
        slug: 'philosophy',
        description:
          'Dive deep into ancient philosophical traditions and their relevance to modern life and spiritual growth.',
        image_url: 'https://images.unsplash.com/photo-1481627834876-b7833e8f5570?w=800',
        is_active: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
      {
        id: 'gurukul-4',
        name: 'Sanskrit Gurukul',
        slug: 'sanskrit',
        description:
          'Master the sacred language of Sanskrit through structured learning programs for beginners to advanced students.',
        image_url: 'https://images.unsplash.com/photo-1544947950-fa07a98d237f?w=800',
        is_active: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
      {
        id: 'gurukul-5',
        name: 'Yoga & Wellness Gurukul',
        slug: 'yoga-wellness',
        description:
          'Integrate physical, mental, and spiritual wellness through traditional yoga practices and holistic health approaches.',
        image_url: 'https://images.unsplash.com/photo-1506126613408-eca07ce68773?w=800',
        is_active: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
    ]
    localStorage.setItem(STORAGE_KEYS.GURUKULS, JSON.stringify(defaultGurukuls))
  }

  // Initialize courses if not exists
  if (!localStorage.getItem(STORAGE_KEYS.COURSES)) {
    const defaultCourses = [
      {
        id: 'course-1',
        gurukul_id: 'gurukul-1',
        course_number: 'C1001',
        title: 'Hinduism Basics for Young Minds',
        description:
          'An introduction to Hindu traditions, festivals, and basic concepts designed for children aged 8-11 years.',
        level: 'basic',
        age_group_min: 8,
        age_group_max: 11,
        duration_weeks: 6,
        fee: 50.0,
        max_students: 20,
        delivery_method: 'remote',
        entry_requirements: undefined,
        learning_outcomes: [
          'Understand basic Hindu concepts',
          'Learn about major festivals',
          'Develop cultural awareness',
          'Practice simple mantras',
        ],
        syllabus: {
          classes: [
            {
              number: 1,
              title: 'What is Hinduism?',
              topics: ['Introduction to Hinduism', 'Basic concepts', 'Diversity in practice'],
              duration: '1 hour',
            },
            {
              number: 2,
              title: 'Hindu Festivals',
              topics: ['Diwali', 'Holi', 'Navratri', 'Significance and celebrations'],
              duration: '1 hour',
            },
            {
              number: 3,
              title: 'Sacred Symbols',
              topics: ['Om symbol', 'Swastika', 'Lotus', 'Their meanings'],
              duration: '1 hour',
            },
            {
              number: 4,
              title: 'Simple Prayers',
              topics: ['Basic mantras', 'Prayer postures', 'Daily practices'],
              duration: '1 hour',
            },
            {
              number: 5,
              title: 'Stories and Values',
              topics: ['Moral stories', 'Life lessons', 'Character building'],
              duration: '1 hour',
            },
            {
              number: 6,
              title: 'Celebration and Reflection',
              topics: ['Course review', 'Certificate ceremony', 'Future learning'],
              duration: '1 hour',
            },
          ],
        },
        is_active: true,
        teacher_id: 'test-teacher-1',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
      {
        id: 'course-2',
        gurukul_id: 'gurukul-1',
        course_number: 'C2001',
        title: 'Hindu Philosophy for Teens',
        description:
          'Explore deeper philosophical concepts of Hinduism suitable for teenagers aged 12-15 years.',
        level: 'intermediate',
        age_group_min: 12,
        age_group_max: 15,
        duration_weeks: 8,
        fee: 75.0,
        max_students: 15,
        delivery_method: 'remote',
        entry_requirements: undefined,
        learning_outcomes: [
          'Understand key philosophical concepts',
          'Explore different schools of thought',
          'Develop critical thinking',
          'Apply teachings to modern life',
        ],
        syllabus: {
          classes: [
            {
              number: 1,
              title: 'Introduction to Hindu Philosophy',
              topics: ['What is philosophy?', 'Hindu philosophical traditions', 'Key questions'],
              duration: '1.5 hours',
            },
            {
              number: 2,
              title: 'Dharma and Ethics',
              topics: ['Concept of dharma', 'Ethical living', 'Modern applications'],
              duration: '1.5 hours',
            },
          ],
        },
        is_active: true,
        teacher_id: 'test-teacher-1',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
      {
        id: 'course-3',
        gurukul_id: 'gurukul-2',
        course_number: 'M1001',
        title: 'Introduction to Sacred Mantras',
        description: 'Learn basic mantras and their proper pronunciation for beginners.',
        level: 'basic',
        age_group_min: 10,
        age_group_max: 14,
        duration_weeks: 4,
        fee: 40.0,
        max_students: 25,
        delivery_method: 'remote',
        entry_requirements: undefined,
        learning_outcomes: [
          'Learn proper pronunciation',
          'Understand mantra meanings',
          'Develop concentration',
          'Practice meditation',
        ],
        syllabus: {
          classes: [
            {
              number: 1,
              title: 'What are Mantras?',
              topics: ['Definition and purpose', 'Types of mantras', 'Benefits'],
              duration: '1 hour',
            },
          ],
        },
        is_active: true,
        teacher_id: 'test-teacher-1',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
    ]
    localStorage.setItem(STORAGE_KEYS.COURSES, JSON.stringify(defaultCourses))
  }

  // Initialize empty arrays for other data
  if (!localStorage.getItem(STORAGE_KEYS.ENROLLMENTS)) {
    localStorage.setItem(STORAGE_KEYS.ENROLLMENTS, JSON.stringify([]))
  }

  if (!localStorage.getItem(STORAGE_KEYS.CERTIFICATES)) {
    localStorage.setItem(STORAGE_KEYS.CERTIFICATES, JSON.stringify([]))
  }
}
