import type { FastifyRequest } from "fastify";
import { env } from "../config/env.js";
import { AuthService, AuthenticationError } from "../modules/auth/auth.service.js";

declare module "fastify" {
  interface FastifyRequest { userId: string; }
}

const authService = new AuthService();

export async function requireAuthentication(request: FastifyRequest): Promise<void> {
  const authorization = request.headers.authorization;
  const token = authorization?.startsWith("Bearer ") ? authorization.slice("Bearer ".length).trim() : undefined;
  if (token) {
    request.userId = (await authService.verifyAccessToken(token)).userId;
    return;
  }
  if (env.ALLOW_INSECURE_DEV_AUTH) {
    request.userId = env.DEVELOPMENT_USER_ID;
    return;
  }
  throw Object.assign(new AuthenticationError("Authentication is required"), { statusCode: 401 });
}
