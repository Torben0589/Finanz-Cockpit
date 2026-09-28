"use client";

import { HoldingView } from "@/types";
import { formatCurrency, formatPercent, cn } from "@/lib/utils";

export function HoldingsTable({ holdings, onDelete }: { holdings: HoldingView[]; onDelete: (id: string) => void }) {
  if (!holdings.length) {
    return <p className="text-sm text-textMuted">Noch keine Holdings in diesem Portfolio.</p>;
  }

  return (
    <table className="table-base">
      <thead>
        <tr>
          <th>Symbol</th>
          <th>Menge</th>
          <th>Ø Kaufpreis</th>
          <th>Kurs</th>
          <th>Marktwert</th>
          <th>P/L</th>
          <th></th>
        </tr>
      </thead>
      <tbody>
        {holdings.map((h) => (
          <tr key={h.id}>
            <td>
              <span className="font-medium">{h.symbol}</span>
              <span className="text-textMuted ml-2 text-xs">{h.name}</span>
            </td>
            <td>{h.quantity}</td>
            <td>{formatCurrency(h.averageBuyPrice)}</td>
            <td>{formatCurrency(h.currentPrice)}</td>
            <td>{formatCurrency(h.marketValue)}</td>
            <td className={cn(h.plAbsolute >= 0 ? "text-primary" : "text-danger")}>
              {formatCurrency(h.plAbsolute)} ({formatPercent(h.plPercent)})
            </td>
            <td>
              <button onClick={() => onDelete(h.id)} className="text-textMuted hover:text-danger text-xs">
                Entfernen
              </button>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
