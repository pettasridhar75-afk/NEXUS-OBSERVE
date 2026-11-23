
import { useMemo, useState } from "react";
import type { ApiRequestRecord } from "../models/request";
import { RequestTable } from "../components/requests/RequestTable";
import { requestsToCsv } from "../utils/csv";

export function ExplorerPage({
  requests,
  onSelect,
}: {
  requests: ApiRequestRecord[];
  onSelect: (r: ApiRequestRecord) => void;
}) {
  const [q, setQ] = useState("");
  const [status, setStatus] = useState("All");
  const [method, setMethod] = useState("All");
  const [sort, setSort] = useState("newest");
  const [page, setPage] = useState(1);

  const size = 10;

  const filtered = useMemo(
    () =>
      requests
        .filter((r) =>
          `${r.endpoint} ${r.method} ${r.status} ${r.id}`
            .toLowerCase()
            .includes(q.toLowerCase())
        )
        .filter(
          (r) =>
            status === "All" ||
            (status === "Failed" ? r.status >= 400 : r.status < 400)
        )
        .filter((r) => method === "All" || r.method === method)
        .sort((a, b) =>
          sort === "slowest"
            ? b.duration - a.duration
            : Date.parse(b.timestamp) - Date.parse(a.timestamp)
        ),
    [requests, q, status, method, sort]
  );

  const pages = Math.max(1, Math.ceil(filtered.length / size));
  const current = Math.min(page, pages);

  function exportCsv() {
    const blob = new Blob([requestsToCsv(filtered)], {
      type: "text/csv;charset=utf-8",
    });

    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");

    a.href = url;
    a.download = "nexus-observe-requests.csv";
    a.click();

    URL.revokeObjectURL(url);
  }

  return (
    <section className="panel">
      <div className="panel-heading">
        <div>
          <h2>API request history</h2>
          <p>
            Find specific requests, narrow down results and review what happened.
          </p>
        </div>

        <button className="secondary-button" onClick={exportCsv}>
          Export CSV
        </button>
      </div>

      <div className="filter-bar">
        <label className="search-box">
          <input
            value={q}
            onChange={(e) => {
              setQ(e.target.value);
              setPage(1);
            }}
            placeholder="Search by endpoint, method or request ID"
            aria-label="Search API requests"
          />
        </label>

        <select
          value={status}
          onChange={(e) => {
            setStatus(e.target.value);
            setPage(1);
          }}
          aria-label="Filter by request status"
        >
          <option value="All">All statuses</option>
          <option value="Success">Successful</option>
          <option value="Failed">Failed</option>
        </select>

        <select
          value={method}
          onChange={(e) => {
            setMethod(e.target.value);
            setPage(1);
          }}
          aria-label="Filter by HTTP method"
        >
          <option value="All">All methods</option>
          {["GET", "POST", "PUT", "PATCH", "DELETE"].map((m) => (
            <option key={m} value={m}>
              {m}
            </option>
          ))}
        </select>

        <select
          value={sort}
          onChange={(e) => setSort(e.target.value)}
          aria-label="Sort requests"
        >
          <option value="newest">Newest first</option>
          <option value="slowest">Slowest first</option>
        </select>
      </div>

      <RequestTable
        requests={filtered.slice((current - 1) * size, current * size)}
        onSelect={onSelect}
      />

      <div className="pagination">
        <span>
          Showing{" "}
          {filtered.length ? (current - 1) * size + 1 : 0}
          {"–"}
          {Math.min(current * size, filtered.length)}
          {" of "}
          {filtered.length} requests
        </span>

        <div>
          <button
            disabled={current === 1}
            onClick={() => setPage((p) => p - 1)}
          >
            Previous
          </button>

          <strong>
            {current} / {pages}
          </strong>

          <button
            disabled={current === pages}
            onClick={() => setPage((p) => p + 1)}
          >
            Next
          </button>
        </div>
      </div>
    </section>
  );
}
