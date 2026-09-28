"use client";

import { DividendView } from "@/types";
import { formatCurrency, formatDate } from "@/lib/utils";

export function DividendTable({ dividends }: { dividends: DividendView[] }) {
  if (!dividends.length) {
    return <p className="text-sm text-textMuted">Noch keine Dividenden erfasst.</p>;
  }

  return (
    <table className="table-base">
      <thead>
        <tr>
          <th>Symbol</th>
          <th>Ex-Datum</th>
          <th>Zahltag</th>
          <th>Betrag/Aktie</th>
          <th>Menge</th>
          <th className="text-right">Gesamt</th>
        </tr>
      </thead>
      <tbody>
        {dividends.map((d) => (
          <tr key={d.id}>
            <td className="font-medium">{d.symbol}</td>
            <td>{formatDate(d.exDate)}</td>
            <td>{d.payDate ? formatDate(d.payDate) : "—"}</td>
            <td>{formatCurrency(d.amountPerShare, d.currency)}</td>
            <td>{d.quantityAtPay}</td>
            <td className="text-right text-primary font-medium">{formatCurrency(d.totalAmount, d.currency)}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
