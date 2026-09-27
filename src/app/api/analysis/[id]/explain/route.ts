import { NextResponse } from "next/server";
import { db, analysesTable, transactionsTable } from "@/db";
import { eq, and } from "drizzle-orm";
import { getAuthenticatedUser } from "@/lib/auth";
import { encrypt, decrypt } from "@/lib/crypto";

export async function POST(
  request: Request,
  context: any
) {
  const params = await context.params;
  const id = params.id;
  
  const user = await getAuthenticatedUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const analysisId = parseInt(id);
    const analysis = await db.query.analysesTable.findFirst({
      where: and(eq(analysesTable.id, analysisId), eq(analysesTable.userId, user.id))
    });

    if (!analysis) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    if (analysis.explanationStatus === "processing") {
      return NextResponse.json({ error: "Explanations already processing" }, { status: 400 });
    }

    // Mark as processing
    await db.update(analysesTable)
      .set({ explanationStatus: "processing" })
      .where(eq(analysesTable.id, analysisId));

    // Run in background
    const originalName = decrypt(analysis.fileNameEncrypted) || "Unknown";
    resumeAIExplanations(analysisId, originalName, analysis.dataSummary).catch(e => {
      console.error("Failed to resume AI explanations", e);
    });

    return NextResponse.json({ success: true, status: "processing" });
  } catch (err) {
    console.error("Retry explanations error:", err);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}

async function resumeAIExplanations(analysisId: number, fileName: string, dataSummary: any) {
  try {
    const meanAmount = dataSummary?.stats?.meanAmount || 0;

    // Fetch transactions missing explanations or with "Pending AI Analysis..."
    const pendingTxs = await db.query.transactionsTable.findMany({
      where: and(
        eq(transactionsTable.analysisId, analysisId),
        eq(transactionsTable.prediction, "fraud"),
        // @ts-ignore
        eq(transactionsTable.reason, "Pending AI Analysis...")
      ),
      limit: 40
    });

    if (pendingTxs.length === 0) {
      await db.update(analysesTable).set({ explanationStatus: "completed" }).where(eq(analysesTable.id, analysisId));
      return;
    }

    const txToExplain = pendingTxs.map(p => ({
      transactionId: decrypt(p.transactionIdEncrypted) || "Unknown",
      amount: p.amount,
      riskLevel: p.riskLevel,
      probability: p.probability,
      rawData: p.rawDataEncrypted ? JSON.parse(decrypt(p.rawDataEncrypted) || "{}") : {}
    }));

    const { generateBatchTransactionExplanations } = await import("@/lib/ai/provider");
    const { explanations, provider: explProvider } = await generateBatchTransactionExplanations(txToExplain, meanAmount);
    
    for (const [txId, reason] of Object.entries(explanations)) {
      await db.update(transactionsTable)
        .set({ reason, explanationProvider: explProvider })
        .where(and(eq(transactionsTable.analysisId, analysisId), eq(transactionsTable.transactionIdEncrypted, encrypt(txId) || "")));
    }

    await db.update(analysesTable).set({ explanationStatus: "completed" }).where(eq(analysesTable.id, analysisId));
  } catch (error) {
    console.error("AI Explanation failure during retry:", error);
    await db.update(analysesTable).set({ explanationStatus: "failed" }).where(eq(analysesTable.id, analysisId));
  }
}
