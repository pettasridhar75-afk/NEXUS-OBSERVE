
import type { ApiRequestRecord, RequestMetrics } from "../models/request";

function percentile(values: number[], p: number) {
  if (!values.length) return 0;

  const sorted = [...values].sort((a, b) => a - b);

  return sorted[Math.max(0, Math.ceil(p * sorted.length) - 1)];
}

export function calculateMetrics(
  rows: ApiRequestRecord[]
): RequestMetrics {
  const total = rows.length;
  const failed = rows.filter((r) => r.status >= 400).length;
  const values = rows.map((r) => r.duration);
  const sorted = [...values].sort((a, b) => a - b);

  const median =
    sorted.length === 0
      ? 0
      : sorted.length % 2 === 0
        ? (sorted[sorted.length / 2 - 1] +
            sorted[sorted.length / 2]) /
          2
        : sorted[Math.floor(sorted.length / 2)];

  return {
    total,
    successful: total - failed,
    failed,
    successRate: total ? ((total - failed) / total) * 100 : 0,
    errorRate: total ? (failed / total) * 100 : 0,
    averageLatency: total
      ? values.reduce((a, b) => a + b, 0) / total
      : 0,
    medianLatency: median,
    p95Latency: percentile(values, 0.95),
    p99Latency: percentile(values, 0.99),
    totalTrafficBytes: rows.reduce(
      (sum, r) => sum + r.responseSize,
      0
    ),
  };
}

export interface TrendBucket {
  label: string;
  requests: number;
  errors: number;
  averageLatency: number;
  critical: number;
  warning: number;
  healthy: number;
}

interface HourBucket {
  start: number;
  label: string;
  rows: ApiRequestRecord[];
}

export function aggregateRequestsByHour(
  rows: ApiRequestRecord[],
  hours = 12
): TrendBucket[] {
  const now = Date.now();

  const buckets: HourBucket[] = Array.from(
    { length: hours },
    (_, i) => ({
      start: now - (hours - i) * 3600000,
      label: new Date(
        now - (hours - i) * 3600000
      ).toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      }),
      rows: [],
    })
  );

  for (const request of rows) {
    const timestamp = Date.parse(request.timestamp);

    const index = buckets.findIndex(
      (bucket, i) =>
        timestamp >= bucket.start &&
        timestamp <
          (i === buckets.length - 1
            ? now + 1
            : buckets[i + 1].start)
    );

    if (index !== -1) {
      buckets[index].rows.push(request);
    }
  }

  return buckets.map((bucket): TrendBucket => {
    const criticalRows = bucket.rows.filter(
      (r) => r.status >= 500 || r.duration >= 3000
    );

    const warningRows = bucket.rows.filter(
      (r) =>
        !(
          r.status >= 500 ||
          r.duration >= 3000
        ) &&
        (r.status >= 400 || r.duration >= 1000)
    );

    const critical = criticalRows.length;
    const warning = warningRows.length;
    const healthy = bucket.rows.length - critical - warning;

    return {
      label: bucket.label,
      requests: bucket.rows.length,
      errors: bucket.rows.filter((r) => r.status >= 400).length,
      critical,
      warning,
      healthy,
      averageLatency:
        bucket.rows.length > 0
          ? bucket.rows.reduce(
              (sum, r) => sum + r.duration,
              0
            ) / bucket.rows.length
          : 0,
    };
  });
}
