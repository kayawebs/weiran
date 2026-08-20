const publicMessages: Record<string, string> = {
  AUTH_NOT_CONFIGURED: "Authentication is temporarily unavailable.",
  CLEAN_SOURCE_UNAVAILABLE: "The original video is temporarily unavailable.",
  DOLA_CLEAN_SOURCE_UNAVAILABLE: "The original Dola video is temporarily unavailable.",
  DOLA_EXTRACTION_FAILED: "The Dola thread could not be scanned right now.",
  DOLA_NO_VIDEO: "No downloadable videos were found in this public Dola thread.",
  INVALID_DOLA_URL: "Enter a valid public Dola thread URL.",
  PROCESSING_FAILED: "Media processing could not be completed. Please try again later.",
  SOURCE_DELIVERY_FAILED: "The source video could not be delivered right now.",
  SOURCE_DOWNLOAD_FAILED: "The source video could not be downloaded right now.",
  SOURCE_RESOLVE_FAILED: "The source page could not be scanned right now.",
  SOURCE_TICKET_INVALID: "This media link is invalid or has expired.",
  SOURCE_TOO_LARGE: "The source media exceeds the supported size limit.",
  UNSAFE_SOURCE_URL: "The source media URL is not allowed.",
  UNAUTHENTICATED: "Your session is invalid or has expired.",
  UNSUPPORTED_SOURCE: "This source platform is not supported yet.",
  WEB_GUEST_AUTH_DISABLED: "Guest access is not available.",
  WECHAT_AUTH_UNAVAILABLE: "WeChat login is temporarily unavailable.",
  WECHAT_LOGIN_FAILED: "The WeChat login code is invalid or has expired."
};

const knownCodes = new Set(Object.keys(publicMessages));

export function publicErrorCode(error: unknown, fallback = "PROCESSING_FAILED"): string {
  const code = typeof (error as { code?: unknown })?.code === "string"
    ? (error as { code: string }).code
    : fallback;
  return knownCodes.has(code) ? code : fallback;
}

export function publicErrorMessage(code: string | null | undefined): string {
  return publicMessages[code ?? ""] ?? publicMessages.PROCESSING_FAILED!;
}
