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
          <CartesianGrid stroke="#a1a1a133" vertical={false} />
          <XAxis dataKey="fecha" stroke="#a1a1a1" fontSize={12} tickLine={false} />
          <YAxis
            stroke="#a1a1a1"
            fontSize={12}
            tickLine={false}
            axisLine={false}
            width={36}
            domain={["auto", "auto"]}
          />
          <Tooltip
            contentStyle={{ background: "#0a0a0a", border: "1px solid #a1a1a166", borderRadius: 8 }}
            labelStyle={{ color: "#a1a1a1" }}
          />
          <Line
            type="monotone"
            dataKey="peso"
            name="Peso máximo"
            unit=" kg"
            stroke="#fafafa"
            strokeWidth={2}
            dot={{ r: 3, fill: "#fafafa" }}
            isAnimationActive={false}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
