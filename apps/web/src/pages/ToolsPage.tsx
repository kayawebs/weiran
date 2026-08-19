import { PageIntro } from "../components/PageIntro";
import { ToolCard } from "../components/ToolCard";

export function ToolsPage() {
  return (
    <>
      <PageIntro eyebrow="TOOL DIRECTORY" title="Built for the work between ideas." description="Focused tools for getting creator media ready—without the clutter of a full editing suite." aside={<span className="large-number">02<br /><small>TOOLS LIVE</small></span>} />
      <section className="section category-section">
        <div className="category-title"><span>01</span><div><h2>Media cleanup</h2><p>Remove visual noise and recover usable source files.</p></div></div>
        <div className="tool-list">
          <ToolCard index="01" eyebrow="VIDEO · DOLA" title="Clean source download" description="Extract original videos from a public Dola thread URL." to="/tools/video" badge="LIVE" />
          <ToolCard index="02" eyebrow="IMAGE · CLEANUP" title="Image watermark remover" description="Draw a region and repair it with image inpainting." to="/tools/image" badge="LIVE" />
        </div>
      </section>
      <section className="section category-section">
        <div className="category-title"><span>02</span><div><h2>Media acquisition</h2><p>Bring source material into one consistent workflow.</p></div></div>
        <div className="tool-list"><ToolCard index="03" eyebrow="MULTI-PLATFORM" title="Source download" description="A shared extractor layer for supported creator platforms." badge="PLANNED" /></div>
      </section>
      <section className="section category-section">
        <div className="category-title"><span>03</span><div><h2>Creator assist</h2><p>Prepare assets for the next stage of production.</p></div></div>
        <div className="tool-list compact-tools">
          <ToolCard index="04" eyebrow="VIDEO" title="Subtitles" description="Generate and export editable subtitles." badge="PLANNED" />
          <ToolCard index="05" eyebrow="IMAGE" title="Cover maker" description="Turn a frame into a publishing-ready cover." badge="PLANNED" />
          <ToolCard index="06" eyebrow="MEDIA" title="Format converter" description="Convert media into the format your workflow needs." badge="PLANNED" />
        </div>
      </section>
    </>
  );
}
