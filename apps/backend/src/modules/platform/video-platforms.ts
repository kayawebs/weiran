export const videoPlatformIds = ["dola", "dreamina", "jimeng"] as const;
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
  }
};

function hostAllowed(hostname: string, hosts: readonly string[]): boolean {
  const normalized = hostname.toLowerCase();
  return hosts.some((host) => normalized === host || normalized.endsWith(`.${host}`));
}

export function matchesVideoPlatformUrl(id: VideoPlatformId, rawUrl: string): boolean {
  try {
    const url = new URL(rawUrl);
    const platform = getVideoPlatform(id);
    return url.protocol === "https:" && hostAllowed(url.hostname, platform.allowedHosts) && platform.urlPattern.test(url.pathname);
  } catch {
    return false;
  }
}

export function getVideoPlatform(id: VideoPlatformId): VideoPlatformDefinition {
  return platformDefinitions[id];
}

export function listVideoPlatforms(): VideoPlatformDefinition[] {
  return videoPlatformIds.map((id) => platformDefinitions[id]);
}
