"use client";

import { TrendingUp, Building2, ArrowUpFromLine, Landmark, CheckCircle2, Banknote, ShieldCheck } from "lucide-react";
import { VirtualAccountCard, ClaimVirtualAccountCard } from "@/components/payments/VirtualAccountCard";
import { VirtualAccountSetup } from "@/components/payments/VirtualAccountSetup";
import { TransactionList } from "@/components/payments/TransactionList";
import { WorkerEarningsSection } from "@/components/payments/WorkerEarningsSection";
import { usePaymentStore } from "@/store/paymentStore";
import { useAuthStore } from "@/store/authStore";
import { useEffect, useRef } from "react";

export default function PaymentsPage() {
  const { needsSetup, virtualAccount, escrows, isLoading, fetchVirtualAccount, fetchEscrows } = usePaymentStore();
  const user = useAuthStore((state) => state.user);
  const isWorker = user?.user_type === "worker";
  const fetched = useRef(false);

  useEffect(() => {
    if (!fetched.current) {
      fetched.current = true;
      fetchVirtualAccount();
      if (!isWorker) fetchEscrows();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (isWorker) {
    return (
      <div className="space-y-6 pt-4 pb-10">
        {/* Static heading — renders immediately */}
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Payments</h1>
          <p className="text-gray-500 mt-1">Track your earnings and manage your account.</p>
        </div>

        {/* Earnings + payout history (fetches its own data internally) */}
        <WorkerEarningsSection />

        {/* Payout account card — skeleton while loading */}
        <div className="space-y-3">
          {isLoading ? (
            <VirtualAccountSkeleton />
          ) : virtualAccount ? (
            <VirtualAccountCard variant="payout" />
          ) : (
            <VirtualAccountSetup />
          )}
        </div>

        {/* Static explainer — renders immediately */}
        <div className="rounded-xl border border-gray-200 bg-gray-50 p-5 space-y-4">
          <div className="flex items-center gap-2">
            <Banknote className="w-4 h-4 text-muted-foreground" />
            <h2 className="text-sm font-semibold text-foreground">How you get paid</h2>
            <span className="ml-auto inline-flex items-center rounded-full bg-gray-100 border border-gray-200 px-2.5 py-0.5 text-xs font-medium text-muted-foreground">
              Live only
            </span>
          </div>

          <ol className="space-y-3">
            {[
              {
                icon: <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />,
                text: "Both you and the customer mark the job complete. This releases the escrow.",
              },
              {
                icon: <ArrowUpFromLine className="w-4 h-4 text-orange-500 shrink-0 mt-0.5" />,
                text: "Artivo immediately initiates a transfer from its Squad merchant wallet to your registered bank account via NIP.",
              },
              {
                icon: <Landmark className="w-4 h-4 text-orange-500 shrink-0 mt-0.5" />,
                text: "Your bank credits you within minutes. No manual action needed — it's fully automatic.",
              },
            ].map((step, i) => (
              <li key={i} className="flex items-start gap-3">
                {step.icon}
                <p className="text-xs text-muted-foreground leading-relaxed">{step.text}</p>
              </li>
            ))}
          </ol>

          <div className="border-t border-gray-200 pt-3 flex items-center gap-3">
            <Building2 className="w-4 h-4 text-muted-foreground shrink-0" />
            <p className="text-xs text-muted-foreground flex-1">External bank account registration</p>
            <span className="inline-flex items-center rounded-full bg-gray-100 border border-gray-200 px-2.5 py-0.5 text-xs font-medium text-muted-foreground">
              Coming soon
            </span>
          </div>
        </div>
      </div>
    );
  }

  // ─── Customer View ─────────────────────────────────────────────────────────
  return (
    <div className="space-y-6">
      {/* Static heading — renders immediately */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Wallet</h1>
        <p className="text-gray-500 mt-1">
          Fund your account via bank transfer and track your transaction history.
        </p>
      </div>

      {/* Virtual account — skeleton while loading */}
      <section className="space-y-4">
        {isLoading && !virtualAccount
          ? <VirtualAccountSkeleton />
          : <VirtualAccountCard />
        }
        {needsSetup && !virtualAccount && !isLoading && <ClaimVirtualAccountCard />}
      </section>

      {/* Escrows — skeleton while loading, static heading always visible */}
      <section className="space-y-3">
        <div className="flex items-center gap-2">
          <ShieldCheck className="w-5 h-5 text-gray-600" />
          <h2 className="text-lg font-semibold text-gray-900">Active Escrows</h2>
        </div>
        {isLoading ? (
          <EscrowsSkeleton />
        ) : escrows.length > 0 ? (
          <div className="space-y-2">
            {escrows.map((escrow) => (
              <div key={escrow.id} className="rounded-xl border border-border bg-card p-4 flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-foreground">{escrow.title}</p>
                  <p className="text-xs text-muted-foreground capitalize mt-0.5">{escrow.status}</p>
                </div>
                <p className="text-sm font-semibold text-foreground">
                  {new Intl.NumberFormat("en-NG", { style: "currency", currency: "NGN", minimumFractionDigits: 2 }).format(escrow.amount)}
                </p>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">No active escrows.</p>
        )}
      </section>

      {/* Transaction history — static heading, TransactionList handles its own skeleton */}
      <section>
        <div className="flex items-center gap-2 mb-3">
          <TrendingUp className="w-5 h-5 text-gray-600" />
          <h2 className="text-lg font-semibold text-gray-900">
            Transaction History
          </h2>
        </div>
        <TransactionList />
      </section>

      {/* Static withdrawal explainer — renders immediately */}
      <section className="rounded-xl border border-gray-200 bg-gray-50 p-5 space-y-4">
        <div className="flex items-center gap-2">
          <ArrowUpFromLine className="w-4 h-4 text-muted-foreground" />
          <h2 className="text-sm font-semibold text-foreground">Withdrawing your balance</h2>
          <span className="ml-auto inline-flex items-center rounded-full bg-gray-100 border border-gray-200 px-2.5 py-0.5 text-xs font-medium text-muted-foreground">
            Live only
          </span>
        </div>

        <p className="text-xs text-muted-foreground leading-relaxed">
          Any balance left in your wallet after hiring workers can be withdrawn to your personal bank account at any time. Here&apos;s how it works in production:
        </p>

        <ol className="space-y-3">
          {[
            {
              icon: <Landmark className="w-4 h-4 text-orange-500 shrink-0 mt-0.5" />,
              text: "Link your Nigerian bank account — we verify the account name via the NIP network before saving it.",
            },
            {
              icon: <ArrowUpFromLine className="w-4 h-4 text-orange-500 shrink-0 mt-0.5" />,
              text: "Request a withdrawal for any amount up to your current balance. We send it directly from Artivo's Squad merchant wallet to your bank.",
            },
            {
              icon: <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />,
              text: "Funds arrive in your account within minutes via NIP. Your Artivo balance updates instantly.",
            },
          ].map((step, i) => (
            <li key={i} className="flex items-start gap-3">
              {step.icon}
              <p className="text-xs text-muted-foreground leading-relaxed">{step.text}</p>
            </li>
          ))}
        </ol>

        <p className="text-xs text-muted-foreground border-t border-gray-200 pt-3">
          Withdrawals are disabled in sandbox mode because Squad&apos;s transfer API only processes real bank accounts. All other wallet features work normally.
        </p>
      </section>
    </div>
  );
}

// ─── Skeleton Components ─────────────────────────────────────────────────────

function VirtualAccountSkeleton() {
  return (
    <div className="space-y-4">
      {/* Balance card skeleton */}
      <div className="rounded-xl bg-gradient-to-br from-primary/80 to-primary/60 p-6 animate-pulse">
        <div className="flex items-center gap-2 mb-6">
          <div className="w-5 h-5 rounded bg-white/20" />
          <div className="h-4 w-24 rounded bg-white/20" />
        </div>
        <div className="mb-6">
          <div className="h-8 w-40 rounded bg-white/20 mb-2" />
          <div className="h-3 w-24 rounded bg-white/15" />
        </div>
        <div className="bg-white/10 rounded-lg p-3 space-y-2">
          <div className="h-3 w-20 rounded bg-white/15" />
          <div className="h-6 w-48 rounded bg-white/20" />
        </div>
      </div>
      {/* Bank details skeleton */}
      <div className="rounded-xl border border-border bg-card p-5 space-y-4 animate-pulse">
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded bg-gray-200" />
          <div className="h-4 w-24 rounded bg-gray-200" />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <div className="h-3 w-16 rounded bg-gray-200" />
            <div className="h-4 w-28 rounded bg-gray-200" />
          </div>
          <div className="space-y-1.5">
            <div className="h-3 w-16 rounded bg-gray-200" />
            <div className="h-4 w-16 rounded bg-gray-200" />
          </div>
          <div className="col-span-2 space-y-1.5">
            <div className="h-3 w-20 rounded bg-gray-200" />
            <div className="h-4 w-44 rounded bg-gray-200" />
          </div>
        </div>
      </div>
    </div>
  );
}

function EscrowsSkeleton() {
  return (
    <div className="space-y-2">
      {[1, 2].map((i) => (
        <div key={i} className="rounded-xl border border-border bg-card p-4 flex items-center justify-between animate-pulse">
          <div className="space-y-1.5">
            <div className="h-4 w-36 rounded bg-gray-200" />
            <div className="h-3 w-16 rounded bg-gray-200" />
          </div>
          <div className="h-4 w-20 rounded bg-gray-200" />
        </div>
      ))}
    </div>
  );
}
