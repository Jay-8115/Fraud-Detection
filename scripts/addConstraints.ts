import { db } from "../src/db";
import { sql } from "drizzle-orm";

async function main() {
  console.log("Adding unique constraints...");
  
  await db.execute(sql`ALTER TABLE "users" ADD CONSTRAINT "users_clerk_id_hmac_unique" UNIQUE("clerk_id_hmac");`);
  await db.execute(sql`ALTER TABLE "users" ADD CONSTRAINT "users_email_hmac_unique" UNIQUE("email_hmac");`);
  
  console.log("Unique constraints successfully added.");
  process.exit(0);
}

main().catch((err) => {
  console.error("Error adding constraints:", err);
  process.exit(1);
});
