import { pool } from "../src/db";

async function main() {
  const result = await pool.query(`SELECT id, is_blocked, email_hmac, password FROM users WHERE id = 8`);
  console.log("User 8:", result.rows[0]);
  pool.end();
}
main();
