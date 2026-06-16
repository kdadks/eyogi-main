import * as localAuth from '@/lib/local-data/auth'
import { User } from '../types'
import { LocalUser } from '@/lib/local-data/storage'
// Convert User partial to LocalUser partial
function convertUserToLocalUser(userData: Partial<User>): Partial<LocalUser> {
  return {
    id: userData.id,
    email: userData.email,
    full_name: userData.full_name || undefined,
    avatar_url: userData.avatar_url || undefined,
    role: userData.role,
    age: userData.age || undefined,
    phone: userData.phone || undefined,
    address: userData.address_line_1 || undefined,
    student_id: userData.student_id || undefined,
    created_at: userData.created_at,
    updated_at: userData.updated_at,
  }
}
// Convert LocalUser to User
function convertLocalUserToUser(localUser: LocalUser): User {
  return {
    id: localUser.id,
    email: localUser.email,
    full_name: localUser.full_name || null,
    avatar_url: localUser.avatar_url,
    role: localUser.role as User['role'],
    date_of_birth: null,
    phone: localUser.phone,
    address_line_1: localUser.address || null,
    address_line_2: null,
    city: null,
    state: null,
    zip_code: null,
    country: null,
    age: localUser.age,
    student_id: localUser.student_id,
    created_at: localUser.created_at,
    updated_at: localUser.updated_at,
  }
}
export async function signUp(email: string, password: string, userData: Partial<User>) {
  return await localAuth.signUp(email, password, convertUserToLocalUser(userData))
}
export async function signIn(email: string, password: string) {
  return await localAuth.signIn(email, password)
}
export async function signOut() {
  return await localAuth.signOut()
}
export async function getCurrentUser(): Promise<User | null> {
  const localUser = await localAuth.getCurrentUser()
  return localUser ? convertLocalUserToUser(localUser) : null
}
export async function updateProfile(userId: string, updates: Partial<User>) {
  return await localAuth.updateProfile(userId, convertUserToLocalUser(updates))
}
