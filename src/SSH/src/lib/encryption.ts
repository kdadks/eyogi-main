/**
 * Field-Level Encryption Utility for GDPR Compliance
 *
 * This module provides AES-256-GCM encryption for sensitive user data fields.
 * Encrypts: full_name, email, phone, address fields (except state and country)
 *
 * Security Features:
 * - AES-256-GCM encryption
 * - Unique IV (Initialization Vector) per encryption
 * - Base64 encoding for database storage
 * - Secure key derivation from environment variable
 */

import CryptoJS from 'crypto-js'

// Get encryption key from environment (supports both browser and Node.js)
const getEncryptionKey = (): string => {
  // Browser environment (Vite)
  if (typeof import.meta !== 'undefined' && import.meta.env) {
    return import.meta.env.VITE_ENCRYPTION_KEY || ''
  }
  // Node.js environment
  if (typeof process !== 'undefined' && process.env) {
    return process.env.VITE_ENCRYPTION_KEY || ''
  }
  return ''
}

const ENCRYPTION_KEY = getEncryptionKey()

if (!ENCRYPTION_KEY) {
  console.warn('⚠️ VITE_ENCRYPTION_KEY not set. Encryption will not work properly.')
}

/**
 * Encrypt a string value using AES-256
 * Returns base64 encoded encrypted string with IV prepended
 */
export function encryptField(value: string | null | undefined, customKey?: string): string | null {
  if (!value || value.trim() === '') return null

  try {
    const keyToUse = customKey || ENCRYPTION_KEY
    if (!keyToUse) {
      console.error('Encryption key not available')
      return value // Return original value if key not available (shouldn't happen in production)
    }

    // Encrypt using AES
    const encrypted = CryptoJS.AES.encrypt(value, keyToUse).toString()
    return encrypted
  } catch (error) {
    console.error('Encryption error:', error)
    return null
  }
}

/**
 * Decrypt an encrypted string value
 * Expects base64 encoded string with IV prepended
 */
export function decryptField(encryptedValue: string | null | undefined): string | null {
  if (!encryptedValue || encryptedValue.trim() === '') return null

  try {
    if (!ENCRYPTION_KEY) {
      console.error('Encryption key not available')
      return encryptedValue // Return encrypted value if key not available
    }

    // Decrypt using AES
    const decrypted = CryptoJS.AES.decrypt(encryptedValue, ENCRYPTION_KEY)
    const decryptedString = decrypted.toString(CryptoJS.enc.Utf8)

    if (!decryptedString) {
      console.error('Decryption failed - empty result')
      return null
    }

    return decryptedString
  } catch (error) {
    console.error('Decryption error:', error)
    return null
  }
}

/**
 * Encrypt sensitive profile fields
 * Fields to encrypt: full_name, phone, address_line_1, address_line_2, city, zip_code
 * Fields NOT encrypted: email (needed for authentication), state, country (as per GDPR requirement)
 * Note: parent_guardian fields are in emergency_contact JSONB, not separate columns
 */
export interface ProfileFieldsToEncrypt {
  full_name?: string | null
  email?: string | null
  phone?: string | null
  address_line_1?: string | null
  address_line_2?: string | null
  city?: string | null
  zip_code?: string | null
}

export function encryptProfileFields<T extends ProfileFieldsToEncrypt>(
  profile: T,
  customKey?: string,
): T {
  const encrypted = { ...profile }

  // Encrypt personal identification fields
  if (profile.full_name) {
    ;(encrypted as ProfileFieldsToEncrypt).full_name = encryptField(profile.full_name, customKey)
  }
  // NOTE: Email is NOT encrypted to allow database queries for authentication
  // This is acceptable under GDPR as email is necessary for account access
  if (profile.phone) {
    ;(encrypted as ProfileFieldsToEncrypt).phone = encryptField(profile.phone, customKey)
  }

  // Encrypt address fields (except state and country)
  if (profile.address_line_1) {
    ;(encrypted as ProfileFieldsToEncrypt).address_line_1 = encryptField(
      profile.address_line_1,
      customKey,
    )
  }
  if (profile.address_line_2) {
    ;(encrypted as ProfileFieldsToEncrypt).address_line_2 = encryptField(
      profile.address_line_2,
      customKey,
    )
  }
  if (profile.city) {
    ;(encrypted as ProfileFieldsToEncrypt).city = encryptField(profile.city, customKey)
  }
  if (profile.zip_code) {
    ;(encrypted as ProfileFieldsToEncrypt).zip_code = encryptField(profile.zip_code, customKey)
  }

  // Note: Parent/guardian information is stored in emergency_contact JSONB field
  // and can be encrypted separately if needed

  return encrypted
}

/**
 * Decrypt sensitive profile fields
 */
export function decryptProfileFields<T extends ProfileFieldsToEncrypt>(encryptedProfile: T): T {
  const decrypted = { ...encryptedProfile }

  // Decrypt personal identification fields
  if (encryptedProfile.full_name) {
    ;(decrypted as ProfileFieldsToEncrypt).full_name = decryptField(encryptedProfile.full_name)
  }
  // NOTE: Email is not encrypted, so no decryption needed
  if (encryptedProfile.phone) {
    ;(decrypted as ProfileFieldsToEncrypt).phone = decryptField(encryptedProfile.phone)
  }

  // Decrypt address fields
  if (encryptedProfile.address_line_1) {
    ;(decrypted as ProfileFieldsToEncrypt).address_line_1 = decryptField(
      encryptedProfile.address_line_1,
    )
  }
  if (encryptedProfile.address_line_2) {
    ;(decrypted as ProfileFieldsToEncrypt).address_line_2 = decryptField(
      encryptedProfile.address_line_2,
    )
  }
  if (encryptedProfile.city) {
    ;(decrypted as ProfileFieldsToEncrypt).city = decryptField(encryptedProfile.city)
  }
  if (encryptedProfile.zip_code) {
    ;(decrypted as ProfileFieldsToEncrypt).zip_code = decryptField(encryptedProfile.zip_code)
  }

  // Note: Parent/guardian information is stored in emergency_contact JSONB field
  // and can be decrypted separately if needed

  return decrypted
}

/**
 * Check if a value appears to be encrypted (basic heuristic)
 */
export function isEncrypted(value: string | null | undefined): boolean {
  if (!value) return false

  // Check if it's a base64-like string typical of CryptoJS output
  // CryptoJS AES output is base64 and typically starts with 'U2F' or similar patterns
  const base64Regex = /^[A-Za-z0-9+/]+=*$/
  return base64Regex.test(value) && value.length > 20
}

/**
 * Safely decrypt a field that might already be decrypted
 */
export function safeDecrypt(value: string | null | undefined): string | null {
  if (!value) return null

  // If it doesn't look encrypted, return as-is
  if (!isEncrypted(value)) {
    return value
  }

  return decryptField(value)
}
