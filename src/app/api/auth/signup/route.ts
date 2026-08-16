import { NextResponse } from "next/server";
import { db } from "@/db";
import { usersTable } from "@/db";
import { eq } from "drizzle-orm";
import { cookies } from "next/headers";
import { hashPassword } from "@/lib/security";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    const { name, email, password } = await request.json();

    if (!name || !email || !password) {
      return NextResponse.json({ error: "Name, email, and password are required" }, { status: 400 });
    }

    if (typeof password !== "string" || password.length < 8) {
      return NextResponse.json({ error: "Password must be at least 8 characters long" }, { status: 400 });
    }

    const cleanEmail = email.toLowerCase().trim();

    // Check if user already exists
    const existing = await db.query.usersTable.findFirst({
      where: eq(usersTable.email, cleanEmail),
    });

    if (existing) {
      return NextResponse.json({ error: "An account with this email already exists" }, { status: 409 });
    }

    // Hash password securely with salt
    const hashedPassword = hashPassword(password);
    const clerkId = `user_${Date.now()}`;
    const [newUser] = await db
      .insert(usersTable)
      .values({
        clerkId,
        email: cleanEmail,
        name: name.trim(),
        password: hashedPassword,
        role: "user",
        isBlocked: false,
        failedLoginAttempts: 0,
        passwordChangedAt: new Date(),
      })
      .returning();

    // Set secure session cookie
    const cookieStore = await cookies();
    cookieStore.set("session_user_id", String(newUser.id), {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24 * 30, // 30 days
    });

    return NextResponse.json({
      id: String(newUser.id),
      clerkId: newUser.clerkId,
      email: newUser.email,
      name: newUser.name,
      role: newUser.role,
    });
  } catch (err) {
    console.error("Signup error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
