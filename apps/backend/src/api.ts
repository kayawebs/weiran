import Fastify from "fastify";
import cors from "@fastify/cors";
import rateLimit from "@fastify/rate-limit";
import { env } from "./config/env.js";
import { closeDatabase } from "./db/client.js";
import { registerRoutes } from "./http/routes.js";
import { StorageService } from "./modules/storage/storage.service.js";
import { closeTaskQueue } from "./modules/task/task.queue.js";

const app = Fastify({ logger: { level: env.LOG_LEVEL }, trustProxy: env.TRUST_PROXY });
const productionOrigins = env.CORS_ORIGINS?.split(",").map((origin) => origin.trim()).filter(Boolean) ?? [];
await app.register(cors, { origin: env.NODE_ENV === "production" ? productionOrigins : true });
await app.register(rateLimit, {
  max: env.RATE_LIMIT_MAX,
  timeWindow: env.RATE_LIMIT_WINDOW_MS,
  errorResponseBuilder: (_request, context) => ({
    statusCode: 429,
    code: "RATE_LIMITED",
    message: `Too many requests. Try again in ${context.after}.`
  })
});
await registerRoutes(app);
await new StorageService().ensureBucket();

async function shutdown(signal: string): Promise<void> {
  app.log.info({ signal }, "Shutting down API");
  await app.close();
  await closeTaskQueue();
  await closeDatabase();
  process.exit(0);
}

process.on("SIGINT", () => void shutdown("SIGINT"));
process.on("SIGTERM", () => void shutdown("SIGTERM"));

try {
  await app.listen({ host: env.API_HOST, port: env.API_PORT });
} catch (error) {
  app.log.error(error);
  process.exit(1);
}
