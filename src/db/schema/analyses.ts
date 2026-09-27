import { pgTable, text, integer, timestamp, serial, json, real } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const analysesTable = pgTable("analyses", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  fileId: integer("file_id").notNull(),
  fileName: text("file_name").notNull(),
  fileNameEncrypted: text("file_name_encrypted"),
  modelName: text("model_name").notNull().default("auto"),
  status: text("status", { enum: ["pending", "running", "completed", "failed"] }).notNull().default("pending"),
  totalTransactions: integer("total_transactions"),
  fraudCount: integer("fraud_count"),
  legitimateCount: integer("legitimate_count"),
  fraudPercentage: real("fraud_percentage"),
  riskBreakdown: json("risk_breakdown").$type<{ critical: number; high: number; medium: number; low: number }>(),
  metrics: json("metrics").$type<{
    accuracy: number; precision: number; recall: number;
    f1Score: number; rocAuc: number; trainingTimeMs: number; predictionTimeMs: number;
  }>(),
  aiSummary: text("ai_summary"),
  aiSummaryEncrypted: text("ai_summary_encrypted"),
  featureImportance: json("feature_importance").$type<Record<string, number>>(),
  errorMessage: text("error_message"),
  progressStep: text("progress_step"),
  explanationStatus: text("explanation_status", { enum: ["pending", "processing", "completed", "failed"] }).notNull().default("pending"),
  explanationProvider: text("explanation_provider"),
  recommendedModel: text("recommended_model"),
  modelComparison: json("model_comparison"),
  dataSummary: json("data_summary"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  completedAt: timestamp("completed_at"),
});

export const insertAnalysisSchema = createInsertSchema(analysesTable).omit({ id: true, createdAt: true });
export type InsertAnalysis = z.infer<typeof insertAnalysisSchema>;
export type Analysis = typeof analysesTable.$inferSelect;
