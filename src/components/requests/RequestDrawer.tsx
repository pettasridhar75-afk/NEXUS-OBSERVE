
import type { ApiRequestRecord } from "../../models/request";

export function RequestDrawer({
  request,
  onClose,
}: {
  request: ApiRequestRecord | null;
  onClose: () => void;
}) {
  if (!request) return null;

  const rows = [
    ["Request ID", request.id],
    ["Status code", String(request.status)],
    ["Response time", `${Math.round(request.duration)} ms`],
    ["Response size", `${request.responseSize.toLocaleString()} bytes`],
    ["Timestamp", new Date(request.timestamp).toLocaleString()],
  ];

  return (
    <div className="drawer-backdrop" onMouseDown={onClose}>
      <aside
        className="detail-drawer"
        onMouseDown={(e) => e.stopPropagation()}
      >
        <div className="drawer-heading">
          <div>
            <span className="eyebrow">REQUEST DETAILS</span>
            <h2>
              {request.method} {request.endpoint}
            </h2>
          </div>

          <button
            className="secondary-button"
            onClick={onClose}
            aria-label="Close request details"
          >
            Close
          </button>
        </div>

        <div className="detail-list">
          {rows.map(([label, value]) => (
            <div key={label}>
              <span>{label}</span>
              <strong>{value}</strong>
            </div>
          ))}
        </div>

        {request.errorMessage && (
          <div className="error-callout">
            <strong>What went wrong?</strong>
            <p>{request.errorMessage}</p>
          </div>
        )}

        <h3>Response body</h3>
        <pre>
          {JSON.stringify(
            request.responseBody ?? {
              message: "No response body was recorded.",
            },
            null,
            2
          )}
        </pre>

        <h3>Response headers</h3>
        <pre>
          {JSON.stringify(request.responseHeaders, null, 2)}
        </pre>
      </aside>
    </div>
  );
}
