export interface MonitoredRequest {
  endpoint: string;
  status: number;
  duration: number;
}

export interface AnomalyRules {
  slowRequestMs: number;
  criticalRequestMs: number;
  maxErrorRate: number;
}

export interface Anomaly {
  endpoint: string;
  severity: "warning" | "critical";
  type: string;
  message: string;
}

export const defaultRules: AnomalyRules = {
  slowRequestMs: 1000,
  criticalRequestMs: 3000,
  maxErrorRate: 5,
};

export function detectAnomalies(
  request: MonitoredRequest,
  rules: AnomalyRules = defaultRules
): Anomaly[] {
  const anomalies: Anomaly[] = [];

  if (request.duration >= rules.criticalRequestMs) {
    anomalies.push({
      endpoint: request.endpoint,
      severity: "critical",
      type: "Critical Latency",
      message: `Response time exceeded ${rules.criticalRequestMs} ms.`,
    });
  } else if (request.duration >= rules.slowRequestMs) {
    anomalies.push({
      endpoint: request.endpoint,
      severity: "warning",
      type: "Slow Request",
      message: `Response time exceeded ${rules.slowRequestMs} ms.`,
    });
  }

  if (request.status >= 500) {
    anomalies.push({
      endpoint: request.endpoint,
      severity: "critical",
      type: "Server Error",
      message: `Server returned HTTP ${request.status}.`,
    });
  } else if (request.status >= 400) {
    anomalies.push({
      endpoint: request.endpoint,
      severity: "warning",
      type: "Client Error",
      message: `Request returned HTTP ${request.status}.`,
    });
  }

  return anomalies;
}

export function calculateErrorRate(
  requests: MonitoredRequest[]
): number {
  if (requests.length === 0) return 0;

  const errors = requests.filter(
    request => request.status >= 400
  ).length;

  return (errors / requests.length) * 100;
}

export function detectHighErrorRate(
  requests: MonitoredRequest[],
  threshold = defaultRules.maxErrorRate
): Anomaly[] {
  const errorRate = calculateErrorRate(requests);

  if (requests.length === 0 || errorRate <= threshold) {
    return [];
  }

  return [{
    endpoint: "Multiple endpoints",
    severity: "critical",
    type: "High Error Rate",
    message: `Error rate is ${errorRate.toFixed(2)}%, above the ${threshold}% threshold.`,
  }];
}
