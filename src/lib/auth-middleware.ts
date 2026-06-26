// ============================================
// AUTHENTICATION & AUTHORIZATION MIDDLEWARE
// Protect admin endpoints and verify roles
// ============================================

import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL!
const supabaseServiceKey = import.meta.env.VITE_SUPABASE_SERVICE_ROLE_KEY!

// Create admin client for server-side operations
export const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey)

export type UserRole = 'admin' | 'editor' | 'contributor' | 'viewer'

export interface AuthUser {
  id: string
  email: string
  role: UserRole
  status: 'active' | 'inactive' | 'suspended'
}

export interface AuthContext {
  user: AuthUser | null
  isAuthenticated: boolean
  hasRole: (role: UserRole | UserRole[]) => boolean
  isAdmin: () => boolean
  isEditor: () => boolean
}

/**
 * Verify JWT token and extract user info
 */
export async function verifyToken(token: string): Promise<AuthUser | null> {
  try {
    const { data, error } = await supabaseAdmin.auth.getUser(token)

    if (error || !data.user) return null

    // Get user role and status from our users table
    const { data: userData } = await supabaseAdmin
      .from('users')
      .select('id, email, role, status')
      .eq('id', data.user.id)
      .single()

    if (!userData) return null

    return userData as AuthUser
  } catch (error) {
    return null
  }
}

/**
 * Extract token from Authorization header
 */
export function extractToken(authHeader: string | null): string | null {
  if (!authHeader) return null
  const parts = authHeader.split(' ')
  return parts.length === 2 && parts[0] === 'Bearer' ? parts[1] : null
}

/**
 * Middleware for protecting endpoints
 */
export async function withAuth(request: Request, minRole?: UserRole) {
  try {
    const token = extractToken(request.headers.get('authorization'))

    if (!token) {
      return {
        status: 401,
        body: { success: false, error: 'Unauthorized - Missing token' },
      }
    }

    const user = await verifyToken(token)

    if (!user) {
      return {
        status: 401,
        body: { success: false, error: 'Unauthorized - Invalid token' },
      }
    }

    if (user.status !== 'active') {
      return {
        status: 403,
        body: { success: false, error: 'Forbidden - User account inactive' },
      }
    }

    // Check role if required
    if (minRole) {
      const roleHierarchy: Record<UserRole, number> = {
        admin: 4,
        editor: 3,
        contributor: 2,
        viewer: 1,
      }

      if ((roleHierarchy[user.role] || 0) < roleHierarchy[minRole]) {
        return {
          status: 403,
          body: { success: false, error: `Forbidden - Requires ${minRole} role` },
        }
      }
    }

    return {
      status: 200,
      user,
      body: null,
    }
  } catch (error: any) {
    return {
      status: 500,
      body: { success: false, error: error.message },
    }
  }
}

/**
 * Protected endpoint wrapper
 */
export async function createProtectedHandler<T>(
  handler: (request: Request, user: AuthUser) => Promise<T>,
  minRole?: UserRole,
) {
  return async (request: Request) => {
    const auth = await withAuth(request, minRole)

    if (auth.status !== 200) {
      return new Response(JSON.stringify(auth.body), {
        status: auth.status,
        headers: { 'Content-Type': 'application/json' },
      })
    }

    try {
      const result = await handler(request, auth.user!)
      return new Response(JSON.stringify(result), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      })
    } catch (error: any) {
      return new Response(JSON.stringify({ success: false, error: error.message }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      })
    }
  }
}
