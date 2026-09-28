import { pool } from "../src/db";
import bcrypt from "bcryptjs";

async function main() {
  const hash = await bcrypt.hash("yadav8115", 10);
  
  const result = await pool.query(`UPDATE users SET password = $1 WHERE password = '' OR password IS NULL`, [hash]);
  console.log(`Updated ${result.rowCount} users without passwords to have password: yadav8115`);
  
  pool.end();
}
main();
