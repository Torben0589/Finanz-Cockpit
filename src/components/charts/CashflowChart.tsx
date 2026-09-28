"use client";

import { Bar, BarChart, CartesianGrid, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { CashflowPoint } from "@/types";
import { formatCurrency } from "@/lib/utils";

export function CashflowChart({ data }: { data: CashflowPoint[] }) {
  return (
    <ResponsiveContainer width="100%" height={280}>
      <BarChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#232d3d" />
        <XAxis dataKey="month" stroke="#8b98a9" fontSize={11} />
        <YAxis stroke="#8b98a9" fontSize={11} tickFormatter={(v) => formatCurrency(v).replace(",00", "")} width={70} />
        <Tooltip
          contentStyle={{ background: "#121822", border: "1px solid #232d3d", borderRadius: 12 }}
          formatter={(value: number, name: string) => [formatCurrency(value), name]}
        />
        <Legend wrapperStyle={{ fontSize: 12, color: "#8b98a9" }} />
        <Bar dataKey="income" name="Einnahmen" fill="#3ddc97" radius={[6, 6, 0, 0]} />
        <Bar dataKey="expense" name="Ausgaben" fill="#ef4444" radius={[6, 6, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}
