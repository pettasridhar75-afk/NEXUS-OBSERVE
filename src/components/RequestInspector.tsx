import { useState } from "react";
import {
  X, Copy, Check, Clock3, Activity,
  FileJson, AlertTriangle, ShieldCheck
} from "lucide-react";

export interface InspectorRequest {
  id: string | number;
  time?: string;
  timestamp?: string;
  method: string;
  endpoint: string;
  status: number;
  duration: number;
  size?: string;
  responseSize?: number;
  error?: string;
  errorMessage?: string;
  requestHeaders?: Record<string, unknown>;
  responseHeaders?: Record<string, unknown>;
  requestBody?: unknown;
  responseBody?: unknown;
}

interface RequestInspectorProps {
  request: InspectorRequest;
  onClose: () => void;
}

type Tab = "Overview" | "Request" | "Response" | "Errors";

function redact(value: unknown): unknown {
  const sensitive = [
    "password", "token", "authorization",
    "cookie", "secret", "api_key", "apikey"
  ];

  if (Array.isArray(value)) return value.map(redact);

  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value).map(([key, item]) => [
        key,
        sensitive.some(term => key.toLowerCase().includes(term))
          ? "[REDACTED]"
          : redact(item)
      ])
    );
  }

  return value;
}

function JsonViewer({ value }: { value: unknown }) {
  const safeValue = redact(value);
  const output = JSON.stringify(safeValue ?? {}, null, 2);

  const [copied, setCopied] = useState(false);

  async function copyJson() {
    try {
      await navigator.clipboard.writeText(output);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1500);
    } catch {
      setCopied(false);
    }
  }

  return (
    <div className="rounded-xl border border-white/10 overflow-hidden bg-[#080d19]">
      <div className="flex items-center justify-between px-4 py-3 border-b border-white/10">
        <span className="text-xs text-slate-400">JSON data</span>
        <button
          onClick={copyJson}
          className="flex items-center gap-2 text-xs text-violet-300 hover:text-white"
        >
          {copied ? <Check size={14} /> : <Copy size={14} />}
          {copied ? "Copied" : "Copy JSON"}
        </button>
      </div>
      <pre className="p-4 overflow-auto max-h-[320px] text-xs leading-6 text-cyan-200 whitespace-pre-wrap break-words">
        {output}
      </pre>
    </div>
  );
}

function HeaderViewer({
  headers
}: {
  headers?: Record<string, unknown>;
}) {
  return (
    <div className="rounded-xl border border-white/10 overflow-hidden">
      {Object.entries((redact(headers ?? {}) as Record<string, unknown>)).length === 0 ? (
        <p className="p-4 text-sm text-slate-500">No headers available.</p>
      ) : (
        Object.entries(redact(headers ?? {}) as Record<string, unknown>).map(
          ([key, value]) => (
            <div
              key={key}
              className="grid grid-cols-1 sm:grid-cols-2 gap-2 px-4 py-3 border-b border-white/[0.06] last:border-0"
            >
              <span className="text-xs text-slate-400 break-all">{key}</span>
              <span className="text-xs text-slate-200 break-all">
                {String(value)}
              </span>
            </div>
          )
        )
      )}
    </div>
  );
}

