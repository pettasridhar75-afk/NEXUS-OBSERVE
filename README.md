# NEXUS OBSERVE

A modular frontend observability workspace for inspecting API request behaviour, latency, errors and rule-based anomalies.

## Features
- Five pages: Overview, API Explorer, Performance, Anomalies and Settings.
- Search, method/status filtering, sorting, pagination, request inspection and CSV export.
- Average, median, P95 and P99 latency metrics.
- Timestamp-based hourly aggregation of the loaded sample.
- Explainable anomaly rules with configurable thresholds and severity.
- Runtime API response validation and recursive sensitive-field redaction.
- Abortable API requests, refresh lifecycle and error handling.
- Explicit Demo source / Live API source labels.
- Responsive professional interface and unit tests.

## Setup
Requires Node.js 20+ and npm.

```bash
npm install
cp .env.example .env
npm run dev
```

PowerShell alternative: `Copy-Item .env.example .env`. On Windows PowerShell use `npm.cmd` if script execution policy blocks `npm`.

## Verify
```bash
npm test
npm run build
npm run lint
```

## API contract
Set `VITE_OBSERVABILITY_API_URL` in `.env`. The endpoint must return an array of records or `{ "requests": [...] }`. Each record requires:
- `id`, `timestamp` (ISO date), `method` (GET/POST/PUT/PATCH/DELETE), `endpoint`
- `status` (100–599), `duration` (non-negative ms), `responseSize` (non-negative bytes)
- `requestHeaders` and `responseHeaders` (string maps)
- Optional `requestBody`, `responseBody`, `errorMessage`

Do not put private API credentials in Vite environment variables: client-side variables are bundled into browser code. The endpoint must permit browser CORS requests.

## Architecture
`models/` shared domain types; `services/` API access and validation; `hooks/` React request lifecycle; `data/` demo records; `utils/` pure metric, aggregation, anomaly and CSV functions; `pages/` five screen modules; `components/` reusable UI; `tests/` unit tests.

## Important data limitations
The included records are simulated demo telemetry, not production observations. Hourly buckets are derived from timestamps in the records currently loaded; they are not a persistent historical time-series database. P95/P99 are calculated from the currently loaded sample. This starter does not automatically instrument a browser app. A production deployment needs a telemetry ingestion/backend service that stores real events and time-windowed aggregates.

## Suggested next work
1. Build or connect a real telemetry ingestion service.
2. Add server-side historical time buckets and date-range queries.
3. Add endpoint-level alert aggregation and alert lifecycle.
4. Add integration and end-to-end tests.
5. Add accessibility audit, deployment pipeline and architecture decision records.
