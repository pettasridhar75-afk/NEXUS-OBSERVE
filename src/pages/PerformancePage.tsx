
import type {
  ApiRequestRecord,
  RequestMetrics,
} from "../models/request";

import { MetricCard } from "../components/ui/MetricCard";
import { LatencyChart } from "../components/charts/LatencyChart";
import { aggregateRequestsByHour } from "../utils/metrics";

export function PerformancePage({
  requests,
  metrics,
}: {
  requests: ApiRequestRecord[];
  metrics: RequestMetrics;
}) {
  const slowestRequest = Math.max(
    0,
    ...requests.map((request) => request.duration)
  );

  return (
    <>
      <section className="metrics-grid">
        <MetricCard
          label="Average response time"
          value={`${Math.round(metrics.averageLatency)} ms`}
          detail="Typical response time across requests"
        />

        <MetricCard
          label="Median response time"
          value={`${Math.round(metrics.medianLatency)} ms`}
          detail="Half of requests were this fast or faster"
        />

        <MetricCard
          label="95th percentile"
          value={`${Math.round(metrics.p95Latency)} ms`}
          detail="95% of requests finished within this time"
        />

        <MetricCard
          label="99th percentile"
          value={`${Math.round(metrics.p99Latency)} ms`}
          detail="99% of requests finished within this time"
        />
      </section>

      <section className="panel chart-panel">
        <div className="panel-heading">
          <div>
            <h2>Response time throughout the day</h2>
            <p>
              See how average API response times change across the available
              hourly data.
            </p>
          </div>
        </div>

        <LatencyChart
          data={aggregateRequestsByHour(requests)}
        />
      </section>

      <section className="panel">
        <div className="panel-heading">
          <div>
            <h2>Performance summary</h2>
            <p>A closer look at the requests in this dataset.</p>
          </div>
        </div>

        <div className="insight-grid">
          <div>
            <span>Slowest response</span>
            <strong>{Math.round(slowestRequest)} ms</strong>
          </div>

          <div>
            <span>Total response data</span>
            <strong>
              {(metrics.totalTrafficBytes / 1024).toFixed(1)} KB
            </strong>
          </div>

          <div>
            <span>Requests measured</span>
            <strong>{metrics.total.toLocaleString()}</strong>
          </div>
        </div>
      </section>
    </>
  );
}
