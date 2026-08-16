import { NextResponse } from "next/server";
import { db } from "@/db";
import { analysesTable } from "@/db";
import { eq, and, gte, desc } from "drizzle-orm";
import { getAuthenticatedUser } from "@/lib/auth";

export async function GET(request: Request) {
  const user = await getAuthenticatedUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const days = parseInt(searchParams.get("days") ?? "30");
    const since = new Date();
    since.setDate(since.getDate() - days);

    const analyses = await db.query.analysesTable.findMany({
      where: and(
        eq(analysesTable.userId, user.id),
        eq(analysesTable.status, "completed"),
        gte(analysesTable.createdAt, since)
      ),
      orderBy: [desc(analysesTable.createdAt)],
    });

    const byDate: Record<string, { fraudCount: number; legitimateCount: number; total: number }> = {};
    for (let i = 0; i < days; i++) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const key = d.toISOString().split("T")[0];
      byDate[key] = { fraudCount: 0, legitimateCount: 0, total: 0 };
    }

    for (const a of analyses) {
      const key = a.createdAt.toISOString().split("T")[0];
      if (byDate[key]) {
        byDate[key].fraudCount += a.fraudCount ?? 0;
        byDate[key].legitimateCount += a.legitimateCount ?? 0;
        byDate[key].total += a.totalTransactions ?? 0;
      }
    }

    const trends = Object.entries(byDate)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([date, stats]) => ({ date, ...stats }));

    return NextResponse.json(trends);
  } catch (err) {
    console.error("getFraudTrends error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
