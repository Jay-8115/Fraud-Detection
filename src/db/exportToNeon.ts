import pg from "pg";

const localUrl = "postgresql://postgres:8115@localhost:5432/fraud";
const neonUrl = "postgresql://neondb_owner:npg_5OKHpEc1AagJ@ep-quiet-mountain-azcqyl9o-pooler.c-3.ap-southeast-1.aws.neon.tech/neondb?sslmode=require";

const localPool = new pg.Pool({ connectionString: localUrl });
const neonPool = new pg.Pool({ connectionString: neonUrl });

async function exportData() {
  console.log("🚀 Starting database export from Local PostgreSQL to Neon PostgreSQL...");

  const tables = [
    { name: "users", idCol: "id", seqName: "users_id_seq" },
    { name: "uploaded_files", idCol: "id", seqName: "uploaded_files_id_seq" },
    { name: "analyses", idCol: "id", seqName: "analyses_id_seq" },
    { name: "transactions", idCol: "id", seqName: "transactions_id_seq" },
    { name: "chat_messages", idCol: "id", seqName: "chat_messages_id_seq" },
    { name: "reports", idCol: "id", seqName: "reports_id_seq" },
    { name: "audit_logs", idCol: "id", seqName: "audit_logs_id_seq" },
  ];

  try {
    for (const table of tables) {
      console.log(`\n📦 Processing table: ${table.name}...`);
      
      // Get all rows from local DB
      const localResult = await localPool.query(`SELECT * FROM "${table.name}" ORDER BY "${table.idCol}" ASC`);
      const rows = localResult.rows;
      console.log(`  Read ${rows.length} rows from local table "${table.name}".`);

      if (rows.length === 0) {
        console.log(`  (No data to export for "${table.name}")`);
        continue;
      }

      // Clear existing records on Neon table to prevent primary key conflicts
      await neonPool.query(`TRUNCATE TABLE "${table.name}" RESTART IDENTITY CASCADE`);

      // Insert rows into Neon table
      let insertedCount = 0;
      for (const row of rows) {
        const columns = Object.keys(row).map(c => `"${c}"`).join(", ");
        const placeholders = Object.keys(row).map((_, i) => `$${i + 1}`).join(", ");
        const values = Object.values(row).map(val => {
          if (val !== null && typeof val === "object" && !(val instanceof Date)) {
            return JSON.stringify(val);
          }
          return val;
        });

        const insertQuery = `INSERT INTO "${table.name}" (${columns}) VALUES (${placeholders})`;
        await neonPool.query(insertQuery, values);
        insertedCount++;
      }

      console.log(`  ✓ Inserted ${insertedCount} rows into Neon table "${table.name}".`);

      // Reset auto-increment sequence to max id + 1
      const maxIdResult = await localPool.query(`SELECT MAX("${table.idCol}") as max_id FROM "${table.name}"`);
      const maxId = maxIdResult.rows[0].max_id;
      if (maxId) {
        await neonPool.query(`SELECT setval('${table.seqName}', ${maxId}, true)`);
        console.log(`  ✓ Reset sequence "${table.seqName}" to max ID ${maxId}.`);
      }
    }

    console.log("\n=======================================================");
    console.log("🎉 SUCCESS: All data exported to Neon PostgreSQL successfully!");
    console.log("=======================================================\n");
  } catch (err) {
    console.error("❌ Export error:", err);
  } finally {
    await localPool.end();
    await neonPool.end();
  }
}

exportData();
