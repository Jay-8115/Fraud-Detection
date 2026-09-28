import { pool } from "../src/db";

async function main() {
  const result = await pool.query(`SELECT id, email_hmac, password, role FROM users LIMIT 10`);
  console.log("Users in DB:");
  result.rows.forEach(row => {
    console.log({
      id: row.id,
      emailHmac: row.email_hmac,
      hasPassword: !!row.password,
      passwordLength: row.password ? row.password.length : 0,
      passwordPrefix: row.password ? row.password.substring(0, 10) : "",
      role: row.role
    });
  });
  pool.end();
}
main();
