import { Router, Response } from "express";
import { db } from "@workspace/db";
import { usersTable, uploadedFilesTable, analysesTable, reportsTable, auditLogsTable } from "@workspace/db";
import { eq, desc, count, ilike, and } from "drizzle-orm";
import { requireAdmin, type AuthRequest } from "../lib/auth";
import { formatUser } from "./users";

const router = Router();

// GET /api/admin/stats
router.get("/stats", requireAdmin, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const [usersResult, uploadsResult, analysesResult, reportsResult, allUsers, allAnalyses] = await Promise.all([
      db.select({ total: count() }).from(usersTable),
      db.select({ total: count() }).from(uploadedFilesTable),
      db.select({ total: count() }).from(analysesTable),
      db.select({ total: count() }).from(reportsTable),
      db.query.usersTable.findMany(),
      db.query.analysesTable.findMany({ where: eq(analysesTable.status, "completed") }),
    ]);

    const blockedUsers = allUsers.filter((u) => u.isBlocked).length;
    const activeUsers = allUsers.filter((u) => !u.isBlocked).length;
    const totalFraudDetected = allAnalyses.reduce((s, a) => s + (a.fraudCount ?? 0), 0);

    res.json({
      totalUsers: Number(usersResult[0]!.total),
      activeUsers,
      blockedUsers,
      totalUploads: Number(uploadsResult[0]!.total),
      totalAnalyses: Number(analysesResult[0]!.total),
      totalFraudDetected,
      totalReports: Number(reportsResult[0]!.total),
      storageUsedBytes: Number(uploadsResult[0]!.total) * 512000,
    });
  } catch (err) {
    req.log.error({ err }, "getAdminStats error");
    res.status(500).json({ error: "Internal server error" });
  }
});

// GET /api/admin/users
router.get("/users", requireAdmin, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const page = parseInt(String(req.query.page ?? "1"));
    const limit = parseInt(String(req.query.limit ?? "20"));
    const search = String(req.query.search ?? "");
    const status = String(req.query.status ?? "all");
    const offset = (page - 1) * limit;

    let where: any = undefined;
    if (search) where = ilike(usersTable.email, `%${search}%`);
    if (status === "active") where = where ? and(where, eq(usersTable.isBlocked, false)) : eq(usersTable.isBlocked, false);
    if (status === "blocked") where = where ? and(where, eq(usersTable.isBlocked, true)) : eq(usersTable.isBlocked, true);

    const [users, [{ total }]] = await Promise.all([
      db.query.usersTable.findMany({ where, orderBy: [desc(usersTable.createdAt)], limit, offset }),
      db.select({ total: count() }).from(usersTable).where(where),
    ]);

    res.json({ data: users.map(formatUser), total: Number(total), page, limit, totalPages: Math.ceil(Number(total) / limit) });
  } catch (err) {
    req.log.error({ err }, "listAdminUsers error");
    res.status(500).json({ error: "Internal server error" });
  }
});

// PATCH /api/admin/users/:id
router.patch("/users/:id", requireAdmin, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = parseInt(String(req.params['id']));
    const { isBlocked, role } = req.body;
    const [updated] = await db
      .update(usersTable)
      .set({
        isBlocked: isBlocked !== undefined ? Boolean(isBlocked) : undefined,
        role: role !== undefined ? role : undefined,
        updatedAt: new Date(),
      })
      .where(eq(usersTable.id, userId))
      .returning();
    if (!updated) { res.status(404).json({ error: "User not found" }); return; }

    await db.insert(auditLogsTable).values({
      userId: req.userId!,
      userEmail: req.userEmail!,
      action: isBlocked !== undefined ? (isBlocked ? "block_user" : "unblock_user") : "update_user",
      resource: "user",
      resourceId: String(userId),
      details: `Updated user ${updated.email}`,
      ipAddress: req.ip ?? null,
    });

    res.json(formatUser(updated));
  } catch (err) {
    req.log.error({ err }, "updateAdminUser error");
    res.status(500).json({ error: "Internal server error" });
  }
});

// DELETE /api/admin/users/:id
router.delete("/users/:id", requireAdmin, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = parseInt(String(req.params['id']));
    const user = await db.query.usersTable.findFirst({ where: eq(usersTable.id, userId) });
    if (!user) { res.status(404).json({ error: "User not found" }); return; }
    await db.delete(usersTable).where(eq(usersTable.id, user.id));
    res.status(204).send();
  } catch (err) {
    req.log.error({ err }, "deleteAdminUser error");
    res.status(500).json({ error: "Internal server error" });
  }
});

// GET /api/admin/analyses
router.get("/analyses", requireAdmin, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const page = parseInt(String(req.query.page ?? "1"));
    const limit = parseInt(String(req.query.limit ?? "20"));
    const offset = (page - 1) * limit;

    const [analyses, [{ total }]] = await Promise.all([
      db.query.analysesTable.findMany({ orderBy: [desc(analysesTable.createdAt)], limit, offset }),
      db.select({ total: count() }).from(analysesTable),
    ]);

    res.json({
      data: analyses.map((a) => ({
        id: String(a.id),
        userId: String(a.userId),
        fileId: String(a.fileId),
        fileName: a.fileName,
        modelName: a.modelName,
        status: a.status,
        totalTransactions: a.totalTransactions,
        fraudCount: a.fraudCount,
        legitimateCount: a.legitimateCount,
        fraudPercentage: a.fraudPercentage,
        riskBreakdown: a.riskBreakdown,
        metrics: a.metrics,
        aiSummary: a.aiSummary,
        featureImportance: a.featureImportance,
        errorMessage: a.errorMessage,
        createdAt: a.createdAt.toISOString(),
        completedAt: a.completedAt?.toISOString() ?? null,
      })),
      total: Number(total),
      page,
      limit,
      totalPages: Math.ceil(Number(total) / limit),
    });
  } catch (err) {
    req.log.error({ err }, "listAdminAnalyses error");
    res.status(500).json({ error: "Internal server error" });
  }
});

// GET /api/admin/audit-logs
router.get("/audit-logs", requireAdmin, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const page = parseInt(String(req.query.page ?? "1"));
    const limit = parseInt(String(req.query.limit ?? "50"));
    const filterUserId = req.query.userId ? parseInt(String(req.query.userId)) : null;
    const offset = (page - 1) * limit;

    const where = filterUserId ? eq(auditLogsTable.userId, filterUserId) : undefined;
    const [logs, [{ total }]] = await Promise.all([
      db.query.auditLogsTable.findMany({ where, orderBy: [desc(auditLogsTable.createdAt)], limit, offset }),
      db.select({ total: count() }).from(auditLogsTable).where(where),
    ]);

    res.json({
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
    req.log.error({ err }, "getAuditLogs error");
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
