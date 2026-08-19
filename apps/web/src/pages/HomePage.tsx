import { Link } from "react-router-dom";
import { AdSlot } from "../ads/AdSlot";
import { ToolCard } from "../components/ToolCard";
import { copy } from "../i18n/copy";

export function HomePage() {
  return (
    <>
      <section className="hero">
        <div className="hero-main">
          <p className="eyebrow">{copy.home.eyebrow}</p>
          <h1>{copy.home.hero[0]}<br /><span>{copy.home.hero[1]}</span><br />{copy.home.hero[2]}</h1>
        </div>
        <div className="hero-side">
          <p>{copy.home.description}</p>
          <Link className="primary-action" to="/tools">{copy.home.explore} <span>↗</span></Link>
        </div>
        <div className="hero-orbit" aria-hidden="true"><span /><i>W</i></div>
      </section>

      <section className="section tool-preview">
        <div className="section-heading"><div><p className="section-label">{copy.home.available}</p><h2>{copy.home.start}</h2></div><Link className="text-link" to="/tools">{copy.home.viewAll} →</Link></div>
        <div className="tool-list">
          <ToolCard index="01" eyebrow={`${copy.common.video} · DOLA`} title={copy.home.videoTitle} description={copy.home.videoDescription} to="/tools/video" badge={copy.common.live} />
          <ToolCard index="02" eyebrow={`${copy.common.image} · ${copy.common.cleanup}`} title={copy.home.imageTitle} description={copy.home.imageDescription} to="/tools/image" badge={copy.common.live} />
        </div>
      </section>

      <section className="section workflow-section">
        <div className="section-heading"><div><p className="section-label">{copy.home.platform}</p><h2>{copy.home.workflowTitle}</h2></div></div>
        <div className="workflow-line">
          {copy.home.workflow.map((step, index) => <div key={step}><span>0{index + 1}</span><strong>{step}</strong></div>)}
        </div>
        <p className="section-note">{copy.home.note}</p>
        <AdSlot placement="home-footer" />
      </section>
    </>
  );
}
