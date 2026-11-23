
import type { DashboardView } from "../../models/request";

const items: DashboardView[] = [
  "Overview",
  "API Explorer",
  "Performance",
  "Anomalies",
  "Settings",
];

export function Sidebar({
  active,
  onNavigate,
  anomalyCount,
  mobileOpen,
  onClose,
}: {
  active: DashboardView;
  onNavigate: (v: DashboardView) => void;
  anomalyCount: number;
  mobileOpen: boolean;
  onClose: () => void;
}) {
  return (
    <>
      <button
        className={`mobile-scrim ${mobileOpen ? "visible" : ""}`}
        onClick={onClose}
        aria-label="Close menu"
      />

      <aside className={`sidebar ${mobileOpen ? "sidebar-open" : ""}`}>
        <div className="brand">
          <div>
            <strong>
              nexus<span>.</span>
            </strong>
            <small>OBSERVE</small>
          </div>
        </div>

        <p className="workspace-label">WORKSPACE</p>

        <nav>
          {items.map((label) => (
            <button
              key={label}
              className={`nav-item ${active === label ? "active" : ""}`}
              onClick={() => {
                onNavigate(label);
                onClose();
              }}
            >
              <span>{label}</span>

              {label === "Anomalies" && anomalyCount > 0 && (
                <em>{anomalyCount}</em>
              )}
            </button>
          ))}
        </nav>

        <div className="sidebar-bottom">
          <div>
            <strong>Monitoring workspace</strong>
            <small>Frontend systems</small>
          </div>
        </div>
      </aside>
    </>
  );
}
