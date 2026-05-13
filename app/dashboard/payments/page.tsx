"use client";

import { useEffect } from "react";
import { motion } from "framer-motion";
import {
  ArrowDownLeft,
  ArrowUpRight,
  Wallet,
  TrendingUp,
  Receipt,
} from "lucide-react";
import { VirtualAccountCard } from "@/components/payments/VirtualAccountCard";
import { TransactionList } from "@/components/payments/TransactionList";
import { ErrorBanner } from "@/components/ui/ErrorBanner";
import { ErrorToast, useErrorToast } from "@/components/ui/ErrorToast";
import { usePaymentStore, type Transaction } from "@/store/paymentStore";

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency: "NGN",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

function PaymentSummary({ transactions }: { transactions: Transaction[] }) {
  const totalIncome = transactions
    .filter((t) => t.type === "credit" && t.status === "completed")
    .reduce((sum, t) => sum + t.amount, 0);

  const totalSpent = transactions
    .filter((t) => t.type === "debit" && t.status === "completed")
    .reduce((sum, t) => sum + t.amount, 0);

  const pendingCount = transactions.filter(
    (t) => t.status === "pending"
  ).length;

  const summaryItems = [
    {
      label: "Total Income",
      value: formatCurrency(totalIncome),
      icon: ArrowDownLeft,
      iconBg: "bg-green-100",
      iconColor: "text-green-600",
    },
    {
      label: "Total Spent",
      value: formatCurrency(totalSpent),
      icon: ArrowUpRight,
      iconBg: "bg-red-100",
      iconColor: "text-red-600",
    },
    {
      label: "Pending",
      value: String(pendingCount),
      icon: Receipt,
      iconBg: "bg-yellow-100",
      iconColor: "text-yellow-600",
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
      {summaryItems.map((item) => {
        const Icon = item.icon;
        return (
          <motion.div
            key={item.label}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="rounded-lg border border-gray-200 bg-white p-4"
          >
            <div className="flex items-center gap-3">
              <div
                className={`w-10 h-10 rounded-full flex items-center justify-center ${item.iconBg}`}
              >
                <Icon className={`w-5 h-5 ${item.iconColor}`} />
              </div>
              <div>
                <p className="text-xs text-gray-500">{item.label}</p>
                <p className="text-lg font-semibold text-gray-900">
                  {item.value}
                </p>
              </div>
            </div>
          </motion.div>
        );
      })}
    </div>
  );
}

export default function PaymentsPage() {
  const { transactions, isLoading, error, fetchTransactions, clearError } =
    usePaymentStore();
  const { toast, showToast, hideToast } = useErrorToast();

  useEffect(() => {
    fetchTransactions(1).catch(() => {
      showToast("Connection lost. Unable to load transactions.", {
        onRetry: () => fetchTransactions(1),
        variant: "network",
      });
    });
  }, [fetchTransactions, showToast]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Payments</h1>
        <p className="text-gray-500 mt-1">
          Manage your virtual account and view transaction history
        </p>
      </div>

      {/* Payment Error Banner — Requirement 5.6: failure → retry */}
      {error && (
        <ErrorBanner
          message="Payment operation failed"
          description={error}
          onRetry={() => {
            clearError();
            fetchTransactions();
          }}
          onDismiss={clearError}
          retryLabel="Try Again"
        />
      )}

      {/* Network Error Toast */}
      <ErrorToast
        message={toast.message}
        visible={toast.visible}
        onDismiss={hideToast}
        onRetry={toast.onRetry}
        variant={toast.variant}
      />

      {/* Virtual Account */}
      <section>
        <VirtualAccountCard />
      </section>

      {/* Payment Summary */}
      <section>
        <div className="flex items-center gap-2 mb-3">
          <Wallet className="w-5 h-5 text-gray-600" />
          <h2 className="text-lg font-semibold text-gray-900">Summary</h2>
        </div>
        <PaymentSummary transactions={transactions} />
      </section>

      {/* Transaction History */}
      <section>
        <div className="flex items-center gap-2 mb-3">
          <TrendingUp className="w-5 h-5 text-gray-600" />
          <h2 className="text-lg font-semibold text-gray-900">
            Transaction History
          </h2>
        </div>
        <TransactionList />
      </section>
    </div>
  );
}
