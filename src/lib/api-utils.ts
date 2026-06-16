/**
 * API response and error utilities
 */

export interface ApiResponse<T = any> {
  success: boolean
  data?: T
  error?: string
  message?: string
}

export interface ApiError {
  code: string
  message: string
  details?: any
}

/**
 * Create success response
 */
export function successResponse<T>(data: T, message?: string): ApiResponse<T> {
  return {
    success: true,
    data,
    message,
  }
}

/**
 * Create error response
 */
export function errorResponse(error: any, details?: any): ApiResponse {
  let message = 'An error occurred'

  if (typeof error === 'string') {
    message = error
  } else if (error instanceof Error) {
    message = error.message
  } else if (error?.message) {
    message = error.message
  }

  return {
    success: false,
    error: message,
    ...(details && { message: JSON.stringify(details) }),
  }
}

/**
 * Handle API errors
 */
export function handleApiError(error: any) {
  if (error?.code === 'PGRST116') {
    return errorResponse('Record not found', error)
  }
  if (error?.code === 'PGRST204') {
    return errorResponse('No content', error)
  }
  if (error?.code === 'PGRST205') {
    return errorResponse('Table not found', error)
  }
  if (error?.message?.includes('unique constraint')) {
    return errorResponse('Resource already exists', error)
  }
  if (error?.message?.includes('violates')) {
    return errorResponse('Invalid data provided', error)
  }
  return errorResponse(error?.message || 'An error occurred', error)
}

/**
 * Validate required fields
 */
export function validateRequired(data: Record<string, any>, fields: string[]): string | null {
  for (const field of fields) {
    if (!data[field]) {
      return `Field '${field}' is required`
    }
  }
  return null
}

/**
 * Get user ID from request
 */
export function getUserIdFromRequest(request: Request): string | null {
  const headers = request.headers
  return headers.get('x-user-id')
}
