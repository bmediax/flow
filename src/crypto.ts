/**
 * Encryption utilities for sensitive data storage
 * Uses Web Crypto API for secure encryption/decryption
 */

const ALGORITHM = 'AES-GCM'
const KEY_LENGTH = 256

/**
 * Derives a crypto key from a user-specific identifier
 * In a real app, this would use a more secure key derivation method
 */
async function getDerivedKey(): Promise<CryptoKey> {
  // Use a combination of user agent and a stable identifier
  // This ensures the key is consistent across sessions but unique per browser
  const keyMaterial = `flow-reader-${navigator.userAgent}`

  const encoder = new TextEncoder()
  const keyData = encoder.encode(keyMaterial)

  // Import the key material
  const baseKey = await crypto.subtle.importKey(
    'raw',
    keyData,
    'PBKDF2',
    false,
    ['deriveKey'],
  )

  // Derive a key using PBKDF2
  return crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt: encoder.encode('flow-reader-salt'),
      iterations: 100000,
      hash: 'SHA-256',
    },
    baseKey,
    { name: ALGORITHM, length: KEY_LENGTH },
    false,
    ['encrypt', 'decrypt'],
  )
}

/**
 * Encrypts a string value
 * @param value - The string to encrypt
 * @returns Base64-encoded encrypted data with IV
 */
export async function encrypt(value: string): Promise<string> {
  if (!value) return ''

  const key = await getDerivedKey()
  const encoder = new TextEncoder()
  const data = encoder.encode(value)

  // Generate a random IV for each encryption
  const iv = crypto.getRandomValues(new Uint8Array(12))

  const encrypted = await crypto.subtle.encrypt(
    {
      name: ALGORITHM,
      iv,
    },
    key,
    data,
  )

  // Combine IV and encrypted data
  const combined = new Uint8Array(iv.length + encrypted.byteLength)
  combined.set(iv, 0)
  combined.set(new Uint8Array(encrypted), iv.length)

  // Convert to base64 for storage
  return btoa(String.fromCharCode(...combined))
}

/**
 * Decrypts an encrypted string value
 * @param encryptedValue - Base64-encoded encrypted data with IV
 * @returns The decrypted string
 */
export async function decrypt(encryptedValue: string): Promise<string> {
  if (!encryptedValue) return ''

  try {
    const key = await getDerivedKey()

    // Decode from base64
    const combined = Uint8Array.from(atob(encryptedValue), (c) => c.charCodeAt(0))

    // Extract IV and encrypted data
    const iv = combined.slice(0, 12)
    const data = combined.slice(12)

    const decrypted = await crypto.subtle.decrypt(
      {
        name: ALGORITHM,
        iv,
      },
      key,
      data,
    )

    const decoder = new TextDecoder()
    return decoder.decode(decrypted)
  } catch (error) {
    console.error('Decryption failed:', error)
    return ''
  }
}
