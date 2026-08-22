import type { PlatformGuide } from "../catalog/platformGuides";
import { siteCopy } from "../i18n/siteCopy";

export function PlatformLinkGuide({ guide }: { guide: PlatformGuide }) {
  return (
    <section className="section platform-link-guide" id="copy-link-guide">
      <header className="platform-guide-header">
        <div>
          <p className="section-label">{siteCopy.guide.eyebrow}</p>
          <h2>{guide.title}</h2>
          <p>{guide.description}</p>
        </div>
        <span>{siteCopy.guide.time}</span>
      </header>
      <div className="platform-guide-layout">
        <ol className="platform-guide-steps">
          {guide.steps.map((item, index) => (
            <li key={item.title}>
              <span>{String(index + 1).padStart(2, "0")}</span>
              <div><h3>{item.title}</h3><p>{item.description}</p></div>
            </li>
          ))}
        </ol>
        <aside className="platform-guide-reference">
          <div>
            <p className="section-label">{siteCopy.guide.formats}</p>
            <div className="guide-formats">{guide.linkFormats.map((format) => <code key={format}>{format}</code>)}</div>
          </div>
          <div>
            <p className="section-label">{siteCopy.guide.checks}</p>
            <ul>{guide.checks.map((item) => <li key={item}>{item}</li>)}</ul>
          </div>
          <p className="guide-legal">{siteCopy.guide.legal}</p>
        </aside>
      </div>
    </section>
  );
}
