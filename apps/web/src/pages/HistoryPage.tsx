import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../api";
import { PageIntro } from "../components/PageIntro";
import type { Task } from "../types";

const taskNames: Record<string, string> = { VIDEO_WATERMARK_REMOVE: "Dola clean source", IMAGE_WATERMARK_REMOVE: "Image watermark remover", SOURCE_DOWNLOAD: "Source download", IMAGE_PROCESS: "Image processing" };

export function HistoryPage() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  useEffect(() => { api.listTasks().then(({ tasks: rows }) => setTasks(rows)).catch((cause) => setError(cause instanceof Error ? cause.message : "Could not load history.")).finally(() => setLoading(false)); }, []);

  return (
    <>
      <PageIntro eyebrow="YOUR WORKSPACE" title="Task history." description="Recent jobs from this browser session. Open any task to check its status or refresh its download links." aside={<span className="large-number">{tasks.length.toString().padStart(2, "0")}<br /><small>RECENT TASKS</small></span>} />
      <section className="section history-section">
        {loading && <p className="empty-state">Loading your recent work…</p>}
        {error && <p className="form-error">{error}</p>}
        {!loading && !error && tasks.length === 0 && <div className="empty-state"><h2>No tasks yet.</h2><p>Your completed and in-progress tools will appear here.</p><Link className="primary-action" to="/tools">Explore tools <span>↗</span></Link></div>}
        <div className="history-list">{tasks.map((task, index) => <Link to={`/tasks/${task.id}`} className="history-row" key={task.id}><span className="history-index">{String(index + 1).padStart(2, "0")}</span><div><small>{task.taskType.replaceAll("_", " ")}</small><strong>{taskNames[task.taskType] ?? "Creator task"}</strong></div><time dateTime={task.createdAt}>{new Intl.DateTimeFormat("en", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" }).format(new Date(task.createdAt))}</time><span className={`status-pill ${task.status.toLowerCase()}`}>{task.status}</span><i>→</i></Link>)}</div>
      </section>
    </>
  );
}
