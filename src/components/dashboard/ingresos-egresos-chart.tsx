"use client";

import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend } from "recharts";
import { formatearMoneda } from "@/lib/utils";

export function IngresosEgresosChart({ data }: { data: { mes: string; ingresos: number; egresos: number }[] }) {
  return (
    <ResponsiveContainer width="100%" height={280}>
      <BarChart data={data} barGap={6}>
        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e3dc" />
        <XAxis dataKey="mes" tickLine={false} axisLine={false} fontSize={12} />
        <YAxis tickLine={false} axisLine={false} fontSize={12} tickFormatter={(v) => `S/${v}`} width={55} />
        <Tooltip
          formatter={(value: number) => formatearMoneda(value)}
          contentStyle={{ borderRadius: 8, border: "1px solid #e5e3dc", fontSize: 13 }}
        />
        <Legend iconType="circle" wrapperStyle={{ fontSize: 12 }} />
        <Bar dataKey="ingresos" name="Ingresos" fill="#16a34a" radius={[4, 4, 0, 0]} />
        <Bar dataKey="egresos" name="Egresos" fill="#dc2626" radius={[4, 4, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}
