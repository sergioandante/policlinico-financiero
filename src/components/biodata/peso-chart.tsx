"use client";

import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";

export function PesoChart({ data }: { data: { fechaCorta: string; pesoKg: number }[] }) {
  if (data.length === 0) {
    return (
      <div className="flex h-[260px] items-center justify-center text-sm text-muted-foreground">
        Aún no hay registros. Agrega tu primera métrica para ver tu evolución aquí.
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={260}>
      <LineChart data={data}>
        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e3dc" />
        <XAxis dataKey="fechaCorta" tickLine={false} axisLine={false} fontSize={11} interval="preserveStartEnd" />
        <YAxis
          tickLine={false}
          axisLine={false}
          fontSize={12}
          domain={["dataMin - 2", "dataMax + 2"]}
          tickFormatter={(v) => `${v} kg`}
          width={55}
        />
        <Tooltip
          formatter={(value: number) => [`${value.toFixed(1)} kg`, "Peso"]}
          contentStyle={{ borderRadius: 8, border: "1px solid #e5e3dc", fontSize: 13 }}
        />
        <Line
          type="monotone"
          dataKey="pesoKg"
          name="Peso"
          stroke="#1c7a64"
          strokeWidth={2}
          dot={{ r: 3 }}
          activeDot={{ r: 5 }}
        />
      </LineChart>
    </ResponsiveContainer>
  );
}
