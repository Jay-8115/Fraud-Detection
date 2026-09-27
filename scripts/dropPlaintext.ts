import { db } from "../src/db";
import { sql } from "drizzle-orm";

async function main() {
  console.log("Dropping plaintext columns...");
  
  await db.execute(sql`ALTER TABLE "users" DROP COLUMN IF EXISTS "email" CASCADE;`);
  await db.execute(sql`ALTER TABLE "users" DROP COLUMN IF EXISTS "clerk_id" CASCADE;`);
  await db.execute(sql`ALTER TABLE "users" DROP COLUMN IF EXISTS "name" CASCADE;`);
  
  await db.execute(sql`ALTER TABLE "audit_logs" DROP COLUMN IF EXISTS "user_email" CASCADE;`);
  await db.execute(sql`ALTER TABLE "audit_logs" DROP COLUMN IF EXISTS "details" CASCADE;`);
  await db.execute(sql`ALTER TABLE "audit_logs" DROP COLUMN IF EXISTS "ip_address" CASCADE;`);
  
  await db.execute(sql`ALTER TABLE "uploaded_files" DROP COLUMN IF EXISTS "original_name" CASCADE;`);
  await db.execute(sql`ALTER TABLE "uploaded_files" DROP COLUMN IF EXISTS "preview" CASCADE;`);
  
  await db.execute(sql`ALTER TABLE "analyses" DROP COLUMN IF EXISTS "file_name" CASCADE;`);
  await db.execute(sql`ALTER TABLE "analyses" DROP COLUMN IF EXISTS "ai_summary" CASCADE;`);
  
  await db.execute(sql`ALTER TABLE "transactions" DROP COLUMN IF EXISTS "transaction_id" CASCADE;`);
  await db.execute(sql`ALTER TABLE "transactions" DROP COLUMN IF EXISTS "raw_data" CASCADE;`);

  console.log("Plaintext columns successfully dropped.");
  process.exit(0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
