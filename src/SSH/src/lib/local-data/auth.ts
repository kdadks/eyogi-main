import {
  LocalUser,
  generateId,
  generateStudentId,
  storeUser,
  findUserByEmail,
  storeSession,
  clearSession,
  getCurrentSession,
} from './storage'
import { authStore } from '@/lib/auth/authStore'
export async function signUp(email: string, password: string, userData: Partial<LocalUser>) {
  // Simulate API delay
  await new Promise((resolve) => setTimeout(resolve, 500))
  // Check if user already exists
  const existingUser = findUserByEmail(email)
  if (existingUser) {
    throw new Error('User already exists with this email')
  }
  // Create new user
  const newUser: LocalUser = {
    id: generateId(),
    email,
    full_name: userData.full_name || '',
    avatar_url: userData.avatar_url || undefined,
    role: userData.role || 'student',
    age: userData.age,
    phone: userData.phone,
    address: userData.address,
    parent_guardian_name: userData.parent_guardian_name,
    parent_guardian_email: userData.parent_guardian_email,
    parent_guardian_phone: userData.parent_guardian_phone,
    student_id: userData.role === 'student' ? generateStudentId() : undefined,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  }
  // Store user
  storeUser(newUser)
  // Update auth store
  const session = storeSession(newUser)
  authStore.setUser({
    id: newUser.id,
    email: newUser.email,
    full_name: newUser.full_name || null,
    avatar_url: newUser.avatar_url,
    role: newUser.role as
      | 'student'
      | 'teacher'
      | 'admin'
      | 'business_admin'
      | 'super_admin'
      | 'parent',
    date_of_birth: null,
    phone: newUser.phone,
    address_line_1: newUser.address || null,
    address_line_2: null,
    city: null,
    state: null,
    zip_code: null,
    country: null,
    age: newUser.age,
    student_id: newUser.student_id,
    created_at: newUser.created_at,
    updated_at: newUser.updated_at,
  })
  return {
    user: newUser,
    session,
  }
}
export async function signIn(email: string, password: string) {
  // Simulate API delay
  await new Promise((resolve) => setTimeout(resolve, 500))
  // Find user
  const user = findUserByEmail(email)
  if (!user) {
    throw new Error('Invalid email or password')
  }
  // For demo purposes, we'll accept "123456" as the password for all test accounts
  if (password !== '123456') {
    throw new Error('Invalid email or password')
  }
  // Update auth store
  const session = storeSession(user)
  authStore.setUser({
    id: user.id,
    email: user.email,
    full_name: user.full_name || null,
    avatar_url: user.avatar_url,
    role: user.role as
      | 'student'
      | 'teacher'
      | 'admin'
      | 'business_admin'
      | 'super_admin'
      | 'parent',
    date_of_birth: null,
    phone: user.phone,
    address_line_1: user.address || null,
    address_line_2: null,
    city: null,
    state: null,
    zip_code: null,
    country: null,
    age: user.age,
    student_id: user.student_id,
    created_at: user.created_at,
    updated_at: user.updated_at,
  })
  return {
    user,
    session,
  }
}
export async function signOut() {
  // Simulate API delay
  await new Promise((resolve) => setTimeout(resolve, 200))
  clearSession()
  authStore.clearAuth()
}
export async function getCurrentUser(): Promise<LocalUser | null> {
  // Simulate API delay
  await new Promise((resolve) => setTimeout(resolve, 100))
  const session = getCurrentSession()
  return session?.user || null
}
export async function updateProfile(userId: string, updates: Partial<LocalUser>) {
  // Simulate API delay
  await new Promise((resolve) => setTimeout(resolve, 300))
  const users = JSON.parse(localStorage.getItem('eyogi_users') || '[]')
  const userIndex = users.findIndex((u: LocalUser) => u.id === userId)
  if (userIndex === -1) {
    throw new Error('User not found')
  }
  const updatedUser = {
    ...users[userIndex],
    ...updates,
    updated_at: new Date().toISOString(),
  }
  users[userIndex] = updatedUser
  localStorage.setItem('eyogi_users', JSON.stringify(users))
  // Update session if it's the current user
  const currentSession = getCurrentSession()
  if (currentSession && currentSession.user.id === userId) {
    storeSession(updatedUser)
    authStore.setUser(updatedUser)
  }
  return updatedUser
}
