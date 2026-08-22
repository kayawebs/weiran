import { marketConfig } from "../config/market";

export type SourcePlatformId = "dola" | "dreamina" | "jimeng";

type LocalizedText = { en: string; "zh-CN": string };
const text = (en: string, zh: string): LocalizedText => ({ en, "zh-CN": zh });

type SourcePlatformDefinition = {
  id: SourcePlatformId;
  toolId: string;
  path: string;
  name: string;
  mark: string;
  logo: string;
  placeholder: string;
  eyebrow: LocalizedText;
  title: LocalizedText;
  description: LocalizedText;
  supported: LocalizedText;
  urlTitle: LocalizedText;
  urlHint: LocalizedText;
  fieldLabel: LocalizedText;
  invalid: LocalizedText;
  isValidUrl: (url: URL) => boolean;
};

export type SourcePlatform = Omit<SourcePlatformDefinition, "eyebrow" | "title" | "description" | "supported" | "urlTitle" | "urlHint" | "fieldLabel" | "invalid"> & {
  eyebrow: string;
  title: string;
  description: string;
  supported: string;
  urlTitle: string;
  urlHint: string;
  fieldLabel: string;
  invalid: string;
};

const hostIs = (url: URL, host: string) => url.hostname.toLowerCase() === host;

const definitions: Record<SourcePlatformId, SourcePlatformDefinition> = {
  dola: {
    id: "dola",
    toolId: "dola-video",
    path: "/download/dola",
    name: "Dola",
    mark: "D",
    logo: "/logos/dola.png",
    placeholder: "https://www.dola.com/thread/...",
    eyebrow: text("VIDEO · DOLA", "视频 · DOLA"),
    title: text("Get the clean source.", "获取无水印源视频。"),
    description: text("Paste a public Dola thread URL. We resolve every available original video and prepare secure downloads.", "粘贴公开 Dola Thread 链接，解析其中全部原始视频并生成安全下载地址。"),
    supported: text("DOLA SUPPORTED", "已支持 DOLA"),
    urlTitle: text("Paste the thread URL", "粘贴 Thread 链接"),
    urlHint: text("One thread can contain multiple videos.", "一个 Thread 可能包含多个视频。"),
    fieldLabel: text("Public Dola URL", "Dola 公开链接"),
    invalid: text("Paste a valid public Dola thread URL.", "请粘贴有效的 Dola 公开 Thread 链接。"),
    isValidUrl: (url) => url.protocol === "https:" && ["dola.com", "www.dola.com"].includes(url.hostname.toLowerCase()) && /^\/thread\/[A-Za-z0-9_-]+\/?$/.test(url.pathname)
  },
  dreamina: {
    id: "dreamina",
    toolId: "dreamina-video",
    path: "/download/dreamina",
    name: "Dreamina / CapCut",
    mark: "DR",
    logo: "/logos/jimeng.png",
    placeholder: "https://dreamina.capcut.com/ai-tool/work-detail/...",
    eyebrow: text("VIDEO · DREAMINA", "视频 · DREAMINA"),
    title: text("Download the original Dreamina video.", "下载 Dreamina 原始视频。"),
    description: text("Paste a public Dreamina or CapCut AI work-detail URL to preview and download the original MP4.", "粘贴公开 Dreamina 或 CapCut AI 作品详情链接，预览并下载原始 MP4。"),
    supported: text("DREAMINA SUPPORTED", "已支持 DREAMINA"),
    urlTitle: text("Paste the work-detail URL", "粘贴作品详情链接"),
    urlHint: text("The public work page contains one original creator video.", "公开作品页中包含一个创作者原始视频。"),
    fieldLabel: text("Dreamina work URL", "Dreamina 作品链接"),
    invalid: text("Paste a valid public Dreamina work-detail URL.", "请粘贴有效的 Dreamina 公开作品详情链接。"),
    isValidUrl: (url) => url.protocol === "https:" && hostIs(url, "dreamina.capcut.com") && /^\/ai-tool\/work-detail\/[A-Za-z0-9_-]+\/?$/.test(url.pathname)
  },
  jimeng: {
    id: "jimeng",
    toolId: "jimeng-video",
    path: "/download/jimeng",
    name: "Jimeng / Seedance",
    mark: "JM",
    logo: "/logos/jimeng.png",
    placeholder: "https://jimeng.jianying.com/s/...",
    eyebrow: text("VIDEO · JIMENG", "视频 · 即梦"),
    title: text("Download the original Jimeng video.", "下载即梦原始视频。"),
    description: text("Paste a public Jimeng / Seedance share link to resolve the original creator MP4.", "粘贴公开即梦 / Seedance 分享链接，解析创作者原始 MP4。"),
    supported: text("JIMENG SUPPORTED", "已支持即梦"),
    urlTitle: text("Paste the Jimeng share link", "粘贴即梦分享链接"),
    urlHint: text("The work must be published or shared publicly first.", "作品需要先发布或生成公开分享。"),
    fieldLabel: text("Jimeng public URL", "即梦公开链接"),
    invalid: text("Paste a valid public Jimeng /s/ share URL.", "请粘贴有效的即梦 /s/ 公开分享链接。"),
    isValidUrl: (url) => url.protocol === "https:" && hostIs(url, "jimeng.jianying.com") && /^(?:\/s\/[A-Za-z0-9_-]+|\/ai-tool\/work-detail\/[A-Za-z0-9_-]+)\/?$/.test(url.pathname)
  }
};

export function sourcePlatformFor(id: SourcePlatformId): SourcePlatform {
  const definition = definitions[id];
  const locale = marketConfig.locale;
  return {
    ...definition,
    eyebrow: definition.eyebrow[locale],
    title: definition.title[locale],
    description: definition.description[locale],
    supported: definition.supported[locale],
    urlTitle: definition.urlTitle[locale],
    urlHint: definition.urlHint[locale],
    fieldLabel: definition.fieldLabel[locale],
    invalid: definition.invalid[locale]
  };
}
