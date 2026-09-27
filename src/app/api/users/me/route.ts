import { NextResponse } from "next/server";
import { db } from "@/db";
import { usersTable } from "@/db";
import { eq } from "drizzle-orm";
import { getAuthenticatedUser } from "@/lib/auth";
import { encrypt, decrypt } from "@/lib/crypto";

export async function GET() {
  const user = await getAuthenticatedUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Get full db user info
  const dbUser = await db.query.usersTable.findFirst({
    where: eq(usersTable.id, user.id),
  });

  if (!dbUser) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  return NextResponse.json({
    id: String(dbUser.id),
    clerkId: decrypt(dbUser.clerkIdEncrypted) || "Unknown",
    email: decrypt(dbUser.emailEncrypted) || "Unknown",
    name: dbUser.name || "Unknown",
    role: dbUser.role,
    isBlocked: dbUser.isBlocked,
    totalUploads: dbUser.totalUploads,
    totalAnalyses: dbUser.totalAnalyses,
    lastLoginAt: dbUser.lastLoginAt?.toISOString() ?? null,
    createdAt: dbUser.createdAt.toISOString(),
  });
}

export async function PATCH(request: Request) {
  const user = await getAuthenticatedUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { name } = await request.json();
    const [updatedUser] = await db
      .update(usersTable)
      .set({ name: name ? name : undefined, updatedAt: new Date() })
      .where(eq(usersTable.id, user.id))
      .returning();

    if (!updatedUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    return NextResponse.json({
      id: String(updatedUser.id),
      clerkId: decrypt(updatedUser.clerkIdEncrypted) || "Unknown",
      email: decrypt(updatedUser.emailEncrypted) || "Unknown",
      name: updatedUser.name || "Unknown",
      role: updatedUser.role,
      isBlocked: updatedUser.isBlocked,
      totalUploads: updatedUser.totalUploads,
      totalAnalyses: updatedUser.totalAnalyses,
      lastLoginAt: updatedUser.lastLoginAt?.toISOString() ?? null,
      createdAt: updatedUser.createdAt.toISOString(),
    });
  } catch (err) {
    return NextResponse.json({ error: "Bad request" }, { status: 400 });
  }
}

export async function DELETE() {
  const user = await getAuthenticatedUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  await db.delete(usersTable).where(eq(usersTable.id, user.id));
  return new Response(null, { status: 204 });
}
