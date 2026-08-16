import { NextResponse } from "next/server";
import { db } from "@/db";
import { analysesTable, uploadedFilesTable, reportsTable } from "@/db";
import { eq, and, count } from "drizzle-orm";
import { getAuthenticatedUser } from "@/lib/auth";

export async function GET() {
  const user = await getAuthenticatedUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const userId = user.id;

    const [filesResult, analysesResult, reportsResult, completedAnalyses] = await Promise.all([
      db.select({ total: count() }).from(uploadedFilesTable).where(eq(uploadedFilesTable.userId, userId)),
      db.select({ total: count() }).from(analysesTable).where(eq(analysesTable.userId, userId)),
      db.select({ total: count() }).from(reportsTable).where(eq(reportsTable.userId, userId)),
      db.query.analysesTable.findMany({
        where: and(eq(analysesTable.userId, userId), eq(analysesTable.status, "completed"))
      }),
    ]);

    const totalTransactions = completedAnalyses.reduce((s, a) => s + (a.totalTransactions ?? 0), 0);
    const totalFraud = completedAnalyses.reduce((s, a) => s + (a.fraudCount ?? 0), 0);
    const totalLegitimate = completedAnalyses.reduce((s, a) => s + (a.legitimateCount ?? 0), 0);
    const highRiskCount = completedAnalyses.reduce((s, a) => s + (a.riskBreakdown?.high ?? 0) + (a.riskBreakdown?.critical ?? 0), 0);
    const fraudPercentage = totalTransactions > 0 ? (totalFraud / totalTransactions) * 100 : 0;
    const lastAnalysis = [...completedAnalyses].sort((a, b) => {
      const aTime = a.createdAt?.getTime() ?? 0;
      const bTime = b.createdAt?.getTime() ?? 0;
      return bTime - aTime;
    })[0];

    return NextResponse.json({
      totalFiles: Number(filesResult[0]?.total ?? 0),
      totalTransactions,
      totalFraud,
      totalLegitimate,
      fraudPercentage: parseFloat(fraudPercentage.toFixed(2)),
      highRiskCount,
      lastAnalysisAt: lastAnalysis?.completedAt?.toISOString() ?? null,
      totalReports: Number(reportsResult[0]?.total ?? 0),
    });
  } catch (err) {
    console.error("getDashboardStats error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
