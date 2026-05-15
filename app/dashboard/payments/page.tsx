"use client";

import { TrendingUp, Building2 } from "lucide-react";
import { VirtualAccountCard, ClaimVirtualAccountCard } from "@/components/payments/VirtualAccountCard";
import { VirtualAccountSetup } from "@/components/payments/VirtualAccountSetup";
import { TransactionList } from "@/components/payments/TransactionList";
import { WorkerEarningsSection } from "@/components/payments/WorkerEarningsSection";
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

  if (isWorker) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Payments</h1>
          <p className="text-gray-500 mt-1">Track your earnings and manage your account.</p>
        </div>

        {/* Earnings + payout history */}
        <WorkerEarningsSection />

        {/* Account section */}
        <div className="space-y-3">
          <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
            Payout Account
          </h2>

          {/* Virtual account — setup or display */}
          {virtualAccount ? <VirtualAccountCard /> : <VirtualAccountSetup />}

          {/* External bank account — coming soon */}
          <div className="flex items-center gap-3 rounded-xl border border-dashed border-gray-200 bg-gray-50 px-4 py-3">
            <Building2 className="w-4 h-4 text-muted-foreground shrink-0" />
            <p className="text-sm text-muted-foreground flex-1">External bank account</p>
            <span className="inline-flex items-center rounded-full bg-gray-100 border border-gray-200 px-2.5 py-0.5 text-xs font-medium text-muted-foreground">
              Coming soon
            </span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Wallet</h1>
        <p className="text-gray-500 mt-1">
          Fund your account via bank transfer and track your transaction history.
        </p>
      </div>

      <section className="space-y-4">
        <VirtualAccountCard />
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
