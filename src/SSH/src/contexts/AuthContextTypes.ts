import { createContext } from 'react'
import { User } from '@supabase/supabase-js'
import type { Profile } from '../types'
export interface AuthContextType {
  // Current authenticated admin user (from Supabase Auth)
  user: User | null
  // User's profile data from database
  profile: Profile | null
  loading: boolean
  initialized: boolean
  // Admin sign in (Supabase Auth only)
  signIn: (email: string, password: string) => Promise<{ error: unknown }>
  signOut: () => Promise<void>
  updateAuthState: () => Promise<{ user: User | null; profile: Profile | null }>
  // Check if user has admin privileges (admin, business_admin, or super_admin)
  isSuperAdmin: boolean
  // Role-based permissions
  canManageCertificates: boolean
  canAssignTemplates: boolean
  isTeacher: boolean
  // Check permissions
  canAccess: (resource: string, action: string) => boolean
}
export const AuthContext = createContext<AuthContextType | undefined>(undefined)
