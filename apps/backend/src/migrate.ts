import { readdir, readFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { pool, withTransaction } from "./db/client.js";

const currentDirectory = dirname(fileURLToPath(import.meta.url));
const migrationDirectory = join(currentDirectory, "db", "migrations");

async function migrate(): Promise<void> {
  await pool.query(`CREATE TABLE IF NOT EXISTS schema_migrations (
    name TEXT PRIMARY KEY,
    applied_at TIMESTAMPTZ NOT NULL DEFAULT now()
  )`);

  const files = (await readdir(migrationDirectory)).filter((name) => name.endsWith(".sql")).sort();
  for (const name of files) {
    const applied = await pool.query<{ name: string }>("SELECT name FROM schema_migrations WHERE name = $1", [name]);
    if (applied.rowCount) continue;
    const sql = await readFile(join(migrationDirectory, name), "utf8");
    await withTransaction(async (client) => {
      await client.query(sql);
      await client.query("INSERT INTO schema_migrations (name) VALUES ($1)", [name]);
    });
    console.log(`Applied migration ${name}`);
  }
}

migrate()
  .then(() => pool.end())
  .catch(async (error: unknown) => {
    console.error(error);
    await pool.end();
    process.exitCode = 1;
  });
