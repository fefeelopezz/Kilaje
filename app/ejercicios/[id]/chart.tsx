"use client";

import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

export function Chart({ data }: { data: { fecha: string; peso: number }[] }) {
  return (
    <div className="h-56">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 8, right: 8, bottom: 0, left: 0 }}>
          <CartesianGrid stroke="#8a8f9833" vertical={false} />
          <XAxis dataKey="fecha" stroke="#8a8f98" fontSize={12} tickLine={false} />
          <YAxis
            stroke="#8a8f98"
            fontSize={12}
            tickLine={false}
            axisLine={false}
            width={36}
            domain={["auto", "auto"]}
          />
          <Tooltip
            contentStyle={{ background: "#0e0f11", border: "1px solid #8a8f9866", borderRadius: 8 }}
            labelStyle={{ color: "#8a8f98" }}
          />
          <Line
            type="monotone"
            dataKey="peso"
            name="Peso máximo"
            unit=" kg"
            stroke="#c6f432"
            strokeWidth={2}
            dot={{ r: 3, fill: "#c6f432" }}
            isAnimationActive={false}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
