import { Link } from "react-router-dom";
import { AdSlot } from "../ads/AdSlot";
import { liveTools, localize, toolCategories } from "../catalog/tools";
import { CatalogToolCard } from "../components/CatalogToolCard";
import { Seo } from "../components/Seo";
import { marketConfig } from "../config/market";
import { siteCopy } from "../i18n/siteCopy";

export function HomePage() {
  const featured = liveTools();
  return (
    <>
      <Seo title={marketConfig.locale === "zh-CN" ? "AI 创作者工具平台" : "AI Creator Tools"} description={siteCopy.home.description} />
      <section className="hero platform-hero">
        <div className="hero-main">
          <p className="eyebrow">{siteCopy.home.eyebrow}</p>
          <h1>{siteCopy.home.title[0]}<br /><span>{siteCopy.home.title[1]}</span><br />{siteCopy.home.title[2]}</h1>
        </div>
        <div className="hero-side">
          <p>{siteCopy.home.description}</p>
          <div className="hero-actions">
            <Link className="primary-action" to="/tools">{siteCopy.home.primary}<span>↗</span></Link>
            <Link className="secondary-action" to="/download">{siteCopy.home.secondary}<span>→</span></Link>
          </div>
        </div>
        <div className="hero-orbit" aria-hidden="true"><span /><i>W</i></div>
      </section>

      <section className="section tool-map-section">
        <div className="section-heading"><div><p className="section-label">{siteCopy.home.categories}</p><h2>{siteCopy.home.categoriesTitle}</h2></div></div>
        <div className="category-map">
          {toolCategories.map((category) => (
            <Link className="category-map-card" to={category.path} key={category.id}>
              <span>{category.index}</span>
              <p>{localize(category.eyebrow)}</p>
              <h3>{localize(category.title)}</h3>
              <small>{localize(category.description)}</small>
              <i aria-hidden="true">↗</i>
            </Link>
          ))}
        </div>
        <AdSlot placement="home-inline" />
      </section>

      <section className="section featured-tools-section">
        <div className="section-heading"><div><p className="section-label">{siteCopy.home.featured}</p><h2>{siteCopy.home.featuredTitle}</h2></div><Link className="text-link" to="/tools">{siteCopy.nav.all} →</Link></div>
        <div className="catalog-tool-grid">
          {featured.map((tool, index) => <CatalogToolCard tool={tool} index={index} key={tool.id} />)}
        </div>
      </section>

      <section className="section platform-principle">
        <p className="section-label">{siteCopy.home.platform}</p>
        <div><h2>{siteCopy.home.platformTitle}</h2><p>{siteCopy.home.platformDescription}</p></div>
      </section>
    </>
  );
}
