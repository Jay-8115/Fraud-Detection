import { NextResponse } from "next/server";
import path from "path";
import fs from "fs";
import { db } from "@/db";
import { uploadedFilesTable } from "@/db";
import { eq, and } from "drizzle-orm";
import { getAuthenticatedUser } from "@/lib/auth";
import { formatFile } from "@/lib/format";

const uploadDir = path.join(process.cwd(), "uploads");

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
    const fileId = parseInt(id);

    const file = await db.query.uploadedFilesTable.findFirst({
      where: and(
        eq(uploadedFilesTable.id, fileId),
        eq(uploadedFilesTable.userId, user.id)
      ),
    });

    if (!file) {
      return NextResponse.json({ error: "File not found" }, { status: 404 });
    }

    return NextResponse.json(formatFile(file));
  } catch (err) {
    console.error("getFile error:", err);
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
    const fileId = parseInt(id);

    const file = await db.query.uploadedFilesTable.findFirst({
      where: and(
        eq(uploadedFilesTable.id, fileId),
        eq(uploadedFilesTable.userId, user.id)
      ),
    });

    if (!file) {
      return NextResponse.json({ error: "File not found" }, { status: 404 });
    }

    const filePath = path.join(uploadDir, file.fileName);
    if (fs.existsSync(filePath)) {
      try {
        fs.unlinkSync(filePath);
      } catch (err) {
        console.error("Failed to delete file on disk:", err);
      }
    }

    await db.delete(uploadedFilesTable).where(eq(uploadedFilesTable.id, file.id));
    return new Response(null, { status: 204 });
  } catch (err) {
    console.error("deleteFile error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
