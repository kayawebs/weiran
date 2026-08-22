import { Link } from "react-router-dom";
import { tools } from "../catalog/tools";
import { siteCopy } from "../i18n/siteCopy";
import { CatalogToolCard } from "./CatalogToolCard";

function recommendations(currentToolId: string) {
  const current = tools.find((tool) => tool.id === currentToolId);
  const groups = [
    tools.filter((tool) => tool.id !== currentToolId && tool.status === "live"),
    tools.filter((tool) => tool.id !== currentToolId && tool.status === "planned" && tool.category === current?.category),
    tools.filter((tool) => tool.id !== currentToolId && tool.status === "planned" && tool.category !== current?.category)
  ];
  const unique = new Map(groups.flat().map((tool) => [tool.id, tool]));
  return Array.from(unique.values()).slice(0, 4);
}

export function MoreToolsSection({ currentToolId }: { currentToolId: string }) {
  const recommended = recommendations(currentToolId);
  if (recommended.length === 0) return null;
  return (
    <section className="section more-tools-section">
      <header className="more-tools-header">
        <div><p className="section-label">{siteCopy.moreTools.eyebrow}</p><h2>{siteCopy.moreTools.title}</h2><p>{siteCopy.moreTools.description}</p></div>
        <Link className="text-link" to="/tools">{siteCopy.moreTools.all} →</Link>
      </header>
      <div className="catalog-tool-grid more-tools-grid">
        {recommended.map((tool, index) => <CatalogToolCard tool={tool} index={index} key={tool.id} />)}
      </div>
    </section>
  );
}
