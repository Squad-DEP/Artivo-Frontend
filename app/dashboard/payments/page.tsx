"use client";

import { TrendingUp } from "lucide-react";
import { VirtualAccountCard, ClaimVirtualAccountCard } from "@/components/payments/VirtualAccountCard";
import { TransactionList } from "@/components/payments/TransactionList";
import { usePaymentStore } from "@/store/paymentStore";
import { useEffect } from "react";

export default function PaymentsPage() {
  const { needsSetup, virtualAccount, fetchVirtualAccount } = usePaymentStore();

  useEffect(() => {
    fetchVirtualAccount();
  }, [fetchVirtualAccount]);

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
