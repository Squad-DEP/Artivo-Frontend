"use client";

import * as React from "react";
import {
  Loader2, CheckCircle2, Clock, Banknote,
  RefreshCw, Wallet, XCircle,
  ArrowDownLeft, AlertTriangle, User,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { apiService } from "@/api/api-service";
import { cn } from "@/lib/utils";

type PayoutStatus = "success" | "pending" | "failed" | "not_initiated" | "offline";

interface EarningsPayout {
  job_id: string;
  title: string;
  customer_name: string;
  amount: number;
  completed_at: string | null;
  payment_method: string;
  payout_reference: string | null;
  payout_status: PayoutStatus;
  payout_amount: number | null;
  bank_name: string | null;
  account_last4: string | null;
}

interface EarningsSummary {
  total_earned: number;
  total_paid_out: number;
  pending_payout: number;
  failed_payout: number;
}

interface EarningsData {
  summary: EarningsSummary;
  payouts: EarningsPayout[];
}

const fmt = (v: number) => `₦${Number(v).toLocaleString("en-NG")}`;

function fmtDate(iso: string | null): string {
  if (!iso) return "";
  const d = new Date(iso);
  const now = new Date();
  const sameYear = d.getFullYear() === now.getFullYear();
  return d.toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    ...(sameYear ? {} : { year: "numeric" }),
  });
}

const PAYOUT_CONFIG: Record<
  PayoutStatus,
  { label: string; icon: React.ReactNode; cls: string }
> = {
  success: {
    label: "Paid out",
    icon: <CheckCircle2 className="w-3.5 h-3.5" />,
    cls: "bg-emerald-50 text-emerald-700 border-emerald-200",
  },
  pending: {
    label: "Transfer pending",
    icon: <Clock className="w-3.5 h-3.5" />,
    cls: "bg-amber-50 text-amber-700 border-amber-200",
  },
  failed: {
    label: "Transfer failed",
    icon: <XCircle className="w-3.5 h-3.5" />,
    cls: "bg-red-50 text-red-600 border-red-200",
  },
  not_initiated: {
    label: "Payout pending",
    icon: <AlertTriangle className="w-3.5 h-3.5" />,
    cls: "bg-orange-50 text-orange-700 border-orange-200",
  },
  offline: {
    label: "Cash payment",
    icon: <Banknote className="w-3.5 h-3.5" />,
    cls: "bg-gray-50 text-gray-600 border-gray-200",
  },
};

