import { type FormEvent, useState } from "react";
import { useNavigate } from "react-router-dom";
import { tools } from "../catalog/tools";
import { siteCopy } from "../i18n/siteCopy";

type MatchRule = { toolId: string; hosts: string[] };

const matchRules: MatchRule[] = [
  { toolId: "dola-video", hosts: ["dola.com"] },
  { toolId: "jimeng-video", hosts: ["jimeng.jianying.com"] },
  { toolId: "dreamina-video", hosts: ["dreamina.capcut.com", "capcut.com"] },
  { toolId: "doubao-video", hosts: ["doubao.com"] },
  { toolId: "vibes-video", hosts: ["meta.ai", "instagram.com", "facebook.com", "fb.watch"] },
  { toolId: "tiktok-video", hosts: ["tiktok.com"] },
  { toolId: "douyin-video", hosts: ["douyin.com"] },
  { toolId: "xiaohongshu-media", hosts: ["xiaohongshu.com", "xhslink.com"] },
  { toolId: "kuaishou-video", hosts: ["kuaishou.com", "gifshow.com"] }
];

function extractUrl(value: string): URL | null {
  const match = value.match(/https?:\/\/[^\s<>"'，。]+/i);
  if (!match) return null;
  try {
    return new URL(match[0].replace(/[)\]}>]+$/, ""));
  } catch {
    return null;
  }
}

function hostMatches(hostname: string, expected: string): boolean {
  return hostname === expected || hostname.endsWith(`.${expected}`);
}

export function SourceLinkRouter() {
  const navigate = useNavigate();
  const [value, setValue] = useState("");
  const [error, setError] = useState("");

  function submit(event: FormEvent) {
    event.preventDefault();
    const sourceUrl = extractUrl(value.trim());
    if (!sourceUrl) {
      setError(siteCopy.sourceRouter.invalid);
      return;
    }
    const rule = matchRules.find((item) => item.hosts.some((host) => hostMatches(sourceUrl.hostname.toLowerCase(), host)));
    const tool = rule ? tools.find((item) => item.id === rule.toolId) : undefined;
    if (!tool) {
      setError(siteCopy.sourceRouter.unsupported);
      return;
    }
    const params = new URLSearchParams({ url: sourceUrl.toString() });
    if (tool.status === "live") params.set("scan", "1");
    navigate(`${tool.path}?${params.toString()}`);
  }

  return (
    <section className="section source-router-section">
      <div className="source-router">
        <div className="source-router-copy">
          <p className="section-label">{siteCopy.sourceRouter.eyebrow}</p>
          <h2>{siteCopy.sourceRouter.title}</h2>
          <p>{siteCopy.sourceRouter.description}</p>
        </div>
        <form onSubmit={submit}>
          <label htmlFor="source-link-router">{siteCopy.sourceRouter.label}</label>
          <div className="source-router-field">
            <input id="source-link-router" value={value} onChange={(event) => { setValue(event.target.value); setError(""); }} placeholder={siteCopy.sourceRouter.placeholder} autoComplete="url" />
            <button type="submit">{siteCopy.sourceRouter.submit}<span>→</span></button>
          </div>
          {error ? <p className="form-error" role="alert">{error}</p> : <p className="source-router-hint">{siteCopy.sourceRouter.hint}</p>}
        </form>
      </div>
    </section>
  );
}
