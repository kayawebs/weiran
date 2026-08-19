import { randomUUID } from "node:crypto";
import type { Pool, PoolClient } from "pg";

type Queryable = Pool | PoolClient;

export async function ensureUser(db: Queryable, userId: string): Promise<void> {
  await db.query(`INSERT INTO users (id, external_id) VALUES ($1, $1)
    ON CONFLICT (id) DO NOTHING`, [userId]);
}

export async function findOrCreateUserByExternalId(db: Queryable, externalId: string): Promise<{ id: string }> {
  const result = await db.query<{ id: string }>(`INSERT INTO users (id, external_id)
    VALUES ($1, $2)
    ON CONFLICT (external_id) DO UPDATE SET external_id = EXCLUDED.external_id
    RETURNING id`, [randomUUID(), externalId]);
  return result.rows[0]!;
}
