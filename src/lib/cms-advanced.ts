// ============================================
// ADVANCED CMS FEATURES
// Email notifications, caching, error handling
// ============================================

import nodemailer from 'nodemailer'
import type { Form, FormSubmission, Post, Page } from '@/types/cms'

// ============================================
// EMAIL NOTIFICATIONS
// ============================================

interface EmailConfig {
  host: string
  port: number
  secure: boolean
  auth: {
    user: string
    pass: string
  }
  from: string
}

let emailTransporter: nodemailer.Transporter | null = null

function initializeEmailTransporter(): nodemailer.Transporter {
  if (emailTransporter) return emailTransporter

  const config: EmailConfig = {
    host: process.env.SMTP_HOST || '',
    port: parseInt(process.env.SMTP_PORT || '587'),
    secure: process.env.SMTP_SECURE === 'true',
    auth: {
      user: process.env.SMTP_USER || '',
      pass: process.env.SMTP_PASSWORD || '',
    },
    from: process.env.SMTP_FROM || 'noreply@eyogigurukul.com',
  }

  emailTransporter = nodemailer.createTransport(config)
  return emailTransporter
}

export interface FormNotificationData {
  form: Form
  submission: FormSubmission
  siteUrl: string
}

/**
 * Send form submission notification email
 */
export async function sendFormNotificationEmail({
  form,
  submission,
  siteUrl,
}: FormNotificationData): Promise<boolean> {
  try {
    if (!form.notification_email) return false

    const transporter = initializeEmailTransporter()

    const dataEntries = Object.entries(submission.data)
      .map(([key, value]) => `<strong>${key}:</strong> ${String(value)}`)
      .join('<br />')

    const html = `
      <h2>New Form Submission</h2>
      <p><strong>Form:</strong> ${form.name}</p>
      <p><strong>Submitted by:</strong> ${submission.submitter_name || 'Anonymous'}</p>
      <p><strong>Email:</strong> ${submission.submitter_email || 'Not provided'}</p>
      <hr />
      <h3>Submission Data:</h3>
      <p>${dataEntries}</p>
      <hr />
      <p><a href="${siteUrl}/admin/forms/submissions">View in Admin</a></p>
    `

    await transporter.sendMail({
      to: form.notification_email,
      subject: `New submission for form: ${form.name}`,
      html,
    })

    return true
  } catch (error) {
    console.error('Failed to send form notification:', error)
    return false
  }
}

/**
 * Send confirmation email to form submitter
 */
export async function sendFormConfirmationEmail(
  email: string,
  name: string,
  formName: string,
): Promise<boolean> {
  try {
    if (!email) return false

    const transporter = initializeEmailTransporter()

    const html = `
      <h2>Thank You!</h2>
      <p>Hello ${name || 'there'},</p>
      <p>We have received your submission for <strong>${formName}</strong>.</p>
      <p>We will get back to you as soon as possible.</p>
      <br />
      <p>Best regards,<br />Eyogi Gurukul Team</p>
    `

    await transporter.sendMail({
      to: email,
      subject: `Confirmation: ${formName}`,
      html,
    })

    return true
  } catch (error) {
    console.error('Failed to send confirmation email:', error)
    return false
  }
}

// ============================================
// CACHING LAYER
// Simple in-memory cache with TTL
// ============================================

interface CacheEntry<T> {
  data: T
  expiresAt: number
}

class CacheManager {
  private cache = new Map<string, CacheEntry<any>>()
  private defaultTTL = 5 * 60 * 1000 // 5 minutes

  set<T>(key: string, data: T, ttl: number = this.defaultTTL): void {
    this.cache.set(key, {
      data,
      expiresAt: Date.now() + ttl,
    })
  }

  get<T>(key: string): T | null {
    const entry = this.cache.get(key)

    if (!entry) return null

    if (Date.now() > entry.expiresAt) {
      this.cache.delete(key)
      return null
    }

    return entry.data as T
  }

  clear(pattern?: string): void {
    if (!pattern) {
      this.cache.clear()
      return
    }

    const regex = new RegExp(pattern)
    for (const key of this.cache.keys()) {
      if (regex.test(key)) {
        this.cache.delete(key)
      }
    }
  }

  has(key: string): boolean {
    const entry = this.cache.get(key)
    if (!entry) return false

    if (Date.now() > entry.expiresAt) {
      this.cache.delete(key)
      return false
    }

    return true
  }
}

