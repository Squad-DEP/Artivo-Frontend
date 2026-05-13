"use client";

import { useEffect } from "react";
import { usePaymentStore, type Transaction } from "@/store/paymentStore";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

const PAGE_SIZE = 20;

function formatDate(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleDateString("en-NG", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

function formatAmount(amount: number, currency: string): string {
  return new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency: currency || "NGN",
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(amount);
}

function formatPaymentMethod(method: Transaction["payment_method"]): string {
  const labels: Record<Transaction["payment_method"], string> = {
    mobile_money: "Mobile Money",
    bank_transfer: "Bank Transfer",
    wallet: "Wallet",
  };
  return labels[method];
}

function StatusBadge({ status }: { status: Transaction["status"] }) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium",
        status === "completed" &&
          "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
        status === "pending" &&
          "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400",
        status === "failed" &&
          "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"
      )}
    >
      {status.charAt(0).toUpperCase() + status.slice(1)}
    </span>
  );
}

function TransactionRow({ transaction }: { transaction: Transaction }) {
  const isCredit = transaction.type === "credit";

  return (
    <tr className="border-b border-border last:border-b-0 hover:bg-muted/50 transition-colors">
      <td className="px-4 py-3">
        <StatusBadge status={transaction.status} />
      </td>
      <td
        className={cn(
          "px-4 py-3 font-medium tabular-nums",
          isCredit ? "text-green-600 dark:text-green-400" : "text-foreground"
        )}
      >
        {isCredit ? "+" : "-"}
        {formatAmount(transaction.amount, transaction.currency)}
      </td>
      <td className="px-4 py-3 text-muted-foreground text-sm">
        {formatDate(transaction.created_at)}
      </td>
      <td className="px-4 py-3 text-sm">{transaction.counterparty_name}</td>
      <td className="px-4 py-3 text-sm text-muted-foreground">
        {formatPaymentMethod(transaction.payment_method)}
      </td>
    </tr>
  );
}

export function TransactionList() {
  const {
    transactions,
    totalTransactions,
    currentPage,
    isLoading,
    error,
    fetchTransactions,
  } = usePaymentStore();

  useEffect(() => {
    fetchTransactions(1);
  }, [fetchTransactions]);

  const totalPages = Math.ceil(totalTransactions / PAGE_SIZE);

  const handlePreviousPage = () => {
    if (currentPage > 1) {
      fetchTransactions(currentPage - 1);
    }
  };

  const handleNextPage = () => {
    if (currentPage < totalPages) {
      fetchTransactions(currentPage + 1);
    }
  };

  if (error) {
    return (
      <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-4 text-center">
        <p className="text-sm text-destructive">{error}</p>
        <Button
          variant="outline"
          size="sm"
          className="mt-2"
          onClick={() => fetchTransactions(currentPage)}
        >
          Retry
        </Button>
      </div>
    );
  }

  if (isLoading && transactions.length === 0) {
    return (
      <div className="space-y-3">
        {Array.from({ length: 5 }).map((_, i) => (
          <div
            key={i}
            className="h-12 animate-pulse rounded-md bg-muted"
          />
        ))}
      </div>
    );
  }

  if (!isLoading && transactions.length === 0) {
    return (
      <div className="rounded-lg border border-border p-8 text-center">
        <p className="text-muted-foreground">No transactions yet.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="overflow-x-auto rounded-lg border border-border">
        <table className="w-full text-left">
          <thead className="border-b border-border bg-muted/50">
            <tr>
              <th className="px-4 py-3 text-xs font-medium uppercase tracking-wider text-muted-foreground">
                Status
              </th>
              <th className="px-4 py-3 text-xs font-medium uppercase tracking-wider text-muted-foreground">
                Amount
              </th>
              <th className="px-4 py-3 text-xs font-medium uppercase tracking-wider text-muted-foreground">
                Date
              </th>
              <th className="px-4 py-3 text-xs font-medium uppercase tracking-wider text-muted-foreground">
                Counterparty
              </th>
              <th className="px-4 py-3 text-xs font-medium uppercase tracking-wider text-muted-foreground">
                Payment Method
              </th>
            </tr>
          </thead>
          <tbody>
            {transactions.map((transaction) => (
              <TransactionRow key={transaction.id} transaction={transaction} />
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            Showing {(currentPage - 1) * PAGE_SIZE + 1}–
            {Math.min(currentPage * PAGE_SIZE, totalTransactions)} of{" "}
            {totalTransactions} transactions
          </p>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handlePreviousPage}
              disabled={currentPage <= 1 || isLoading}
            >
              Previous
            </Button>
            <span className="text-sm text-muted-foreground">
              Page {currentPage} of {totalPages}
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={handleNextPage}
              disabled={currentPage >= totalPages || isLoading}
            >
              Next
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
