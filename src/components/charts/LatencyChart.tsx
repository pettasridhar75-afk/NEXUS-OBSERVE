
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
            unit=" ms"
          />

          <Tooltip
            cursor={{ fill: "#f1f6f2" }}
            contentStyle={{
              borderRadius: 8,
              border: "1px solid #e5eae5",
              fontSize: 12,
            }}
            formatter={(value) => [`${value} ms`, "Average response time"]}
          />

          <Bar
            dataKey="averageLatency"
            name="Average response time"
            fill="#27845c"
            radius={[5, 5, 0, 0]}
            maxBarSize={42}
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
