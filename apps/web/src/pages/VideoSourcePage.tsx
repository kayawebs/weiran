import { type FormEvent, useState } from "react";
import { useNavigate } from "react-router-dom";
import { api, ApiError } from "../api";
import { PageIntro } from "../components/PageIntro";

export function VideoSourcePage() {
  const [url, setUrl] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const navigate = useNavigate();

  async function submit(event: FormEvent) {
    event.preventDefault();
    setError("");
    if (!/^https:\/\/(www\.)?dola\.com\/thread\/[A-Za-z0-9_-]+\/?(?:\?.*)?$/.test(url.trim())) {
      setError("Paste a valid public Dola thread URL.");
      return;
    }
    setSubmitting(true);
    try {
      const task = await api.createVideoTask(url.trim());
      navigate(`/tasks/${task.id}`);
    } catch (cause) {
      setError(cause instanceof ApiError ? cause.message : "We could not start this task.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <>
      <PageIntro eyebrow="VIDEO · DOLA" title="Get the clean source." description="Paste a public Dola thread URL. We resolve every available original video and turn it into a secure download." aside={<span className="platform-chip"><i /> DOLA SUPPORTED</span>} />
      <section className="tool-workspace">
        <form className="workspace-panel" onSubmit={submit}>
          <div className="step-heading"><span>01</span><div><h2>Choose a platform</h2><p>More source platforms will plug into the same workflow.</p></div></div>
          <label className="platform-option selected"><span className="platform-logo">D</span><span><strong>Dola</strong><small>Public thread links</small></span><i>Selected</i></label>
          <div className="form-divider" />
          <div className="step-heading"><span>02</span><div><h2>Paste the thread URL</h2><p>One thread can contain multiple videos.</p></div></div>
          <label className="field-label" htmlFor="dola-url">Public Dola URL</label>
          <div className="url-field"><input id="dola-url" type="url" value={url} onChange={(event) => setUrl(event.target.value)} placeholder="https://www.dola.com/thread/..." autoComplete="url" /><span>URL</span></div>
          {error && <p className="form-error" role="alert">{error}</p>}
          <button className="primary-action full-button" type="submit" disabled={submitting}>{submitting ? "Starting task…" : "Find source videos"}<span>→</span></button>
        </form>
        <aside className="workspace-aside">
          <p className="section-label">HOW IT WORKS</p>
          <ol><li><span>1</span><div><strong>Resolve the thread</strong><p>Identify every video attached to the public post.</p></div></li><li><span>2</span><div><strong>Fetch the source</strong><p>Download the clean source to private object storage.</p></div></li><li><span>3</span><div><strong>Deliver securely</strong><p>Create temporary links for your results.</p></div></li></ol>
          <p className="fine-print">Only submit material you own or have permission to download and reuse.</p>
        </aside>
      </section>
    </>
  );
}
