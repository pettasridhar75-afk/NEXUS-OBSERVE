import { describe, it, expect } from "vitest";
import {
  detectAnomalies,
  calculateErrorRate,
  detectHighErrorRate,
} from "../utils/anomalyDetection";

describe("Anomaly Detection", () => {
  it("detects slow requests", () => {
    const result = detectAnomalies({
      endpoint: "/api/products",
      status: 200,
      duration: 1500,
    });

    expect(result[0].type).toBe("Slow Request");
    expect(result[0].severity).toBe("warning");
  });

  it("detects critical latency", () => {
    const result = detectAnomalies({
      endpoint: "/api/orders",
      status: 200,
      duration: 4000,
    });

    expect(result[0].type).toBe("Critical Latency");
    expect(result[0].severity).toBe("critical");
  });

  it("detects server errors", () => {
    const result = detectAnomalies({
      endpoint: "/api/payment",
      status: 500,
      duration: 200,
    });

    expect(result.some(a => a.type === "Server Error")).toBe(true);
  });

  it("calculates error rate correctly", () => {
    const requests = [
      { endpoint: "/a", status: 200, duration: 100 },
      { endpoint: "/b", status: 500, duration: 200 },
      { endpoint: "/c", status: 200, duration: 300 },
      { endpoint: "/d", status: 404, duration: 150 },
    ];

    expect(calculateErrorRate(requests)).toBe(50);
  });

  it("returns zero for empty requests", () => {
    expect(calculateErrorRate([])).toBe(0);
  });

  it("detects high error rates", () => {
    const requests = [
      { endpoint: "/a", status: 500, duration: 100 },
      { endpoint: "/b", status: 200, duration: 100 },
    ];

    expect(detectHighErrorRate(requests).length).toBe(1);
  });

  it("does not flag normal requests", () => {
    const result = detectAnomalies({
      endpoint: "/api/users",
      status: 200,
      duration: 200,
    });

    expect(result).toHaveLength(0);
  });
});
