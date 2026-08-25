import { NavLink, Outlet } from "react-router-dom";
import { useProfile } from "../context/ProfileContext";
import { useTranslation } from "../i18n/LanguageContext";
import type { LanguageCode } from "../i18n/LanguageContext";

const NAV_ITEMS = [
  { to: "/", key: "nav.dashboard", end: true, soon: false },
  { to: "/discovery", key: "nav.discovery", soon: false },
  { to: "/market", key: "nav.market", soon: false },
  { to: "/financial", key: "nav.financial", soon: false },
  { to: "/schemes", key: "nav.schemes", soon: false },
  { to: "/stress", key: "nav.stress", soon: true },
  { to: "/report", key: "nav.report", soon: true },
  { to: "/advisor", key: "nav.advisor", soon: false },
];

const BOTTOM_NAV_ITEMS = [
  { to: "/", key: "nav.dashboard", end: true },
  { to: "/discovery", key: "nav.discovery" },
  { to: "/market", key: "nav.market" },
  { to: "/financial", key: "nav.financial" },
];

export function AppShell() {
  const { applicant, villagePath, clearProfile } = useProfile();
  const { t, language, setLanguage } = useTranslation();

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="sidebar-brand">
          <span className="sidebar-brand-mark">EI</span>
          <div>
            <div className="sidebar-brand-name">{t("appName")}</div>
            <div className="sidebar-brand-sub">{t("appTagline")}</div>
          </div>
        </div>

        <nav className="sidebar-nav">
          {NAV_ITEMS.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) => "sidebar-link" + (isActive ? " active" : "")}
            >
              {t(item.key)}
              {item.soon && <span className="badge-soon">{t("common.comingSoon")}</span>}
            </NavLink>
          ))}
        </nav>

        <div className="sidebar-footer">
          <NavLink to="/profile" className="sidebar-link" style={{ padding: 0, marginBottom: 6 }}>
            {t("nav.profile")}
          </NavLink>
          {applicant && (
            <>
              <div className="sidebar-footer-label">{t("nav.profile")}</div>
              <div className="sidebar-footer-id">{villagePath ?? applicant.id.slice(0, 8) + "…"}</div>
              <button className="sidebar-switch-btn secondary" onClick={clearProfile} type="button">
                {t("topbar.switchProfile")}
              </button>
            </>
          )}
        </div>
      </aside>

      <div className="app-column">
        <header className="topbar">
          <div className="topbar-location">📍 {villagePath ?? "—"}</div>
          <div className="topbar-actions">
            <select
              className="lang-select"
              value={language}
              onChange={(e) => setLanguage(e.target.value as LanguageCode)}
              aria-label={t("topbar.language")}
            >
              <option value="en">English</option>
              <option value="hi">हिन्दी</option>
            </select>
            <button className="icon-btn" type="button" title={t("topbar.notifications")}>
              🔔
            </button>
            <button className="icon-btn" type="button" title={t("topbar.settings")}>
              ⚙️
            </button>
          </div>
        </header>

        <main className="app-main">
          <Outlet />
        </main>
      </div>

      <nav className="bottom-nav">
        {BOTTOM_NAV_ITEMS.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.end}
            className={({ isActive }) => (isActive ? "active" : undefined)}
          >
            {t(item.key)}
          </NavLink>
        ))}
      </nav>
    </div>
  );
}
