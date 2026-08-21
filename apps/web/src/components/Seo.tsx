import { useEffect } from "react";
import { marketConfig } from "../config/market";

type Props = {
  title: string;
  description: string;
  path?: string;
  noIndex?: boolean;
};

function setMeta(selector: string, attributes: Record<string, string>): void {
  let element = document.head.querySelector<HTMLMetaElement>(selector);
  if (!element) {
    element = document.createElement("meta");
    document.head.appendChild(element);
  }
  for (const [name, value] of Object.entries(attributes)) element.setAttribute(name, value);
}

export function Seo({ title, description, path = "/", noIndex = false }: Props) {
  useEffect(() => {
    const fullTitle = `${title} — ${marketConfig.brandName}`;
    const canonicalUrl = new URL(path, `${marketConfig.siteUrl}/`).toString();
    document.title = fullTitle;
    setMeta('meta[name="description"]', { name: "description", content: description });
    setMeta('meta[name="robots"]', { name: "robots", content: noIndex ? "noindex, follow" : "index, follow" });
    setMeta('meta[property="og:title"]', { property: "og:title", content: fullTitle });
    setMeta('meta[property="og:description"]', { property: "og:description", content: description });
    setMeta('meta[property="og:url"]', { property: "og:url", content: canonicalUrl });
    let canonical = document.head.querySelector<HTMLLinkElement>('link[rel="canonical"]');
    if (!canonical) {
      canonical = document.createElement("link");
      canonical.rel = "canonical";
      document.head.appendChild(canonical);
    }
    canonical.href = canonicalUrl;
  }, [description, noIndex, path, title]);

  return null;
}
