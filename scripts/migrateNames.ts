import { db } from "../src/db";
import { usersTable } from "../src/db";
import { sql } from "drizzle-orm";
import { decrypt } from "../src/lib/crypto";

async function main() {
  console.log("Starting migration of name_encrypted to name...");

  try {
    // 1. Add the new 'name' column if it doesn't exist
    console.log("Adding 'name' column...");
    await db.execute(sql`ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "name" text;`);

    // 2. Fetch all users
    console.log("Fetching users...");
    // Using raw SQL because the schema was updated and might not map name_encrypted anymore
    const result = await db.execute(sql`SELECT id, name_encrypted FROM "users" WHERE name_encrypted IS NOT NULL;`);
    const users = result.rows;
    console.log(`Found ${users.length} users with encrypted names.`);

    // 3. Decrypt and update
    for (const user of users) {
      if (user.name_encrypted) {
        const decryptedName = decrypt(user.name_encrypted as string) || "Unknown User";
        await db.execute(sql`UPDATE "users" SET "name" = ${decryptedName} WHERE id = ${user.id};`);
      }
    }
    console.log("Successfully migrated all names.");

    // 4. Drop the old column
    console.log("Dropping 'name_encrypted' column...");
    await db.execute(sql`ALTER TABLE "users" DROP COLUMN IF EXISTS "name_encrypted";`);

    console.log("Migration complete!");
    process.exit(0);
  } catch (error) {
    console.error("Migration failed:", error);
    process.exit(1);
  }
}

main();
