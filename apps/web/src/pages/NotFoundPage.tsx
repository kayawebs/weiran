import { Link } from "react-router-dom";
import { Seo } from "../components/Seo";
import { copy } from "../i18n/copy";

export function NotFoundPage() {
  return <section className="not-found"><Seo title={copy.notFound.title} description={copy.notFound.description} noIndex /><p className="eyebrow">{copy.notFound.eyebrow}</p><h1>{copy.notFound.title}</h1><p>{copy.notFound.description}</p><Link className="primary-action" to="/">{copy.notFound.back} <span>→</span></Link></section>;
}
