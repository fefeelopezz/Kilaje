"use client";

import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

export function VolumeChart({ data }: { data: { semana: string; volumen: number }[] }) {
  return (
    <div className="h-56">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 8, right: 8, bottom: 0, left: 0 }}>
          <CartesianGrid stroke="#a1a1a133" vertical={false} />
          <XAxis dataKey="semana" stroke="#a1a1a1" fontSize={12} tickLine={false} />
          <YAxis
            stroke="#a1a1a1"
            fontSize={12}
            tickLine={false}
            axisLine={false}
            width={48}
            tickFormatter={(v: number) => (v >= 1000 ? `${Number((v / 1000).toFixed(1))}k` : String(v))}
          />
          <Tooltip
            cursor={{ fill: "#ffffff0d" }}
            contentStyle={{ background: "#0a0a0a", border: "1px solid #a1a1a166", borderRadius: 8 }}
            labelStyle={{ color: "#a1a1a1" }}
            formatter={(v) => [`${Number(v).toLocaleString("es-AR")} kg`, "Volumen"]}
          />
          <Bar dataKey="volumen" fill="#fafafa" radius={[4, 4, 0, 0]} isAnimationActive={false} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
