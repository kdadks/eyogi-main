import { User } from '@/types'

export function getUserDisplayName(user: User | null): string {
  if (!user) return 'Guest'
  return user.full_name || user.email || 'User'
}

export function getUserInitials(user: User | null): string {
  if (!user || !user.full_name) return 'U'
  
  return user.full_name
    .split(' ')
    .map(word => word.charAt(0))
    .join('')
    .toUpperCase()
    .slice(0, 2)
}

export function getRoleDisplayName(role: User['role']): string {
  const roleNames = {
    student: 'Student',
    teacher: 'Teacher',
    admin: 'Administrator'
  }
  return roleNames[role] || 'User'
}

export function getRoleColor(role: User['role']): string {
  const roleColors = {
    student: 'bg-blue-100 text-blue-800',
    teacher: 'bg-green-100 text-green-800',
    admin: 'bg-purple-100 text-purple-800'
  }
  return roleColors[role] || 'bg-gray-100 text-gray-800'
}

export function canAccessRoute(user: User | null, requiredRole?: User['role']): boolean {
  if (!user) return false
  if (!requiredRole) return true
  return user.role === requiredRole
}

export function getDefaultRedirectPath(user: User | null): string {
  if (!user) return '/auth/signin'
  
  switch (user.role) {
    case 'student':
      return '/dashboard/student'
    case 'teacher':
      return '/dashboard/teacher'
    case 'admin':
      return '/dashboard/admin'
    default:
      return '/dashboard'
  }
}