import { NextResponse } from "next/server";
import { db } from "@/db";
import { usersTable } from "@/db";
import { eq } from "drizzle-orm";
import { cookies } from "next/headers";
import { 
  verifyPassword, 
  hashPassword, 
  isAccountLocked, 
  MAX_FAILED_ATTEMPTS, 
  LOCKOUT_DURATION_MINUTES 
} from "@/lib/security";

export async function POST(request: Request) {
  try {
    const { email, password } = await request.json();

    if (!email || !password) {
      return NextResponse.json({ error: "Email and password are required" }, { status: 400 });
    }

    const cleanEmail = email.toLowerCase().trim();

    // Look up user by email
    const user = await db.query.usersTable.findFirst({
      where: eq(usersTable.email, cleanEmail),
    });

    if (!user) {
      return NextResponse.json({ error: "Invalid email or password" }, { status: 401 });
    }

    // Check account lockout status
    const { isLocked, remainingMinutes } = isAccountLocked(user);
    if (isLocked) {
      return NextResponse.json(
        { error: `Account is temporarily locked due to multiple failed attempts. Please try again in ${remainingMinutes} minutes.` },
        { status: 429 }
      );
    }

    // Check if account is blocked by admin
    if (user.isBlocked) {
      return NextResponse.json({ error: "Account is blocked. Please contact support." }, { status: 403 });
    }

    // Verify password securely with scrypt
    const isValid = verifyPassword(password, user.password);

    if (!isValid) {
      const newAttempts = (user.failedLoginAttempts || 0) + 1;
      let lockoutUntil: Date | null = null;

      if (newAttempts >= MAX_FAILED_ATTEMPTS) {
        lockoutUntil = new Date(Date.now() + LOCKOUT_DURATION_MINUTES * 60 * 1000);
      }

      await db
        .update(usersTable)
        .set({
          failedLoginAttempts: newAttempts,
          lockoutUntil,
          updatedAt: new Date(),
        })
        .where(eq(usersTable.id, user.id));

      if (lockoutUntil) {
        return NextResponse.json(
          { error: `Account is temporarily locked for ${LOCKOUT_DURATION_MINUTES} minutes due to 5 consecutive failed attempts.` },
          { status: 429 }
        );
      }

      return NextResponse.json({ error: "Invalid email or password" }, { status: 401 });
    }

    // Password is valid - check for legacy plain-text auto-migration
    const updateData: Record<string, any> = {
      failedLoginAttempts: 0,
      lockoutUntil: null,
      lastLoginAt: new Date(),
      updatedAt: new Date(),
    };

    if (!user.password.includes(":")) {
      updateData.password = hashPassword(password);
      updateData.passwordChangedAt = new Date();
    }

    await db
      .update(usersTable)
      .set(updateData)
      .where(eq(usersTable.id, user.id));

    // Set secure session cookie
    const cookieStore = await cookies();
    cookieStore.set("session_user_id", String(user.id), {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24 * 30, // 30 days
    });

    return NextResponse.json({
      id: String(user.id),
      clerkId: user.clerkId,
      email: user.email,
      name: user.name,
      role: user.role,
    });
  } catch (err) {
    console.error("Login error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
