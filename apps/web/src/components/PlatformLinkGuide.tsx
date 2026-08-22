import type { PlatformGuide } from "../catalog/platformGuides";
import { siteCopy } from "../i18n/siteCopy";

export function PlatformLinkGuide({ guide, compact = false }: { guide: PlatformGuide; compact?: boolean }) {
  if (compact) {
    return (
      <section className="compact-link-guide" aria-labelledby="compact-link-guide-title">
        <header>
          <div><p className="section-label">{siteCopy.guide.eyebrow}</p><h2 id="compact-link-guide-title">{guide.title}</h2></div>
          <div className="compact-guide-formats">{guide.linkFormats.slice(0, 2).map((format) => <code key={format}>{format}</code>)}</div>
        </header>
        <ol>
          {guide.steps.slice(0, 3).map((item, index) => (
            <li key={item.title}><span>{index + 1}</span><div><strong>{item.title}</strong><p>{item.description}</p></div></li>
          ))}
        </ol>
      </section>
    );
  }

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
