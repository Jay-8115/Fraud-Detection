"use server";

import { db } from "@/db";
import { usersTable } from "@/db";
import { eq } from "drizzle-orm";
import { encrypt, hashForLookup } from "@/lib/crypto";
import bcrypt from "bcryptjs";
import { createSession, invalidateSession } from "@/lib/auth";
import { redirect } from "next/navigation";

export async function loginAction(formData: FormData) {
  const email = formData.get("email")?.toString();
  const password = formData.get("password")?.toString();

  if (!email || !password) {
    return { error: "Email and password are required." };
  }

  const emailHmac = hashForLookup(email.toLowerCase()) || "";
  console.log("Login attempt:", { email: email.toLowerCase(), emailHmac });
  
  const user = await db.query.usersTable.findFirst({
    where: eq(usersTable.emailHmac, emailHmac),
  });

  console.log("User found:", user ? { id: user.id, emailHmac: user.emailHmac, hasPassword: !!user.password, passwordLength: user.password?.length } : null);

  // Return generic error if user not found or no password hash exists
  if (!user || !user.password) {
    return { error: "Invalid email or password." };
  }

  const isValid = await bcrypt.compare(password, user.password);

  if (!isValid) {
    return { error: "Invalid email or password." };
  }

  if (user.isBlocked) {
    return { error: "Account is blocked. Please contact support." };
  }

  await createSession(user.id);
  
  db.update(usersTable)
    .set({ lastLoginAt: new Date() })
    .where(eq(usersTable.id, user.id))
    .execute()
    .catch(console.error);

  if (user.role === "admin") {
    return { success: true, redirectUrl: "/admin" };
  } else {
    return { success: true, redirectUrl: "/dashboard" };
  }
}

export async function signupAction(formData: FormData) {
  const name = formData.get("name")?.toString();
  const email = formData.get("email")?.toString();
  const password = formData.get("password")?.toString();

  if (!name || !email || !password) {
    return { error: "All fields are required." };
  }

  if (password.length < 8) {
    return { error: "Password must be at least 8 characters." };
  }

  const emailLower = email.toLowerCase();
  const emailHmac = hashForLookup(emailLower) || "";
  const emailEnc = encrypt(emailLower);

  const existingUser = await db.query.usersTable.findFirst({
    where: eq(usersTable.emailHmac, emailHmac),
  });

  if (existingUser) {
    // If they exist but have no password (legacy sync row), they should use a password reset.
    // For safety, we just return a generic error or tell them they already have an account.
    if (!existingUser.password) {
      return { error: "Account exists but requires password setup. Contact admin." };
    }
    return { error: "Email is already registered." };
  }

  const hashedPassword = await bcrypt.hash(password, 10);

  const inserted = await db.insert(usersTable).values({
    name,
    emailHmac,
    emailEncrypted: emailEnc,
    password: hashedPassword,
    role: "user",
  }).returning();

  const user = inserted[0];
  await createSession(user.id);

  return { success: true, redirectUrl: "/dashboard" };
}

export async function logoutAction() {
  await invalidateSession();
  return { success: true, redirectUrl: "/sign-in" };
}
