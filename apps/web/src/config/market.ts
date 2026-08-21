export type Market = "cn" | "global";
export type Locale = "zh-CN" | "en";
export type AdPlacement = "home-inline" | "directory-inline" | "tool-top" | "result-footer" | "tool-bottom";

function resolveMarket(value: string | undefined): Market {
  if (!value || value === "global") return "global";
  if (value === "cn") return "cn";
  throw new Error(`Unsupported VITE_MARKET: ${value}`);
}

const market = resolveMarket(import.meta.env.VITE_MARKET as string | undefined);
const defaultSiteUrl = market === "cn" ? "https://weiranlab.xyz" : "https://weiran.art";

export const marketConfig = {
  market,
  locale: (market === "cn" ? "zh-CN" : "en") as Locale,
  brandName: market === "cn" ? "未然Lab" : "Weiran Lab",
  siteUrl: ((import.meta.env.VITE_PUBLIC_SITE_URL as string | undefined) ?? defaultSiteUrl).replace(/\/$/, ""),
  ads: {
    provider: (import.meta.env.VITE_WEB_AD_PROVIDER as string | undefined) ?? "none",
    clientId: (import.meta.env.VITE_ADSENSE_CLIENT_ID as string | undefined) ?? "",
    slots: {
      "home-inline": (import.meta.env.VITE_AD_SLOT_HOME as string | undefined) ?? "",
      "directory-inline": (import.meta.env.VITE_AD_SLOT_TOOLS as string | undefined) ?? "",
      "tool-top": (import.meta.env.VITE_AD_SLOT_TOOL_TOP as string | undefined) ?? (import.meta.env.VITE_AD_SLOT_TOOLS as string | undefined) ?? "",
      "result-footer": (import.meta.env.VITE_AD_SLOT_RESULT as string | undefined) ?? "",
      "tool-bottom": (import.meta.env.VITE_AD_SLOT_TOOL_BOTTOM as string | undefined) ?? (import.meta.env.VITE_AD_SLOT_RESULT as string | undefined) ?? ""
    } satisfies Record<AdPlacement, string>
  }
} as const;
