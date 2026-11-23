
import { useEffect, useMemo, useState } from "react";

import type {
  AnomalyRules,
  ApiRequestRecord,
  DashboardView,
} from "./models/request";

import { Sidebar } from "./components/layout/Sidebar";
import { RequestDrawer } from "./components/requests/RequestDrawer";

import { OverviewPage } from "./pages/OverviewPage";
import { ExplorerPage } from "./pages/ExplorerPage";
import { PerformancePage } from "./pages/PerformancePage";
import { AnomaliesPage } from "./pages/AnomaliesPage";
import { SettingsPage } from "./pages/SettingsPage";

import { useApiRequests } from "./hooks/useApiRequests";
import { calculateMetrics } from "./utils/metrics";
import {
  defaultRules,
  detectAnomalies,
  validateRules,
} from "./utils/anomalyDetection";

export default function App() {
  const {
    requests,
    source,
    loading,
    refreshing,
    error,
    lastUpdated,
    refresh,
  } = useApiRequests();

  const [view, setView] = useState<DashboardView>("Overview");
  const [mobileOpen, setMobileOpen] = useState(false);
  const [selected, setSelected] = useState<ApiRequestRecord | null>(null);
  const [live, setLive] = useState(true);
  const [rules, setRules] = useState<AnomalyRules>(defaultRules);

  useEffect(() => {
    if (!live) return;

    const timer = window.setInterval(() => {
      void refresh();
    }, 15000);

    return () => window.clearInterval(timer);
  }, [live, refresh]);

  const metrics = useMemo(
    () => calculateMetrics(requests),
    [requests]
  );

  const findings = useMemo(
    () =>
      validateRules(rules).length
        ? []
        : detectAnomalies(requests, rules),
    [requests, rules]
  );

  function navigate(nextView: DashboardView) {
    setView(nextView);
    setMobileOpen(false);
    setSelected(null);
  }

  const pageDescriptions: Record<DashboardView, string> = {
    Overview: "A clear picture of your API activity and reliability.",
    "API Explorer": "Find requests, review responses and investigate failures.",
    Performance: "Understand response times and identify slower requests.",
    Anomalies: "Review unusual activity and investigate potential issues.",
    Settings: "Manage monitoring preferences and detection thresholds.",
  };

  return (
    <div className="app-shell">
      <Sidebar
        active={view}
        onNavigate={navigate}
        anomalyCount={findings.length}
        mobileOpen={mobileOpen}
        onClose={() => setMobileOpen(false)}
      />

      <main className="main-area">
        <header className="topbar">
          <button
            className="mobile-menu"
            onClick={() => setMobileOpen(true)}
            aria-label="Open navigation"
          >
            Menu
          </button>

          <div className="breadcrumb">
            <span>Workspace</span>
            <b>/</b>
            <strong>{view}</strong>
          </div>

          <div className="top-actions">
            <span className={`connection-pill ${source}`}>
              <i />
              {source === "api" ? "Connected API" : "Demo data"}
            </span>

            <button
              className="secondary-button"
              onClick={() => navigate("Anomalies")}
            >
              Alerts ({findings.length})
            </button>

            <button
              className={`live-button ${live ? "is-live" : ""}`}
              onClick={() => setLive((value) => !value)}
            >
              <span />
              {live ? "Auto refresh on" : "Auto refresh paused"}
            </button>

            <button
              className="secondary-button"
              onClick={() => void refresh()}
              disabled={refreshing}
            >
              {refreshing ? "Refreshing..." : "Refresh"}
            </button>
          </div>
        </header>

        <div className="content">
          <section className="page-heading">
            <div>
              <p className="eyebrow">
                API RELIABILITY WORKSPACE
              </p>

              <h1>{view === "Overview" ? "API overview" : view}</h1>

              <p className="subheading">
                {pageDescriptions[view]}
              </p>
            </div>

            <div className="heading-meta">
              <span>
                {lastUpdated
                  ? `Last updated ${lastUpdated.toLocaleTimeString()}`
                  : "Waiting for monitoring data"}
              </span>
            </div>
          </section>

          {source === "demo" && (
            <div className="demo-banner">
              <b>DEMO ENVIRONMENT</b>
              This dashboard currently uses simulated request data.
              Connect a monitoring API in Settings to view real telemetry.
            </div>
          )}

          {error && (
            <div className="notice error-notice">
              <span>{error}</span>

              <button onClick={() => void refresh()}>
                Try again
              </button>
            </div>
          )}

          {loading && (
            <div className="notice">
              Loading monitoring data...
            </div>
          )}

          {view === "Overview" && (
            <OverviewPage
              requests={requests}
              metrics={metrics}
              onSelect={setSelected}
              onExplore={() => navigate("API Explorer")}
            />
          )}

          {view === "API Explorer" && (
            <ExplorerPage
              requests={requests}
              onSelect={setSelected}
            />
          )}

          {view === "Performance" && (
            <PerformancePage
              requests={requests}
              metrics={metrics}
            />
          )}

          {view === "Anomalies" && (
            <AnomaliesPage
              findings={findings}
              rules={rules}
            />
          )}

          {view === "Settings" && (
            <SettingsPage
              live={live}
              onLiveChange={setLive}
              rules={rules}
              onRulesChange={setRules}
              source={source}
              lastUpdated={lastUpdated}
            />
          )}

          <footer className="footer">
            <span>
              Nexus Observe · Frontend monitoring
            </span>

            <span>
              {source === "demo" ? "Simulated data" : "Monitoring API"}
              {" · "}
              {requests.length.toLocaleString()} records
            </span>
          </footer>
        </div>
      </main>

      <RequestDrawer
        request={selected}
        onClose={() => setSelected(null)}
      />
    </div>
  );
}
