import { NextResponse } from "next/server";
import { db } from "@/db";
import { reportsTable } from "@/db";
import { eq, and } from "drizzle-orm";
import { getAuthenticatedUser } from "@/lib/auth";
import { formatReport } from "@/lib/format";

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
    const reportId = parseInt(id, 10);
    if (isNaN(reportId)) {
      return NextResponse.json({ error: "Invalid report ID" }, { status: 400 });
    }

    const report = await db.query.reportsTable.findFirst({
      where: and(
        eq(reportsTable.id, reportId), 
        eq(reportsTable.userId, user.id)
      ),
    });

    if (!report) {
      return NextResponse.json({ error: "Report not found" }, { status: 404 });
    }

    return NextResponse.json(formatReport(report));
  } catch (err) {
    console.error("getReport error:", err);
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
    const reportId = parseInt(id, 10);
    if (isNaN(reportId)) {
      return NextResponse.json({ error: "Invalid report ID" }, { status: 400 });
    }

    const report = await db.query.reportsTable.findFirst({
      where: and(
        eq(reportsTable.id, reportId), 
        eq(reportsTable.userId, user.id)
      ),
    });

    if (!report) {
      return NextResponse.json({ error: "Report not found" }, { status: 404 });
    }

    await db.delete(reportsTable).where(eq(reportsTable.id, report.id));
    return new Response(null, { status: 204 });
  } catch (err) {
    console.error("deleteReport error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
