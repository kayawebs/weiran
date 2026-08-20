import { randomBytes } from "node:crypto";
import { Redis } from "ioredis";
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

export class SourceTicketService {
  private readonly redis = new Redis(env.REDIS_URL, { maxRetriesPerRequest: null });
  private readonly keyPrefix = "source-media-ticket:";

  async create(payload: SourceTicketPayload): Promise<string> {
    const validated = sourceTicketSchema.parse(payload);
    const serialized = JSON.stringify(validated);
    for (let attempt = 0; attempt < 3; attempt += 1) {
      const ticket = randomBytes(32).toString("base64url");
      const stored = await this.redis.set(
        `${this.keyPrefix}${ticket}`,
        serialized,
        "EX",
        env.DOWNLOAD_URL_TTL_SECONDS,
        "NX"
      );
      if (stored === "OK") return ticket;
    }
    throw Object.assign(new Error("Could not allocate a source media ticket"), { code: "SOURCE_TICKET_STORE_FAILED" });
  }

  async read(ticket: string): Promise<SourceTicketPayload> {
    const serialized = await this.redis.get(`${this.keyPrefix}${ticket}`);
    if (!serialized) throw new SourceTicketError();
    try {
      return sourceTicketSchema.parse(JSON.parse(serialized) as unknown);
    } catch {
      throw new SourceTicketError();
    }
  }

  async close(): Promise<void> {
    if (this.redis.status !== "end") await this.redis.quit();
  }
}
