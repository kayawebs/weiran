import "dotenv/config";
import { z } from "zod";

const booleanFromEnv = z.enum(["true", "false"]).transform((value) => value === "true");
const optionalEnvString = (schema: z.ZodString) => z.preprocess(
  (value) => value === "" ? undefined : value,
  schema.optional()
);

const envSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  DEPLOYMENT_MARKET: z.enum(["cn", "global"]).default("global"),
  API_HOST: z.string().default("0.0.0.0"),
  API_PORT: z.coerce.number().int().positive().default(3000),
  LOG_LEVEL: z.enum(["fatal", "error", "warn", "info", "debug", "trace"]).default("info"),
  TRUST_PROXY: booleanFromEnv.default("false"),
  CORS_ORIGINS: optionalEnvString(z.string()),
  RATE_LIMIT_MAX: z.coerce.number().int().min(10).max(10000).default(300),
  RATE_LIMIT_WINDOW_MS: z.coerce.number().int().min(1000).max(60 * 60 * 1000).default(60_000),
  ALLOW_INSECURE_DEV_AUTH: booleanFromEnv.default("true"),
  ENABLE_WEB_GUEST_AUTH: booleanFromEnv.default("false"),
  DEVELOPMENT_USER_ID: z.string().uuid().default("00000000-0000-4000-8000-000000000001"),
  WECHAT_APP_ID: optionalEnvString(z.string().min(1)),
  WECHAT_APP_SECRET: optionalEnvString(z.string().min(1)),
  JWT_SECRET: optionalEnvString(z.string().min(32)),
  JWT_ISSUER: z.string().min(1).default("ai-creator-tools"),
  JWT_AUDIENCE: z.string().min(1).default("ai-creator-tools-miniprogram"),
  JWT_TTL_SECONDS: z.coerce.number().int().min(300).max(60 * 60 * 24 * 30).default(60 * 60 * 24 * 7),
  DATABASE_URL: z.string().url(),
  REDIS_URL: z.string().url(),
  TASK_MAX_ATTEMPTS: z.coerce.number().int().min(1).max(10).default(3),
  WORKER_CONCURRENCY: z.coerce.number().int().min(1).max(16).default(2),
  OSS_REGION: z.string().regex(/^oss-[a-z0-9-]+$/),
  OSS_BUCKET: z.string().regex(/^[a-z0-9][a-z0-9-]{1,61}[a-z0-9]$/),
  OSS_ACCESS_KEY_ID: z.string().min(1),
  OSS_ACCESS_KEY_SECRET: z.string().min(1),
  OSS_INTERNAL_ENDPOINT: optionalEnvString(z.string().url()),
  OSS_REQUEST_TIMEOUT_MS: z.coerce.number().int().min(10_000).max(15 * 60 * 1_000).default(120_000),
  OSS_MULTIPART_THRESHOLD_BYTES: z.coerce.number().int().min(1024 * 1024).max(5 * 1024 * 1024 * 1024).default(8 * 1024 * 1024),
  OSS_MULTIPART_PART_SIZE_BYTES: z.coerce.number().int().min(100 * 1024).max(100 * 1024 * 1024).default(1024 * 1024),
  OSS_MULTIPART_PARALLEL: z.coerce.number().int().min(1).max(8).default(3),
  UPLOAD_URL_TTL_SECONDS: z.coerce.number().int().min(60).max(3600).default(900),
  DOWNLOAD_URL_TTL_SECONDS: z.coerce.number().int().min(60).max(3600).default(900),
  MAX_UPLOAD_BYTES: z.coerce.number().int().positive().max(5 * 1024 * 1024 * 1024).default(524288000)
}).superRefine((configuration, context) => {
  if (configuration.NODE_ENV === "production" && configuration.ALLOW_INSECURE_DEV_AUTH) {
    context.addIssue({ code: z.ZodIssueCode.custom, message: "ALLOW_INSECURE_DEV_AUTH must be false in production" });
  }
  if (configuration.NODE_ENV === "production" && !configuration.JWT_SECRET) {
    context.addIssue({ code: z.ZodIssueCode.custom, message: "JWT_SECRET is required in production" });
  }
  if (configuration.NODE_ENV === "production" && configuration.DEPLOYMENT_MARKET === "cn" && (!configuration.WECHAT_APP_ID || !configuration.WECHAT_APP_SECRET)) {
    context.addIssue({ code: z.ZodIssueCode.custom, message: "WeChat credentials are required for the cn deployment" });
  }
});

export const env = envSchema.parse(process.env);
