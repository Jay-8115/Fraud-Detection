import { pool } from "../src/db";

async function main() {
  console.log("Creating sessions table if it does not exist...");

  const query = `
    CREATE TABLE IF NOT EXISTS "sessions" (
      "id" serial PRIMARY KEY NOT NULL,
      "token_hash" text NOT NULL,
      "user_id" integer NOT NULL,
      "created_at" timestamp DEFAULT now() NOT NULL,
      "expires_at" timestamp NOT NULL,
      "last_used_at" timestamp DEFAULT now() NOT NULL,
      CONSTRAINT "sessions_token_hash_unique" UNIQUE("token_hash")
    );

    DO $$
    BEGIN
        IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'sessions_user_id_users_id_fk') THEN
            ALTER TABLE "sessions" ADD CONSTRAINT "sessions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE cascade ON UPDATE no action;
        END IF;
    END
    $$;
  `;

  try {
    await pool.query(query);
    console.log("Sessions table created successfully.");
  } catch (err) {
    console.error("Error creating sessions table:", err);
  } finally {
    pool.end();
  }
}

main();
