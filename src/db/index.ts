import { drizzle } from "drizzle-orm/node-postgres";
import pg from "pg";
import * as schema from "./schema";

const { Pool } = pg;

if (!process.env.DATABASE_URL) {
  throw new Error(
    "DATABASE_URL must be set. Did you forget to provision a database?",
  );
}

// Neon postgres connection strings usually include ?sslmode=require, which triggers a node-postgres warning.
// We replace it here with verify-full to suppress the warning while retaining the exact same current security behavior.
const connectionString = process.env.DATABASE_URL.replace("sslmode=require", "sslmode=verify-full");

export const pool = new Pool({ connectionString });
export const db = drizzle(pool, { schema });

export * from "./schema";
