"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Loader2, User, MapPin, Banknote, CheckCircle2,
  Clock, AlertCircle, Undo2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { apiService } from "@/api/api-service";
import { cn } from "@/lib/utils";

interface ActiveJob {
  id: string;
  job_request_id: string;
  worker_id: string;
  worker_name: string;
  worker_photo: string | null;
  title: string;
  description: string;
  location: string | null;
  amount: number;
  payment_method: string;
  status: string;
  created_at: string;
  worker_confirmed: boolean;
  customer_confirmed: boolean;
}

const formatAmount = (v: number) => `₦${Number(v).toLocaleString("en-NG")}`;

function getJobBadge(job: ActiveJob): { label: string; color: string; big?: boolean } {
  if (job.status === "completed") return { label: "Completed", color: "bg-gray-100 text-gray-600 border-gray-200" };
  if (job.customer_confirmed && !job.worker_confirmed) return {
    label: "You marked as complete",
    color: "bg-orange-100 text-orange-500 border-orange-200",
    big: true,
  };
  if (job.worker_confirmed && !job.customer_confirmed) return {
    label: "Worker marked done",
    color: "bg-orange-100 text-orange-500 border-orange-200",
    big: true,
  };
  return { label: "Active", color: "bg-emerald-50 text-emerald-700 border-emerald-200" };
}

function isUnresolved(job: ActiveJob): boolean {
  return job.status !== "completed";
}

