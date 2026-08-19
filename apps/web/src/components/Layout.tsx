import { useState } from "react";
import { Link, NavLink, Outlet, useLocation } from "react-router-dom";
import { marketConfig } from "../config/market";
import { copy } from "../i18n/copy";

const navItems = [
  { to: "/", label: copy.layout.home, end: true },
  { to: "/tools", label: copy.layout.tools, end: false },
  { to: "/history", label: copy.layout.history, end: false }
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
        <div><span className="footer-brand">{marketConfig.brandName}</span><p>{copy.layout.tagline}</p></div>
        <p>{copy.layout.legal}</p>
        <span>© {new Date().getFullYear()} {marketConfig.brandName}</span>
      </footer>
    </div>
  );
}
