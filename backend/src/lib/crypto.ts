import { createCipheriv, createDecipheriv, randomBytes, scryptSync } from 'crypto';
import config from '../config/index.js';

const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 16;

function getKey(): Buffer {
  const secret = config.encryptionKey;
  if (!secret) {
    throw new Error('ENCRYPTION_KEY environment variable is required');
  }
  return scryptSync(secret, 'picknpack-salt', 32);
}

/**
 * Encrypt a plaintext string.
 * Returns: iv:encrypted:authTag (hex encoded, colon-separated)
 */
export function encrypt(text: string): string {
  if (!text) return text;
  const key = getKey();
  const iv = randomBytes(IV_LENGTH);
  const cipher = createCipheriv(ALGORITHM, key, iv);
  let encrypted = cipher.update(text, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  const tag = cipher.getAuthTag().toString('hex');
  return `${iv.toString('hex')}:${encrypted}:${tag}`;
}

/**
 * Decrypt a string encrypted with encrypt().
 */
export function decrypt(encryptedText: string): string {
  if (!encryptedText) return encryptedText;
  // If it doesn't look encrypted (no colons), return as-is (legacy plain text)
  if (!encryptedText.includes(':')) return encryptedText;
  const key = getKey();
  const [ivHex, encrypted, tagHex] = encryptedText.split(':');
  const iv = Buffer.from(ivHex, 'hex');
  const tag = Buffer.from(tagHex, 'hex');
  const decipher = createDecipheriv(ALGORITHM, key, iv);
  decipher.setAuthTag(tag);
  let decrypted = decipher.update(encrypted, 'hex', 'utf8');
  decrypted += decipher.final('utf8');
  return decrypted;
}
