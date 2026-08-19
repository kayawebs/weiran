import { Link } from "react-router-dom";
import { copy } from "../i18n/copy";

export function NotFoundPage() {
  return <section className="not-found"><p className="eyebrow">{copy.notFound.eyebrow}</p><h1>{copy.notFound.title}</h1><p>{copy.notFound.description}</p><Link className="primary-action" to="/">{copy.notFound.back} <span>→</span></Link></section>;
}
