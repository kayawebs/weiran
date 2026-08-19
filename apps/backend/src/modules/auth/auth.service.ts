import { SignJWT, jwtVerify } from "jose";
import { z } from "zod";
import { env } from "../../config/env.js";
import { pool } from "../../db/client.js";
import { findOrCreateUserByExternalId } from "../../shared/users.js";

const wechatResponseSchema = z.object({
  openid: z.string().min(1).optional(),
  unionid: z.string().min(1).optional(),
  errcode: z.number().optional(),
  errmsg: z.string().optional()
});

export class AuthenticationError extends Error {
  constructor(message: string, readonly code: string = "UNAUTHENTICATED") { super(message); }
}

function signingKey(): Uint8Array {
  if (!env.JWT_SECRET) throw new AuthenticationError("JWT is not configured", "AUTH_NOT_CONFIGURED");
  return new TextEncoder().encode(env.JWT_SECRET);
}

export type AccessToken = { accessToken: string; expiresInSeconds: number; userId: string };

export class AuthService {
  async loginWithWechatCode(code: string): Promise<AccessToken> {
    if (!env.WECHAT_APP_ID || !env.WECHAT_APP_SECRET) {
      throw new AuthenticationError("WeChat login is not configured", "AUTH_NOT_CONFIGURED");
    }
    const url = new URL("https://api.weixin.qq.com/sns/jscode2session");
    url.search = new URLSearchParams({
      appid: env.WECHAT_APP_ID,
      secret: env.WECHAT_APP_SECRET,
      js_code: code,
      grant_type: "authorization_code"
    }).toString();
    const response = await fetch(url, { signal: AbortSignal.timeout(10_000) });
    if (!response.ok) throw new AuthenticationError("WeChat identity service is unavailable", "WECHAT_AUTH_UNAVAILABLE");
    const body: unknown = await response.json();
    const session = wechatResponseSchema.parse(body);
    if (!session.openid) {
      throw new AuthenticationError(session.errmsg || "WeChat login code is invalid or expired", "WECHAT_LOGIN_FAILED");
    }
    const user = await findOrCreateUserByExternalId(pool, `wechat:${session.openid}`);
    const accessToken = await new SignJWT({ provider: "wechat" })
      .setProtectedHeader({ alg: "HS256", typ: "JWT" })
      .setIssuer(env.JWT_ISSUER)
      .setAudience(env.JWT_AUDIENCE)
      .setSubject(user.id)
      .setIssuedAt()
      .setExpirationTime(`${env.JWT_TTL_SECONDS}s`)
      .sign(signingKey());
    return { accessToken, expiresInSeconds: env.JWT_TTL_SECONDS, userId: user.id };
  }

  async verifyAccessToken(token: string): Promise<{ userId: string }> {
    try {
      const result = await jwtVerify(token, signingKey(), {
        issuer: env.JWT_ISSUER,
        audience: env.JWT_AUDIENCE,
        algorithms: ["HS256"]
      });
      if (!result.payload.sub) throw new AuthenticationError("Token subject is missing");
      return { userId: result.payload.sub };
    } catch (error) {
      if (error instanceof AuthenticationError) throw error;
      throw new AuthenticationError("Access token is invalid or expired");
    }
  }
}
