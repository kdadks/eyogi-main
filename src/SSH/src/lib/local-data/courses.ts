import { Course, Gurukul } from '@/types'

const STORAGE_KEYS = {
  GURUKULS: 'eyogi_gurukuls',
  COURSES: 'eyogi_courses',
  ENROLLMENTS: 'eyogi_enrollments'
}

export async function getCourses(filters?: {
  gurukul_id?: string
  level?: string
  age_group?: number
  search?: string
}): Promise<Course[]> {
  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 200))
  
  const courses = JSON.parse(localStorage.getItem(STORAGE_KEYS.COURSES) || '[]')
  const gurukuls = JSON.parse(localStorage.getItem(STORAGE_KEYS.GURUKULS) || '[]')
  
  let filteredCourses = courses.filter((course: Course) => course.is_active)
  
  // Apply filters
  if (filters?.gurukul_id) {
    filteredCourses = filteredCourses.filter((course: Course) => course.gurukul_id === filters.gurukul_id)
  }
  
  if (filters?.level) {
    filteredCourses = filteredCourses.filter((course: Course) => course.level === filters.level)
  }
  
  if (filters?.age_group) {
    filteredCourses = filteredCourses.filter((course: Course) => 
      course.age_group_min <= filters.age_group! && course.age_group_max >= filters.age_group!
    )
  }
  
  if (filters?.search) {
    const searchTerm = filters.search.toLowerCase()
    filteredCourses = filteredCourses.filter((course: Course) =>
      course.title.toLowerCase().includes(searchTerm) ||
      course.description.toLowerCase().includes(searchTerm)
    )
  }
  
  // Add gurukul information
  return filteredCourses.map((course: Course) => ({
    ...course,
    gurukul: gurukuls.find((g: Gurukul) => g.id === course.gurukul_id)
  }))
}

export async function getCourse(id: string): Promise<Course | null> {
  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 150))
  
  const courses = JSON.parse(localStorage.getItem(STORAGE_KEYS.COURSES) || '[]')
  const gurukuls = JSON.parse(localStorage.getItem(STORAGE_KEYS.GURUKULS) || '[]')
  
  const course = courses.find((c: Course) => c.id === id)
  if (!course) return null
  
  return {
    ...course,
    gurukul: gurukuls.find((g: Gurukul) => g.id === course.gurukul_id)
  }
}

export async function getEnrolledCount(courseId: string): Promise<number> {
  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 100))
  
  const enrollments = JSON.parse(localStorage.getItem(STORAGE_KEYS.ENROLLMENTS) || '[]')
  return enrollments.filter((e: any) => 
    e.course_id === courseId && (e.status === 'approved' || e.status === 'completed')
  ).length
}

export async function createCourse(course: Omit<Course, 'id' | 'created_at' | 'updated_at'>): Promise<Course> {
  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 300))
  
  const courses = JSON.parse(localStorage.getItem(STORAGE_KEYS.COURSES) || '[]')
  
  const newCourse: Course = {
    ...course,
    id: Math.random().toString(36).substr(2, 9) + Date.now().toString(36),
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  }
  
  courses.push(newCourse)
  localStorage.setItem(STORAGE_KEYS.COURSES, JSON.stringify(courses))
  
  return newCourse
}

export async function updateCourse(id: string, updates: Partial<Course>): Promise<Course> {
  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 300))
  
  const courses = JSON.parse(localStorage.getItem(STORAGE_KEYS.COURSES) || '[]')
  const courseIndex = courses.findIndex((c: Course) => c.id === id)
  
  if (courseIndex === -1) {
    throw new Error('Course not found')
  }
  
  const updatedCourse = {
    ...courses[courseIndex],
    ...updates,
    updated_at: new Date().toISOString()
  }
  
  courses[courseIndex] = updatedCourse
  localStorage.setItem(STORAGE_KEYS.COURSES, JSON.stringify(courses))
  
  return updatedCourse
}

export async function deleteCourse(id: string): Promise<void> {
  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 200))
  
  const courses = JSON.parse(localStorage.getItem(STORAGE_KEYS.COURSES) || '[]')
  const courseIndex = courses.findIndex((c: Course) => c.id === id)
  
  if (courseIndex !== -1) {
    courses[courseIndex].is_active = false
    localStorage.setItem(STORAGE_KEYS.COURSES, JSON.stringify(courses))
  }
}

export async function getTeacherCourses(teacherId: string): Promise<Course[]> {
  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 150))
  
  const courses = JSON.parse(localStorage.getItem(STORAGE_KEYS.COURSES) || '[]')
  const gurukuls = JSON.parse(localStorage.getItem(STORAGE_KEYS.GURUKULS) || '[]')
  
  const teacherCourses = courses.filter((c: Course) => c.teacher_id === teacherId && c.is_active)
  
  return teacherCourses.map((course: Course) => ({
    ...course,
    gurukul: gurukuls.find((g: any) => g.id === course.gurukul_id)
  }))
}