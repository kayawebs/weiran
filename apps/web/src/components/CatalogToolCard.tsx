import { Link } from "react-router-dom";
import { localize, type ToolDefinition } from "../catalog/tools";
import { siteCopy } from "../i18n/siteCopy";

export function CatalogToolCard({ tool, index }: { tool: ToolDefinition; index: number }) {
  return (
    <Link className={`catalog-tool-card ${tool.status}`} to={tool.path}>
      <span className="catalog-tool-mark" aria-hidden="true">{tool.mark}</span>
      <div className="catalog-tool-body">
        <div className="tool-card-meta">
          <span className="tool-type">{String(index + 1).padStart(2, "0")}</span>
          <span className="badge">{tool.status === "live" ? siteCopy.directory.live : siteCopy.directory.planned}</span>
        </div>
        <h3>{localize(tool.shortTitle)}</h3>
        <p>{localize(tool.description)}</p>
        <div className="catalog-tags">{tool.tags.map((tag) => <span key={localize(tag)}>{localize(tag)}</span>)}</div>
      </div>
      <span className="tool-arrow" aria-hidden="true">↗</span>
    </Link>
  );
}
