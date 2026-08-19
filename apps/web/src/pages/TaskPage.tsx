import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { api } from "../api";
import type { ResultFile, Task } from "../types";

const labels = { PENDING: "Queued", PROCESSING: "Processing", SUCCESS: "Ready", FAILED: "Failed" } as const;

export function TaskPage() {
  const { taskId = "" } = useParams();
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
        setTask(next);
        setError("");
        if (next.status === "SUCCESS") {
          const response = await api.getResults(taskId);
          if (!cancelled) setResults(response.files?.length ? response.files : [response as unknown as ResultFile]);
        } else if (next.status !== "FAILED") {
          timer = window.setTimeout(refresh, 2000);
        }
      } catch (cause) {
        if (!cancelled) { setError(cause instanceof Error ? cause.message : "Could not load this task."); timer = window.setTimeout(refresh, 4000); }
      }
    }
    void refresh();
    return () => { cancelled = true; if (timer) window.clearTimeout(timer); };
  }, [taskId]);

  const status = task?.status ?? "PENDING";
  return (
    <section className="task-page">
      <div className={`status-orb ${status.toLowerCase()}`}><span>{status === "SUCCESS" ? "✓" : status === "FAILED" ? "!" : ""}</span></div>
      <p className="eyebrow">TASK {taskId.slice(0, 8).toUpperCase()}</p>
      <h1>{labels[status]}</h1>
      <p className="task-status-copy">{status === "PENDING" ? "Your task is waiting for an available worker." : status === "PROCESSING" ? "We are preparing your media. You can leave this page and return from History." : status === "SUCCESS" ? `${results.length || "Your"} result${results.length === 1 ? " is" : "s are"} ready to download.` : task?.error?.message ?? error ?? "The task could not be completed."}</p>
      {(status === "PENDING" || status === "PROCESSING") && <div className="progress-track"><span /></div>}
      {error && !task && <p className="form-error">{error}</p>}
      {status === "SUCCESS" && <div className="result-grid">{results.map((file, index) => (
        <article className="result-card" key={file.assetId ?? index}>
          <div className="result-preview">
            {file.mimeType?.startsWith("image/") ? <img src={file.downloadUrl} alt={file.title ?? `Result ${index + 1}`} /> : file.mimeType?.startsWith("video/") ? <video src={file.downloadUrl} controls playsInline preload="metadata" /> : <span>FILE</span>}
          </div>
          <div className="result-details"><div><span>RESULT {String(index + 1).padStart(2, "0")}</span><h2>{file.title || file.filename || `Media file ${index + 1}`}</h2></div><a className="primary-action" href={file.downloadUrl} download={file.filename ?? undefined}>Download <span>↓</span></a></div>
        </article>
      ))}</div>}
      <div className="task-actions"><Link className="secondary-action" to="/tools">Start another task</Link><Link className="text-link" to="/history">View history →</Link></div>
    </section>
  );
}
