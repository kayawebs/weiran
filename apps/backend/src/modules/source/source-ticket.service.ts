import { createHash, randomUUID } from "node:crypto";
import { EncryptJWT, jwtDecrypt } from "jose";
import { z } from "zod";
import { env } from "../../config/env.js";

const sourceTicketSchema = z.object({
  sourceUrl: z.string().url(),
  requestHeaders: z.record(z.string()).default({}),
  mimeType: z.string().min(3).max(100),
  filename: z.string().min(1).max(180)
});

export type SourceTicketPayload = z.infer<typeof sourceTicketSchema>;

export class SourceTicketError extends Error {
  readonly code = "SOURCE_TICKET_INVALID";
  readonly statusCode = 401;

  constructor() { super("Source media ticket is invalid or expired"); }
}

function encryptionKey(): Uint8Array {
  if (!env.JWT_SECRET) throw Object.assign(new Error("Source ticket encryption is not configured"), { code: "AUTH_NOT_CONFIGURED" });
  return createHash("sha256")
    .update("weiran-lab/source-media-ticket/v1\0")
    .update(env.JWT_SECRET)
    .digest();
}

const issuer = `${env.JWT_ISSUER}:source-media`;
const audience = `${env.JWT_AUDIENCE}:source-media`;

export class SourceTicketService {
  async create(payload: SourceTicketPayload): Promise<string> {
    const validated = sourceTicketSchema.parse(payload);
    return new EncryptJWT(validated)
      .setProtectedHeader({ alg: "dir", enc: "A256GCM", typ: "source-media+jwt" })
      .setIssuer(issuer)
      .setAudience(audience)
      .setJti(randomUUID())
      .setIssuedAt()
      .setExpirationTime(`${env.DOWNLOAD_URL_TTL_SECONDS}s`)
      .encrypt(encryptionKey());
  }

  async read(ticket: string): Promise<SourceTicketPayload> {
    try {
      const result = await jwtDecrypt(ticket, encryptionKey(), {
        issuer,
        audience,
        keyManagementAlgorithms: ["dir"],
        contentEncryptionAlgorithms: ["A256GCM"]
      });
      return sourceTicketSchema.parse(result.payload);
    } catch {
      throw new SourceTicketError();
    }
  }
}
