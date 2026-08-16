import { NextResponse } from "next/server";
import { db } from "@/db";
import { auditLogsTable } from "@/db";
import { eq, desc, count } from "drizzle-orm";
import { getAuthenticatedUser } from "@/lib/auth";

export async function GET(request: Request) {
  const user = await getAuthenticatedUser();
  if (!user || user.role !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") ?? "1");
    const limit = parseInt(searchParams.get("limit") ?? "50");
    const filterUserId = searchParams.get("userId") ? parseInt(searchParams.get("userId")!) : null;
    const offset = (page - 1) * limit;

    const where = filterUserId && !isNaN(filterUserId) ? eq(auditLogsTable.userId, filterUserId) : undefined;
    const [logs, [{ total }]] = await Promise.all([
      db.query.auditLogsTable.findMany({ 
        where, 
        orderBy: [desc(auditLogsTable.createdAt)], 
        limit, 
        offset 
      }),
      db.select({ total: count() }).from(auditLogsTable).where(where),
    ]);

    return NextResponse.json({
      data: logs.map((l) => ({
        id: String(l.id),
        userId: String(l.userId),
        userEmail: l.userEmail,
        action: l.action,
        resource: l.resource,
        resourceId: l.resourceId,
        details: l.details,
        ipAddress: l.ipAddress,
        createdAt: l.createdAt.toISOString(),
      })),
      total: Number(total),
      page,
      limit,
      totalPages: Math.ceil(Number(total) / limit),
    });
  } catch (err) {
    console.error("getAuditLogs error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
