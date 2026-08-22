import { Link, Navigate, useLocation } from "react-router-dom";
import { AdSlot } from "../ads/AdSlot";
import { categoryById, localize, toolByPath } from "../catalog/tools";
import { platformGuideFor } from "../catalog/platformGuides";
import { MoreToolsSection } from "../components/MoreToolsSection";
import { PageIntro } from "../components/PageIntro";
import { PlatformLinkGuide } from "../components/PlatformLinkGuide";
import { Seo } from "../components/Seo";
import { ToolMark } from "../components/ToolMark";
import { siteCopy } from "../i18n/siteCopy";

export function ToolLandingPage() {
  const location = useLocation();
  const tool = toolByPath(location.pathname);
  if (!tool) return <Navigate to="/tools" replace />;
  const category = categoryById(tool.category);
  const guide = platformGuideFor(tool.id);

  return (
    <>
      <Seo title={localize(tool.title)} description={localize(tool.seoDescription)} path={tool.path} noIndex={tool.status !== "live"} />
      <PageIntro eyebrow={`${localize(category.eyebrow)} · ${tool.mark}`} title={localize(tool.title)} description={localize(tool.description)} aside={<span className="platform-chip planned-chip"><i /> {siteCopy.planned.badge}</span>} />
      <section className="planned-workspace">
        <ToolMark className="planned-workspace-mark" tool={tool} />
        <div>
          <p className="section-label">{siteCopy.planned.eyebrow}</p>
          <h2>{siteCopy.planned.title}</h2>
          <p>{siteCopy.planned.description}</p>
          <p className="fine-print">{siteCopy.planned.noFake}</p>
          <div className="catalog-tags">{tool.tags.map((tag) => <span key={localize(tag)}>{localize(tag)}</span>)}</div>
          <Link className="primary-action" to="/tools">{siteCopy.planned.browse}<span>→</span></Link>
        </div>
      </section>
      {guide && <PlatformLinkGuide guide={guide} />}
      <AdSlot placement="tool-top" />
      <MoreToolsSection currentToolId={tool.id} />
    </>
  );
}
