import { NextResponse } from "next/server";
import { db } from "@/db";
import { analysesTable, transactionsTable } from "@/db";
import { eq, and, desc, count, gte, lte } from "drizzle-orm";
import { getAuthenticatedUser } from "@/lib/auth";

function formatTransaction(t: typeof transactionsTable.$inferSelect) {
  return {
    id: String(t.id),
    analysisId: String(t.analysisId),
    transactionId: t.transactionId,
    amount: t.amount,
    prediction: t.prediction,
    probability: t.probability,
    riskScore: t.riskScore,
    riskLevel: t.riskLevel,
    reason: t.reason,
    rawData: t.rawData,
  };
}

export async function GET(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  const user = await getAuthenticatedUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { id } = await context.params;
    const analysisId = parseInt(id);

    const analysis = await db.query.analysesTable.findFirst({
      where: and(
        eq(analysesTable.id, analysisId), 
        eq(analysesTable.userId, user.id)
      ),
    });

    if (!analysis) {
      return NextResponse.json({ error: "Analysis not found" }, { status: 404 });
    }

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") ?? "1");
    const limit = parseInt(searchParams.get("limit") ?? "50");
    const prediction = searchParams.get("prediction") ?? "all";
    const minRisk = searchParams.get("minRisk");
    const maxRisk = searchParams.get("maxRisk");
    const offset = (page - 1) * limit;

    let where = eq(transactionsTable.analysisId, analysis.id);
    if (prediction === "fraud") {
      where = and(where, eq(transactionsTable.prediction, "fraud")) as any;
    } else if (prediction === "legitimate") {
      where = and(where, eq(transactionsTable.prediction, "legitimate")) as any;
    }

    if (minRisk) {
      where = and(where, gte(transactionsTable.riskScore, parseFloat(minRisk))) as any;
    }
    if (maxRisk) {
      where = and(where, lte(transactionsTable.riskScore, parseFloat(maxRisk))) as any;
    }

    const baseWhere = eq(transactionsTable.analysisId, analysis.id);
    const [transactions, [{ total }], [{ fraudCount }], [{ legitimateCount }]] = await Promise.all([
      db.query.transactionsTable.findMany({ 
        where, 
        limit, 
        offset, 
        orderBy: [desc(transactionsTable.riskScore)] 
      }),
      db.select({ total: count() }).from(transactionsTable).where(where),
      db.select({ fraudCount: count() }).from(transactionsTable).where(
        and(baseWhere, eq(transactionsTable.prediction, "fraud"))
      ),
      db.select({ legitimateCount: count() }).from(transactionsTable).where(
        and(baseWhere, eq(transactionsTable.prediction, "legitimate"))
      ),
    ]);

    return NextResponse.json({
      data: transactions.map(formatTransaction),
      total: Number(total),
      page,
      limit,
      totalPages: Math.ceil(Number(total) / limit),
      fraudCount: Number(fraudCount),
      legitimateCount: Number(legitimateCount),
    });
  } catch (err) {
    console.error("listTransactions error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
