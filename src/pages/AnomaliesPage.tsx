
import type {
  AnomalyFinding,
  AnomalyRules,
} from "../models/request";

export function AnomaliesPage({
  findings,
  rules,
}: {
  findings: AnomalyFinding[];
  rules: AnomalyRules;
}) {
  const critical = findings.filter(
    (finding) => finding.severity === "critical"
  ).length;

  const warnings = findings.length - critical;

  return (
    <section className="panel">
      <div className="panel-heading">
        <div>
          <h2>Unusual API activity</h2>
          <p>
            Requests that crossed one or more of your configured monitoring
            thresholds.
          </p>
        </div>

        <span className="count-pill">
          {findings.length} {findings.length === 1 ? "issue" : "issues"} found
        </span>
      </div>

      <div className="anomaly-summary">
        <div>
          <strong>{critical}</strong>
          <span>Critical issues</span>
        </div>

        <div>
          <strong>{warnings}</strong>
          <span>Warnings</span>
        </div>
      </div>

      {findings.length > 0 ? (
        <div className="finding-list">
          {findings.map((finding) => (
            <article className="finding" key={finding.id}>
              <div>
                <div className="finding-title">
                  <strong>{finding.type}</strong>
                  <span>{finding.severity}</span>
                </div>

                <b>{finding.endpoint}</b>

                <p>{finding.message}</p>

                {finding.timestamp && (
                  <small>
                    Detected on{" "}
                    {new Date(finding.timestamp).toLocaleString()}
                  </small>
                )}
              </div>
            </article>
          ))}
        </div>
      ) : (
        <div className="empty-state">
          <strong>No unusual activity found</strong>
          <span>
            The loaded requests have not crossed any of your configured
            monitoring thresholds.
          </span>
        </div>
      )}

      <div className="rule-note">
        <strong>Monitoring thresholds</strong>
        <span>Slow request: {rules.slowRequestMs} ms</span>
        <span>Critical response time: {rules.criticalRequestMs} ms</span>
        <span>
          Error rate: {rules.maxErrorRate}% · Minimum{" "}
          {rules.minimumRequestsForRateAlert} requests
        </span>
      </div>
    </section>
  );
}
