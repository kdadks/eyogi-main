/**
 * Next.js middleware for authentication and authorization
 * Runs on every request
 */

import { NextRequest, NextResponse } from 'next/server'
import { getTokenFromHeader, verifyToken } from '@/lib/supabase/auth'

// Routes that don't require authentication
const PUBLIC_ROUTES = [
  '/',
  '/login',
  '/contact',
  '/about',
  '/donation',
  '/forms',
  '/faq',
  '/membership',
  '/hinduism',
]

// Routes that require authentication (admin-only)
const PROTECTED_ROUTES = ['/admin']

/**
 * Check if route is public
 */
function isPublicRoute(pathname: string): boolean {
  return PUBLIC_ROUTES.some((route) => pathname === route || pathname.startsWith(`${route}/`))
}

/**
 * Check if route is protected
 */
function isProtectedRoute(pathname: string): boolean {
  return PROTECTED_ROUTES.some((route) => pathname === route || pathname.startsWith(`${route}/`))
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Allow public routes without authentication
  if (isPublicRoute(pathname)) {
    return NextResponse.next()
  }

  // Check for protected routes
  if (isProtectedRoute(pathname)) {
    // Get token from request
    const authHeader = request.headers.get('authorization')
    const token = getTokenFromHeader(authHeader) || request.cookies.get('auth_token')?.value

    if (!token) {
      return NextResponse.redirect(new URL('/login', request.url))
    }

    // Verify token
    const user = await verifyToken(token)
    if (!user) {
      return NextResponse.redirect(new URL('/login', request.url))
    }

    // Add user info to request headers for API routes
    const requestHeaders = new Headers(request.headers)
    requestHeaders.set('x-user-id', user.id)

    return NextResponse.next({
      request: {
        headers: requestHeaders,
      },
    })
  }

  // For SSH routes, allow authenticated users
  if (pathname.startsWith('/ssh-app/') || pathname.startsWith('/ssh-admin')) {
    const authHeader = request.headers.get('authorization')
    const token = getTokenFromHeader(authHeader) || request.cookies.get('auth_token')?.value

    if (!token) {
      return NextResponse.redirect(new URL('/login', request.url))
    }

    const user = await verifyToken(token)
    if (!user) {
      return NextResponse.redirect(new URL('/login', request.url))
    }

    const requestHeaders = new Headers(request.headers)
    requestHeaders.set('x-user-id', user.id)

    return NextResponse.next({
      request: {
        headers: requestHeaders,
      },
    })
  }

  return NextResponse.next()
}

// Configure which routes the middleware should run on
export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.png|.*\\.jpg|.*\\.jpeg|.*\\.svg|.*\\.webp).*)',
  ],
}
