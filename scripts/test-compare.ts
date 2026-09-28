import { pool } from "../src/db";
import bcrypt from "bcryptjs";

async function main() {
  const result = await pool.query(`SELECT email_hmac, password FROM users WHERE id = 8`);
  const hash = result.rows[0].password;
  console.log("DB Hash:", hash);
  const isValid = await bcrypt.compare("yadav8115", hash);
  console.log("Is yadav8115 valid?", isValid);
  
  const isValid2 = await bcrypt.compare("Admin123!", hash);
  console.log("Is Admin123! valid?", isValid2);
  pool.end();
}
main();
