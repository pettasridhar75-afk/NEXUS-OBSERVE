export type HttpMethod = "GET" | "POST" | "PUT" | "PATCH" | "DELETE";

export interface ApiRequestRecord {
  id: string;
  timestamp: string;
  method: HttpMethod;
  endpoint: string;
  status: number;
  duration: number;
  responseSize: number;
  requestHeaders: Record<string, string>;
  responseHeaders: Record<string, string>;
  requestBody?: unknown;
  responseBody?: unknown;
  errorMessage?: string;
}

export interface FetchRequestsOptions {
  forceNetworkError?: boolean;
  delayMs?: number;
  timeoutMs?: number;
}

export class ApiServiceError extends Error {
  status?: number;

  constructor(message: string, status?: number) {
    super(message);
    this.name = "ApiServiceError";
    this.status = status;
  }
}

const mockRequests: ApiRequestRecord[] = [
  {
    id: "req-1001",
    timestamp: new Date().toISOString(),
    method: "GET",
    endpoint: "/api/users",
    status: 200,
    duration: 124,
    responseSize: 2048,
    requestHeaders: { Accept: "application/json" },
    responseHeaders: { "Content-Type": "application/json" },
    responseBody: { users: [{ id: 1, name: "Demo User" }] }
  },
  {
    id: "req-1002",
    timestamp: new Date(Date.now() - 30000).toISOString(),
    method: "POST",
    endpoint: "/api/auth/login",
    status: 401,
    duration: 310,
    responseSize: 512,
    requestHeaders: { "Content-Type": "application/json" },
    responseHeaders: { "Content-Type": "application/json" },
    requestBody: { email: "[REDACTED]", password: "[REDACTED]" },
    responseBody: { error: "Unauthorized" },
    errorMessage: "Invalid credentials"
  },
  {
    id: "req-1003",
    timestamp: new Date(Date.now() - 60000).toISOString(),
    method: "GET",
    endpoint: "/api/products",
    status: 200,
    duration: 1850,
    responseSize: 8192,
    requestHeaders: { Accept: "application/json" },
    responseHeaders: { "Content-Type": "application/json" },
    responseBody: { products: [] }
  },
  {
    id: "req-1004",
    timestamp: new Date(Date.now() - 90000).toISOString(),
    method: "DELETE",
    endpoint: "/api/orders/42",
    status: 500,
    duration: 720,
    responseSize: 256,
    requestHeaders: { Accept: "application/json" },
    responseHeaders: { "Content-Type": "application/json" },
    responseBody: { error: "Internal server error" },
    errorMessage: "The server could not process this request"
  },
  {
    id: "req-1005",
    timestamp: new Date(Date.now() - 120000).toISOString(),
    method: "GET",
    endpoint: "/api/analytics",
    status: 200,
    duration: 95,
    responseSize: 4096,
    requestHeaders: { Accept: "application/json" },
    responseHeaders: { "Content-Type": "application/json" },
    responseBody: { visits: 1250 }
  }
];

function wait(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function getApiUrl(): string | undefined {
  return import.meta.env.VITE_OBSERVABILITY_API_URL || undefined;
}

function isRequestRecord(value: unknown): value is ApiRequestRecord {
  if (!value || typeof value !== "object") return false;

  const record = value as Record<string, unknown>;

  return (
    typeof record.id === "string" &&
    typeof record.timestamp === "string" &&
    typeof record.method === "string" &&
    typeof record.endpoint === "string" &&
    typeof record.status === "number" &&
    typeof record.duration === "number"
  );
}

function redactSensitiveData(value: unknown): unknown {
  const sensitiveKeys = [
    "password",
    "token",
    "authorization",
    "cookie",
    "secret",
    "api_key",
    "apikey",
    "access_token",
    "refresh_token"
  ];

  if (Array.isArray(value)) {
    return value.map(redactSensitiveData);
  }

  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value).map(([key, item]) => [
        key,
        sensitiveKeys.some(secret =>
          key.toLowerCase().includes(secret)
        )
          ? "[REDACTED]"
          : redactSensitiveData(item)
      ])
    );
  }

  return value;
}

function sanitizeRequest(record: ApiRequestRecord): ApiRequestRecord {
  return {
    ...record,
    requestHeaders: redactSensitiveData(record.requestHeaders) as Record<string, string>,
    responseHeaders: redactSensitiveData(record.responseHeaders) as Record<string, string>,
    requestBody: redactSensitiveData(record.requestBody),
    responseBody: redactSensitiveData(record.responseBody)
  };
}

export async function fetchRequests(
  options: FetchRequestsOptions = {}
): Promise<ApiRequestRecord[]> {
  const {
    forceNetworkError = false,
    delayMs = 700,
    timeoutMs = 10000
  } = options;

  if (forceNetworkError) {
    await wait(delayMs);
    throw new ApiServiceError("Unable to connect to the monitoring service.");
  }

  const apiUrl = getApiUrl();

  // Demo mode: use simulated asynchronous API data.
  if (!apiUrl) {
    await wait(delayMs);

    return mockRequests.map(sanitizeRequest);
  }

  const controller = new AbortController();

  const timeout = setTimeout(() => {
    controller.abort();
  }, timeoutMs);

  try {
    const response = await fetch(apiUrl, {
      method: "GET",
      headers: { Accept: "application/json" },
      signal: controller.signal
    });

    if (!response.ok) {
      throw new ApiServiceError(
        `Monitoring API returned HTTP ${response.status}`,
        response.status
      );
    }

    const payload: unknown = await response.json();

    const records = Array.isArray(payload)
      ? payload
      : payload &&
          typeof payload === "object" &&
          "requests" in payload &&
          Array.isArray((payload as { requests: unknown }).requests)
        ? (payload as { requests: unknown[] }).requests
        : null;

    if (!records || !records.every(isRequestRecord)) {
      throw new ApiServiceError("The monitoring API returned an invalid data format.");
    }

    return records.map(record => sanitizeRequest(record));
  } catch (error) {
    if (error instanceof ApiServiceError) {
      throw error;
    }

    if (controller.signal.aborted) {
      throw new ApiServiceError("The monitoring API request timed out.");
    }

    throw new ApiServiceError(
      error instanceof Error
        ? error.message
        : "An unexpected network error occurred."
    );
  } finally {
    clearTimeout(timeout);
  }
}

export function getDemoRequestCount(): number {
  return mockRequests.length;
}
