export const videoPlatformIds = ["dola"] as const;
export type VideoPlatformId = (typeof videoPlatformIds)[number];

type PlatformWatermarkRegion = { x: number; y: number; width: number; height: number };

export type VideoPlatformDefinition = {
  id: VideoPlatformId;
  name: string;
  description: string;
  urlPlaceholder: string;
  extractorId: string;
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
    requiresCleanSource: true,
    watermarkRegions: []
  }
};

export function getVideoPlatform(id: VideoPlatformId): VideoPlatformDefinition {
  return platformDefinitions[id];
}

export function listVideoPlatforms(): VideoPlatformDefinition[] {
  return videoPlatformIds.map((id) => platformDefinitions[id]);
}
