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
  authStore.setUser(newUser)

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
  authStore.setUser(user)

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
