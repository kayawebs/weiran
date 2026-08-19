import type { ComponentType } from "react";
import { marketConfig, type AdPlacement } from "../config/market";
import { copy } from "../i18n/copy";

export type AdAdapterProps = { placement: AdPlacement; slotId: string };
export type AdAdapter = ComponentType<AdAdapterProps>;

function NoAds() { return null; }

function HouseAd({ placement, slotId }: AdAdapterProps) {
  return <aside className="ad-slot" data-placement={placement} data-slot={slotId}><span>{copy.ads.label}</span><p>{copy.ads.houseText}</p></aside>;
}

// Add a provider module here when an ad network is selected. Pages only use AdSlot,
// so regional SDKs and consent requirements stay isolated from product features.
const adapters: Record<string, AdAdapter> = { none: NoAds, house: HouseAd };

export function AdSlot({ placement }: { placement: AdPlacement }) {
  const Adapter = adapters[marketConfig.ads.provider];
  const slotId = marketConfig.ads.slots[placement];
  if (!Adapter || marketConfig.ads.provider === "none" || !slotId) return null;
  return <Adapter placement={placement} slotId={slotId} />;
}
