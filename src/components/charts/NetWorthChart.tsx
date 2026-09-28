"use client";

import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { NetWorthPoint } from "@/types";
import { formatCurrency, formatDate } from "@/lib/utils";

export function NetWorthChart({ data }: { data: NetWorthPoint[] }) {
  return (
    <ResponsiveContainer width="100%" height={280}>
      <AreaChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
        <defs>
          <linearGradient id="netWorthGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#3ddc97" stopOpacity={0.4} />
            <stop offset="95%" stopColor="#3ddc97" stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="#232d3d" />
        <XAxis
          dataKey="date"
          tickFormatter={(d) => formatDate(d)}
          stroke="#8b98a9"
          fontSize={11}
          minTickGap={40}
        />
        <YAxis stroke="#8b98a9" fontSize={11} tickFormatter={(v) => formatCurrency(v).replace(",00", "")} width={70} />
        <Tooltip
          contentStyle={{ background: "#121822", border: "1px solid #232d3d", borderRadius: 12 }}
          labelFormatter={(d) => formatDate(d as string)}
          formatter={(value: number, name: string) => [formatCurrency(value), name]}
        />
        <Area type="monotone" dataKey="netWorth" name="Net Worth" stroke="#3ddc97" fill="url(#netWorthGradient)" strokeWidth={2} />
      </AreaChart>
    </ResponsiveContainer>
  );
}
