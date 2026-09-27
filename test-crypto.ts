import { encrypt, decrypt, hashForLookup, maskEmail, maskString } from "./src/lib/crypto";

async function test() {
  const original = "sensitive_data@example.com";
  
  const encrypted = encrypt(original);
  console.log("Encrypted:", encrypted);
  
  const decrypted = decrypt(encrypted);
  console.log("Decrypted:", decrypted);
  
  const hmac = hashForLookup(original);
  console.log("HMAC:", hmac);

  console.log("Masked Email:", maskEmail(original));
  console.log("Masked String:", maskString("1234567890"));
  
  if (original === decrypted) {
    console.log("Round-trip SUCCESS!");
  } else {
    console.log("Round-trip FAILED!");
  }
}

test();
