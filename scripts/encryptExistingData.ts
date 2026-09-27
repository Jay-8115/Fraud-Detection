import { db } from "@/db";
import { usersTable, auditLogsTable, uploadedFilesTable, transactionsTable, analysesTable } from "@/db/schema";
import { encrypt, hashForLookup } from "@/lib/crypto";
import { eq } from "drizzle-orm";

async function runMigration() {
  console.log("Starting data encryption migration...");

  // 1. Migrate Users
  const users = await db.select().from(usersTable);
  for (const user of users) {
    if (!user.emailEncrypted) {
      await db.update(usersTable)
        .set({
          clerkIdEncrypted: encrypt(user.clerkId),
          clerkIdHmac: hashForLookup(user.clerkId),
          emailEncrypted: encrypt(user.email),
          emailHmac: hashForLookup(user.email),
          nameEncrypted: encrypt(user.name),
        })
        .where(eq(usersTable.id, user.id));
    }
  }
  console.log(`Migrated ${users.length} users.`);

  // 2. Migrate Audit Logs
  const auditLogs = await db.select().from(auditLogsTable);
  for (const log of auditLogs) {
    if (!log.userEmailEncrypted) {
      await db.update(auditLogsTable)
        .set({
          userEmailEncrypted: encrypt(log.userEmail),
          detailsEncrypted: log.details ? encrypt(log.details) : null,
          ipAddressEncrypted: log.ipAddress ? encrypt(log.ipAddress) : null,
        })
        .where(eq(auditLogsTable.id, log.id));
    }
  }
  console.log(`Migrated ${auditLogs.length} audit logs.`);

  // 3. Migrate Uploaded Files
  const files = await db.select().from(uploadedFilesTable);
  for (const file of files) {
    if (!file.originalNameEncrypted) {
      await db.update(uploadedFilesTable)
        .set({
          originalNameEncrypted: encrypt(file.originalName),
          previewEncrypted: file.preview ? encrypt(JSON.stringify(file.preview)) : null,
        })
        .where(eq(uploadedFilesTable.id, file.id));
    }
  }
  console.log(`Migrated ${files.length} uploaded files.`);

  // 4. Migrate Transactions
  const transactions = await db.select().from(transactionsTable);
  for (const tx of transactions) {
    if (!tx.transactionIdEncrypted) {
      await db.update(transactionsTable)
        .set({
          transactionIdEncrypted: encrypt(tx.transactionId),
          rawDataEncrypted: tx.rawData ? encrypt(JSON.stringify(tx.rawData)) : null,
        })
        .where(eq(transactionsTable.id, tx.id));
    }
  }
  console.log(`Migrated ${transactions.length} transactions.`);

  // 5. Migrate Analyses
  const analyses = await db.select().from(analysesTable);
  for (const analysis of analyses) {
    if (!analysis.fileNameEncrypted) {
      await db.update(analysesTable)
        .set({
          fileNameEncrypted: encrypt(analysis.fileName),
          aiSummaryEncrypted: analysis.aiSummary ? encrypt(analysis.aiSummary) : null,
        })
        .where(eq(analysesTable.id, analysis.id));
    }
  }
  console.log(`Migrated ${analyses.length} analyses.`);

  console.log("Migration complete!");
}

runMigration().catch(console.error);
