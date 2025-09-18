import * as localAuth from '@/lib/local-data/auth'
import { User } from '@/types'

export async function signUp(email: string, password: string, userData: Partial<User>) {
  return await localAuth.signUp(email, password, userData)
}

export async function signIn(email: string, password: string) {
  return await localAuth.signIn(email, password)
}

export async function signOut() {
  return await localAuth.signOut()
}

export async function getCurrentUser(): Promise<User | null> {
  return await localAuth.getCurrentUser()
}

export async function updateProfile(userId: string, updates: Partial<User>) {
  return await localAuth.updateProfile(userId, updates)
}
