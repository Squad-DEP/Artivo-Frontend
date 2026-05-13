"use client";

import { useEffect } from "react";
import { usePaymentStore, type SquadTransaction } from "@/store/paymentStore";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { RefreshCw } from "lucide-react";

function formatDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString("en-NG", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

function formatNGN(koboString: string): string {
  const naira = parseFloat(koboString) / 100;
  return new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency: "NGN",
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(naira);
}

function TransactionRow({ tx }: { tx: SquadTransaction }) {
  const isCredit = tx.transaction_indicator === "C";

  return (
    <tr className="border-b border-border last:border-b-0 hover:bg-muted/50 transition-colors">
      <td className="px-4 py-3">
        <span
          className={cn(
            "inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium",
            isCredit
              ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
              : "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400"
          )}
        >
          {isCredit ? "Deposit" : "Debit"}
        </span>
      </td>
      <td
        className={cn(
          "px-4 py-3 font-medium tabular-nums",
          isCredit ? "text-green-600 dark:text-green-400" : "text-foreground"
        )}
      >
        {isCredit ? "+" : "-"}
        {formatNGN(tx.principal_amount)}
      </td>
      <td className="px-4 py-3 text-muted-foreground text-sm">
        {formatDate(tx.transaction_date)}
      </td>
      <td className="px-4 py-3 text-sm text-muted-foreground truncate max-w-[120px]">
        {tx.remarks || "—"}
      </td>
      <td className="px-4 py-3 text-xs text-muted-foreground font-mono truncate max-w-[140px]">
        {tx.transaction_reference}
      </td>
    </tr>
  );
}

export function TransactionList() {
  const { transactions, isLoading, error, fetchTransactions } = usePaymentStore();

  useEffect(() => {
    fetchTransactions();
  }, [fetchTransactions]);

  if (isLoading && transactions.length === 0) {
    return (
      <div className="space-y-3">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="h-12 animate-pulse rounded-md bg-muted" />
        ))}
      </div>
    );
  }

  if (!isLoading && transactions.length === 0) {
    return (
      <div className="rounded-lg border border-border p-8 text-center space-y-2">
        <p className="text-muted-foreground text-sm">No transactions yet.</p>
        <p className="text-xs text-muted-foreground">
          Fund your wallet with a bank transfer to see your history here.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex justify-end">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => fetchTransactions()}
          disabled={isLoading}
          className="gap-1.5 text-xs"
        >
          <RefreshCw className={cn("w-3.5 h-3.5", isLoading && "animate-spin")} />
          Refresh
        </Button>
      </div>

      <div className="overflow-x-auto rounded-lg border border-border">
        <table className="w-full text-left">
          <thead className="border-b border-border bg-muted/50">
            <tr>
              <th className="px-4 py-3 text-xs font-medium uppercase tracking-wider text-muted-foreground">Type</th>
              <th className="px-4 py-3 text-xs font-medium uppercase tracking-wider text-muted-foreground">Amount</th>
              <th className="px-4 py-3 text-xs font-medium uppercase tracking-wider text-muted-foreground">Date</th>
              <th className="px-4 py-3 text-xs font-medium uppercase tracking-wider text-muted-foreground">Remarks</th>
              <th className="px-4 py-3 text-xs font-medium uppercase tracking-wider text-muted-foreground">Reference</th>
            </tr>
          </thead>
          <tbody>
            {transactions.map((tx) => (
              <TransactionRow key={tx.transaction_reference} tx={tx} />
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
