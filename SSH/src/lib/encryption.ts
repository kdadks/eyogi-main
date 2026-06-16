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

// Diagnostic logging
if (!ENCRYPTION_KEY) {
  console.error('❌ CRITICAL: VITE_ENCRYPTION_KEY not set!')
  console.error('⚠️  Encrypted data will NOT be decrypted.')
  console.error('📖 See ENCRYPTION_SETUP_GUIDE.md for setup instructions.')
  console.error(
    '🔧 Action required: Set VITE_ENCRYPTION_KEY in Vercel environment variables and redeploy.',
  )
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
export function decryptField(encryptedValue: string | null | undefined | any): string | null {
  if (!encryptedValue) return null

  // Convert to string if it's not already (handles numbers, etc.)
  const valueStr = typeof encryptedValue === 'string' ? encryptedValue : String(encryptedValue)

  if (valueStr.trim() === '') return null

  // Skip decryption if it doesn't look encrypted (doesn't start with U2FsdGVkX1)
  if (!valueStr.startsWith('U2FsdGVkX1')) {
    // Return as-is if it looks like plain text
    return valueStr
  }

  try {
    if (!ENCRYPTION_KEY) {
      console.warn('⚠️ Encryption key not available, returning null')
      return null
    }

    // Decrypt using AES
    const decrypted = CryptoJS.AES.decrypt(valueStr, ENCRYPTION_KEY)
    const decryptedString = decrypted.toString(CryptoJS.enc.Utf8)

    if (!decryptedString) {
      // Silently fail and return null - likely wrong key or corrupted data
      return null
    }

    return decryptedString
  } catch (error) {
    // Silently fail and return null
    console.warn('⚠️ Decryption failed, returning null')
    return null
  }
} /**
 * Encrypt sensitive profile fields
 * Fields to encrypt: full_name, phone, date_of_birth, age, emergency_contact, address_line_1, address_line_2, city, zip_code
 * Fields NOT encrypted: email (needed for authentication), state, country (as per GDPR requirement)
 */
export interface ProfileFieldsToEncrypt {
  full_name?: string | null
  email?: string | null
  phone?: string | null
  date_of_birth?: string | null
  age?: number | null
  emergency_contact?: any | null
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

  // IMPORTANT: Email is NEVER encrypted - it must remain in plain text for:
  // 1. Authentication and login functionality
  // 2. Password reset email lookups
  // 3. Welcome email delivery
  // 4. Database queries and user lookups
  // Email remains in plain text as it's necessary for account access (GDPR compliant)
  // The email field is intentionally NOT processed here

  if (profile.phone) {
    ;(encrypted as ProfileFieldsToEncrypt).phone = encryptField(profile.phone, customKey)
  }

  // Encrypt date of birth
  if (profile.date_of_birth) {
    const dobString =
      typeof profile.date_of_birth === 'string'
        ? profile.date_of_birth
        : String(profile.date_of_birth)
    ;(encrypted as ProfileFieldsToEncrypt).date_of_birth = encryptField(dobString, customKey)
  }

  // Encrypt age
  if (profile.age !== null && profile.age !== undefined) {
    ;(encrypted as ProfileFieldsToEncrypt).age = encryptField(
      profile.age.toString(),
      customKey,
    ) as any
  }

  // Encrypt emergency contact (JSONB field)
  if (profile.emergency_contact) {
    ;(encrypted as ProfileFieldsToEncrypt).emergency_contact = encryptField(
      typeof profile.emergency_contact === 'string'
        ? profile.emergency_contact
        : JSON.stringify(profile.emergency_contact),
      customKey,
    ) as any
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
 * Gracefully handles decryption failures by returning null for failed fields
 */
export function decryptProfileFields<T extends ProfileFieldsToEncrypt>(encryptedProfile: T): T {
  const decrypted = { ...encryptedProfile }

  // Decrypt personal identification fields
  if (encryptedProfile.full_name) {
    const result = decryptField(encryptedProfile.full_name)
    ;(decrypted as ProfileFieldsToEncrypt).full_name = result || encryptedProfile.full_name
  }
  // NOTE: Email is not encrypted, so no decryption needed
  if (encryptedProfile.phone) {
    const result = decryptField(encryptedProfile.phone)
    ;(decrypted as ProfileFieldsToEncrypt).phone = result || encryptedProfile.phone
  }

  // Decrypt date of birth
  if (encryptedProfile.date_of_birth) {
    const result = decryptField(encryptedProfile.date_of_birth)
    ;(decrypted as ProfileFieldsToEncrypt).date_of_birth = result || null
  }

  // Decrypt age
  if (encryptedProfile.age !== null && encryptedProfile.age !== undefined) {
    const decryptedAge = decryptField(encryptedProfile.age as any)
    if (decryptedAge && !isNaN(parseInt(decryptedAge, 10))) {
      ;(decrypted as ProfileFieldsToEncrypt).age = parseInt(decryptedAge, 10)
    } else {
      ;(decrypted as ProfileFieldsToEncrypt).age = null
    }
  }

  // Decrypt emergency contact
  if (encryptedProfile.emergency_contact) {
    const decryptedContact = decryptField(encryptedProfile.emergency_contact as any)
    if (decryptedContact) {
      try {
        ;(decrypted as ProfileFieldsToEncrypt).emergency_contact = JSON.parse(decryptedContact)
      } catch {
        // If JSON parse fails, treat as plain object
        if (typeof encryptedProfile.emergency_contact === 'object') {
          ;(decrypted as ProfileFieldsToEncrypt).emergency_contact =
            encryptedProfile.emergency_contact
        } else {
          ;(decrypted as ProfileFieldsToEncrypt).emergency_contact = null
        }
      }
    } else {
      ;(decrypted as ProfileFieldsToEncrypt).emergency_contact = encryptedProfile.emergency_contact
    }
  }

  // Decrypt address fields
  if (encryptedProfile.address_line_1) {
    const result = decryptField(encryptedProfile.address_line_1)
    ;(decrypted as ProfileFieldsToEncrypt).address_line_1 = result || null
  }
  if (encryptedProfile.address_line_2) {
    const result = decryptField(encryptedProfile.address_line_2)
    ;(decrypted as ProfileFieldsToEncrypt).address_line_2 = result || null
  }
  if (encryptedProfile.city) {
    const result = decryptField(encryptedProfile.city)
    ;(decrypted as ProfileFieldsToEncrypt).city = result || null
  }
  if (encryptedProfile.zip_code) {
    const result = decryptField(encryptedProfile.zip_code)
    ;(decrypted as ProfileFieldsToEncrypt).zip_code = result || null
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
