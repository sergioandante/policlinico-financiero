"use client";

import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Cell, LabelList } from "recharts";
import { formatearMoneda } from "@/lib/utils";
import { type Area } from "@/lib/clasificacion-areas";

// Paleta categórica validada (contraste + separación CVD) para las 5 áreas.
// Orden fijo por área — no se reordena aunque cambien los montos.
const COLOR_POR_AREA: Record<Area, string> = {
  BP: "#2a78d6",
  C_HG: "#eb6834",
  TR: "#1baf7a",
  ODONTOLOGIA: "#eda100",
  OTROS: "#e87ba4",
};

export function IngresosPorAreaChart({ data }: { data: { area: Area; label: string; total: number }[] }) {
  return (
    <ResponsiveContainer width="100%" height={Math.max(220, data.length * 46)}>
      <BarChart data={data} layout="vertical" margin={{ left: 8, right: 24 }}>
        <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#e5e3dc" />
        <XAxis type="number" tickLine={false} axisLine={false} fontSize={12} tickFormatter={(v) => `S/${v}`} />
        <YAxis type="category" dataKey="label" tickLine={false} axisLine={false} fontSize={12} width={130} />
        <Tooltip
          formatter={(value: number) => formatearMoneda(value)}
          contentStyle={{ borderRadius: 8, border: "1px solid #e5e3dc", fontSize: 13 }}
        />
        <Bar dataKey="total" radius={[0, 4, 4, 0]} maxBarSize={28}>
          {data.map((d) => (
            <Cell key={d.area} fill={COLOR_POR_AREA[d.area]} />
          ))}
          <LabelList
            dataKey="total"
            position="right"
            formatter={(v: number) => formatearMoneda(v)}
            style={{ fontSize: 12, fill: "#52514e" }}
          />
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}
