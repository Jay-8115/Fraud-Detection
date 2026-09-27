import { pgTable, text, boolean, integer, timestamp, serial } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const usersTable = pgTable("users", {
  id: serial("id").primaryKey(),
  clerkId: text("clerk_id").notNull().unique(),
  clerkIdEncrypted: text("clerk_id_encrypted"),
  clerkIdHmac: text("clerk_id_hmac").unique(),
  email: text("email").notNull().unique(),
  emailEncrypted: text("email_encrypted"),
  emailHmac: text("email_hmac").unique(),
  name: text("name").notNull(),
  nameEncrypted: text("name_encrypted"),
  role: text("role", { enum: ["user", "admin"] }).notNull().default("user"),
  password: text("password").notNull().default(""),
  isBlocked: boolean("is_blocked").notNull().default(false),
  failedLoginAttempts: integer("failed_login_attempts").notNull().default(0),
  lockoutUntil: timestamp("lockout_until"),
  passwordChangedAt: timestamp("password_changed_at"),
  totalUploads: integer("total_uploads").notNull().default(0),
  totalAnalyses: integer("total_analyses").notNull().default(0),
  lastLoginAt: timestamp("last_login_at"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const insertUserSchema = createInsertSchema(usersTable).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof usersTable.$inferSelect;
