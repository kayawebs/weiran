import { PageIntro } from "../components/PageIntro";
import { ToolCard } from "../components/ToolCard";
import { AdSlot } from "../ads/AdSlot";
import { copy } from "../i18n/copy";

export function ToolsPage() {
  return (
    <>
      <PageIntro eyebrow={copy.tools.eyebrow} title={copy.tools.title} description={copy.tools.description} aside={<span className="large-number">02<br /><small>{copy.tools.liveCount}</small></span>} />
      <section className="section category-section">
        <div className="category-title"><span>01</span><div><h2>{copy.tools.categories[0].title}</h2><p>{copy.tools.categories[0].description}</p></div></div>
        <div className="tool-list">
          <ToolCard index="01" eyebrow={copy.tools.categories[0].tools[0].meta} title={copy.tools.categories[0].tools[0].title} description={copy.tools.categories[0].tools[0].description} to="/tools/video" badge={copy.common.live} />
          <ToolCard index="02" eyebrow={copy.tools.categories[0].tools[1].meta} title={copy.tools.categories[0].tools[1].title} description={copy.tools.categories[0].tools[1].description} to="/tools/image" badge={copy.common.live} />
        </div>
      </section>
      <section className="section category-section">
        <div className="category-title"><span>02</span><div><h2>{copy.tools.categories[1].title}</h2><p>{copy.tools.categories[1].description}</p></div></div>
        <div className="tool-list"><ToolCard index="03" eyebrow={copy.tools.categories[1].tools[0].meta} title={copy.tools.categories[1].tools[0].title} description={copy.tools.categories[1].tools[0].description} badge={copy.common.planned} /></div>
      </section>
      <section className="section category-section">
        <div className="category-title"><span>03</span><div><h2>{copy.tools.categories[2].title}</h2><p>{copy.tools.categories[2].description}</p></div></div>
        <div className="tool-list compact-tools">
          {copy.tools.categories[2].tools.map((tool, index) => <ToolCard key={tool.title} index={`0${index + 4}`} eyebrow={tool.meta} title={tool.title} description={tool.description} badge={copy.common.planned} />)}
        </div>
      </section>
      <AdSlot placement="tools-inline" />
    </>
  );
}
