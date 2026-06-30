import { Router, Response } from "express";
import { db } from "@workspace/db";
import { chatMessagesTable, analysesTable } from "@workspace/db";
import { eq, and, desc } from "drizzle-orm";
import { requireAuth, type AuthRequest } from "../lib/auth";
import { generateChatResponse } from "../lib/gemini";

const router = Router();

// POST /api/chat/messages
router.post("/messages", requireAuth, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { message, analysisId } = req.body;
    if (!message) { res.status(400).json({ error: "message is required" }); return; }

    const [userMsg] = await db
      .insert(chatMessagesTable)
      .values({ userId: req.userId!, analysisId: analysisId ? parseInt(analysisId) : null, role: "user", content: message })
      .returning();

    let analysisContext: string | null = null;
    if (analysisId) {
      const analysis = await db.query.analysesTable.findFirst({
        where: and(eq(analysesTable.id, parseInt(analysisId)), eq(analysesTable.userId, req.userId!)),
      });
      if (analysis) {
        analysisContext = `File: ${analysis.fileName}, Model: ${analysis.modelName}, Total: ${analysis.totalTransactions}, Fraud: ${analysis.fraudCount} (${analysis.fraudPercentage?.toFixed(1)}%), Accuracy: ${((analysis.metrics?.accuracy ?? 0) * 100).toFixed(1)}%`;
      }
    }

    const history = await db.query.chatMessagesTable.findMany({
      where: and(
        eq(chatMessagesTable.userId, req.userId!),
        analysisId ? eq(chatMessagesTable.analysisId, parseInt(analysisId)) : undefined,
      ),
      orderBy: [desc(chatMessagesTable.createdAt)],
      limit: 10,
    });

    const formattedHistory = history.reverse().slice(0, -1).map((m) => ({
      role: m.role as "user" | "assistant",
      content: m.content,
    }));

    const aiResponse = await generateChatResponse(message, analysisContext, formattedHistory);

    const [assistantMsg] = await db
      .insert(chatMessagesTable)
      .values({ userId: req.userId!, analysisId: analysisId ? parseInt(analysisId) : null, role: "assistant", content: aiResponse })
      .returning();

    res.json(formatMessage(assistantMsg));
  } catch (err) {
    req.log.error({ err }, "sendChatMessage error");
    res.status(500).json({ error: "Internal server error" });
  }
});

// GET /api/chat/history/:analysisId
router.get("/history/:analysisId", requireAuth, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const aId = parseInt(String(req.params['analysisId']));
    const messages = await db.query.chatMessagesTable.findMany({
      where: and(eq(chatMessagesTable.userId, req.userId!), eq(chatMessagesTable.analysisId, aId)),
      orderBy: [desc(chatMessagesTable.createdAt)],
      limit: 100,
    });
    res.json(messages.reverse().map(formatMessage));
  } catch (err) {
    req.log.error({ err }, "getChatHistory error");
    res.status(500).json({ error: "Internal server error" });
  }
});

// DELETE /api/chat/history/:analysisId
router.delete("/history/:analysisId", requireAuth, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const aId = parseInt(String(req.params['analysisId']));
    await db.delete(chatMessagesTable).where(
      and(eq(chatMessagesTable.userId, req.userId!), eq(chatMessagesTable.analysisId, aId)),
    );
    res.status(204).send();
  } catch (err) {
    req.log.error({ err }, "clearChatHistory error");
    res.status(500).json({ error: "Internal server error" });
  }
});

function formatMessage(m: typeof chatMessagesTable.$inferSelect) {
  return {
    id: String(m.id),
    role: m.role,
    content: m.content,
    analysisId: m.analysisId ? String(m.analysisId) : null,
    createdAt: m.createdAt.toISOString(),
  };
}

export default router;
