import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../api";
import { PageIntro } from "../components/PageIntro";
import { Seo } from "../components/Seo";
import { marketConfig } from "../config/market";
import { copy } from "../i18n/copy";
import type { Task } from "../types";

export function HistoryPage() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  useEffect(() => { api.listTasks().then(({ tasks: rows }) => setTasks(rows)).catch((cause) => setError(cause instanceof Error ? cause.message : copy.history.loadError)).finally(() => setLoading(false)); }, []);

  return (
    <>
      <Seo title={copy.history.title} description={copy.history.description} path="/history" noIndex />
      <PageIntro eyebrow={copy.history.eyebrow} title={copy.history.title} description={copy.history.description} aside={<span className="large-number">{tasks.length.toString().padStart(2, "0")}<br /><small>{copy.history.recent}</small></span>} />
      <section className="section history-section">
        {loading && <p className="empty-state">{copy.history.loading}</p>}
        {error && <p className="form-error">{error}</p>}
        {!loading && !error && tasks.length === 0 && <div className="empty-state"><h2>{copy.history.emptyTitle}</h2><p>{copy.history.emptyDescription}</p><Link className="primary-action" to="/tools">{copy.history.explore} <span>↗</span></Link></div>}
        <div className="history-list">{tasks.map((task, index) => <Link to={`/tasks/${task.id}`} className="history-row" key={task.id}><span className="history-index">{String(index + 1).padStart(2, "0")}</span><div><small>{copy.history.taskKinds[task.taskType]}</small><strong>{copy.history.taskNames[task.taskType] ?? copy.history.creatorTask}</strong></div><time dateTime={task.createdAt}>{new Intl.DateTimeFormat(marketConfig.locale, { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" }).format(new Date(task.createdAt))}</time><span className={`status-pill ${task.status.toLowerCase()}`}>{copy.history.statuses[task.status]}</span><i>→</i></Link>)}</div>
      </section>
    </>
  );
}
