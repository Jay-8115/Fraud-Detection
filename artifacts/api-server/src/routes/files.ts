import { Router, Response } from "express";
import multer from "multer";
import path from "path";
import fs from "fs";
import { db } from "@workspace/db";
import { uploadedFilesTable, auditLogsTable } from "@workspace/db";
import { eq, and, ilike, desc, count, sql } from "drizzle-orm";
import { requireAuth, type AuthRequest } from "../lib/auth";
import { parseCSV } from "../lib/csvParser";

const router = Router();

const uploadDir = path.join(process.cwd(), "uploads");
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });

const storage = multer.diskStorage({
  destination: uploadDir,
  filename: (_, file, cb) => {
    const unique = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    cb(null, `${unique}${path.extname(file.originalname)}`);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (_, file, cb) => {
    const allowed = [".csv", ".xlsx", ".xls", ".pdf"];
    const ext = path.extname(file.originalname).toLowerCase();
    if (allowed.includes(ext)) cb(null, true);
    else cb(new Error("Invalid file type. Only CSV, Excel, and PDF are allowed."));
  },
});

// GET /api/files
router.get("/", requireAuth, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const page = parseInt(String(req.query.page ?? "1"));
    const limit = parseInt(String(req.query.limit ?? "20"));
    const search = String(req.query.search ?? "");
    const offset = (page - 1) * limit;

    const baseWhere = eq(uploadedFilesTable.userId, req.userId!);
    const where = search
      ? and(baseWhere, ilike(uploadedFilesTable.originalName, `%${search}%`))
      : baseWhere;

    const [files, [{ total }]] = await Promise.all([
      db.query.uploadedFilesTable.findMany({
        where,
        orderBy: [desc(uploadedFilesTable.createdAt)],
        limit,
        offset,
      }),
      db.select({ total: count() }).from(uploadedFilesTable).where(where),
    ]);

    res.json({
      data: files.map(formatFile),
      total: Number(total),
      page,
      limit,
      totalPages: Math.ceil(Number(total) / limit),
    });
  } catch (err) {
    req.log.error({ err }, "listFiles error");
    res.status(500).json({ error: "Internal server error" });
  }
});

// POST /api/files  (multipart/form-data)
router.post("/", requireAuth, (req: AuthRequest, res: Response): void => {
  upload.single("file")(req, res, async (err) => {
    if (err) { res.status(400).json({ error: err.message }); return; }
    if (!req.file) { res.status(400).json({ error: "No file uploaded" }); return; }

    try {
      const ext = path.extname(req.file.originalname).toLowerCase();
      let rowCount: number | null = null;
      let columnCount: number | null = null;
      let columns: string[] | null = null;
      let preview: Record<string, unknown>[] | null = null;

      if (ext === ".csv") {
        const text = fs.readFileSync(req.file.path, "utf-8");
        const rows = parseCSV(text);
        if (rows.length > 0) {
          columns = Object.keys(rows[0]);
          columnCount = columns.length;
          rowCount = rows.length;
          preview = rows.slice(0, 10);
        }
      }

      const [file] = await db
        .insert(uploadedFilesTable)
        .values({
          userId: req.userId!,
          fileName: req.file.filename,
          originalName: req.file.originalname,
          fileSize: req.file.size,
          fileType: ext.replace(".", ""),
          rowCount,
          columnCount,
          columns,
          preview,
          status: "ready",
        })
        .returning();

      // Audit log
      await db.insert(auditLogsTable).values({
        userId: req.userId!,
        userEmail: req.userEmail!,
        action: "upload",
        resource: "file",
        resourceId: String(file.id),
        details: `Uploaded ${req.file.originalname}`,
        ipAddress: req.ip ?? null,
      });

      res.status(201).json(formatFile(file));
    } catch (e) {
      req.log.error({ err: e }, "uploadFile error");
      res.status(500).json({ error: "Internal server error" });
    }
  });
});

// GET /api/files/:id
router.get("/:id", requireAuth, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const fileId = parseInt(String(req.params['id']));
    const file = await db.query.uploadedFilesTable.findFirst({
      where: and(
        eq(uploadedFilesTable.id, fileId),
        eq(uploadedFilesTable.userId, req.userId!),
      ),
    });
    if (!file) { res.status(404).json({ error: "File not found" }); return; }
    res.json(formatFile(file));
  } catch (err) {
    req.log.error({ err }, "getFile error");
    res.status(500).json({ error: "Internal server error" });
  }
});

// DELETE /api/files/:id
router.delete("/:id", requireAuth, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const fileId = parseInt(String(req.params['id']));
    const file = await db.query.uploadedFilesTable.findFirst({
      where: and(
        eq(uploadedFilesTable.id, fileId),
        eq(uploadedFilesTable.userId, req.userId!),
      ),
    });
    if (!file) { res.status(404).json({ error: "File not found" }); return; }

    const filePath = path.join(uploadDir, file.fileName);
    if (fs.existsSync(filePath)) fs.unlinkSync(filePath);

    await db.delete(uploadedFilesTable).where(eq(uploadedFilesTable.id, file.id));
    res.status(204).send();
  } catch (err) {
    req.log.error({ err }, "deleteFile error");
    res.status(500).json({ error: "Internal server error" });
  }
});

export function formatFile(f: typeof uploadedFilesTable.$inferSelect) {
  return {
    id: String(f.id),
    userId: String(f.userId),
    fileName: f.fileName,
    originalName: f.originalName,
    fileSize: f.fileSize,
    fileType: f.fileType,
    rowCount: f.rowCount,
    columnCount: f.columnCount,
    columns: f.columns,
    preview: f.preview,
    status: f.status,
    errorMessage: f.errorMessage,
    createdAt: f.createdAt.toISOString(),
  };
}

export default router;
