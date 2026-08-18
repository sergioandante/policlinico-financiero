"use client";

import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend } from "recharts";
import { formatearMoneda } from "@/lib/utils";

type Punto = { mes: string; ingresos: number; egresosFijos: number; egresosVariables: number };

export function ProyeccionChart({ data }: { data: Punto[] }) {
  return (
    <ResponsiveContainer width="100%" height={280}>
      <LineChart data={data}>
        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e3dc" />
        <XAxis dataKey="mes" tickLine={false} axisLine={false} fontSize={12} />
        <YAxis tickLine={false} axisLine={false} fontSize={12} tickFormatter={(v) => `S/${v}`} width={55} />
        <Tooltip
          formatter={(value: number) => formatearMoneda(value)}
          contentStyle={{ borderRadius: 8, border: "1px solid #e5e3dc", fontSize: 13 }}
        />
        <Legend iconType="circle" wrapperStyle={{ fontSize: 12 }} />
        <Line type="monotone" dataKey="ingresos" name="Ingresos" stroke="#16a34a" strokeWidth={2} dot={{ r: 3 }} />
        <Line type="monotone" dataKey="egresosFijos" name="Egresos fijos" stroke="#dc2626" strokeWidth={2} dot={{ r: 3 }} />
        <Line
          type="monotone"
          dataKey="egresosVariables"
          name="Egresos variables"
          stroke="#f59e0b"
          strokeWidth={2}
          dot={{ r: 3 }}
        />
      </LineChart>
    </ResponsiveContainer>
  );
}
