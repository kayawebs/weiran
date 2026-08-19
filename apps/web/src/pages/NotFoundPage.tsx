import { Link } from "react-router-dom";

export function NotFoundPage() {
  return <section className="not-found"><p className="eyebrow">404 · OFF THE WORKBENCH</p><h1>Nothing here.</h1><p>The page may have moved, but the tools are still ready.</p><Link className="primary-action" to="/">Back home <span>→</span></Link></section>;
}
