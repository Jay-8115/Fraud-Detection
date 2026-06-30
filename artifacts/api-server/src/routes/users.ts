import { Router, Request, Response } from "express";
import { db } from "@workspace/db";
import { usersTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { requireAuth, type AuthRequest } from "../lib/auth";

const router = Router();

// GET /api/users/me
router.get("/me", requireAuth, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const user = await db.query.usersTable.findFirst({ where: eq(usersTable.id, req.userId!) });
    if (!user) { res.status(404).json({ error: "User not found" }); return; }
    res.json(formatUser(user));
  } catch (err) {
    req.log.error({ err }, "getMe error");
    res.status(500).json({ error: "Internal server error" });
  }
});

// PATCH /api/users/me
router.patch("/me", requireAuth, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { name } = req.body;
    const [updated] = await db
      .update(usersTable)
      .set({ name: name ?? undefined, updatedAt: new Date() })
      .where(eq(usersTable.id, req.userId!))
      .returning();
    res.json(formatUser(updated));
  } catch (err) {
    req.log.error({ err }, "updateMe error");
    res.status(500).json({ error: "Internal server error" });
  }
});

// DELETE /api/users/me
router.delete("/me", requireAuth, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    await db.delete(usersTable).where(eq(usersTable.id, req.userId!));
    res.status(204).send();
  } catch (err) {
    req.log.error({ err }, "deleteMe error");
    res.status(500).json({ error: "Internal server error" });
  }
});

export function formatUser(user: typeof usersTable.$inferSelect) {
  return {
    id: String(user.id),
    clerkId: user.clerkId,
    email: user.email,
    name: user.name,
    role: user.role,
    isBlocked: user.isBlocked,
    totalUploads: user.totalUploads,
    totalAnalyses: user.totalAnalyses,
    lastLoginAt: user.lastLoginAt?.toISOString() ?? null,
    createdAt: user.createdAt.toISOString(),
  };
}

export default router;
