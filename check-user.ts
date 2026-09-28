import { db } from "./src/db";
import { usersTable } from "./src/db/schema/users";
import { eq } from "drizzle-orm";
import crypto from "crypto";

function getHmacKey(): string {
  const key = process.env.HMAC_KEY;
  if (!key) throw new Error("HMAC_KEY environment variable is missing.");
  return key;
}

function hashForLookup(text: string): string | null {
  if (!text) return null;
  const hmac = crypto.createHmac("sha256", getHmacKey());
  hmac.update(text.toLowerCase().trim());
  return hmac.digest("hex");
}

async function main() {
  const email = "yadavjay081105@gmail.com";
  const emailHmac = hashForLookup(email);

  if (!emailHmac) throw new Error("Could not hash email");

  const users = await db.query.usersTable.findMany({
    where: eq(usersTable.emailHmac, emailHmac),
  });

  console.log(`Found ${users.length} users with email ${email}`);
  for (const user of users) {
    console.log({
      id: user.id,
      role: user.role,
      hasClerkId: !!user.clerkIdHmac,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt
    });
  }
  
  // also get all users to see if there's a duplicate with a different email hash?
  const allUsers = await db.query.usersTable.findMany();
  console.log(`\nTotal users in DB: ${allUsers.length}`);
  for (const user of allUsers) {
    if (user.role === 'admin' || user.id > 0) {
      console.log(`User ID: ${user.id}, Role: ${user.role}, HasClerk: ${!!user.clerkIdHmac}`);
    }
  }

  process.exit(0);
}

main().catch(console.error);
