import { db } from "./src/db";
import { usersTable } from "./src/db/schema/users";
import crypto from "crypto";

const ALGORITHM = "aes-256-gcm";

function getEncryptionKey(): Buffer {
  const keyHex = process.env.ENCRYPTION_KEY;
  if (!keyHex) throw new Error("ENCRYPTION_KEY environment variable is missing.");
  return Buffer.from(keyHex, "hex");
}

function decrypt(encryptedData: string | null | undefined): string | null {
  if (!encryptedData) return null;
  try {
    const key = getEncryptionKey();
    const parts = encryptedData.split(":");
    if (parts.length !== 3) throw new Error("Invalid encrypted data format");
    
    const iv = Buffer.from(parts[0], "hex");
    const authTag = Buffer.from(parts[1], "hex");
    const ciphertext = parts[2];
    
    const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
    decipher.setAuthTag(authTag);
    
    let decrypted = decipher.update(ciphertext, "hex", "utf8");
    decrypted += decipher.final("utf8");
    return decrypted;
  } catch (error) {
    return null; 
  }
}

async function main() {
  const allUsers = await db.query.usersTable.findMany();
  console.log(`Total users in DB: ${allUsers.length}`);
  
  for (const user of allUsers) {
    const email = decrypt(user.emailEncrypted);
    console.log(`User ID: ${user.id}, Role: ${user.role}, Email: ${email}`);
  }
  process.exit(0);
}

main().catch(console.error);
