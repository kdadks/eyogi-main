import { Enrollment } from '../../types'

const STORAGE_KEYS = {
  ENROLLMENTS: 'eyogi_enrollments',
  COURSES: 'eyogi_courses',
  USERS: 'eyogi_users',
  GURUKULS: 'eyogi_gurukuls',
}

function generateId(): string {
  return Math.random().toString(36).substr(2, 9) + Date.now().toString(36)
}

export async function enrollInCourse(courseId: string, studentId: string): Promise<Enrollment> {
  // Simulate API delay
  await new Promise((resolve) => setTimeout(resolve, 300))

  const enrollments = JSON.parse(localStorage.getItem(STORAGE_KEYS.ENROLLMENTS) || '[]')
  const courses = JSON.parse(localStorage.getItem(STORAGE_KEYS.COURSES) || '[]')
  const users = JSON.parse(localStorage.getItem(STORAGE_KEYS.USERS) || '[]')

  // Check if already enrolled
  const existingEnrollment = enrollments.find(
    (e: Enrollment) => e.course_id === courseId && e.student_id === studentId,
  )

  if (existingEnrollment) {
    throw new Error('Already enrolled in this course')
  }

  const newEnrollment: Enrollment = {
    id: generateId(),
    student_id: studentId,
    course_id: courseId,
    status: 'pending',
    enrolled_at: new Date().toISOString(),
    approved_at: undefined,
    completed_at: undefined,
    payment_status: 'pending',
    payment_id: undefined,
    certificate_issued: false,
    certificate_url: undefined,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  }

  // Add related data
  const course = courses.find((c: any) => c.id === courseId)
  const student = users.find((u: any) => u.id === studentId)

  const enrichedEnrollment = {
    ...newEnrollment,
    course,
    student,
  }

  enrollments.push(newEnrollment)
  localStorage.setItem(STORAGE_KEYS.ENROLLMENTS, JSON.stringify(enrollments))

  return enrichedEnrollment
}

export async function getStudentEnrollments(studentId: string): Promise<Enrollment[]> {
  // Simulate API delay
  await new Promise((resolve) => setTimeout(resolve, 200))

  const enrollments = JSON.parse(localStorage.getItem(STORAGE_KEYS.ENROLLMENTS) || '[]')
  const courses = JSON.parse(localStorage.getItem(STORAGE_KEYS.COURSES) || '[]')
  const gurukuls = JSON.parse(localStorage.getItem(STORAGE_KEYS.GURUKULS) || '[]')

  const studentEnrollments = enrollments.filter((e: Enrollment) => e.student_id === studentId)

  return studentEnrollments
    .map((enrollment: Enrollment) => {
      const course = courses.find((c: any) => c.id === enrollment.course_id)
      const gurukul = course ? gurukuls.find((g: any) => g.id === course.gurukul_id) : null

      return {
        ...enrollment,
        course: course ? { ...course, gurukul } : null,
      }
    })
    .sort(
      (a: Enrollment, b: Enrollment) =>
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
    )
}

export async function getTeacherEnrollments(teacherId: string): Promise<Enrollment[]> {
  // Simulate API delay
  await new Promise((resolve) => setTimeout(resolve, 200))

  const enrollments = JSON.parse(localStorage.getItem(STORAGE_KEYS.ENROLLMENTS) || '[]')
  const courses = JSON.parse(localStorage.getItem(STORAGE_KEYS.COURSES) || '[]')
  const users = JSON.parse(localStorage.getItem(STORAGE_KEYS.USERS) || '[]')
  const gurukuls = JSON.parse(localStorage.getItem(STORAGE_KEYS.GURUKULS) || '[]')

  // Get courses taught by this teacher
  const teacherCourses = courses.filter((c: any) => c.teacher_id === teacherId)
  const teacherCourseIds = teacherCourses.map((c: any) => c.id)

  // Get enrollments for teacher's courses
  const teacherEnrollments = enrollments.filter((e: Enrollment) =>
    teacherCourseIds.includes(e.course_id),
  )

  return teacherEnrollments
    .map((enrollment: Enrollment) => {
      const course = courses.find((c: any) => c.id === enrollment.course_id)
      const gurukul = course ? gurukuls.find((g: any) => g.id === course.gurukul_id) : null
      const student = users.find((u: any) => u.id === enrollment.student_id)

      return {
        ...enrollment,
        course: course ? { ...course, gurukul } : null,
        student,
      }
    })
    .sort(
      (a: Enrollment, b: Enrollment) =>
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
    )
}

