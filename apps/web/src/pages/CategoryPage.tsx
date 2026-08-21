import { Link } from "react-router-dom";
import { AdSlot } from "../ads/AdSlot";
import { categoryById, localize, toolsByCategory, type ToolCategoryId } from "../catalog/tools";
import { CatalogToolCard } from "../components/CatalogToolCard";
import { PageIntro } from "../components/PageIntro";
import { Seo } from "../components/Seo";
import { siteCopy } from "../i18n/siteCopy";

export function CategoryPage({ categoryId }: { categoryId: ToolCategoryId }) {
  const category = categoryById(categoryId);
  const categoryTools = toolsByCategory(categoryId);
  const available = categoryTools.filter((tool) => tool.status === "live");
  const planned = categoryTools.filter((tool) => tool.status === "planned");

  return (
    <>
      <Seo title={localize(category.title)} description={localize(category.description)} path={category.path} noIndex={available.length === 0} />
      <PageIntro eyebrow={localize(category.eyebrow)} title={localize(category.title)} description={localize(category.description)} aside={<div className="category-counts"><strong>{available.length}</strong><span>{siteCopy.category.live}</span><strong>{planned.length}</strong><span>{siteCopy.category.planned}</span></div>} />
      {available.length > 0 && <section className="section category-directory-block">
        <div className="section-heading"><div><p className="section-label">{siteCopy.directory.live}</p><h2>{siteCopy.category.availableTitle}</h2></div></div>
        <div className="catalog-tool-grid">{available.map((tool, index) => <CatalogToolCard tool={tool} index={index} key={tool.id} />)}</div>
      </section>}
      {planned.length > 0 && <section className="section category-directory-block roadmap-block">
        <div className="section-heading"><div><p className="section-label">{siteCopy.directory.planned}</p><h2>{siteCopy.category.roadmapTitle}</h2></div><Link className="text-link" to="/tools">{siteCopy.category.directory} →</Link></div>
        <div className="catalog-tool-grid">{planned.map((tool, index) => <CatalogToolCard tool={tool} index={index} key={tool.id} />)}</div>
      </section>}
      <AdSlot placement="directory-inline" />
    </>
  );
}