export function ActiveJobsView({ onUnresolvedCount }: { onUnresolvedCount?: (count: number) => void }) {
  const [jobs, setJobs] = useState<ActiveJob[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [completing, setCompleting] = useState<string | null>(null);
  const [uncompleting, setUncompleting] = useState<string | null>(null);
  const [confirmingId, setConfirmingId] = useState<string | null>(null);
  const [actionError, setActionError] = useState<Record<string, string>>({});

  const fetchJobs = useCallback(async () => {
    try {
      const data = await apiService.get<{ jobs: ActiveJob[] }>("/customer/my-jobs");
      const fetched = data.jobs ?? [];
      setJobs(fetched);
      setError(null);
      onUnresolvedCount?.(fetched.filter(isUnresolved).length);
    } catch {
      setError("Failed to load active jobs.");
    } finally {
      setIsLoading(false);
    }
  }, [onUnresolvedCount]);

  useEffect(() => {
    fetchJobs();
  }, [fetchJobs]);

  async function handleComplete(jobId: string) {
    setCompleting(jobId);
    setActionError((prev) => { const n = { ...prev }; delete n[jobId]; return n; });
    try {
      await apiService.post<{ success: boolean; msg: string; released: boolean }>(
        `/customer/complete-job/${jobId}`, {}
      );
      await fetchJobs();
    } catch (e: any) {
      setActionError((prev) => ({ ...prev, [jobId]: e?.message ?? "Failed to mark job as complete." }));
    } finally {
      setCompleting(null);
      setConfirmingId(null);
    }
  }

  async function handleUncomplete(jobId: string) {
    setUncompleting(jobId);
    setActionError((prev) => { const n = { ...prev }; delete n[jobId]; return n; });
    try {
      await apiService.post<{ success: boolean }>(`/customer/uncomplete-job/${jobId}`, {});
      await fetchJobs();
    } catch (e: any) {
      setActionError((prev) => ({ ...prev, [jobId]: e?.message ?? "Could not undo completion." }));
    } finally {
      setUncompleting(null);
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center gap-2 text-sm text-muted-foreground py-8">
        <Loader2 className="w-4 h-4 animate-spin" /> Loading active jobs…
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

  const activeJobs = jobs.filter(j => j.status !== "completed");
  const completedJobs = jobs.filter(j => j.status === "completed");

  if (jobs.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-border p-10 text-center">
        <p className="text-sm text-muted-foreground">No active jobs yet.</p>
        <p className="text-xs text-muted-foreground mt-1">Hire an artisan from your posts to get started.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {activeJobs.length > 0 && (
        <div className="space-y-3">
          {activeJobs.map((job) => {
            const cfg = getJobBadge(job);
            const canComplete = !job.customer_confirmed && job.status !== "completed";
            const canUncomplete = job.customer_confirmed && job.status !== "completed";
            const isConfirming = confirmingId === job.id;
            const oneConfirmed = (job.worker_confirmed || job.customer_confirmed) && job.status !== "completed";

            return (
              <div
                key={job.id}
                className={cn(
                  "rounded-xl border border-gray-200 bg-gray-50 p-4 space-y-3 transition-all overflow-hidden",
                  oneConfirmed && "bg-gradient-to-bl from-orange-100 via-gray-50 to-gray-50"
                )}
              >
                {/* Header */}
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0 space-y-0.5">
                    <h4 className="text-lg font-semibold text-foreground truncate">{job.title}</h4>
                    <p className="text-xs text-muted-foreground line-clamp-1">{job.description}</p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    {canUncomplete && (
                      <button
                        onClick={() => handleUncomplete(job.id)}
                        disabled={uncompleting === job.id}
                        title="Mark as not finished"
                        className="inline-flex items-center gap-1 rounded-full border border-gray-200 bg-white px-2.5 py-1 text-xs font-medium text-muted-foreground hover:border-destructive/40 hover:text-destructive transition-colors cursor-pointer disabled:opacity-50"
                      >
                        {uncompleting === job.id
                          ? <Loader2 className="w-3 h-3 animate-spin" />
                          : <Undo2 className="w-3 h-3" />}
                        Not done?
                      </button>
                    )}
                    <span className={cn(
                      "inline-flex items-center rounded-full border font-medium",
                      cfg.big ? "px-3 py-1 text-sm" : "px-2.5 py-0.5 text-xs",
                      cfg.color
                    )}>
                      {cfg.label}
                    </span>
                  </div>
                </div>

                {/* Worker info + meta */}
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center overflow-hidden shrink-0">
                    {job.worker_photo
                      ? <img src={job.worker_photo} alt={job.worker_name} className="w-full h-full object-cover" />
                      : <User className="w-4 h-4 text-primary" />}
                  </div>
                  <div className="flex-1 min-w-0 flex flex-wrap gap-2">
                    <Chip label={job.worker_name} bold />
                    {job.location && <Chip icon={<MapPin className="w-3 h-3" />} label={job.location} />}
                    <Chip icon={<Banknote className="w-3 h-3" />} label={formatAmount(job.amount)} className="font-semibold text-foreground" />
                  </div>
                </div>

                {/* Confirmation state */}
                <div className="flex items-center gap-4 pt-1 border-t border-gray-300 text-xs">
                  <ConfirmDot confirmed={job.customer_confirmed} label="You" />
                  <div className="w-px h-4 bg-gray-300" />
                  <ConfirmDot confirmed={job.worker_confirmed} label={job.worker_name.split(" ")[0]} />
                </div>

                {/* Inline action error */}
                {actionError[job.id] && (
                  <div className="flex items-start gap-2 text-xs text-destructive bg-destructive/5 border border-destructive/20 rounded-lg px-3 py-2">
                    <AlertCircle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                    <span>{actionError[job.id]}</span>
                  </div>
                )}

                {/* Action */}
                {canComplete && (
                  isConfirming ? (
                    <div className="flex gap-2 pt-1">
                      <Button
                        variant="outline"
                        className="flex-1 h-11 text-sm"
                        onClick={() => setConfirmingId(null)}
                        disabled={!!completing}
                      >
                        Cancel
                      </Button>
                      <Button
                        className="flex-1 h-11 text-sm bg-emerald-600 hover:bg-emerald-700 text-white"
                        onClick={() => handleComplete(job.id)}
                        disabled={completing === job.id}
                      >
                        {completing === job.id
                          ? <><Loader2 className="w-4 h-4 mr-1.5 animate-spin" />Confirming…</>
                          : <><CheckCircle2 className="w-4 h-4 mr-1.5" />Yes, Confirm</>}
                      </Button>
                    </div>
                  ) : (
                    <Button
                      className="w-full h-11 text-sm bg-emerald-600 hover:bg-emerald-700 text-white"
                      onClick={() => setConfirmingId(job.id)}
                    >
                      <CheckCircle2 className="w-4 h-4 mr-1.5" />
                      Mark as Complete
                    </Button>
                  )
                )}

                {job.customer_confirmed && !job.worker_confirmed && !actionError[job.id] && (
                  <p className="text-xs text-muted-foreground flex items-center gap-1.5 pt-1 border-t border-gray-300">
                    <Clock className="w-3.5 h-3.5" />
                    Waiting for {job.worker_name.split(" ")[0]} to confirm. Payout releases once both confirm.
                  </p>
                )}
              </div>
            );
          })}
        </div>
      )}

      {completedJobs.length > 0 && (
        <div className="space-y-2">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Completed</p>
          {completedJobs.map((job) => (
            <div key={job.id} className="rounded-xl border border-gray-200 bg-gray-50 p-4 flex items-center gap-3 opacity-75">
              <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-foreground truncate">{job.title}</p>
                <p className="text-xs text-muted-foreground">with {job.worker_name} · {formatAmount(job.amount)}</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function Chip({
  icon, label, bold, className,
}: {
  icon?: React.ReactNode;
  label: string;
  bold?: boolean;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 text-xs text-muted-foreground bg-gray-200 rounded-full px-2.5 py-1 border border-gray-300",
        bold && "text-foreground font-medium",
        className
      )}
    >
      {icon}
      {label}
    </span>
  );
}

function ConfirmDot({ confirmed, label }: { confirmed: boolean; label: string }) {
  return (
    <span className={cn(
      "flex items-center gap-1.5 text-xs font-medium",
      confirmed ? "text-emerald-600" : "text-muted-foreground"
    )}>
      {confirmed
        ? <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
        : <AlertCircle className="w-3.5 h-3.5 shrink-0" />}
      <span>{label}</span>
      <span className={confirmed ? "text-emerald-500" : "text-muted-foreground/60"}>
        {confirmed ? "confirmed" : "pending"}
      </span>
    </span>
  );
}
