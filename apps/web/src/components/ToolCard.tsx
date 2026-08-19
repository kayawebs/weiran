import { Link } from "react-router-dom";

type Props = {
  index: string;
  eyebrow: string;
  title: string;
  description: string;
  to?: string;
  badge?: string;
};

export function ToolCard({ index, eyebrow, title, description, to, badge }: Props) {
  const content = (
    <>
      <span className="tool-index">{index}</span>
      <div className="tool-card-copy">
        <div className="tool-card-meta"><p className="tool-type">{eyebrow}</p>{badge && <span className="badge">{badge}</span>}</div>
        <h3>{title}</h3>
        <p>{description}</p>
      </div>
      <span className="tool-arrow" aria-hidden="true">{to ? "↗" : "—"}</span>
    </>
  );
  return to ? <Link className="tool-card is-active" to={to}>{content}</Link> : <article className="tool-card is-planned">{content}</article>;
}