export function WorkerEarningsSection() {
  const router = useRouter();
  const [data, setData] = React.useState<EarningsData | null>(null);
  const [isLoading, setIsLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [retrying, setRetrying] = React.useState<string | null>(null);
  const [retryMsg, setRetryMsg] = React.useState<Record<string, string>>({});

  const fetchEarnings = React.useCallback(async () => {
    try {
      const res = await apiService.get<EarningsData>("/worker/earnings");
      setData(res);
      setError(null);
    } catch {
      setError("Failed to load earnings.");
    } finally {
      setIsLoading(false);
    }
  }, []);

  React.useEffect(() => {
    fetchEarnings();
  }, [fetchEarnings]);

  const handleRetryPayout = async (jobId: string) => {
    setRetrying(jobId);
    try {
      const res = await apiService.post<{ success: boolean; msg: string }>(
        `/worker/retry-payout/${jobId}`,
        {}
      );
      setRetryMsg((prev) => ({ ...prev, [jobId]: res.msg }));
      await fetchEarnings();
    } catch (e: any) {
      setRetryMsg((prev) => ({
        ...prev,
        [jobId]: e?.message ?? "Could not initiate payout. Check your bank account.",
      }));
    } finally {
      setRetrying(null);
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-5">
        {/* Outstanding pill skeleton */}
        <div className="w-full rounded-full bg-gray-200 px-7 py-5 flex items-center justify-between gap-4 animate-pulse">
          <div className="space-y-2 px-5">
            <div className="h-3 w-20 rounded bg-gray-300" />
            <div className="h-8 w-36 rounded bg-gray-300" />
          </div>
          <div className="shrink-0 w-14 h-14 rounded-full bg-gray-300" />
        </div>
        {/* Payout list skeleton */}
        <div className="space-y-2">
          <div className="h-4 w-28 rounded bg-gray-200" />
          {[1, 2, 3].map((i) => (
            <div key={i} className="rounded-xl border border-gray-200 bg-gray-50 p-4 animate-pulse">
              <div className="flex items-start justify-between gap-3">
                <div className="space-y-2 flex-1">
                  <div className="h-4 w-3/4 rounded bg-gray-200" />
                  <div className="h-3 w-1/2 rounded bg-gray-200" />
                </div>
                <div className="space-y-2 shrink-0 flex flex-col items-end">
                  <div className="h-5 w-20 rounded bg-gray-200" />
                  <div className="h-5 w-24 rounded-full bg-gray-200" />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-md border border-destructive/30 bg-destructive/5 p-3">
        <p className="text-sm text-destructive">{error}</p>
      </div>
    );
  }

  if (!data || data.payouts.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-border p-8 text-center">
        <Wallet className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
        <p className="text-sm text-muted-foreground">No completed jobs yet.</p>
        <p className="text-xs text-muted-foreground mt-1">
          Your earnings will appear here once a job is confirmed complete.
        </p>
      </div>
    );
  }

  const { summary, payouts } = data;
  const outstanding = summary.failed_payout + summary.pending_payout;

  return (
    <div className="space-y-5">
      {/* Only show the outstanding pill when there's money waiting to be collected */}
      {outstanding > 0 && (
        <div className="w-full rounded-full bg-[var(--orange,#f97316)] px-7 py-5 flex items-center justify-between gap-4">
          <div className="min-w-0">
            <p className="text-white/80 px-10 text-xs font-medium uppercase tracking-widest leading-none mb-1">
              Outstanding
            </p>
            <p className="text-white px-5 text-3xl md:text-5xl font-extrabold leading-none tracking-tight">
              {fmt(outstanding)}
            </p>
          </div>
          <div className="shrink-0 w-14 h-14 rounded-full bg-white/20 flex items-center justify-center">
            <ArrowDownLeft className="w-7 h-7 text-white" strokeWidth={2.5} />
          </div>
        </div>
      )}

      {/* Per-job payout list */}
      <div className="space-y-2">
        <h3 className="font-semibold text-muted-foreground uppercase tracking-wide">
          Payout history
        </h3>
        {payouts.map((p) => {
          const cfg = PAYOUT_CONFIG[p.payout_status];
          const canRetry =
            p.payout_status === "not_initiated" || p.payout_status === "failed";
          const msg = retryMsg[p.job_id];

          return (
            <div
              key={p.job_id}
              className="rounded-xl border border-gray-200 bg-gray-50 overflow-hidden"
            >
              {/* Clickable header — goes to My Jobs tab with this job highlighted */}
              <button
                className="w-full text-left px-4 pt-4 pb-3 flex items-start justify-between gap-3 hover:bg-muted/40 transition-colors cursor-pointer"
                onClick={() =>
                  router.push(`/dashboard/jobs?tab=active&highlight=${p.job_id}`)
                }
              >
                <div className="min-w-0 space-y-0.5">
                  <p className="text-sm font-semibold text-foreground truncate leading-tight">
                    {p.title}
                  </p>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground flex-wrap">
                    <span className="flex items-center gap-1">
                      <User className="w-3 h-3" />
                      {p.customer_name}
                    </span>
                    {p.completed_at && (
                      <span className="text-muted-foreground/60">·</span>
                    )}
                    {p.completed_at && (
                      <span>{fmtDate(p.completed_at)}</span>
                    )}
                  </div>
                </div>
                <div className="shrink-0 flex flex-col items-end gap-1.5">
                  <p className="text-base font-bold text-foreground">{fmt(p.amount)}</p>
                  <span
                    className={cn(
                      "inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs font-medium",
                      cfg.cls
                    )}
                  >
                    {cfg.icon}
                    {cfg.label}
                  </span>
                </div>
              </button>

              {/* Footer: bank info or retry */}
              {(p.payout_status === "success" && p.bank_name && p.account_last4) || canRetry ? (
                <div className="px-4 pb-3 pt-0 border-t border-border/60 mt-0">
                  {p.payout_status === "success" && p.bank_name && p.account_last4 && (
                    <p className="text-xs text-muted-foreground flex items-center gap-1.5 pt-2.5">
                      <Banknote className="w-3.5 h-3.5" />
                      Sent to {p.bank_name} ****{p.account_last4}
                    </p>
                  )}

                  {canRetry && (
                    <div className="pt-2.5">
                      {msg ? (
                        <p className="text-xs text-muted-foreground">{msg}</p>
                      ) : (
                        <Button
                          className="w-full h-11 text-sm bg-[var(--orange,#f97316)] hover:bg-[var(--orange,#f97316)]/90 text-white gap-2"
                          onClick={() => handleRetryPayout(p.job_id)}
                          disabled={retrying === p.job_id}
                        >
                          {retrying === p.job_id ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : (
                            <RefreshCw className="w-4 h-4" />
                          )}
                          Collect Funds
                        </Button>
                      )}
                    </div>
                  )}
                </div>
              ) : null}
            </div>
          );
        })}
      </div>
    </div>
  );
}

