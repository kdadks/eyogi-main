/**
 * HTML Sanitization Utility
 *
 * This utility provides safe HTML sanitization to prevent XSS attacks
 * when rendering user-generated or dynamic HTML content.
 *
 * Security: Uses DOMPurify to sanitize HTML before rendering with dangerouslySetInnerHTML
 */

import DOMPurify from 'dompurify'

/**
 * Sanitize HTML content to prevent XSS attacks
 *
 * @param html - The HTML string to sanitize
 * @param allowedTags - Optional array of allowed HTML tags (default: safe subset)
 * @returns Sanitized HTML string safe for rendering
 *
 * @example
 * ```tsx
 * <div dangerouslySetInnerHTML={{ __html: sanitizeHtml(content) }} />
 * ```
 */
export function sanitizeHtml(html: string, allowedTags?: string[]): string {
  if (!html) return ''

  const config = {
    ALLOWED_TAGS: allowedTags || [
      'b', 'i', 'em', 'strong', 'a', 'p', 'br', 'ul', 'ol', 'li',
      'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
      'blockquote', 'code', 'pre', 'hr',
      'div', 'span', 'img', 'table', 'thead', 'tbody', 'tr', 'td', 'th'
    ],
    ALLOWED_ATTR: ['href', 'src', 'alt', 'title', 'class', 'id', 'target', 'rel'],
    ALLOW_DATA_ATTR: false,
    // Prevent JavaScript execution
    FORBID_TAGS: ['script', 'style', 'iframe', 'object', 'embed'],
    FORBID_ATTR: ['onerror', 'onload', 'onclick', 'onmouseover'],
  }

  return DOMPurify.sanitize(html, config) as string
}

/**
 * Sanitize HTML with a more permissive configuration for rich content
 * Use this for admin-generated or trusted content that needs more formatting
 *
 * @param html - The HTML string to sanitize
 * @returns Sanitized HTML string
 */
export function sanitizeRichHtml(html: string): string {
  if (!html) return ''

  const config = {
    ALLOWED_TAGS: [
      'b', 'i', 'em', 'strong', 'a', 'p', 'br', 'ul', 'ol', 'li',
      'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
      'blockquote', 'code', 'pre', 'hr', 'div', 'span', 'img',
      'table', 'thead', 'tbody', 'tr', 'td', 'th', 'video', 'audio'
    ],
    ALLOWED_ATTR: [
      'href', 'src', 'alt', 'title', 'class', 'id', 'target', 'rel',
      'width', 'height', 'controls', 'poster'
    ],
    ALLOW_DATA_ATTR: false,
    FORBID_TAGS: ['script', 'style', 'iframe', 'object', 'embed'],
    FORBID_ATTR: ['onerror', 'onload', 'onclick', 'onmouseover', 'onsubmit'],
  }

  return DOMPurify.sanitize(html, config) as string
}

/**
 * Sanitize plain text with basic formatting only
 * Use for user-generated content with minimal formatting needs
 *
 * @param html - The HTML string to sanitize
 * @returns Sanitized HTML string with basic formatting only
 */
export function sanitizeBasicHtml(html: string): string {
  if (!html) return ''

  const config = {
    ALLOWED_TAGS: ['b', 'i', 'em', 'strong', 'a', 'p', 'br', 'ul', 'ol', 'li'],
    ALLOWED_ATTR: ['href', 'target', 'rel'],
    ALLOW_DATA_ATTR: false,
    FORBID_TAGS: ['script', 'style', 'iframe', 'object', 'embed', 'img', 'video'],
    FORBID_ATTR: ['onerror', 'onload', 'onclick', 'onmouseover'],
  }

  return DOMPurify.sanitize(html, config) as string
}
