
import type { AnomalyRules, DataSource } from "../models/request";

export function SettingsPage({
  live,
  onLiveChange,
  rules,
  onRulesChange,
  source,
  lastUpdated,
}: {
  live: boolean;
  onLiveChange: (v: boolean) => void;
  rules: AnomalyRules;
  onRulesChange: (r: AnomalyRules) => void;
  source: DataSource;
  lastUpdated: Date | null;
}) {
  const update = (key: keyof AnomalyRules, value: number) => {
    onRulesChange({
      ...rules,
      [key]: value,
    });
  };

  const thresholds = [
    ["slowRequestMs", "Slow request threshold", "ms"],
    ["criticalRequestMs", "Critical response time", "ms"],
    ["maxErrorRate", "Maximum error rate", "%"],
    [
      "minimumRequestsForRateAlert",
      "Minimum requests for error-rate alert",
      "requests",
    ],
  ] as const;

  return (
    <section className="panel settings-panel">
      <div className="panel-heading">
        <div>
          <h2>Monitoring preferences</h2>
          <p>
            Manage how often your data refreshes and when unusual activity
            should be reported.
          </p>
        </div>
      </div>

      <div className="settings-subheading">
        <h3>Data collection</h3>
        <p>Control how the dashboard receives monitoring data.</p>
      </div>

      <div className="setting-row">
        <div>
          <strong>Automatic refresh</strong>
          <small>
            Check for new monitoring data every 15 seconds.
          </small>
        </div>

        <button
          className={`toggle ${live ? "on" : ""}`}
          onClick={() => onLiveChange(!live)}
          aria-pressed={live}
        >
          {live ? "Enabled" : "Paused"}
        </button>
      </div>

      <div className="setting-row">
        <div>
          <strong>Current data source</strong>
          <small>
            {source === "api"
              ? "The dashboard is receiving data from a monitoring API."
              : "The dashboard is currently using simulated sample data."}
          </small>
        </div>

        <span className={`source-tag ${source}`}>
          {source === "api" ? "Connected API" : "Demo data"}
        </span>
      </div>

      <div className="setting-row">
        <div>
          <strong>Last successful update</strong>
          <small>
            {lastUpdated
              ? lastUpdated.toLocaleString()
              : "No successful update has been recorded yet."}
          </small>
        </div>
      </div>

      <div className="settings-subheading">
        <h3>Detection thresholds</h3>
        <p>
          Adjust the limits used to identify slow requests and unusual error
          rates. Changes apply to the loaded request data.
        </p>
      </div>

      {thresholds.map(([key, label, unit]) => (
        <label className="rule-input" key={key}>
          <span>
            {label}
            <small> ({unit})</small>
          </span>

          <input
            type="number"
            min="0"
            value={rules[key]}
            onChange={(e) => update(key, Number(e.target.value))}
          />
        </label>
      ))}

      <p className="settings-footnote">
        To connect a real monitoring API, configure
        VITE_OBSERVABILITY_API_URL in your .env file.
        Refer to README for the expected API response format.
      </p>
    </section>
  );
}
