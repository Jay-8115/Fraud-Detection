import { NextResponse } from "next/server";
import { db } from "@/db";
import { usersTable } from "@/db";
import { eq, desc, count, ilike, and } from "drizzle-orm";
import { getAuthenticatedUser } from "@/lib/auth";
import { formatUser } from "@/lib/format";


export async function GET(request: Request) {
  const user = await getAuthenticatedUser();
  if (!user || user.role !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") ?? "1");
    const limit = parseInt(searchParams.get("limit") ?? "20");
    const search = searchParams.get("search") ?? "";
    const status = searchParams.get("status") ?? "all";
    const offset = (page - 1) * limit;

    let where: any = undefined;
    if (search) {
      where = ilike(usersTable.email, `%${search}%`);
    }
    if (status === "active") {
      where = where ? and(where, eq(usersTable.isBlocked, false)) : eq(usersTable.isBlocked, false);
    } else if (status === "blocked") {
      where = where ? and(where, eq(usersTable.isBlocked, true)) : eq(usersTable.isBlocked, true);
    }

    const [users, [{ total }]] = await Promise.all([
      db.query.usersTable.findMany({ 
        where, 
        orderBy: [desc(usersTable.createdAt)], 
        limit, 
        offset 
      }),
      db.select({ total: count() }).from(usersTable).where(where),
    ]);

    return NextResponse.json({ 
      data: users.map(formatUser), 
      total: Number(total), 
      page, 
      limit, 
      totalPages: Math.ceil(Number(total) / limit) 
    });
  } catch (err) {
    console.error("listAdminUsers error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
