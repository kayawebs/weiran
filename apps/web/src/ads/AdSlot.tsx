import { useEffect, type ComponentType } from "react";
import { marketConfig, type AdPlacement } from "../config/market";
import { copy } from "../i18n/copy";

export type AdAdapterProps = { placement: AdPlacement; slotId: string };
export type AdAdapter = ComponentType<AdAdapterProps>;

function NoAds() { return null; }

function HouseAd({ placement, slotId }: AdAdapterProps) {
  return <aside className="ad-slot" data-placement={placement} data-slot={slotId}><span>{copy.ads.label}</span><p>{copy.ads.houseText}</p></aside>;
}

function AdsenseAd({ placement, slotId }: AdAdapterProps) {
  useEffect(() => {
    const clientId = marketConfig.ads.clientId;
    if (!clientId) return;
    const scriptId = "weiran-adsense-sdk";
    if (!document.getElementById(scriptId)) {
      const script = document.createElement("script");
      script.id = scriptId;
      script.async = true;
      script.crossOrigin = "anonymous";
      script.src = `https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${encodeURIComponent(clientId)}`;
      document.head.appendChild(script);
    }
    const timer = window.setTimeout(() => {
      try {
        const adsWindow = window as Window & { adsbygoogle?: unknown[] };
        (adsWindow.adsbygoogle ??= []).push({});
      } catch {
        // Ad blockers and consent tools may intentionally prevent initialization.
      }
    }, 0);
    return () => window.clearTimeout(timer);
  }, [slotId]);

  return (
    <aside className="ad-slot adsense-slot" data-placement={placement}>
      <span>{copy.ads.label}</span>
      <ins
        className="adsbygoogle"
        style={{ display: "block", width: "100%" }}
        data-ad-client={marketConfig.ads.clientId}
        data-ad-slot={slotId}
        data-ad-format="auto"
        data-full-width-responsive="true"
      />
    </aside>
  );
}

// Regional SDKs stay behind this adapter boundary. Global can use AdSense while
// the China deployment can select a different provider without changing pages.
const adapters: Record<string, AdAdapter> = { none: NoAds, house: HouseAd, adsense: AdsenseAd };

export function AdSlot({ placement }: { placement: AdPlacement }) {
  const Adapter = adapters[marketConfig.ads.provider];
  const slotId = marketConfig.ads.slots[placement];
  if (!Adapter || marketConfig.ads.provider === "none" || !slotId) return null;
  if (marketConfig.ads.provider === "adsense" && !marketConfig.ads.clientId) return null;
  return <Adapter placement={placement} slotId={slotId} />;
}
