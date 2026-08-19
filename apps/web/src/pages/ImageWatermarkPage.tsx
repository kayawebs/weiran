import { type ChangeEvent, type PointerEvent, useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { api, ApiError } from "../api";
import { PageIntro } from "../components/PageIntro";
import type { WatermarkRegion } from "../types";

type Point = { x: number; y: number };
const round = (value: number) => Math.round(value * 10_000) / 10_000;

export function ImageWatermarkPage() {
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState("");
  const [region, setRegion] = useState<WatermarkRegion | null>(null);
  const [start, setStart] = useState<Point | null>(null);
  const [mode, setMode] = useState<"inpaint" | "blur">("inpaint");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();

  useEffect(() => () => { if (previewUrl) URL.revokeObjectURL(previewUrl); }, [previewUrl]);

  function chooseFile(event: ChangeEvent<HTMLInputElement>) {
    const selected = event.target.files?.[0] ?? null;
    if (!selected) return;
    if (!["image/jpeg", "image/png", "image/webp"].includes(selected.type)) { setError("Choose a JPG, PNG, or WebP image."); return; }
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setFile(selected);
    setPreviewUrl(URL.createObjectURL(selected));
    setRegion(null);
    setError("");
    event.target.value = "";
  }

  function pointFromEvent(event: PointerEvent<HTMLDivElement>): Point {
    const bounds = event.currentTarget.getBoundingClientRect();
    return { x: Math.min(1, Math.max(0, (event.clientX - bounds.left) / bounds.width)), y: Math.min(1, Math.max(0, (event.clientY - bounds.top) / bounds.height)) };
  }

  function beginSelection(event: PointerEvent<HTMLDivElement>) {
    event.currentTarget.setPointerCapture(event.pointerId);
    const point = pointFromEvent(event);
    setStart(point);
    setRegion({ x: point.x, y: point.y, width: 0.001, height: 0.001 });
  }

  function moveSelection(event: PointerEvent<HTMLDivElement>) {
    if (!start) return;
    const point = pointFromEvent(event);
    const x = round(Math.min(start.x, point.x));
    const y = round(Math.min(start.y, point.y));
    const width = round(Math.min(1 - x, Math.max(0.001, Math.abs(point.x - start.x))));
    const height = round(Math.min(1 - y, Math.max(0.001, Math.abs(point.y - start.y))));
    setRegion({ x, y, width, height });
  }

  function endSelection() { setStart(null); }

  async function submit() {
    setError("");
    if (!file || !region || region.width < 0.005 || region.height < 0.005) { setError("Draw a box over the watermark before continuing."); return; }
    setSubmitting(true);
    try {
      const task = await api.createImageTask(file, region, mode);
      navigate(`/tasks/${task.id}`);
    } catch (cause) {
      setError(cause instanceof ApiError ? cause.message : "We could not start this task.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <>
      <PageIntro eyebrow="IMAGE · CLEANUP" title="Remove what gets in the way." description="Upload an authorized image and draw directly over the watermark. We restore the selected area while preserving the rest." aside={<span className="large-number">1×<br /><small>REGION PER TASK</small></span>} />
      <section className="image-workspace">
        <div className="image-stage-panel">
          <div className="step-heading"><span>01</span><div><h2>Upload and mark the area</h2><p>Drag a rectangle around the entire watermark.</p></div></div>
          {!previewUrl ? (
            <button className="upload-dropzone" type="button" onClick={() => inputRef.current?.click()}><span>＋</span><strong>Choose an image</strong><small>JPG, PNG, or WebP</small></button>
          ) : (
            <div className="selection-shell">
              <div className="selection-stage" onPointerDown={beginSelection} onPointerMove={moveSelection} onPointerUp={endSelection} onPointerCancel={endSelection}>
                <img src={previewUrl} alt="Selected source" draggable={false} />
                {region && <span className="selection-box" style={{ left: `${region.x * 100}%`, top: `${region.y * 100}%`, width: `${region.width * 100}%`, height: `${region.height * 100}%` }}><i>REMOVE</i></span>}
              </div>
              <button type="button" className="text-button" onClick={() => inputRef.current?.click()}>Choose a different image</button>
            </div>
          )}
          <input ref={inputRef} className="visually-hidden" type="file" accept="image/jpeg,image/png,image/webp" onChange={chooseFile} />
        </div>
        <aside className="image-controls">
          <div className="step-heading"><span>02</span><div><h2>Choose a finish</h2><p>Smart repair works best for most backgrounds.</p></div></div>
          <label className={mode === "inpaint" ? "mode-option selected" : "mode-option"}><input type="radio" name="mode" checked={mode === "inpaint"} onChange={() => setMode("inpaint")} /><span><strong>Smart repair</strong><small>Rebuild the selected background</small></span><i>Recommended</i></label>
          <label className={mode === "blur" ? "mode-option selected" : "mode-option"}><input type="radio" name="mode" checked={mode === "blur"} onChange={() => setMode("blur")} /><span><strong>Soft blur</strong><small>Obscure the selected area</small></span></label>
          {region && <div className="region-readout"><span>Selected area</span><strong>{Math.round(region.width * 100)}% × {Math.round(region.height * 100)}%</strong></div>}
          {error && <p className="form-error" role="alert">{error}</p>}
          <button type="button" className="primary-action full-button" onClick={submit} disabled={!file || !region || submitting}>{submitting ? "Uploading…" : "Remove watermark"}<span>→</span></button>
          <p className="fine-print">Your file uploads directly to private object storage. The download link expires automatically.</p>
        </aside>
      </section>
    </>
  );
}
