import { User } from '@/types'

const STORAGE_KEY = 'eyogi_users'

export async function getAllUsers(): Promise<User[]> {
  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 200))
  
  const users = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]')
  return users
}

export async function updateUserRole(userId: string, newRole: User['role']): Promise<User> {
  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 300))
  
  const users = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]')
  const userIndex = users.findIndex((u: User) => u.id === userId)
  
  if (userIndex === -1) {
    throw new Error('User not found')
  }
  
  users[userIndex].role = newRole
  users[userIndex].updated_at = new Date().toISOString()
  
  // If changing to student, assign student ID
  if (newRole === 'student' && !users[userIndex].student_id) {
    const year = new Date().getFullYear()
    const existingStudents = users.filter((u: User) => 
      u.student_id?.startsWith(`EYG-${year}-`)
    )
    const nextNumber = existingStudents.length + 1
    users[userIndex].student_id = `EYG-${year}-${nextNumber.toString().padStart(4, '0')}`
  }
  
  // If changing from student, remove student ID
  if (newRole !== 'student') {
    users[userIndex].student_id = null
  }
  
  localStorage.setItem(STORAGE_KEY, JSON.stringify(users))
  
  return users[userIndex]
}

export async function deleteUser(userId: string): Promise<void> {
  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 250))
  
  const users = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]')
  const filteredUsers = users.filter((u: User) => u.id !== userId)
  
  localStorage.setItem(STORAGE_KEY, JSON.stringify(filteredUsers))
}

export async function getTeacherCourses(teacherId: string): Promise<any[]> {
  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 150))
  
  const courses = JSON.parse(localStorage.getItem('eyogi_courses') || '[]')
  const gurukuls = JSON.parse(localStorage.getItem('eyogi_gurukuls') || '[]')
  
  const teacherCourses = courses.filter((c: any) => c.teacher_id === teacherId)
  
  return teacherCourses.map((course: any) => ({
    ...course,
    gurukul: gurukuls.find((g: any) => g.id === course.gurukul_id)
  }))
}