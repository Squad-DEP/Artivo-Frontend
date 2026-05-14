"use client";

import { TrendingUp } from "lucide-react";
import { VirtualAccountCard, ClaimVirtualAccountCard } from "@/components/payments/VirtualAccountCard";
import { TransactionList } from "@/components/payments/TransactionList";
import { WorkerBankAccountPanel } from "@/components/payments/WorkerBankAccountPanel";
import { usePaymentStore } from "@/store/paymentStore";
import { useAuthStore } from "@/store/authStore";
import { useEffect } from "react";

export default function PaymentsPage() {
  const { needsSetup, virtualAccount, fetchVirtualAccount } = usePaymentStore();
  const user = useAuthStore((state) => state.user);
  const isWorker = user?.user_type === "worker";

  useEffect(() => {
    fetchVirtualAccount();
  }, [fetchVirtualAccount]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Wallet</h1>
        <p className="text-gray-500 mt-1">
          {isWorker
            ? "Manage your payout account and track your earnings."
            : "Fund your account via bank transfer and track your transaction history."}
        </p>
      </div>

      {/* Worker: payout bank account */}
      {isWorker && (
        <section>
          <WorkerBankAccountPanel />
        </section>
      )}

      <section className="space-y-4">
        <VirtualAccountCard />
        {/* Show claim option alongside setup when no account is linked yet */}
        {needsSetup && !virtualAccount && <ClaimVirtualAccountCard />}
      </section>

      {virtualAccount && (
        <section>
          <div className="flex items-center gap-2 mb-3">
            <TrendingUp className="w-5 h-5 text-gray-600" />
            <h2 className="text-lg font-semibold text-gray-900">
              Transaction History
            </h2>
          </div>
          <TransactionList />
        </section>
      )}
    </div>
  );
}
