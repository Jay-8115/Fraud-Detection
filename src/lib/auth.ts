import { db } from "@/db";
import { usersTable } from "@/db";
import { sessionsTable } from "@/db/schema/sessions";
import { eq } from "drizzle-orm";
import { encrypt, decrypt, hashForLookup } from "@/lib/crypto";
import { cookies } from "next/headers";
import crypto from "crypto";

export interface AuthenticatedUser {
  id: number;
  email: string;
  name: string;
  role: "user" | "admin";
}

const SESSION_COOKIE_NAME = "session_token";

function hashToken(token: string): string {
  return crypto.createHash("sha256").update(token).digest("hex");
}

export async function getAuthenticatedUser(): Promise<AuthenticatedUser | null> {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get(SESSION_COOKIE_NAME)?.value;

    if (!token) {
      return null;
    }

    const tokenHash = hashToken(token);
    
    // Find session in database
    const session = await db.query.sessionsTable.findFirst({
      where: eq(sessionsTable.tokenHash, tokenHash),
    });

    if (!session || session.expiresAt < new Date()) {
      return null;
    }

    // Update lastUsedAt if more than 1 hour passed
    if (new Date().getTime() - session.lastUsedAt.getTime() > 1000 * 60 * 60) {
      db.update(sessionsTable)
        .set({ lastUsedAt: new Date() })
        .where(eq(sessionsTable.id, session.id))
        .execute()
        .catch(err => console.error("Failed to update session lastUsedAt"));
    }

    const user = await db.query.usersTable.findFirst({
      where: eq(usersTable.id, session.userId),
    });

    if (!user || user.isBlocked) {
      return null;
    }

    return {
      id: user.id,
      email: decrypt(user.emailEncrypted) || "Unknown",
      name: user.name || "Unknown",
      role: user.role as "user" | "admin",
    };
  } catch (err: any) {
    if (err && err.digest === 'DYNAMIC_SERVER_USAGE') {
      throw err;
    }
    console.error("Authentication check error:", err);
    return null;
  }
}

export async function createSession(userId: number): Promise<void> {
  const tokenBytes = crypto.randomBytes(32);
  const token = tokenBytes.toString("hex");
  const tokenHash = hashToken(token);
  const expiresAt = new Date(Date.now() + 1000 * 60 * 60 * 24 * 7); // 7 days

  await db.insert(sessionsTable).values({
    tokenHash,
    userId,
    expiresAt,
  });

  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    expires: expiresAt,
  });
}

export async function invalidateSession(): Promise<void> {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get(SESSION_COOKIE_NAME)?.value;

    if (token) {
      const tokenHash = hashToken(token);
      await db.delete(sessionsTable).where(eq(sessionsTable.tokenHash, tokenHash));
    }
  } catch (err) {
    console.error("Failed to invalidate session", err);
  } finally {
    const cookieStore = await cookies();
    cookieStore.delete(SESSION_COOKIE_NAME);
  }
}
