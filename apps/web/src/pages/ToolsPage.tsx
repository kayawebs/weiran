import { useState } from "react";
import { AdSlot } from "../ads/AdSlot";
import { localize, toolCategories, toolsByCategory } from "../catalog/tools";
import { CatalogToolCard } from "../components/CatalogToolCard";
import { PageIntro } from "../components/PageIntro";
import { Seo } from "../components/Seo";
import { siteCopy } from "../i18n/siteCopy";

export function ToolsPage() {
  const [query, setQuery] = useState("");
  const normalized = query.trim().toLocaleLowerCase();
  const matches = (value: string) => value.toLocaleLowerCase().includes(normalized);
  const filteredCategories = toolCategories.map((category) => ({
    category,
    tools: toolsByCategory(category.id).filter((tool) => !normalized || [localize(tool.title), localize(tool.description), ...tool.tags.map(localize)].some(matches))
  })).filter((group) => group.tools.length > 0);

  return (
    <>
      <Seo title={siteCopy.directory.title} description={siteCopy.directory.description} path="/tools" />
      <PageIntro eyebrow={siteCopy.directory.eyebrow} title={siteCopy.directory.title} description={siteCopy.directory.description} aside={<span className="large-number">{String(filteredCategories.reduce((count, group) => count + group.tools.length, 0)).padStart(2, "0")}<br /><small>{siteCopy.nav.all}</small></span>} />
      <section className="directory-search section-narrow">
        <label htmlFor="tool-search">{siteCopy.directory.searchLabel}</label>
        <div className="directory-search-field"><span>⌕</span><input id="tool-search" type="search" value={query} onChange={(event) => setQuery(event.target.value)} placeholder={siteCopy.directory.searchPlaceholder} /></div>
      </section>
      {filteredCategories.length > 0 ? filteredCategories.map(({ category, tools: categoryTools }) => (
        <section className="section directory-category" key={category.id}>
          <header className="directory-category-header">
            <span>{category.index}</span>
            <div><p className="section-label">{localize(category.eyebrow)}</p><h2>{localize(category.title)}</h2><p>{localize(category.description)}</p></div>
          </header>
          <div className="catalog-tool-grid">{categoryTools.map((tool, index) => <CatalogToolCard tool={tool} index={index} key={tool.id} />)}</div>
        </section>
      )) : <section className="empty-directory"><p>{siteCopy.directory.empty}</p><button className="text-button" type="button" onClick={() => setQuery("")}>{siteCopy.directory.clear}</button></section>}
      <AdSlot placement="directory-inline" />
    </>
  );
}
