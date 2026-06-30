import { Router, Response } from "express";
import { db } from "@workspace/db";
import { reportsTable, analysesTable, auditLogsTable } from "@workspace/db";
import { eq, and, desc, count } from "drizzle-orm";
import { requireAuth, type AuthRequest } from "../lib/auth";

const router = Router();

// GET /api/reports
router.get("/", requireAuth, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const page = parseInt(String(req.query.page ?? "1"));
    const limit = parseInt(String(req.query.limit ?? "20"));
    const offset = (page - 1) * limit;

    const where = eq(reportsTable.userId, req.userId!);
    const [reports, [{ total }]] = await Promise.all([
      db.query.reportsTable.findMany({ where, orderBy: [desc(reportsTable.createdAt)], limit, offset }),
      db.select({ total: count() }).from(reportsTable).where(where),
    ]);

    res.json({ data: reports.map(formatReport), total: Number(total), page, limit, totalPages: Math.ceil(Number(total) / limit) });
  } catch (err) {
    req.log.error({ err }, "listReports error");
    res.status(500).json({ error: "Internal server error" });
  }
});

// POST /api/reports
router.post("/", requireAuth, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { analysisId } = req.body;
    if (!analysisId) { res.status(400).json({ error: "analysisId is required" }); return; }

    const analysis = await db.query.analysesTable.findFirst({
      where: and(eq(analysesTable.id, parseInt(analysisId)), eq(analysesTable.userId, req.userId!)),
    });
    if (!analysis) { res.status(404).json({ error: "Analysis not found" }); return; }
    if (analysis.status !== "completed") { res.status(400).json({ error: "Analysis not completed yet" }); return; }

    const fileName = `FraudWatch_Report_${analysis.fileName.replace(/\.[^.]+$/, "")}_${Date.now()}.txt`;
    const downloadUrl = `/api/reports/download/${analysis.id}`;

    const [report] = await db
      .insert(reportsTable)
      .values({ userId: req.userId!, analysisId: analysis.id, fileName, downloadUrl })
      .returning();

    await db.insert(auditLogsTable).values({
      userId: req.userId!,
      userEmail: req.userEmail!,
      action: "generate_report",
      resource: "report",
      resourceId: String(report.id),
      details: `Generated report for ${analysis.fileName}`,
      ipAddress: req.ip ?? null,
    });

    res.status(201).json(formatReport(report));
  } catch (err) {
    req.log.error({ err }, "generateReport error");
    res.status(500).json({ error: "Internal server error" });
  }
});

// GET /api/reports/download/:analysisId
router.get("/download/:analysisId", requireAuth, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const aId = parseInt(String(req.params['analysisId']));
    const analysis = await db.query.analysesTable.findFirst({
      where: and(eq(analysesTable.id, aId), eq(analysesTable.userId, req.userId!)),
    });
    if (!analysis) { res.status(404).json({ error: "Analysis not found" }); return; }

    const content = generateTextReport(analysis);
    res.setHeader("Content-Type", "text/plain");
    res.setHeader("Content-Disposition", `attachment; filename="FraudWatch_Report_${analysis.id}.txt"`);
    res.send(content);
  } catch (err) {
    req.log.error({ err }, "downloadReport error");
    res.status(500).json({ error: "Internal server error" });
  }
});

// GET /api/reports/:id
router.get("/:id", requireAuth, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const rId = parseInt(String(req.params['id']));
    const report = await db.query.reportsTable.findFirst({
      where: and(eq(reportsTable.id, rId), eq(reportsTable.userId, req.userId!)),
    });
    if (!report) { res.status(404).json({ error: "Report not found" }); return; }
    res.json(formatReport(report));
  } catch (err) {
    req.log.error({ err }, "getReport error");
    res.status(500).json({ error: "Internal server error" });
  }
});

// DELETE /api/reports/:id
router.delete("/:id", requireAuth, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const rId = parseInt(String(req.params['id']));
    const report = await db.query.reportsTable.findFirst({
      where: and(eq(reportsTable.id, rId), eq(reportsTable.userId, req.userId!)),
    });
    if (!report) { res.status(404).json({ error: "Report not found" }); return; }
    await db.delete(reportsTable).where(eq(reportsTable.id, report.id));
    res.status(204).send();
  } catch (err) {
    req.log.error({ err }, "deleteReport error");
    res.status(500).json({ error: "Internal server error" });
  }
});

function formatReport(r: typeof reportsTable.$inferSelect) {
  return {
    id: String(r.id),
    userId: String(r.userId),
    analysisId: String(r.analysisId),
    fileName: r.fileName,
    downloadUrl: r.downloadUrl,
    createdAt: r.createdAt.toISOString(),
  };
}

function generateTextReport(analysis: typeof analysesTable.$inferSelect): string {
  return [
    "================================================================",
    "          FRAUDWATCH - FRAUD DETECTION ANALYSIS REPORT",
    "================================================================",
    "",
    `Report Generated: ${new Date().toISOString()}`,
    `Analysis ID: ${analysis.id}`,
    `Dataset: ${analysis.fileName}`,
    `Model: ${analysis.modelName}`,
    "",
    "--- TRANSACTION SUMMARY ---",
    `Total Transactions: ${analysis.totalTransactions ?? "N/A"}`,
    `Fraud Detected: ${analysis.fraudCount ?? "N/A"} (${analysis.fraudPercentage?.toFixed(2) ?? "N/A"}%)`,
    `Legitimate: ${analysis.legitimateCount ?? "N/A"}`,
    "",
    "--- RISK BREAKDOWN ---",
    `Critical Risk: ${analysis.riskBreakdown?.critical ?? 0}`,
    `High Risk: ${analysis.riskBreakdown?.high ?? 0}`,
    `Medium Risk: ${analysis.riskBreakdown?.medium ?? 0}`,
    `Low Risk: ${analysis.riskBreakdown?.low ?? 0}`,
    "",
    "--- MODEL PERFORMANCE ---",
    `Accuracy: ${((analysis.metrics?.accuracy ?? 0) * 100).toFixed(2)}%`,
    `Precision: ${((analysis.metrics?.precision ?? 0) * 100).toFixed(2)}%`,
    `Recall: ${((analysis.metrics?.recall ?? 0) * 100).toFixed(2)}%`,
    `F1 Score: ${((analysis.metrics?.f1Score ?? 0) * 100).toFixed(2)}%`,
    `ROC-AUC: ${((analysis.metrics?.rocAuc ?? 0) * 100).toFixed(2)}%`,
    "",
    "--- AI SUMMARY ---",
    analysis.aiSummary ?? "No AI summary available.",
    "",
    "================================================================",
    "                    END OF REPORT",
    "================================================================",
  ].join("\n");
}

export default router;
