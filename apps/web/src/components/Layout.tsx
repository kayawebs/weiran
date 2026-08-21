import { useState } from "react";
import { Link, NavLink, Outlet, useLocation } from "react-router-dom";
import { marketConfig } from "../config/market";
import { copy } from "../i18n/copy";
import { siteCopy } from "../i18n/siteCopy";

const navItems = [
  { to: "/tools", label: siteCopy.nav.all, end: true },
  { to: "/download", label: siteCopy.nav.download, end: false },
  { to: "/image", label: siteCopy.nav.image, end: false },
  { to: "/video", label: siteCopy.nav.video, end: false },
  { to: "/creator", label: siteCopy.nav.creator, end: false },
  { to: "/history", label: siteCopy.nav.history, end: false }
];

export function Layout() {
  const [menuOpen, setMenuOpen] = useState(false);
  const location = useLocation();

  return (
    <div className="site-shell">
      <header className="site-header">
        <Link className="brand" to="/" aria-label={copy.layout.homeLabel} onClick={() => setMenuOpen(false)}>
          <span className="brand-mark" aria-hidden="true"><span>W</span></span>
          <span>{marketConfig.brandName}</span>
        </Link>
        <button className="menu-button" type="button" aria-label={copy.layout.menu} aria-expanded={menuOpen} onClick={() => setMenuOpen(!menuOpen)}>
          <span /><span />
        </button>
        <nav className={menuOpen ? "nav-open" : ""} aria-label={copy.layout.nav}>
          {navItems.map((item) => (
            <NavLink key={item.to} to={item.to} end={item.end} onClick={() => setMenuOpen(false)} className={({ isActive }) => isActive ? "active" : ""}>
              {item.label}
            </NavLink>
          ))}
        </nav>
      </header>
      <main key={location.pathname}><Outlet /></main>
      <footer className="site-footer">
        <div className="footer-summary"><span className="footer-brand">{marketConfig.brandName}</span><p>{siteCopy.footer.tagline}</p><small>{siteCopy.footer.notice}</small></div>
        <div className="footer-links"><strong>{siteCopy.footer.product}</strong><Link to="/tools">{siteCopy.footer.allTools}</Link><Link to="/history">{siteCopy.nav.history}</Link></div>
        <div className="footer-links"><strong>{siteCopy.footer.workspaces}</strong><Link to="/download">{siteCopy.nav.download}</Link><Link to="/image">{siteCopy.nav.image}</Link><Link to="/video">{siteCopy.nav.video}</Link><Link to="/creator">{siteCopy.nav.creator}</Link></div>
        <div className="footer-links"><strong>{siteCopy.footer.legal}</strong><Link to="/privacy">{siteCopy.footer.privacy}</Link><Link to="/terms">{siteCopy.footer.terms}</Link><Link to="/disclaimer">{siteCopy.footer.disclaimer}</Link></div>
        <span className="footer-copyright">© {new Date().getFullYear()} {marketConfig.brandName}</span>
      </footer>
    </div>
  );
}
