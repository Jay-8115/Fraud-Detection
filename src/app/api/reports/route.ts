import { NextResponse } from "next/server";
import { db } from "@/db";
import { reportsTable, analysesTable, auditLogsTable } from "@/db";
import { eq, and, desc, count } from "drizzle-orm";
import { getAuthenticatedUser } from "@/lib/auth";
import { formatReport } from "@/lib/format";
import { encrypt, decrypt } from "@/lib/crypto";


export async function GET(request: Request) {
  const user = await getAuthenticatedUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") ?? "1");
    const limit = parseInt(searchParams.get("limit") ?? "20");
    const offset = (page - 1) * limit;

    const where = eq(reportsTable.userId, user.id);
    const [reports, [{ total }]] = await Promise.all([
      db.query.reportsTable.findMany({ 
        where, 
        orderBy: [desc(reportsTable.createdAt)], 
        limit, 
        offset 
      }),
      db.select({ total: count() }).from(reportsTable).where(where),
    ]);

    return NextResponse.json({ 
      data: reports.map(formatReport), 
      total: Number(total), 
      page, 
      limit, 
      totalPages: Math.ceil(Number(total) / limit) 
    });
  } catch (err) {
    console.error("listReports error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const user = await getAuthenticatedUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { analysisId } = body;
    if (!analysisId) {
      return NextResponse.json({ error: "analysisId is required" }, { status: 400 });
    }

    const analysis = await db.query.analysesTable.findFirst({
      where: and(
        eq(analysesTable.id, parseInt(analysisId)), 
        eq(analysesTable.userId, user.id)
      ),
    });
    if (!analysis) {
      return NextResponse.json({ error: "Analysis not found" }, { status: 404 });
    }
    if (analysis.status !== "completed") {
      return NextResponse.json({ error: "Analysis not completed yet" }, { status: 400 });
    }

    const originalName = decrypt(analysis.fileNameEncrypted) || "Unknown";
    const fileName = `FraudWatch_Report_${originalName.replace(/\.[^.]+$/, "")}_${Date.now()}.txt`;
    const downloadUrl = `/api/reports/download/${analysis.id}`;

    const [report] = await db
      .insert(reportsTable)
      .values({ 
        userId: user.id, 
        analysisId: analysis.id, 
        fileName, 
        downloadUrl 
      })
      .returning();

    await db.insert(auditLogsTable).values({
      userId: user.id,
      userEmailEncrypted: encrypt(user.email),
      action: "generate_report",
      resource: "report",
      resourceId: String(report.id),
      detailsEncrypted: encrypt(`Generated report for ${originalName}`),
    });

    return NextResponse.json(formatReport(report), { status: 201 });
  } catch (err) {
    console.error("generateReport error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
