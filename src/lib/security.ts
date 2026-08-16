import crypto from "crypto";
import { User } from "@/db/schema/users";

export const MAX_FAILED_ATTEMPTS = 5;
export const LOCKOUT_DURATION_MINUTES = 15;

/**
 * Salt and hash password using scrypt (Node.js crypto).
 * Output format: <salt_hex>:<hash_hex>
 */
export function hashPassword(password: string): string {
  const salt = crypto.randomBytes(16).toString("hex");
  const hash = crypto.scryptSync(password, salt, 64).toString("hex");
  return `${salt}:${hash}`;
}

/**
 * Timing-safe password verification with legacy plaintext support.
 */
export function verifyPassword(password: string, combinedHash: string): boolean {
  if (!combinedHash) return false;

  // Legacy plaintext support during migration
  if (!combinedHash.includes(":")) {
    return password === combinedHash;
  }

  try {
    const [salt, storedHash] = combinedHash.split(":");
    if (!salt || !storedHash) return false;

    const hash = crypto.scryptSync(password, salt, 64).toString("hex");
    const storedHashBuf = Buffer.from(storedHash, "hex");
    const hashBuf = Buffer.from(hash, "hex");

    if (storedHashBuf.length !== hashBuf.length) {
      return false;
    }

    return crypto.timingSafeEqual(storedHashBuf, hashBuf);
  } catch (err) {
    console.error("verifyPassword error:", err);
    return false;
  }
}

/**
 * Check if a user account is currently locked out due to failed login attempts.
 */
export function isAccountLocked(user: { lockoutUntil?: Date | null }): { isLocked: boolean; remainingMinutes: number } {
  if (!user.lockoutUntil) {
    return { isLocked: false, remainingMinutes: 0 };
  }

  const now = new Date();
  const lockoutTime = new Date(user.lockoutUntil);

  if (now < lockoutTime) {
    const diffMs = lockoutTime.getTime() - now.getTime();
    const remainingMinutes = Math.ceil(diffMs / (60 * 1000));
    return { isLocked: true, remainingMinutes };
  }

  return { isLocked: false, remainingMinutes: 0 };
}

/**
 * Remove sensitive credentials and security hashes from user data objects.
 */
export function sanitizeUser<T extends Record<string, any>>(user: T): Omit<T, "password" | "failedLoginAttempts" | "lockoutUntil"> {
  const { password, failedLoginAttempts, lockoutUntil, ...sanitized } = user;
  return sanitized;
}
