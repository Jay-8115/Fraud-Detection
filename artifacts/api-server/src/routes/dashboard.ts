import { Router, Response } from "express";
import { db } from "@workspace/db";
import { analysesTable, uploadedFilesTable, reportsTable, auditLogsTable } from "@workspace/db";
import { eq, and, desc, count, gte } from "drizzle-orm";
import { requireAuth, type AuthRequest } from "../lib/auth";

const router = Router();

// GET /api/dashboard/stats
router.get("/stats", requireAuth, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.userId!;

    const [filesResult, analysesResult, reportsResult, completedAnalyses] = await Promise.all([
      db.select({ total: count() }).from(uploadedFilesTable).where(eq(uploadedFilesTable.userId, userId)),
      db.select({ total: count() }).from(analysesTable).where(eq(analysesTable.userId, userId)),
      db.select({ total: count() }).from(reportsTable).where(eq(reportsTable.userId, userId)),
      db.query.analysesTable.findMany({ where: and(eq(analysesTable.userId, userId), eq(analysesTable.status, "completed")) }),
    ]);

    const totalTransactions = completedAnalyses.reduce((s, a) => s + (a.totalTransactions ?? 0), 0);
    const totalFraud = completedAnalyses.reduce((s, a) => s + (a.fraudCount ?? 0), 0);
    const totalLegitimate = completedAnalyses.reduce((s, a) => s + (a.legitimateCount ?? 0), 0);
    const highRiskCount = completedAnalyses.reduce((s, a) => s + (a.riskBreakdown?.high ?? 0) + (a.riskBreakdown?.critical ?? 0), 0);
    const fraudPercentage = totalTransactions > 0 ? (totalFraud / totalTransactions) * 100 : 0;
    const lastAnalysis = [...completedAnalyses].sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())[0];

    res.json({
      totalFiles: Number(filesResult[0]!.total),
      totalTransactions,
      totalFraud,
      totalLegitimate,
      fraudPercentage: parseFloat(fraudPercentage.toFixed(2)),
      highRiskCount,
      lastAnalysisAt: lastAnalysis?.completedAt?.toISOString() ?? null,
      totalReports: Number(reportsResult[0]!.total),
    });
  } catch (err) {
    req.log.error({ err }, "getDashboardStats error");
    res.status(500).json({ error: "Internal server error" });
  }
});

// GET /api/dashboard/fraud-trends
router.get("/fraud-trends", requireAuth, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const days = parseInt(String(req.query.days ?? "30"));
    const since = new Date();
    since.setDate(since.getDate() - days);

    const analyses = await db.query.analysesTable.findMany({
      where: and(eq(analysesTable.userId, req.userId!), eq(analysesTable.status, "completed"), gte(analysesTable.createdAt, since)),
      orderBy: [desc(analysesTable.createdAt)],
    });

    const byDate: Record<string, { fraudCount: number; legitimateCount: number; total: number }> = {};
    for (let i = 0; i < days; i++) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const key = d.toISOString().split("T")[0]!;
      byDate[key] = { fraudCount: 0, legitimateCount: 0, total: 0 };
    }

    for (const a of analyses) {
      const key = a.createdAt.toISOString().split("T")[0]!;
      if (byDate[key]) {
        byDate[key]!.fraudCount += a.fraudCount ?? 0;
        byDate[key]!.legitimateCount += a.legitimateCount ?? 0;
        byDate[key]!.total += a.totalTransactions ?? 0;
      }
    }

    const trends = Object.entries(byDate)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([date, stats]) => ({ date, ...stats }));

    res.json(trends);
  } catch (err) {
    req.log.error({ err }, "getFraudTrends error");
    res.status(500).json({ error: "Internal server error" });
  }
});

// GET /api/dashboard/recent-activity
router.get("/recent-activity", requireAuth, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const logs = await db.query.auditLogsTable.findMany({
      where: eq(auditLogsTable.userId, req.userId!),
      orderBy: [desc(auditLogsTable.createdAt)],
      limit: 10,
    });

    res.json(
      logs.map((l) => ({
        id: String(l.id),
        type: l.action as "upload" | "analysis" | "report" | "login",
        description: l.details ?? l.action,
        createdAt: l.createdAt.toISOString(),
      })),
    );
  } catch (err) {
    req.log.error({ err }, "getRecentActivity error");
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
