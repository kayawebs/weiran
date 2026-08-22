export type MediaStream = {
  url: string;
  mimeType: string;
  quality?: string;
  label?: string;
  width?: number;
  height?: number;
  requestHeaders?: Record<string, string>;
  watermarked?: boolean;
};

export type MediaItem = {
  id: string;
  mediaType: "image" | "video" | "audio" | "unknown";
  title: string | null;
  cover: string | null;
  duration: number | null;
  streams: MediaStream[];
};

export type MediaSource = {
  extractorId: string;
  originalUrl: string;
  title: string | null;
  items: MediaItem[];
};

export interface SourceExtractor {
  readonly id: string;
  canHandle(url: URL): boolean;
  extract(url: URL): Promise<MediaSource>;
}

export class UnsupportedSourceError extends Error {
  readonly code = "UNSUPPORTED_SOURCE";

  constructor(url: string) {
    super(`No enabled extractor supports this URL: ${url}`);
  }
}

export class ExtractorRegistry {
  constructor(private readonly extractors: SourceExtractor[]) {}

  async extract(rawUrl: string): Promise<MediaSource> {
    const url = new URL(rawUrl);
    const extractor = this.extractors.find((candidate) => candidate.canHandle(url));
    if (!extractor) throw new UnsupportedSourceError(rawUrl);
    return extractor.extract(url);
  }
}