export async function updateEnrollmentStatus(
  enrollmentId: string,
  status: Enrollment['status'],
  additionalData?: Partial<Enrollment>,
): Promise<Enrollment> {
  // Simulate API delay
  await new Promise((resolve) => setTimeout(resolve, 250))

  const enrollments = JSON.parse(localStorage.getItem(STORAGE_KEYS.ENROLLMENTS) || '[]')
  const courses = JSON.parse(localStorage.getItem(STORAGE_KEYS.COURSES) || '[]')
  const users = JSON.parse(localStorage.getItem(STORAGE_KEYS.USERS) || '[]')

  const enrollmentIndex = enrollments.findIndex((e: Enrollment) => e.id === enrollmentId)
  if (enrollmentIndex === -1) {
    throw new Error('Enrollment not found')
  }

  const updates: Partial<Enrollment> = {
    status,
    ...additionalData,
    updated_at: new Date().toISOString(),
  }

  if (status === 'approved') {
    updates.approved_at = new Date().toISOString()
  } else if (status === 'completed') {
    updates.completed_at = new Date().toISOString()
  }

  const updatedEnrollment = {
    ...enrollments[enrollmentIndex],
    ...updates,
  }

  enrollments[enrollmentIndex] = updatedEnrollment
  localStorage.setItem(STORAGE_KEYS.ENROLLMENTS, JSON.stringify(enrollments))

  // Add related data for return
  const course = courses.find((c: any) => c.id === updatedEnrollment.course_id)
  const student = users.find((u: any) => u.id === updatedEnrollment.student_id)

  return {
    ...updatedEnrollment,
    course,
    student,
  }
}

export async function bulkUpdateEnrollments(
  enrollmentIds: string[],
  status: Enrollment['status'],
): Promise<Enrollment[]> {
  // Simulate API delay
  await new Promise((resolve) => setTimeout(resolve, 400))

  const enrollments = JSON.parse(localStorage.getItem(STORAGE_KEYS.ENROLLMENTS) || '[]')
  const courses = JSON.parse(localStorage.getItem(STORAGE_KEYS.COURSES) || '[]')
  const users = JSON.parse(localStorage.getItem(STORAGE_KEYS.USERS) || '[]')

  const updates: Partial<Enrollment> = {
    status,
    updated_at: new Date().toISOString(),
  }

  if (status === 'approved') {
    updates.approved_at = new Date().toISOString()
  } else if (status === 'completed') {
    updates.completed_at = new Date().toISOString()
  }

  const updatedEnrollments: Enrollment[] = []

  enrollmentIds.forEach((id) => {
    const enrollmentIndex = enrollments.findIndex((e: Enrollment) => e.id === id)
    if (enrollmentIndex !== -1) {
      const updatedEnrollment = {
        ...enrollments[enrollmentIndex],
        ...updates,
      }
      enrollments[enrollmentIndex] = updatedEnrollment

      // Add related data
      const course = courses.find((c: any) => c.id === updatedEnrollment.course_id)
      const student = users.find((u: any) => u.id === updatedEnrollment.student_id)

      updatedEnrollments.push({
        ...updatedEnrollment,
        course,
        student,
      })
    }
  })

  localStorage.setItem(STORAGE_KEYS.ENROLLMENTS, JSON.stringify(enrollments))

  return updatedEnrollments
}

export async function getEnrollmentStats(): Promise<{
  total: number
  pending: number
  approved: number
  completed: number
}> {
  // Simulate API delay
  await new Promise((resolve) => setTimeout(resolve, 100))

  const enrollments = JSON.parse(localStorage.getItem(STORAGE_KEYS.ENROLLMENTS) || '[]')

  return {
    total: enrollments.length,
    pending: enrollments.filter((e: Enrollment) => e.status === 'pending').length,
    approved: enrollments.filter((e: Enrollment) => e.status === 'approved').length,
    completed: enrollments.filter((e: Enrollment) => e.status === 'completed').length,
  }
}

export async function getAllEnrollments(): Promise<Enrollment[]> {
  // Simulate API delay
  await new Promise((resolve) => setTimeout(resolve, 200))

  const enrollments = JSON.parse(localStorage.getItem(STORAGE_KEYS.ENROLLMENTS) || '[]')
  const courses = JSON.parse(localStorage.getItem(STORAGE_KEYS.COURSES) || '[]')
  const users = JSON.parse(localStorage.getItem(STORAGE_KEYS.USERS) || '[]')
  const gurukuls = JSON.parse(localStorage.getItem(STORAGE_KEYS.GURUKULS) || '[]')

  return enrollments
    .map((enrollment: Enrollment) => {
      const course = courses.find((c: any) => c.id === enrollment.course_id)
      const gurukul = course ? gurukuls.find((g: any) => g.id === course.gurukul_id) : null
      const student = users.find((u: any) => u.id === enrollment.student_id)

      return {
        ...enrollment,
        course: course ? { ...course, gurukul } : null,
        student,
      }
    })
    .sort(
      (a: Enrollment, b: Enrollment) =>
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
    )
}
