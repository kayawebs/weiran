import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { api } from "../api";
import { AdSlot } from "../ads/AdSlot";
import { copy } from "../i18n/copy";
import type { ResultFile, Task } from "../types";

export function TaskPage() {
  const { taskId = "" } = useParams();
  const navigate = useNavigate();
  const [task, setTask] = useState<Task | null>(null);
  const [results, setResults] = useState<ResultFile[]>([]);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;
    let timer: number | undefined;
    async function refresh() {
      try {
        const next = await api.getTask(taskId);
        if (cancelled) return;
        const legacyVideoUrl = typeof next.input.url === "string" ? next.input.url : null;
        if (next.taskType === "VIDEO_WATERMARK_REMOVE" && next.status !== "SUCCESS" && legacyVideoUrl) {
          const query = new URLSearchParams({ url: legacyVideoUrl, scan: "1" });
          navigate(`/tools/video?${query.toString()}`, { replace: true });
          return;
        }
        setTask(next);
        setError("");
        if (next.status === "SUCCESS") {
          const response = await api.getResults(taskId);
          if (!cancelled) setResults(response.files?.length ? response.files : [response as unknown as ResultFile]);
        } else if (next.status !== "FAILED") {
          timer = window.setTimeout(refresh, 2000);
        }
      } catch (cause) {
        if (!cancelled) { setError(cause instanceof Error ? cause.message : copy.task.loadError); timer = window.setTimeout(refresh, 4000); }
      }
    }
    void refresh();
    return () => { cancelled = true; if (timer) window.clearTimeout(timer); };
  }, [navigate, taskId]);

  const status = task?.status ?? "PENDING";
  return (
    <section className="task-page">
      <div className={`status-orb ${status.toLowerCase()}`}><span>{status === "SUCCESS" ? "✓" : status === "FAILED" ? "!" : ""}</span></div>
      <p className="eyebrow">{copy.task.task} {taskId.slice(0, 8).toUpperCase()}</p>
      <h1>{copy.task.labels[status]}</h1>
      <p className="task-status-copy">{status === "PENDING" ? copy.task.pending : status === "PROCESSING" ? copy.task.processing : status === "SUCCESS" ? copy.task.ready(results.length) : copy.task.failure(task?.error?.code)}</p>
      {(status === "PENDING" || status === "PROCESSING") && <div className="progress-track"><span /></div>}
      {error && !task && <p className="form-error">{error}</p>}
      {status === "SUCCESS" && <div className="result-grid">{results.map((file, index) => (
        <article className="result-card" key={file.assetId ?? index}>
          <div className="result-preview">
            {file.mimeType?.startsWith("image/") ? <img src={file.downloadUrl} alt={file.title ?? copy.task.resultAlt(index + 1)} /> : file.mimeType?.startsWith("video/") ? <video src={file.downloadUrl} controls playsInline preload="metadata" /> : <span>{copy.task.file}</span>}
          </div>
          <div className="result-details"><div><span>{copy.task.result} {String(index + 1).padStart(2, "0")}</span><h2>{file.title || file.filename || copy.task.mediaFile(index + 1)}</h2></div><a className="primary-action" href={file.downloadUrl} download={file.filename ?? undefined}>{copy.task.download} <span>↓</span></a></div>
        </article>
      ))}</div>}
      {status === "SUCCESS" && <AdSlot placement="result-footer" />}
      <div className="task-actions"><Link className="secondary-action" to="/tools">{copy.task.another}</Link><Link className="text-link" to="/history">{copy.task.history} →</Link></div>
    </section>
  );
}
