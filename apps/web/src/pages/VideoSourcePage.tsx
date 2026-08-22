import { type FormEvent, useCallback, useEffect, useRef, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { AdSlot } from "../ads/AdSlot";
import { api, apiMediaUrl, ApiError } from "../api";
import { platformGuideFor } from "../catalog/platformGuides";
import { PageIntro } from "../components/PageIntro";
import { MoreToolsSection } from "../components/MoreToolsSection";
import { PlatformLinkGuide } from "../components/PlatformLinkGuide";
import { Seo } from "../components/Seo";
import { copy } from "../i18n/copy";
import type { ResolvedSource } from "../types";

function durationLabel(duration: number | null): string | null {
  if (duration == null) return null;
  const seconds = Math.round(duration);
  const minutes = Math.floor(seconds / 60);
  return `${minutes}:${String(seconds % 60).padStart(2, "0")}`;
}

function qualityLabel(quality: string, height: number | null): string {
  if (height) return `${height}P`;
  return quality === "source" ? copy.video.original : quality.toUpperCase();
}

export function VideoSourcePage() {
  const guide = platformGuideFor("dola-video");
  const [searchParams] = useSearchParams();
  const incomingUrl = searchParams.get("url") ?? "";
  const shouldAutoScan = searchParams.get("scan") === "1";
  const [url, setUrl] = useState(incomingUrl);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState<ResolvedSource | null>(null);
  const [previewId, setPreviewId] = useState<string | null>(null);
  const autoScanStarted = useRef(false);
  const resultsRef = useRef<HTMLElement | null>(null);

  const scanUrl = useCallback(async (sourceUrl: string) => {
    setError("");
    setSubmitting(true);
    try {
      const resolved = await api.resolveVideoSources(sourceUrl);
      setResult(resolved);
      setPreviewId(null);
    } catch (cause) {
      setError(cause instanceof ApiError ? cause.message : copy.video.startError);
    } finally {
      setSubmitting(false);
    }
  }, []);

  useEffect(() => {
    if (!shouldAutoScan || autoScanStarted.current || !/^https:\/\/(www\.)?dola\.com\/thread\/[A-Za-z0-9_-]+\/?(?:\?.*)?$/.test(incomingUrl)) return;
    autoScanStarted.current = true;
    void scanUrl(incomingUrl);
  }, [incomingUrl, scanUrl, shouldAutoScan]);

  useEffect(() => {
    if (!result) return;
    const frame = window.requestAnimationFrame(() => resultsRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }));
    return () => window.cancelAnimationFrame(frame);
  }, [result]);

  async function submit(event: FormEvent) {
    event.preventDefault();
    setError("");
    if (!/^https:\/\/(www\.)?dola\.com\/thread\/[A-Za-z0-9_-]+\/?(?:\?.*)?$/.test(url.trim())) {
      setError(copy.video.invalid);
      return;
    }
    await scanUrl(url.trim());
  }

  return (
    <>
      <Seo title={copy.video.title} description={copy.video.description} path="/download/dola" />
      <PageIntro compact eyebrow={copy.video.eyebrow} title={copy.video.title} description={copy.video.description} aside={<span className="platform-chip"><i /> {copy.video.supported}</span>} />
      <section className="tool-workspace compact-source-workspace">
        <form className="workspace-panel compact-source-panel" onSubmit={submit}>
          <header className="compact-source-header">
            <span className="platform-logo has-logo"><img src="/logos/dola.png" alt="" /></span>
            <div><p className="section-label">DOLA</p><h2>{copy.video.urlTitle}</h2><p>{copy.video.urlHint}</p></div>
          </header>
          {guide && <PlatformLinkGuide guide={guide} compact />}
          <div className="compact-source-input">
            <div>
              <label className="field-label" htmlFor="dola-url">{copy.video.fieldLabel}</label>
              <div className="url-field"><input id="dola-url" type="url" value={url} onChange={(event) => setUrl(event.target.value)} placeholder="https://www.dola.com/thread/..." autoComplete="url" /><span>URL</span></div>
            </div>
            <button className="primary-action" type="submit" disabled={submitting}>{submitting ? copy.video.starting : copy.video.submit}<span>→</span></button>
          </div>
          {error && <p className="form-error" role="alert">{error}</p>}
          <p className="fine-print compact-source-legal">{copy.video.legal}</p>
        </form>
      </section>
      {result && <section className="source-results compact-source-results" aria-live="polite" ref={resultsRef}>
        <header className="source-results-header">
          <div><p className="section-label">{copy.video.found(result.videoCount)}</p><h2>{result.title || copy.video.resultsTitle}</h2></div>
          <span>{copy.video.expires(Math.round(result.expiresInSeconds / 60))}</span>
        </header>
        <div className="source-result-list">{result.videos.map((video, index) => {
          const previewUrl = apiMediaUrl(video.previewPath);
          const coverUrl = video.coverUrl ? apiMediaUrl(video.coverUrl) : null;
          const duration = durationLabel(video.duration);
          return <article className="source-result-card" key={video.id}>
            <div className="source-cover">{coverUrl ? <img src={coverUrl} alt="" loading="lazy" /> : <span>D</span>}</div>
            <div className="source-result-copy">
              <p>{copy.video.videoNumber(index + 1)}</p>
              <h3>{video.title}</h3>
              <div className="source-tags">
                <span>{qualityLabel(video.quality, video.height)}</span>
                <span className="clean-tag">{copy.video.noWatermark}</span>
                {video.width && video.height && <span>{video.width}×{video.height}</span>}
                {duration && <span>{duration}</span>}
              </div>
            </div>
            <div className="source-result-actions">
              <a className="primary-action" href={apiMediaUrl(video.downloadPath)} download={video.filename}>{copy.video.download}<span>↓</span></a>
              <button className="secondary-action" type="button" onClick={() => setPreviewId(previewId === video.id ? null : video.id)}>{previewId === video.id ? copy.video.hidePreview : copy.video.preview}<span>{previewId === video.id ? "×" : "▶"}</span></button>
            </div>
            {previewId === video.id && <div className="source-preview"><video src={previewUrl} poster={coverUrl ?? undefined} controls playsInline preload="metadata" /></div>}
          </article>;
        })}</div>
        <AdSlot placement="result-footer" />
      </section>}
      <MoreToolsSection currentToolId="dola-video" />
      <AdSlot placement="tool-bottom" />
    </>
  );
}
