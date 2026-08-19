import { useState } from "react";
import { Link, NavLink, Outlet, useLocation } from "react-router-dom";

const navItems = [
  { to: "/", label: "Home", end: true },
  { to: "/tools", label: "Tools", end: false },
  { to: "/history", label: "History", end: false }
];

export function Layout() {
  const [menuOpen, setMenuOpen] = useState(false);
  const location = useLocation();

  return (
    <div className="site-shell">
      <header className="site-header">
        <Link className="brand" to="/" aria-label="Weiran Lab home" onClick={() => setMenuOpen(false)}>
          <span className="brand-mark" aria-hidden="true"><span>W</span></span>
          <span>Weiran Lab</span>
        </Link>
        <button className="menu-button" type="button" aria-label="Toggle navigation" aria-expanded={menuOpen} onClick={() => setMenuOpen(!menuOpen)}>
          <span /><span />
        </button>
        <nav className={menuOpen ? "nav-open" : ""} aria-label="Primary navigation">
          {navItems.map((item) => (
            <NavLink key={item.to} to={item.to} end={item.end} onClick={() => setMenuOpen(false)} className={({ isActive }) => isActive ? "active" : ""}>
              {item.label}
            </NavLink>
          ))}
        </nav>
      </header>
      <main key={location.pathname}><Outlet /></main>
      <footer className="site-footer">
        <div><span className="footer-brand">Weiran Lab</span><p>Practical media infrastructure for AI creators.</p></div>
        <p>Only process media you own or are authorized to use.</p>
        <span>© {new Date().getFullYear()} Weiran Lab</span>
      </footer>
    </div>
  );
}
