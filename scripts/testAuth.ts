import { hashForLookup, encrypt, decrypt } from "../src/lib/crypto";

async function main() {
  console.log("Testing crypto functions...");
  const clerkId = "user_2l3k4j5h6g7f8d9s0a";
  const email = "test@example.com";
  const name = "Test User";

  try {
    const hmacClerkId = hashForLookup(clerkId);
    console.log("HMAC Clerk ID:", hmacClerkId);

    const emailHmac = hashForLookup(email);
    console.log("HMAC Email:", emailHmac);

    const clerkIdEncrypted = encrypt(clerkId);
    console.log("Encrypted Clerk ID:", clerkIdEncrypted);

    const decryptedClerkId = decrypt(clerkIdEncrypted);
    console.log("Decrypted Clerk ID:", decryptedClerkId);

    if (clerkId !== decryptedClerkId) {
      throw new Error("Decryption failed!");
    }

    console.log("Crypto tests passed.");
  } catch (err) {
    console.error("Crypto test error:", err);
  }
}

main();
