
import {
  BarChart,
  Bar,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import type { TrendBucket } from "../../utils/metrics";

export function LatencyChart({ data }: { data: TrendBucket[] }) {
  return (
    <div className="chart-wrap">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={data}
          margin={{ top: 15, right: 12, left: -18, bottom: 5 }}
        >
          <CartesianGrid
            stroke="#e9ede9"
            strokeDasharray="3 4"
            vertical={false}
          />

          <XAxis
            dataKey="label"
            tick={{ fill: "#87918a", fontSize: 11 }}
            axisLine={false}
            tickLine={false}
          />

          <YAxis
            tick={{ fill: "#87918a", fontSize: 11 }}
            axisLine={false}
            tickLine={false}
            allowDecimals={false}
          />

          <Tooltip
            cursor={{ fill: "#f1f6f2" }}
            contentStyle={{
              borderRadius: 8,
              border: "1px solid #e5eae5",
              fontSize: 12,
            }}
          />

          <Bar
            dataKey="healthy"
            name="Healthy"
            stackId="requests"
            fill="#27845c"
          />

          <Bar
            dataKey="warning"
            name="Warning"
            stackId="requests"
            fill="#F59E0B"
          />

          <Bar
            dataKey="critical"
            name="Critical"
            stackId="requests"
            fill="#E5484D"
            radius={[5, 5, 0, 0]}
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
