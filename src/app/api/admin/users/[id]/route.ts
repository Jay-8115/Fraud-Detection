import { NextResponse } from "next/server";
import { db } from "@/db";
import { usersTable, auditLogsTable } from "@/db";
import { eq } from "drizzle-orm";
import { getAuthenticatedUser } from "@/lib/auth";
import { formatUser } from "@/lib/format";
import { encrypt, decrypt } from "@/lib/crypto";

export async function PATCH(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  const user = await getAuthenticatedUser();
  if (!user || user.role !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const { id } = await context.params;
    const targetUserId = parseInt(id);
    const body = await request.json();
    const { isBlocked, role } = body;

    const [updated] = await db
      .update(usersTable)
      .set({
        isBlocked: isBlocked !== undefined ? Boolean(isBlocked) : undefined,
        role: role !== undefined ? role : undefined,
        updatedAt: new Date(),
      })
      .where(eq(usersTable.id, targetUserId))
      .returning();

    if (!updated) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    await db.insert(auditLogsTable).values({
      userId: user.id,
      userEmailEncrypted: encrypt(user.email),
      action: isBlocked !== undefined ? (isBlocked ? "block_user" : "unblock_user") : "update_user",
      resource: "user",
      resourceId: String(targetUserId),
      detailsEncrypted: encrypt(`Updated user ${decrypt(updated.emailEncrypted)}`),
    });

    return NextResponse.json(formatUser(updated));
  } catch (err) {
    console.error("updateAdminUser error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  const user = await getAuthenticatedUser();
  if (!user || user.role !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const { id } = await context.params;
    const targetUserId = parseInt(id);

    const targetUser = await db.query.usersTable.findFirst({ 
      where: eq(usersTable.id, targetUserId) 
    });
    if (!targetUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    await db.delete(usersTable).where(eq(usersTable.id, targetUser.id));
    return new Response(null, { status: 204 });
  } catch (err) {
    console.error("deleteAdminUser error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