export const cacheManager = new CacheManager()

// Cache key generators
export const cacheKeys = {
  posts: (page: number, limit: number, category?: string) =>
    `posts:page=${page}:limit=${limit}:category=${category || 'all'}`,
  post: (slug: string) => `post:${slug}`,
  pages: (page: number, limit: number) => `pages:page=${page}:limit=${limit}`,
  page: (slug: string) => `page:${slug}`,
  categories: () => 'categories:all',
  category: (slug: string) => `category:${slug}`,
  featured: (limit: number) => `posts:featured:limit=${limit}`,
  settings: () => 'settings:all',
  setting: (key: string) => `setting:${key}`,
  menus: () => 'menus:all',
  menu: (location: string) => `menu:${location}`,
}

// ============================================
// ERROR HANDLING & LOGGING
// ============================================

export class CmsError extends Error {
  constructor(
    message: string,
    public code: string = 'INTERNAL_ERROR',
    public statusCode: number = 500,
  ) {
    super(message)
    this.name = 'CmsError'
  }
}

export class ValidationError extends CmsError {
  constructor(message: string) {
    super(message, 'VALIDATION_ERROR', 400)
    this.name = 'ValidationError'
  }
}

export class NotFoundError extends CmsError {
  constructor(resource: string) {
    super(`${resource} not found`, 'NOT_FOUND', 404)
    this.name = 'NotFoundError'
  }
}

export class UnauthorizedError extends CmsError {
  constructor(message: string = 'Unauthorized') {
    super(message, 'UNAUTHORIZED', 401)
    this.name = 'UnauthorizedError'
  }
}

export class ForbiddenError extends CmsError {
  constructor(message: string = 'Forbidden') {
    super(message, 'FORBIDDEN', 403)
    this.name = 'ForbiddenError'
  }
}

// ============================================
// LOGGING
// ============================================

export enum LogLevel {
  DEBUG = 'DEBUG',
  INFO = 'INFO',
  WARN = 'WARN',
  ERROR = 'ERROR',
}

interface LogEntry {
  timestamp: string
  level: LogLevel
  message: string
  data?: any
  error?: string
}

class Logger {
  private logs: LogEntry[] = []
  private maxLogs = 1000

  private log(level: LogLevel, message: string, data?: any, error?: Error) {
    const entry: LogEntry = {
      timestamp: new Date().toISOString(),
      level,
      message,
      data,
      error: error?.stack,
    }

    this.logs.push(entry)

    // Keep only recent logs
    if (this.logs.length > this.maxLogs) {
      this.logs = this.logs.slice(-this.maxLogs)
    }

    // Also log to console in development
    if (process.env.NODE_ENV === 'development') {
      const prefix = `[${entry.timestamp}] ${level}:`
      console.log(prefix, message, data)
      if (error) console.error(error)
    }
  }

  debug(message: string, data?: any) {
    this.log(LogLevel.DEBUG, message, data)
  }

  info(message: string, data?: any) {
    this.log(LogLevel.INFO, message, data)
  }

  warn(message: string, data?: any) {
    this.log(LogLevel.WARN, message, data)
  }

  error(message: string, error?: Error, data?: any) {
    this.log(LogLevel.ERROR, message, data, error)
  }

  getLogs(level?: LogLevel, limit: number = 100): LogEntry[] {
    let filtered = this.logs

    if (level) {
      filtered = filtered.filter((log) => log.level === level)
    }

    return filtered.slice(-limit)
  }

  clear() {
    this.logs = []
  }
}

export const logger = new Logger()

// ============================================
// MIDDLEWARE: ERROR RESPONSE HANDLER
// ============================================

export function handleCmsError(error: any): {
  status: number
  body: { success: false; error: string; code: string }
} {
  if (error instanceof CmsError) {
    logger.warn('CMS Error', { code: error.code, message: error.message })
    return {
      status: error.statusCode,
      body: {
        success: false,
        error: error.message,
        code: error.code,
      },
    }
  }

  logger.error('Unexpected Error', error as Error)

  return {
    status: 500,
    body: {
      success: false,
      error: 'Internal server error',
      code: 'INTERNAL_ERROR',
    },
  }
}

// ============================================
// UTILS: SLUG VALIDATION
// ============================================

export function validateSlug(slug: string): boolean {
  return /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)
}

export function generateSlug(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_]+/g, '-')
    .replace(/^-+|-+$/g, '')
}
