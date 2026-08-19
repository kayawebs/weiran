import { createReadStream } from "node:fs";
import { mkdir } from "node:fs/promises";
import { dirname } from "node:path";
import OSS from "ali-oss";
import { env } from "../../config/env.js";

type ObjectHead = { res?: { headers?: Record<string, string | string[] | undefined> } };
type PostSignature = { OSSAccessKeyId: string; policy: string; Signature: string; securityToken?: string };

/**
 * Alibaba Cloud OSS adapter. The bucket is provisioned outside the application;
 * its RAM principal is limited to this product's object prefixes.
 */
export class StorageService {
  private readonly client = new OSS({
    region: env.OSS_REGION,
    bucket: env.OSS_BUCKET,
    accessKeyId: env.OSS_ACCESS_KEY_ID,
    accessKeySecret: env.OSS_ACCESS_KEY_SECRET,
    endpoint: env.OSS_INTERNAL_ENDPOINT,
    secure: true
  });

  async ensureBucket(): Promise<void> {
    // OSS bucket creation and lifecycle policies are infrastructure concerns.
    // This no-op preserves a common bootstrap interface without granting the API
    // broad oss:CreateBucket permission.
  }

  async createUploadPost(storageKey: string, contentType: string): Promise<{ url: string; fields: Record<string, string> }> {
    const policy = {
      expiration: new Date(Date.now() + env.UPLOAD_URL_TTL_SECONDS * 1_000).toISOString(),
      conditions: [
        ["content-length-range", 1, env.MAX_UPLOAD_BYTES],
        { bucket: env.OSS_BUCKET },
        { key: storageKey }
      ]
    };
    const signature = await this.client.calculatePostSignature(policy) as unknown as PostSignature;
    const fields: Record<string, string> = {
      key: storageKey,
      OSSAccessKeyId: signature.OSSAccessKeyId,
      policy: signature.policy,
      Signature: signature.Signature,
      success_action_status: "204",
      "Content-Type": contentType
    };
    if (signature.securityToken) fields["x-oss-security-token"] = signature.securityToken;
    return { url: this.publicBucketUrl(), fields };
  }

  async createDownloadUrl(storageKey: string): Promise<string> {
    // This client uses the public OSS endpoint for generated client-facing URLs.
    const publicClient = new OSS({
      region: env.OSS_REGION,
      bucket: env.OSS_BUCKET,
      accessKeyId: env.OSS_ACCESS_KEY_ID,
      accessKeySecret: env.OSS_ACCESS_KEY_SECRET,
      secure: true
    });
    return publicClient.signatureUrl(storageKey, { expires: env.DOWNLOAD_URL_TTL_SECONDS, method: "GET" });
  }

  async headObject(storageKey: string): Promise<{ byteSize: number; contentType: string | undefined }> {
    const result = await this.client.head(storageKey) as unknown as ObjectHead;
    const headers = result.res?.headers ?? {};
    const rawLength = headers["content-length"];
    const byteSize = Number(Array.isArray(rawLength) ? rawLength[0] : rawLength);
    if (!Number.isFinite(byteSize) || byteSize < 0) throw new Error(`OSS object ${storageKey} has no valid length`);
    const rawType = headers["content-type"];
    return { byteSize, contentType: Array.isArray(rawType) ? rawType[0] : rawType };
  }

  async downloadToFile(storageKey: string, destination: string): Promise<void> {
    await mkdir(dirname(destination), { recursive: true });
    await this.client.get(storageKey, destination);
  }

  async uploadFile(storageKey: string, sourceFile: string, contentType: string): Promise<void> {
    await this.client.put(storageKey, createReadStream(sourceFile), {
      headers: { "Content-Type": contentType, "x-oss-forbid-overwrite": "true" }
    });
  }

  private publicBucketUrl(): string {
    return `https://${env.OSS_BUCKET}.${env.OSS_REGION}.aliyuncs.com`;
  }
}
