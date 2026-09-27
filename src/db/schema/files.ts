import { pgTable, text, integer, timestamp, serial, json } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const uploadedFilesTable = pgTable("uploaded_files", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  fileName: text("file_name").notNull(),
  originalName: text("original_name").notNull(),
  originalNameEncrypted: text("original_name_encrypted"),
  fileSize: integer("file_size").notNull(),
  fileType: text("file_type").notNull(),
  rowCount: integer("row_count"),
  columnCount: integer("column_count"),
  columns: json("columns").$type<string[]>(),
  preview: json("preview").$type<Record<string, unknown>[]>(),
  previewEncrypted: text("preview_encrypted"),
  status: text("status", { enum: ["pending", "processing", "ready", "error"] }).notNull().default("pending"),
  errorMessage: text("error_message"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertUploadedFileSchema = createInsertSchema(uploadedFilesTable).omit({ id: true, createdAt: true });
export type InsertUploadedFile = z.infer<typeof insertUploadedFileSchema>;
export type UploadedFile = typeof uploadedFilesTable.$inferSelect;
