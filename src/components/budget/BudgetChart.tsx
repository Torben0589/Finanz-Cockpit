"use client";

import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { BudgetRow } from "@/types";
import { formatCurrency } from "@/lib/utils";

export function BudgetChart({ data }: { data: BudgetRow[] }) {
  return (
    <ResponsiveContainer width="100%" height={280}>
      <BarChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#232d3d" />
        <XAxis dataKey="categoryName" stroke="#8b98a9" fontSize={11} />
        <YAxis stroke="#8b98a9" fontSize={11} tickFormatter={(v) => formatCurrency(v).replace(",00", "")} width={70} />
        <Tooltip
          contentStyle={{ background: "#121822", border: "1px solid #232d3d", borderRadius: 12 }}
          formatter={(value: number, name: string) => [formatCurrency(value), name]}
        />
        <Bar dataKey="budgeted" name="Budget" fill="#3d9edc" radius={[6, 6, 0, 0]} />
        <Bar dataKey="spent" name="Ausgegeben" fill="#dc9e3d" radius={[6, 6, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}
