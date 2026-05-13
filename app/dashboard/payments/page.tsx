"use client";

import { TrendingUp, Wallet } from "lucide-react";
import { VirtualAccountCard } from "@/components/payments/VirtualAccountCard";
import { TransactionList } from "@/components/payments/TransactionList";

export default function PaymentsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Wallet</h1>
        <p className="text-gray-500 mt-1">
          Fund your account via bank transfer and track your transaction history.
        </p>
      </div>

      <section>
        <VirtualAccountCard />
      </section>

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
