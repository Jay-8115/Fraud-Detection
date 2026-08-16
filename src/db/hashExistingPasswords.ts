import fs from "fs";
import path from "path";

// Load .env manually
const envPath = path.join(process.cwd(), ".env");
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, "utf-8");
  envContent.split("\n").forEach((line) => {
    const trimmed = line.trim();
    if (trimmed && !trimmed.startsWith("#") && trimmed.includes("=")) {
      const [key, ...vals] = trimmed.split("=");
      process.env[key.trim()] = vals.join("=").trim();
    }
  });
}

import { db, pool } from "./index";
import { usersTable } from "./schema/users";
import { eq } from "drizzle-orm";
import { hashPassword } from "../lib/security";

async function runPasswordMigration() {
  console.log("🔒 Starting database password migration for PostgreSQL 'fraud' database...");

  try {
    const allUsers = await db.query.usersTable.findMany();
    console.log(`Found ${allUsers.length} total user accounts in 'users' table.`);

    let updatedCount = 0;
    let alreadyHashedCount = 0;

    for (const user of allUsers) {
      // Check if password exists and needs hashing (unhashed passwords don't contain ':')
      if (user.password && !user.password.includes(":")) {
        const hashedPassword = hashPassword(user.password);
        await db
          .update(usersTable)
          .set({
            password: hashedPassword,
            passwordChangedAt: new Date(),
            updatedAt: new Date(),
          })
          .where(eq(usersTable.id, user.id));

        updatedCount++;
        console.log(`  ✓ Hashed password for user [ID: ${user.id}, Email: ${user.email}]`);
      } else {
        alreadyHashedCount++;
      }
    }

    console.log("\n==========================================");
    console.log("🎉 Migration completed successfully!");
    console.log(`- Passwords hashed & updated: ${updatedCount}`);
    console.log(`- Passwords already hashed:   ${alreadyHashedCount}`);
    console.log("==========================================\n");
  } catch (err) {
    console.error("❌ Migration failed with error:", err);
  } finally {
    await pool.end();
  }
}

runPasswordMigration();
