
import type { ApiRequestRecord } from "../../models/request";

export function RequestTable({
  requests,
  onSelect,
}: {
  requests: ApiRequestRecord[];
  onSelect: (r: ApiRequestRecord) => void;
}) {
  if (!requests.length) {
    return (
      <div className="empty-state">
        <strong>No matching requests</strong>
        <span>
          Try changing your search or filters to see more results.
        </span>
      </div>
    );
  }

  return (
    <div className="table-scroll">
      <table className="request-table">
        <thead>
          <tr>
            <th>Endpoint</th>
            <th>Method</th>
            <th>Status</th>
            <th>Response time</th>
            <th>Time</th>
            <th>Action</th>
          </tr>
        </thead>

        <tbody>
          {requests.map((request) => (
            <tr
              key={request.id}
              onClick={() => onSelect(request)}
              tabIndex={0}
              aria-label={`View details for ${request.method} ${request.endpoint}`}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  onSelect(request);
                }
              }}
            >
              <td>
                <strong>{request.endpoint}</strong>
                <small>{request.id}</small>
              </td>

              <td>
                <span
                  className={`method method-${request.method.toLowerCase()}`}
                >
                  {request.method}
                </span>
              </td>

              <td>
                <span
                  className={`status ${
                    request.status >= 400
                      ? "status-error"
                      : "status-ok"
                  }`}
                >
                  {request.status}
                </span>
              </td>

              <td>{Math.round(request.duration)} ms</td>

              <td>
                {new Date(request.timestamp).toLocaleTimeString([], {
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </td>

              <td>
                <button
                  className="text-button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onSelect(request);
                  }}
                >
                  View details
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
