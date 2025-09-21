import { clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

export type ClassValue = string | number | boolean | undefined | null | ClassValue[]

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatCurrency(amount: number | null | undefined, currency = 'EUR'): string {
  if (amount === null || amount === undefined || isNaN(amount)) {
    return new Intl.NumberFormat('en-IE', {
      style: 'currency',
      currency,
    }).format(0)
  }
  return new Intl.NumberFormat('en-IE', {
    style: 'currency',
    currency,
  }).format(amount)
}

export function formatDate(date: string | Date): string {
  return new Intl.DateTimeFormat('en-IE', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  }).format(new Date(date))
}

export function formatDateTime(date: string | Date): string {
  return new Intl.DateTimeFormat('en-IE', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(date))
}

export function generateSlug(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

export function getInitials(name: string): string {
  return name
    .split(' ')
    .map((word) => word.charAt(0))
    .join('')
    .toUpperCase()
    .slice(0, 2)
}

export function truncateText(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text
  return text.slice(0, maxLength) + '...'
}

export function getAgeGroupLabel(min: number, max: number): string {
  return `${min}-${max} years`
}

export function getLevelColor(level: string): string {
  const colors = {
    elementary: 'bg-green-100 text-green-800',
    basic: 'bg-blue-100 text-blue-800',
    intermediate: 'bg-yellow-100 text-yellow-800',
    advanced: 'bg-red-100 text-red-800',
  }
  return colors[level as keyof typeof colors] || colors.basic
}

export function getStatusColor(status: string): string {
  const colors = {
    pending: 'bg-yellow-100 text-yellow-800',
    approved: 'bg-green-100 text-green-800',
    rejected: 'bg-red-100 text-red-800',
    completed: 'bg-blue-100 text-blue-800',
    cancelled: 'bg-gray-100 text-gray-800',
  }
  return colors[status as keyof typeof colors] || colors.pending
}

export function toSentenceCase(text: string): string {
  if (!text) return ''
  return text.charAt(0).toUpperCase() + text.slice(1).toLowerCase()
}

// Course URL utilities - Using clean title-based slugs
export function generateCourseSlug(course: { id: string; title: string }): string {
  // Create a clean slug from just the title
  return generateSlug(course.title)
}

export function generateCourseUrl(course: { id: string; title: string; slug?: string }): string {
  // Use the database slug if available, otherwise generate one
  const slug = course.slug || generateCourseSlug(course)
  return `/courses/${slug}`
}

// For truly unique slugs, we'll need to store them in the database
// This function creates a unique slug that can be stored as a database field
export function createUniqueSlug(title: string, existingSlugs: string[] = []): string {
  const baseSlug = generateSlug(title)
  let uniqueSlug = baseSlug
  let counter = 1

  // Ensure uniqueness by adding numbers if needed
  while (existingSlugs.includes(uniqueSlug)) {
    uniqueSlug = `${baseSlug}-${counter}`
    counter++
  }

  return uniqueSlug
}

export function parseCourseSlug(slug: string): { courseId: string | null; title: string | null } {
  // Handle UUID-only format for backward compatibility
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
  if (uuidRegex.test(slug)) {
    return { courseId: slug, title: null }
  }

  // For the new system, we'll look up by the slug directly in the database
  // This function will be simplified since slugs are stored as database fields
  return { courseId: null, title: slug }
}
