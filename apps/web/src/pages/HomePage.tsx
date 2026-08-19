import { Link } from "react-router-dom";
import { ToolCard } from "../components/ToolCard";

export function HomePage() {
  return (
    <>
      <section className="hero">
        <div className="hero-main">
          <p className="eyebrow">MEDIA INFRASTRUCTURE FOR AI CREATORS</p>
          <h1>Find it.<br /><span>Clean it.</span><br />Create more.</h1>
        </div>
        <div className="hero-side">
          <p>One reliable workspace for acquiring and preparing the media behind your next idea.</p>
          <Link className="primary-action" to="/tools">Explore tools <span>↗</span></Link>
        </div>
        <div className="hero-orbit" aria-hidden="true"><span /><i>W</i></div>
      </section>

      <section className="section tool-preview">
        <div className="section-heading"><div><p className="section-label">AVAILABLE NOW</p><h2>Start with media cleanup.</h2></div><Link className="text-link" to="/tools">View all tools →</Link></div>
        <div className="tool-list">
          <ToolCard index="01" eyebrow="VIDEO · DOLA" title="Clean source download" description="Paste a public Dola thread. We locate its original video files and prepare secure downloads." to="/tools/video" badge="LIVE" />
          <ToolCard index="02" eyebrow="IMAGE · CLEANUP" title="Remove an image watermark" description="Upload an authorized image, draw over the unwanted area, and restore the background." to="/tools/image" badge="LIVE" />
        </div>
      </section>

      <section className="section workflow-section">
        <div className="section-heading"><div><p className="section-label">ONE SHARED PLATFORM</p><h2>From source to creation.</h2></div></div>
        <div className="workflow-line">
          {["Discover", "Acquire", "Clean", "Transform", "Publish"].map((step, index) => <div key={step}><span>0{index + 1}</span><strong>{step}</strong></div>)}
        </div>
        <p className="section-note">Weiran Lab is being built as a modular creator platform. New tools will share the same task, file, and processing infrastructure.</p>
      </section>
    </>
  );
}
