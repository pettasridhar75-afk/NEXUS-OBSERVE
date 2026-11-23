
import type {
  ApiRequestRecord,
  RequestMetrics,
} from "../models/request";

import { MetricCard } from "../components/ui/MetricCard";
import { LatencyChart } from "../components/charts/LatencyChart";
import { RequestTable } from "../components/requests/RequestTable";
import { aggregateRequestsByHour } from "../utils/metrics";

export function OverviewPage({
  requests,
  metrics,
  onSelect,
  onExplore,
}: {
  requests: ApiRequestRecord[];
  metrics: RequestMetrics;
  onSelect: (r: ApiRequestRecord) => void;
  onExplore: () => void;
}) {
  return (
    <>
      <section className="metrics-grid">
        <MetricCard
          label="Total API requests"
          value={metrics.total.toLocaleString()}
          detail="Requests recorded in this dataset"
        />

        <MetricCard
          label="Successful requests"
          value={`${metrics.successRate.toFixed(1)}%`}
          detail={`${metrics.successful} requests completed successfully`}
        />

        <MetricCard
          label="Average response time"
          value={`${Math.round(metrics.averageLatency)} ms`}
          detail={`95% of requests completed within ${Math.round(metrics.p95Latency)} ms`}
        />

        <MetricCard
          label="Failed requests"
          value={String(metrics.failed)}
          detail={`${metrics.errorRate.toFixed(1)}% of recorded requests`}
        />
      </section>

      <section className="panel chart-panel">
        <div className="panel-heading">
          <div>
            <h2>Response time throughout the day</h2>
            <p>
              Average API response time across the available hourly data.
            </p>
          </div>

          <span className="chart-legend">
            <i />
            Average response time
          </span>
        </div>

        <LatencyChart
          data={aggregateRequestsByHour(requests)}
        />
      </section>

      <section className="panel">
        <div className="panel-heading">
          <div>
            <h2>Latest API requests</h2>
            <p>
              Review recent requests, response statuses and execution times.
            </p>
          </div>

          <button className="text-button" onClick={onExplore}>
            View all requests
          </button>
        </div>

        <RequestTable
          requests={requests.slice(0, 8)}
          onSelect={onSelect}
        />
      </section>
    </>
  );
}
