import type { Pool, PoolClient } from "pg";
import type { AssetUploadStatus, MediaAsset, MediaType } from "./storage.types.js";

type Queryable = Pool | PoolClient;
type AssetRow = {
  id: string; user_id: string; storage_key: string; media_type: MediaType; mime_type: string;
  byte_size: string | null; original_filename: string | null; upload_status: AssetUploadStatus;
  metadata: Record<string, unknown>; created_at: Date;
};

const returning = "id, user_id, storage_key, media_type, mime_type, byte_size, original_filename, upload_status, metadata, created_at";

function toAsset(row: AssetRow): MediaAsset {
  return {
    id: row.id, userId: row.user_id, storageKey: row.storage_key, mediaType: row.media_type,
    mimeType: row.mime_type, byteSize: row.byte_size === null ? null : Number(row.byte_size),
    originalFilename: row.original_filename, uploadStatus: row.upload_status, metadata: row.metadata, createdAt: row.created_at
  };
}

export class AssetRepository {
  constructor(private readonly db: Queryable) {}

  async create(asset: Omit<MediaAsset, "createdAt" | "uploadStatus">): Promise<MediaAsset> {
    const result = await this.db.query<AssetRow>(`INSERT INTO media_assets
      (id, user_id, storage_key, media_type, mime_type, byte_size, original_filename, metadata)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8::jsonb)
      RETURNING ${returning}`,
    [asset.id, asset.userId, asset.storageKey, asset.mediaType, asset.mimeType, asset.byteSize,
      asset.originalFilename, JSON.stringify(asset.metadata)]);
    return toAsset(result.rows[0]!);
  }

  async findById(assetId: string, userId?: string): Promise<MediaAsset | null> {
    const result = await this.db.query<AssetRow>(`SELECT ${returning} FROM media_assets
      WHERE id = $1${userId ? " AND user_id = $2" : ""}`, userId ? [assetId, userId] : [assetId]);
    return result.rows[0] ? toAsset(result.rows[0]) : null;
  }

  async markReady(assetId: string, userId: string, byteSize: number): Promise<MediaAsset | null> {
    const result = await this.db.query<AssetRow>(`UPDATE media_assets
      SET upload_status = 'READY', byte_size = $3
      WHERE id = $1 AND user_id = $2 AND upload_status = 'PENDING'
      RETURNING ${returning}`, [assetId, userId, byteSize]);
    return result.rows[0] ? toAsset(result.rows[0]) : null;
  }
}
