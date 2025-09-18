import { createContext } from 'react'
import { User } from '@supabase/supabase-js'

export interface AuthContextType {
  // Current authenticated super admin user (from Supabase Auth ONLY)
  user: User | null
  loading: boolean
  initialized: boolean

  // Super admin sign in (Supabase Auth only)
  signIn: (email: string, password: string) => Promise<{ error: unknown }>
  signOut: () => Promise<void>

  // Check if user is super admin (only users in Supabase Auth are super admins)
  isSuperAdmin: boolean

  // Check permissions
  canAccess: (resource: string, action: string) => boolean
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined)
