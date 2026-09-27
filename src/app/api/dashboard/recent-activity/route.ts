import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { auditLogsTable } from "@/db";
import { eq, desc } from "drizzle-orm";
import { getAuthenticatedUser } from "@/lib/auth";
import { decrypt } from "@/lib/crypto";

export async function GET(req: NextRequest) {
  const user = await getAuthenticatedUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const limitParam = searchParams.get("limit");
  const limit = limitParam ? parseInt(limitParam, 10) : 50;

  try {
    const logs = await db.query.auditLogsTable.findMany({
      where: eq(auditLogsTable.userId, user.id),
      orderBy: [desc(auditLogsTable.createdAt)],
      limit: isNaN(limit) ? 50 : limit,
    });

    return NextResponse.json(
      logs.map((l) => ({
        id: String(l.id),
        type: l.action as "upload" | "analysis" | "report" | "login",
        description: (l.detailsEncrypted ? decrypt(l.detailsEncrypted) : null) ?? l.action,
        createdAt: l.createdAt.toISOString(),
      }))
    );
  } catch (err) {
    console.error("getRecentActivity error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
