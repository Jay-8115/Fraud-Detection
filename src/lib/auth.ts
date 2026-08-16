import { db } from "@/db";
import { usersTable } from "@/db";
import { eq } from "drizzle-orm";
import { cookies } from "next/headers";

export interface AuthenticatedUser {
  id: number;
  clerkId: string;
  email: string;
  name: string;
  role: "user" | "admin";
}

export async function getAuthenticatedUser(): Promise<AuthenticatedUser | null> {
  try {
    const cookieStore = await cookies();
    const sessionId = cookieStore.get("session_user_id")?.value;

    if (!sessionId) {
      return null;
    }

    const userId = parseInt(sessionId, 10);
    if (isNaN(userId)) {
      return null;
    }

    const user = await db.query.usersTable.findFirst({
      where: eq(usersTable.id, userId),
    });

    if (!user || user.isBlocked) {
      return null;
    }

    return {
      id: user.id,
      clerkId: user.clerkId,
      email: user.email,
      name: user.name,
      role: user.role as "user" | "admin",
    };
  } catch (err) {
    console.error("getAuthenticatedUser error:", err);
    return null;
  }
}

