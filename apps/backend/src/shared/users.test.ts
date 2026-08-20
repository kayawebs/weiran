import assert from "node:assert/strict";
import test from "node:test";
import type { Pool } from "pg";
import { ensureUser } from "./users.js";

test("ensureUser binds UUID and text values as separate PostgreSQL parameters", async () => {
  const calls: Array<{ sql: string; values: unknown[] | undefined }> = [];
  const db = {
    query: async (sql: string, values?: unknown[]) => {
      calls.push({ sql, values });
      return { rows: [], rowCount: 0 };
    }
  } as unknown as Pool;
  const userId = "00000000-0000-4000-8000-000000000001";

  await ensureUser(db, userId);

  assert.equal(calls.length, 1);
  assert.match(calls[0]!.sql, /VALUES \(\$1::uuid, \$2::text\)/);
  assert.deepEqual(calls[0]!.values, [userId, userId]);
});
