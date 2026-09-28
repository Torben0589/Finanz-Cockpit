"use client";

import { BudgetRow } from "@/types";
import { formatCurrency, formatPercent, cn } from "@/lib/utils";

export function BudgetTable({ rows }: { rows: BudgetRow[] }) {
  if (!rows.length) {
    return <p className="text-sm text-textMuted">Noch keine Budgets für diesen Monat gesetzt.</p>;
  }

  return (
    <table className="table-base">
      <thead>
        <tr>
          <th>Kategorie</th>
          <th>Budget</th>
          <th>Ausgegeben</th>
          <th>Verbleibend</th>
          <th>Auslastung</th>
        </tr>
      </thead>
      <tbody>
        {rows.map((r) => (
          <tr key={r.categoryId}>
            <td>
              <span className="inline-block w-2 h-2 rounded-full mr-2" style={{ background: r.color }} />
              {r.categoryName}
            </td>
            <td>{formatCurrency(r.budgeted)}</td>
            <td>{formatCurrency(r.spent)}</td>
            <td className={cn(r.remaining < 0 && "text-danger")}>{formatCurrency(r.remaining)}</td>
            <td>
              <div className="w-full bg-surface2 rounded-full h-2 overflow-hidden">
                <div
                  className={cn("h-2", r.percentUsed > 100 ? "bg-danger" : "bg-primary")}
                  style={{ width: `${Math.min(r.percentUsed, 100)}%` }}
                />
              </div>
              <span className="text-xs text-textMuted">{formatPercent(r.percentUsed, 0)}</span>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
