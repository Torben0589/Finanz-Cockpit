"use client";

import { TransactionView } from "@/types";
import { formatCurrency, formatDate, cn } from "@/lib/utils";

const TYPE_LABEL: Record<string, string> = {
  INCOME: "Einnahme",
  EXPENSE: "Ausgabe",
  BUY: "Kauf",
  SELL: "Verkauf",
  DIVIDEND: "Dividende"
};

const TYPE_COLOR: Record<string, string> = {
  INCOME: "text-primary",
  EXPENSE: "text-danger",
  BUY: "text-warning",
  SELL: "text-warning",
  DIVIDEND: "text-primary"
};

export function TransactionTable({ transactions, onDelete }: { transactions: TransactionView[]; onDelete: (id: string) => void }) {
  if (!transactions.length) {
    return <p className="text-sm text-textMuted">Keine Transaktionen gefunden.</p>;
  }

  return (
    <table className="table-base">
      <thead>
        <tr>
          <th>Datum</th>
          <th>Typ</th>
          <th>Konto</th>
          <th>Kategorie</th>
          <th>Notiz</th>
          <th className="text-right">Betrag</th>
          <th></th>
        </tr>
      </thead>
      <tbody>
        {transactions.map((t) => (
          <tr key={t.id}>
            <td>{formatDate(t.date)}</td>
            <td className={cn(TYPE_COLOR[t.type])}>{TYPE_LABEL[t.type]}</td>
            <td>{t.accountName ?? "—"}</td>
            <td>{t.categoryName ?? "—"}</td>
            <td className="max-w-xs truncate">{t.note ?? "—"}</td>
            <td className={cn("text-right font-medium", t.amount >= 0 ? "text-primary" : "text-danger")}>
              {formatCurrency(t.amount, t.currency)}
            </td>
            <td>
              <button onClick={() => onDelete(t.id)} className="text-textMuted hover:text-danger text-xs">
                Löschen
              </button>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
