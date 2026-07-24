"use client";

import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";
import { formatearMoneda } from "@/lib/utils";

export function FlujoCajaChart({ data }: { data: { fecha: string; saldo: number }[] }) {
  return (
    <ResponsiveContainer width="100%" height={240}>
      <AreaChart data={data}>
        <defs>
          <linearGradient id="flujoGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#1c7a64" stopOpacity={0.35} />
            <stop offset="95%" stopColor="#1c7a64" stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e3dc" />
        <XAxis dataKey="fecha" tickLine={false} axisLine={false} fontSize={11} interval="preserveStartEnd" />
        <YAxis tickLine={false} axisLine={false} fontSize={12} tickFormatter={(v) => `S/${v}`} width={55} />
        <Tooltip
          formatter={(value: number) => formatearMoneda(value)}
          contentStyle={{ borderRadius: 8, border: "1px solid #e5e3dc", fontSize: 13 }}
        />
        <Area type="monotone" dataKey="saldo" stroke="#1c7a64" strokeWidth={2} fill="url(#flujoGradient)" />
      </AreaChart>
    </ResponsiveContainer>
  );
}
