import { NextResponse } from "next/server";
import { db } from "@/db";
import { analysesTable, transactionsTable } from "@/db";
import { eq, and } from "drizzle-orm";
import { getAuthenticatedUser } from "@/lib/auth";
import { formatAnalysis } from "@/lib/format";

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

    return NextResponse.json(formatAnalysis(analysis));
  } catch (err) {
    console.error("getAnalysis error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function DELETE(
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

    await db.delete(transactionsTable).where(eq(transactionsTable.analysisId, analysis.id));
    await db.delete(analysesTable).where(eq(analysesTable.id, analysis.id));

    return new Response(null, { status: 204 });
  } catch (err) {
    console.error("deleteAnalysis error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
