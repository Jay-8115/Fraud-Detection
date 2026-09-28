const crypto = require("crypto");

function getHmacKey() {
  const key = process.env.HMAC_KEY;
  if (!key) {
    throw new Error("HMAC_KEY environment variable is missing.");
  }
  return key;
}

function hashForLookup(text) {
  if (!text) return null;
  const hmac = crypto.createHmac("sha256", getHmacKey());
  hmac.update(text.toLowerCase().trim());
  return hmac.digest("hex");
}

console.log("HMAC for yadavjay081105@gmail.com:", hashForLookup("yadavjay081105@gmail.com"));
