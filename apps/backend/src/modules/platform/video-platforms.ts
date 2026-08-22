export const videoPlatformIds = ["dola", "dreamina", "jimeng", "douyin"] as const;
export type VideoPlatformId = (typeof videoPlatformIds)[number];

type PlatformWatermarkRegion = { x: number; y: number; width: number; height: number };

export type VideoPlatformDefinition = {
  id: VideoPlatformId;
  name: string;
  description: string;
  urlPlaceholder: string;
  extractorId: string;
  urlPattern: RegExp;
  allowedHosts: readonly string[];
  invalidUrlMessage: string;
  requiresCleanSource: boolean;
  watermarkRegions: PlatformWatermarkRegion[];
};

const platformDefinitions: Record<VideoPlatformId, VideoPlatformDefinition> = {
  dola: {
    id: "dola",
    name: "Dola",
    description: "提取公开 Thread 中的全部原画视频",
    urlPlaceholder: "https://www.dola.com/thread/...",
    extractorId: "dola",
    urlPattern: /^\/thread\/[A-Za-z0-9_-]+\/?$/,
    allowedHosts: ["dola.com", "www.dola.com"],
    invalidUrlMessage: "Enter a public Dola thread URL",
    requiresCleanSource: true,
    watermarkRegions: []
  },
  dreamina: {
    id: "dreamina",
    name: "Dreamina / CapCut",
    description: "提取公开 Dreamina Work Detail 中的原始视频",
    urlPlaceholder: "https://dreamina.capcut.com/ai-tool/work-detail/...",
    extractorId: "dreamina",
    urlPattern: /^\/ai-tool\/work-detail\/[A-Za-z0-9_-]+\/?$/,
    allowedHosts: ["dreamina.capcut.com"],
    invalidUrlMessage: "Enter a public Dreamina work-detail URL",
    requiresCleanSource: true,
    watermarkRegions: []
  },
  jimeng: {
    id: "jimeng",
    name: "Jimeng / Seedance",
    description: "提取公开即梦分享链接中的原始视频",
    urlPlaceholder: "https://jimeng.jianying.com/s/...",
    extractorId: "jimeng",
    urlPattern: /^(?:\/s\/[A-Za-z0-9_-]+|\/ai-tool\/work-detail\/[A-Za-z0-9_-]+)\/?$/,
    allowedHosts: ["jimeng.jianying.com"],
    invalidUrlMessage: "Enter a public Jimeng share URL",
    requiresCleanSource: true,
    watermarkRegions: []
  },
  douyin: {
    id: "douyin",
    name: "Douyin",
    description: "从公开抖音分享文案或视频链接提取无水印视频",
    urlPlaceholder: "粘贴抖音分享文案或 https://v.douyin.com/...",
    extractorId: "douyin",
    urlPattern: /^(?:\/video\/\d+|\/share\/video\/\d+|\/[A-Za-z0-9_-]+)\/?$/,
    allowedHosts: ["douyin.com", "www.douyin.com", "v.douyin.com", "iesdouyin.com", "www.iesdouyin.com"],
    invalidUrlMessage: "Paste Douyin share text or a public Douyin video URL",
    requiresCleanSource: true,
    watermarkRegions: []
  }
};

function hostAllowed(hostname: string, hosts: readonly string[]): boolean {
  const normalized = hostname.toLowerCase();
  return hosts.some((host) => normalized === host || normalized.endsWith(`.${host}`));
}

export function matchesVideoPlatformUrl(id: VideoPlatformId, rawUrl: string): boolean {
  try {
    const url = extractFirstPublicUrl(rawUrl);
    if (!url) return false;
    const platform = getVideoPlatform(id);
    return url.protocol === "https:" && hostAllowed(url.hostname, platform.allowedHosts) && platform.urlPattern.test(url.pathname);
  } catch {
    return false;
  }
}

/** Extracts the first HTTP(S) URL from copied share text without trusting the surrounding copy. */
export function extractFirstPublicUrl(rawInput: string): URL | null {
  const match = rawInput.match(/https?:\/\/[^\s<>"'，。！？；：、]+/i);
  if (!match) return null;
  const candidate = match[0].replace(/[)\]}>）》】]+$/u, "");
  try {
    const url = new URL(candidate);
    return url.protocol === "https:" || url.protocol === "http:" ? url : null;
  } catch {
    return null;
  }
}

export function getVideoPlatform(id: VideoPlatformId): VideoPlatformDefinition {
  return platformDefinitions[id];
}

export function listVideoPlatforms(): VideoPlatformDefinition[] {
  return videoPlatformIds.map((id) => platformDefinitions[id]);
}
