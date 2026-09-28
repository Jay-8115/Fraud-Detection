import { createClerkClient } from "@clerk/backend";
import { db } from "./src/db";
import { usersTable } from "./src/db/schema/users";
import { eq } from "drizzle-orm";
import crypto from "crypto";

const ALGORITHM = "aes-256-gcm";
const IV_LENGTH = 12;

function getEncryptionKey(): Buffer {
  const keyHex = process.env.ENCRYPTION_KEY;
  if (!keyHex) throw new Error("ENCRYPTION_KEY environment variable is missing.");
  return Buffer.from(keyHex, "hex");
}

function getHmacKey(): string {
  const key = process.env.HMAC_KEY;
  if (!key) throw new Error("HMAC_KEY environment variable is missing.");
  return key;
}

function encrypt(text: string): string | null {
  if (!text) return null;
  const key = getEncryptionKey();
  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv);
  
  let encrypted = cipher.update(text, "utf8", "hex");
  encrypted += cipher.final("hex");
  const authTag = cipher.getAuthTag().toString("hex");
  
  return `${iv.toString("hex")}:${authTag}:${encrypted}`;
}

function hashForLookup(text: string): string | null {
  if (!text) return null;
  const hmac = crypto.createHmac("sha256", getHmacKey());
  hmac.update(text.toLowerCase().trim());
  return hmac.digest("hex");
}
const clerk = createClerkClient({ secretKey: process.env.CLERK_SECRET_KEY });

async function main() {
  const email = "yadavjay081105@gmail.com";
  
  console.log("Fetching all Clerk users...");
  const clerkUsers = await clerk.users.getUserList();
  console.log(`Found ${clerkUsers.data.length} users in Clerk.`);
  
  const clerkUser = clerkUsers.data.find(u => 
    u.emailAddresses.some(e => e.emailAddress.toLowerCase() === email.toLowerCase())
  );

  if (!clerkUser) {
    console.error("User not found in Clerk! Available emails:");
    clerkUsers.data.forEach(u => console.log(u.emailAddresses.map(e => e.emailAddress).join(", ")));
    process.exit(1);
  }

  // 2. Update Clerk public metadata
  console.log("Updating Clerk public metadata to role: 'admin'...");
  await clerk.users.updateUserMetadata(clerkUser.id, {
    publicMetadata: {
      role: "admin",
    },
  });
  console.log("Clerk metadata updated.");

  // 3. Link to our database if not already linked
  const emailHmac = hashForLookup(email);
  const dbUser = await db.query.usersTable.findFirst({
    where: eq(usersTable.emailHmac, emailHmac!),
  });

  if (dbUser) {
    const newClerkHmac = hashForLookup(clerkUser.id);
    if (dbUser.clerkIdHmac !== newClerkHmac) {
      console.log(`Linking DB User ${dbUser.id} to Clerk ID ${clerkUser.id}...`);
      await db.update(usersTable)
        .set({
          clerkIdEncrypted: encrypt(clerkUser.id),
          clerkIdHmac: newClerkHmac,
        })
        .where(eq(usersTable.id, dbUser.id));
      console.log("Database successfully linked!");
    } else {
      console.log("Database is already linked to this Clerk ID.");
    }
  }

  console.log("Done! Please refresh your dashboard.");
  process.exit(0);
}

main().catch(console.error);
