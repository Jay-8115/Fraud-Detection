import { pgTable, text, integer, timestamp, serial, json, real } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const transactionsTable = pgTable("transactions", {
  id: serial("id").primaryKey(),
  analysisId: integer("analysis_id").notNull(),
  transactionId: text("transaction_id").notNull(),
  amount: real("amount"),
  prediction: text("prediction", { enum: ["fraud", "legitimate"] }).notNull(),
  probability: real("probability").notNull(),
  riskScore: real("risk_score").notNull(),
  riskLevel: text("risk_level", { enum: ["critical", "high", "medium", "low"] }).notNull(),
  reason: text("reason"),
  explanationProvider: text("explanation_provider"),
  rawData: json("raw_data").$type<Record<string, unknown>>().notNull().default({}),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertTransactionSchema = createInsertSchema(transactionsTable).omit({ id: true, createdAt: true });
export type InsertTransaction = z.infer<typeof insertTransactionSchema>;
export type Transaction = typeof transactionsTable.$inferSelect;
