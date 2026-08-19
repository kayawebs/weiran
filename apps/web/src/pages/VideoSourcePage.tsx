import { type FormEvent, useState } from "react";
import { useNavigate } from "react-router-dom";
import { api, ApiError } from "../api";
import { PageIntro } from "../components/PageIntro";
import { copy } from "../i18n/copy";

export function VideoSourcePage() {
  const [url, setUrl] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const navigate = useNavigate();

  async function submit(event: FormEvent) {
    event.preventDefault();
    setError("");
    if (!/^https:\/\/(www\.)?dola\.com\/thread\/[A-Za-z0-9_-]+\/?(?:\?.*)?$/.test(url.trim())) {
      setError(copy.video.invalid);
      return;
    }
    setSubmitting(true);
    try {
      const task = await api.createVideoTask(url.trim());
      navigate(`/tasks/${task.id}`);
    } catch (cause) {
      setError(cause instanceof ApiError ? cause.message : copy.video.startError);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <>
      <PageIntro eyebrow={copy.video.eyebrow} title={copy.video.title} description={copy.video.description} aside={<span className="platform-chip"><i /> {copy.video.supported}</span>} />
      <section className="tool-workspace">
        <form className="workspace-panel" onSubmit={submit}>
          <div className="step-heading"><span>01</span><div><h2>{copy.video.platformTitle}</h2><p>{copy.video.platformHint}</p></div></div>
          <label className="platform-option selected"><span className="platform-logo">D</span><span><strong>Dola</strong><small>{copy.video.publicLinks}</small></span><i>{copy.video.selected}</i></label>
          <div className="form-divider" />
          <div className="step-heading"><span>02</span><div><h2>{copy.video.urlTitle}</h2><p>{copy.video.urlHint}</p></div></div>
          <label className="field-label" htmlFor="dola-url">{copy.video.fieldLabel}</label>
          <div className="url-field"><input id="dola-url" type="url" value={url} onChange={(event) => setUrl(event.target.value)} placeholder="https://www.dola.com/thread/..." autoComplete="url" /><span>URL</span></div>
          {error && <p className="form-error" role="alert">{error}</p>}
          <button className="primary-action full-button" type="submit" disabled={submitting}>{submitting ? copy.video.starting : copy.video.submit}<span>→</span></button>
        </form>
        <aside className="workspace-aside">
          <p className="section-label">{copy.video.how}</p>
          <ol>{copy.video.steps.map((step, index) => <li key={step.title}><span>{index + 1}</span><div><strong>{step.title}</strong><p>{step.description}</p></div></li>)}</ol>
          <p className="fine-print">{copy.video.legal}</p>
        </aside>
      </section>
    </>
  );
}
