import { NextResponse } from "next/server";
import { db } from "@/db";
import { analysesTable } from "@/db";
import { desc, count } from "drizzle-orm";
import { getAuthenticatedUser } from "@/lib/auth";
import { formatAnalysis } from "@/lib/format";

export async function GET(request: Request) {
  const user = await getAuthenticatedUser();
  if (!user || user.role !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") ?? "1");
    const limit = parseInt(searchParams.get("limit") ?? "20");
    const offset = (page - 1) * limit;

    const [analyses, [{ total }]] = await Promise.all([
      db.query.analysesTable.findMany({ 
        orderBy: [desc(analysesTable.createdAt)], 
        limit, 
        offset 
      }),
      db.select({ total: count() }).from(analysesTable),
    ]);

    return NextResponse.json({
      data: analyses.map(formatAnalysis),
      total: Number(total),
      page,
      limit,
      totalPages: Math.ceil(Number(total) / limit),
    });
  } catch (err) {
    console.error("listAdminAnalyses error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
