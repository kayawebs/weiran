import { randomUUID } from "node:crypto";
import type { Pool, PoolClient } from "pg";

type Queryable = Pool | PoolClient;

export async function ensureUser(db: Queryable, userId: string): Promise<void> {
  // A PostgreSQL bind parameter has one inferred type. Reusing $1 for both the
  // UUID id and TEXT external_id makes PostgreSQL reject the query with 42P08.
  await db.query(`INSERT INTO users (id, external_id) VALUES ($1::uuid, $2::text)
    ON CONFLICT (id) DO NOTHING`, [userId, userId]);
}

export async function findOrCreateUserByExternalId(db: Queryable, externalId: string): Promise<{ id: string }> {
  const result = await db.query<{ id: string }>(`INSERT INTO users (id, external_id)
    VALUES ($1, $2)
    ON CONFLICT (external_id) DO UPDATE SET external_id = EXCLUDED.external_id
    RETURNING id`, [randomUUID(), externalId]);
  return result.rows[0]!;
}
