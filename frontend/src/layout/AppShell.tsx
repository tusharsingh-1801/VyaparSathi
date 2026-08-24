import { NavLink, Outlet } from "react-router-dom";
import { useProfile } from "../context/ProfileContext";

const NAV_ITEMS = [
  { to: "/", label: "Home", end: true },
  { to: "/advisory", label: "Business Advisory" },
  { to: "/reports", label: "Reports" },
  { to: "/discovery", label: "Discovery" },
  { to: "/profile", label: "Business Profile" },
];

export function AppShell() {
  const { applicant, clearProfile } = useProfile();

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="sidebar-brand">
          <span className="sidebar-brand-mark">AI</span>
          <div>
            <div className="sidebar-brand-name">Business Advisory</div>
            <div className="sidebar-brand-sub">Hyper-local scheme calculator</div>
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
              {item.label}
            </NavLink>
          ))}
        </nav>

        <div className="sidebar-footer">
          {applicant && (
            <>
              <div className="sidebar-footer-label">Profile</div>
              <div className="sidebar-footer-id">{applicant.id.slice(0, 8)}…</div>
              <button className="sidebar-switch-btn" onClick={clearProfile} type="button">
                Switch profile
              </button>
            </>
          )}
        </div>
      </aside>

      <main className="app-main">
        <Outlet />
      </main>
    </div>
  );
}
