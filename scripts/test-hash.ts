import { hashForLookup } from "../src/lib/crypto";

const hmac = hashForLookup("yadavjay081105@gmail.com");
console.log("HMAC for yadavjay081105@gmail.com:", hmac);
