export type Market = "cn" | "global";
export type Locale = "zh-CN" | "en";
export type AdPlacement = "home-footer" | "tools-inline" | "result-footer";

function resolveMarket(value: string | undefined): Market {
  if (!value || value === "global") return "global";
  if (value === "cn") return "cn";
  throw new Error(`Unsupported VITE_MARKET: ${value}`);
}

const market = resolveMarket(import.meta.env.VITE_MARKET as string | undefined);

export const marketConfig = {
  market,
  locale: (market === "cn" ? "zh-CN" : "en") as Locale,
  brandName: market === "cn" ? "未然Lab" : "Weiran Lab",
  ads: {
    provider: (import.meta.env.VITE_WEB_AD_PROVIDER as string | undefined) ?? "none",
    slots: {
      "home-footer": (import.meta.env.VITE_AD_SLOT_HOME as string | undefined) ?? "",
      "tools-inline": (import.meta.env.VITE_AD_SLOT_TOOLS as string | undefined) ?? "",
      "result-footer": (import.meta.env.VITE_AD_SLOT_RESULT as string | undefined) ?? ""
    } satisfies Record<AdPlacement, string>
  }
} as const;
