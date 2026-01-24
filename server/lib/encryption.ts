/**
 * Encryption utility for sensitive data (credentials, API keys, etc.)
 * Uses AES-256-GCM for encryption
 */

import crypto from 'crypto';

const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 16;
const AUTH_TAG_LENGTH = 16;
const SALT_LENGTH = 64;

/**
 * Get encryption key from environment variable
 * In production, this should be stored securely (e.g., AWS Secrets Manager, Azure Key Vault)
 */
function getEncryptionKey(): Buffer {
  const key = process.env.ENCRYPTION_KEY;

  if (!key) {
    console.error('⚠️  ENCRYPTION_KEY environment variable not set! Using default key (INSECURE).');
    console.error('   Set ENCRYPTION_KEY to a secure 32-byte hex string in production.');
    // Fallback to a deterministic default for development only
    return crypto.scryptSync('default-dev-key-CHANGE-IN-PRODUCTION', 'salt', 32);
  }

  // If key is hex string, convert to buffer
  if (/^[0-9a-f]{64}$/i.test(key)) {
    return Buffer.from(key, 'hex');
  }

  // Otherwise derive key from string using scrypt
  return crypto.scryptSync(key, 'salt', 32);
}

/**
 * Encrypt sensitive data (e.g., credentials, API keys)
 * @param plaintext - The data to encrypt
 * @returns Encrypted data in format: iv:authTag:encryptedData (all hex encoded)
 */
export function encrypt(plaintext: string): string {
  if (!plaintext) {
    return '';
  }

  try {
    const key = getEncryptionKey();
    const iv = crypto.randomBytes(IV_LENGTH);

    const cipher = crypto.createCipheriv(ALGORITHM, key, iv);

    let encrypted = cipher.update(plaintext, 'utf8', 'hex');
    encrypted += cipher.final('hex');

    const authTag = cipher.getAuthTag();

    // Format: iv:authTag:encryptedData (all hex)
    return `${iv.toString('hex')}:${authTag.toString('hex')}:${encrypted}`;
  } catch (error) {
    console.error('Encryption error:', error);
    throw new Error('Failed to encrypt data');
  }
}

/**
 * Decrypt sensitive data
 * @param encryptedData - The encrypted data in format: iv:authTag:encryptedData
 * @returns Decrypted plaintext
 */
export function decrypt(encryptedData: string): string {
  if (!encryptedData) {
    return '';
  }

  try {
    const key = getEncryptionKey();
    const parts = encryptedData.split(':');

    if (parts.length !== 3) {
      throw new Error('Invalid encrypted data format');
    }

    const iv = Buffer.from(parts[0], 'hex');
    const authTag = Buffer.from(parts[1], 'hex');
    const encrypted = parts[2];

    const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
    decipher.setAuthTag(authTag);

    let decrypted = decipher.update(encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');

    return decrypted;
  } catch (error) {
    console.error('Decryption error:', error);
    throw new Error('Failed to decrypt data');
  }
}

/**
 * Encrypt an object's sensitive fields
 * @param obj - Object containing sensitive data
 * @param fields - Array of field names to encrypt
 * @returns New object with specified fields encrypted
 */
export function encryptFields(obj: Record<string, any>, fields: string[]): Record<string, any> {
  const result = { ...obj };

  for (const field of fields) {
    if (result[field] && typeof result[field] === 'string') {
      result[field] = encrypt(result[field]);
    } else if (result[field] && typeof result[field] === 'object') {
      // If field is an object, encrypt as JSON string
      result[field] = encrypt(JSON.stringify(result[field]));
    }
  }

  return result;
}

/**
 * Decrypt an object's encrypted fields
 * @param obj - Object containing encrypted data
 * @param fields - Array of field names to decrypt
 * @returns New object with specified fields decrypted
 */
export function decryptFields(obj: Record<string, any>, fields: string[]): Record<string, any> {
  const result = { ...obj };

  for (const field of fields) {
    if (result[field] && typeof result[field] === 'string') {
      try {
        const decrypted = decrypt(result[field]);
        // Try to parse as JSON if it looks like JSON
        if (decrypted.startsWith('{') || decrypted.startsWith('[')) {
          try {
            result[field] = JSON.parse(decrypted);
          } catch {
            result[field] = decrypted;
          }
        } else {
          result[field] = decrypted;
        }
      } catch (error) {
        console.error(`Failed to decrypt field ${field}:`, error);
        // Leave field as-is if decryption fails (might be unencrypted legacy data)
      }
    }
  }

  return result;
}

/**
 * Generate a secure random encryption key
 * Use this to generate ENCRYPTION_KEY for production
 */
export function generateEncryptionKey(): string {
  return crypto.randomBytes(32).toString('hex');
}
