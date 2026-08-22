import type { ReactNode } from "react";

export function PageIntro({ eyebrow, title, description, aside, compact = false }: { eyebrow: string; title: string; description: string; aside?: ReactNode; compact?: boolean }) {
  return (
    <section className={`page-intro${compact ? " compact-page-intro" : ""}`}>
      <div><p className="eyebrow">{eyebrow}</p><h1>{title}</h1><p>{description}</p></div>
      {aside && <div className="page-intro-aside">{aside}</div>}
    </section>
  );
}
