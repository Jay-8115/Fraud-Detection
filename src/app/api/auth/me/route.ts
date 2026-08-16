import { NextResponse } from "next/server";
import { db } from "@/db";
import { usersTable } from "@/db";
import { eq } from "drizzle-orm";
import { cookies } from "next/headers";

export async function GET() {
  try {
    const cookieStore = await cookies();
    const sessionId = cookieStore.get("session_user_id")?.value;

    if (!sessionId) {
      return NextResponse.json({ user: null });
    }

    const userId = parseInt(sessionId, 10);
    if (isNaN(userId)) {
      return NextResponse.json({ user: null });
    }

    const user = await db.query.usersTable.findFirst({
      where: eq(usersTable.id, userId),
    });

    if (!user || user.isBlocked) {
      return NextResponse.json({ user: null });
    }

    return NextResponse.json({
      user: {
        id: String(user.id),
        clerkId: user.clerkId,
        email: user.email,
        name: user.name,
        role: user.role,
      },
    });
  } catch (err) {
    console.error("Auth me error:", err);
    return NextResponse.json({ user: null });
  }
}
