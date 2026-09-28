"use client";

import { Cell, Legend, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";
import { AllocationSlice } from "@/types";
import { formatCurrency, formatPercent } from "@/lib/utils";

const COLORS = ["#3ddc97", "#3d9edc", "#dc9e3d", "#dc3d6e", "#8b3ddc", "#3ddcc0", "#dcb83d", "#6e3ddc"];

export function AllocationChart({ data }: { data: AllocationSlice[] }) {
  if (!data.length) {
    return <p className="text-sm text-textMuted">Noch keine Holdings vorhanden.</p>;
  }

  return (
    <ResponsiveContainer width="100%" height={280}>
      <PieChart>
        <Pie data={data} dataKey="value" nameKey="symbol" innerRadius={60} outerRadius={100} paddingAngle={2}>
          {data.map((_, i) => (
            <Cell key={i} fill={COLORS[i % COLORS.length]} />
          ))}
        </Pie>
        <Tooltip
          contentStyle={{ background: "#121822", border: "1px solid #232d3d", borderRadius: 12 }}
          formatter={(value: number, _name, entry: any) => [
            `${formatCurrency(value)} (${formatPercent(entry.payload.percentage, 1)})`,
            entry.payload.name
          ]}
        />
        <Legend wrapperStyle={{ fontSize: 12, color: "#8b98a9" }} />
      </PieChart>
    </ResponsiveContainer>
  );
}