export default function RequestInspector({
  request,
  onClose
}: RequestInspectorProps) {
  const [tab, setTab] = useState<Tab>("Overview");

  const failed = request.status >= 400;
  const error = request.errorMessage || request.error;

  const tabs: Tab[] = ["Overview", "Request", "Response", "Errors"];

  return (
    <div
      className="fixed inset-0 z-[100] flex justify-end bg-black/70 backdrop-blur-sm"
      onMouseDown={event => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <section
        role="dialog"
        aria-modal="true"
        aria-labelledby="inspector-title"
        className="w-full max-w-2xl h-full overflow-y-auto bg-[#0b1020] border-l border-white/10 shadow-2xl"
      >
        <header className="sticky top-0 z-10 bg-[#0b1020]/95 backdrop-blur-xl border-b border-white/10 p-5">
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-[10px] tracking-widest text-violet-400 font-bold">
                  REQUEST INSPECTOR
                </span>
                <span className={`text-[10px] rounded-md px-2 py-1 font-bold ${
                  failed
                    ? "bg-rose-500/10 text-rose-400"
                    : "bg-emerald-500/10 text-emerald-400"
                }`}>
                  HTTP {request.status}
                </span>
              </div>
              <h2 id="inspector-title" className="text-lg font-bold text-white break-all">
                {request.endpoint}
              </h2>
              <p className="text-xs text-slate-500 mt-1">
                {request.method} · Request ID: {request.id}
              </p>
            </div>
            <button
              onClick={onClose}
              aria-label="Close request inspector"
              className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-white/10"
            >
              <X size={19} />
            </button>
          </div>

          <div className="grid grid-cols-3 gap-3 mt-5">
            <div className="rounded-xl bg-white/[0.04] p-3">
              <Clock3 size={16} className="text-violet-400 mb-2" />
              <p className="text-lg font-bold text-white">{request.duration} ms</p>
              <p className="text-[10px] text-slate-500">Response time</p>
            </div>
            <div className="rounded-xl bg-white/[0.04] p-3">
              <Activity size={16} className="text-cyan-400 mb-2" />
              <p className="text-lg font-bold text-white">{request.method}</p>
              <p className="text-[10px] text-slate-500">HTTP method</p>
            </div>
            <div className="rounded-xl bg-white/[0.04] p-3">
              <FileJson size={16} className="text-emerald-400 mb-2" />
              <p className="text-lg font-bold text-white">
                {request.size ?? (
                  request.responseSize !== undefined
                    ? `${(request.responseSize / 1024).toFixed(1)} KB`
                    : "—"
                )}
              </p>
              <p className="text-[10px] text-slate-500">Response size</p>
            </div>
          </div>

          <nav className="flex gap-1 mt-5 overflow-x-auto" aria-label="Request details">
            {tabs.map(item => (
              <button
                key={item}
                onClick={() => setTab(item)}
                aria-pressed={tab === item}
                className={`px-4 py-2 rounded-lg text-xs whitespace-nowrap transition ${
                  tab === item
                    ? "bg-violet-600/20 text-violet-300 border border-violet-500/20"
                    : "text-slate-400 hover:text-white hover:bg-white/5"
                }`}
              >
                {item}
              </button>
            ))}
          </nav>
        </header>

        <div className="p-5 space-y-5">
          {tab === "Overview" && (
            <>
              <div>
                <h3 className="text-sm font-semibold text-white mb-3">Request information</h3>
                <div className="rounded-xl border border-white/10 p-4 space-y-3">
                  <div className="flex justify-between gap-3 text-xs">
                    <span className="text-slate-500">Timestamp</span>
                    <span className="text-slate-200 text-right">
                      {request.timestamp
                        ? new Date(request.timestamp).toLocaleString()
                        : request.time ?? "Unavailable"}
                    </span>
                  </div>
                  <div className="flex justify-between gap-3 text-xs">
                    <span className="text-slate-500">HTTP status</span>
                    <span className={failed ? "text-rose-400" : "text-emerald-400"}>
                      {request.status}
                    </span>
                  </div>
                  <div className="flex justify-between gap-3 text-xs">
                    <span className="text-slate-500">Duration</span>
                    <span className="text-white">{request.duration} ms</span>
                  </div>
                  <div className="flex justify-between gap-3 text-xs">
                    <span className="text-slate-500">Endpoint</span>
                    <span className="text-slate-200 text-right break-all">{request.endpoint}</span>
                  </div>
                </div>
              </div>
              <div className="flex items-start gap-3 rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-4">
                <ShieldCheck size={18} className="text-emerald-400 shrink-0" />
                <p className="text-xs text-slate-300 leading-relaxed">
                  Sensitive values are masked before displaying request and response data.
                </p>
              </div>
            </>
          )}

          {tab === "Request" && (
            <div className="space-y-5">
              <div>
                <h3 className="text-sm font-semibold text-white mb-3">Request headers</h3>
                <HeaderViewer headers={request.requestHeaders} />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-white mb-3">Request payload</h3>
                <JsonViewer value={request.requestBody} />
              </div>
            </div>
          )}

          {tab === "Response" && (
            <div className="space-y-5">
              <div>
                <h3 className="text-sm font-semibold text-white mb-3">Response headers</h3>
                <HeaderViewer headers={request.responseHeaders} />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-white mb-3">Response payload</h3>
                <JsonViewer value={request.responseBody} />
              </div>
            </div>
          )}

          {tab === "Errors" && (
            <div className={`rounded-xl border p-5 ${
              failed
                ? "border-rose-500/20 bg-rose-500/5"
                : "border-emerald-500/20 bg-emerald-500/5"
            }`}>
              {failed ? (
                <>
                  <AlertTriangle size={22} className="text-rose-400 mb-3" />
                  <h3 className="text-sm font-semibold text-rose-300">Request failed</h3>
                  <p className="text-xs text-slate-300 mt-2 leading-relaxed">
                    {error || `The request returned HTTP ${request.status}.`}
                  </p>
                </>
              ) : (
                <>
                  <ShieldCheck size={22} className="text-emerald-400 mb-3" />
                  <h3 className="text-sm font-semibold text-emerald-300">No HTTP error recorded</h3>
                  <p className="text-xs text-slate-400 mt-2">
                    This request completed without an HTTP failure.
                  </p>
                </>
              )}
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
