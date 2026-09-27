import "server-only";
import crypto from "crypto";

const ALGORITHM = "aes-256-gcm";
const IV_LENGTH = 12;
const SALT_LENGTH = 64;
const TAG_LENGTH = 16;
const TAG_POSITION = IV_LENGTH + SALT_LENGTH;

function getEncryptionKey(): Buffer {
  const keyHex = process.env.ENCRYPTION_KEY;
  if (!keyHex) {
    throw new Error("ENCRYPTION_KEY environment variable is missing.");
  }
  const key = Buffer.from(keyHex, "hex");
  if (key.length !== 32) {
    throw new Error("ENCRYPTION_KEY must be a 64-character hex string (32 bytes).");
  }
  return key;
}

function getHmacKey(): string {
  const key = process.env.HMAC_KEY;
  if (!key) {
    throw new Error("HMAC_KEY environment variable is missing.");
  }
  return key;
}

/**
 * Encrypts a string using AES-256-GCM.
 * Returns a hex string in the format: iv:authTag:ciphertext
 */
export function encrypt(text: string): string | null {
  if (!text) return null;
  const key = getEncryptionKey();
  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv);
  
  let encrypted = cipher.update(text, "utf8", "hex");
  encrypted += cipher.final("hex");
  const authTag = cipher.getAuthTag().toString("hex");
  
  return `${iv.toString("hex")}:${authTag}:${encrypted}`;
}

/**
 * Decrypts a string that was encrypted with `encrypt`.
 */
export function decrypt(encryptedData: string | null | undefined): string | null {
  if (!encryptedData) return null;
  try {
    const key = getEncryptionKey();
    const parts = encryptedData.split(":");
    if (parts.length !== 3) throw new Error("Invalid encrypted data format");
    
    const iv = Buffer.from(parts[0], "hex");
    const authTag = Buffer.from(parts[1], "hex");
    const ciphertext = parts[2];
    
    const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
    decipher.setAuthTag(authTag);
    
    let decrypted = decipher.update(ciphertext, "hex", "utf8");
    decrypted += decipher.final("utf8");
    return decrypted;
  } catch (error) {
    console.error("Decryption failed:", error);
    return null; // Return null on decryption failure (e.g. key rotation mismatch or tampering)
  }
}

/**
 * Creates a stable HMAC SHA-256 hash for exact-match lookups (e.g. email, clerkId).
 */
export function hashForLookup(text: string): string | null {
  if (!text) return null;
  const hmac = crypto.createHmac("sha256", getHmacKey());
  hmac.update(text.toLowerCase().trim());
  return hmac.digest("hex");
}

/**
 * Partially masks an email address for safe client-side display.
 * e.g., "j***@example.com"
 */
export function maskEmail(email: string | null): string | null {
  if (!email) return null;
  const [local, domain] = email.split("@");
  if (!domain) return email;
  const maskedLocal = local.length > 1 ? `${local[0]}***` : "***";
  return `${maskedLocal}@${domain}`;
}

/**
 * Partially masks a transaction ID or generic string.
 */
export function maskString(text: string | null): string | null {
  if (!text) return null;
  if (text.length <= 4) return "***";
  return `${text.slice(0, 2)}***${text.slice(-2)}`;
}
