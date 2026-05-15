"use client";

import { useState, useEffect, useCallback } from "react";
import { Loader2, User, MapPin, Banknote, CheckCircle2, Clock, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { apiService } from "@/api/api-service";

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

function getJobBadge(job: ActiveJob): { label: string; color: string } {
  if (job.status === "completed") return { label: "Completed", color: "bg-gray-100 text-gray-600 border-gray-200" };
  if (job.customer_confirmed && !job.worker_confirmed) return { label: "Waiting for Worker", color: "bg-amber-50 text-amber-700 border-amber-200" };
  if (job.worker_confirmed && !job.customer_confirmed) return { label: "Worker Marked Done", color: "bg-purple-50 text-purple-700 border-purple-200" };
  return { label: "Active", color: "bg-emerald-50 text-emerald-700 border-emerald-200" };
}

export function ActiveJobsView() {
  const [jobs, setJobs] = useState<ActiveJob[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [completing, setCompleting] = useState<string | null>(null);
  const [confirmingId, setConfirmingId] = useState<string | null>(null);

  const fetchJobs = useCallback(async () => {
    try {
      const data = await apiService.get<{ jobs: ActiveJob[] }>("/customer/my-jobs");
      setJobs(data.jobs ?? []);
      setError(null);
    } catch {
      setError("Failed to load active jobs.");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchJobs();
  }, [fetchJobs]);

  async function handleComplete(jobId: string) {
    setCompleting(jobId);
    try {
      const res = await apiService.post<{
        success: boolean;
        msg: string;
        released: boolean;
        worker_confirmed: boolean;
        customer_confirmed: boolean;
      }>(`/customer/complete-job/${jobId}`, {});
      // Refresh to get updated status
      await fetchJobs();
      if (res.released) {
        // Payment released — job is fully done
      }
    } catch (e: any) {
      setError(e?.message ?? "Failed to mark job as complete.");
    } finally {
      setCompleting(null);
      setConfirmingId(null);
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
            const isConfirming = confirmingId === job.id;

            return (
              <div key={job.id} className="rounded-xl border bg-card p-4 space-y-3">
                {/* Header */}
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0 space-y-0.5">
                    <h4 className="text-sm font-semibold text-foreground truncate">{job.title}</h4>
                    <p className="text-xs text-muted-foreground line-clamp-1">{job.description}</p>
                  </div>
                  <span className={`shrink-0 inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium ${cfg.color}`}>
                    {cfg.label}
                  </span>
                </div>

                {/* Worker info + meta */}
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center overflow-hidden shrink-0">
                    {job.worker_photo
                      ? <img src={job.worker_photo} alt={job.worker_name} className="w-full h-full object-cover" />
                      : <User className="w-4 h-4 text-primary" />}
                  </div>
                  <div className="flex-1 min-w-0 text-xs text-muted-foreground flex flex-wrap gap-x-3">
                    <span className="font-medium text-foreground">{job.worker_name}</span>
                    {job.location && <span className="flex items-center gap-1"><MapPin className="w-3 h-3" />{job.location}</span>}
                    <span className="flex items-center gap-1"><Banknote className="w-3 h-3" />{formatAmount(job.amount)}</span>
                  </div>
                </div>

                {/* Confirmation state */}
                <div className="flex items-center gap-2 text-xs pt-1 border-t border-border">
                  <ConfirmDot confirmed={job.customer_confirmed} label="You" />
                  <ConfirmDot confirmed={job.worker_confirmed} label={job.worker_name.split(" ")[0]} />
                </div>

                {/* Action */}
                {canComplete && (
                  isConfirming ? (
                    <div className="flex gap-2 pt-1">
                      <Button
                        size="sm"
                        variant="outline"
                        className="flex-1"
                        onClick={() => setConfirmingId(null)}
                        disabled={!!completing}
                      >
                        Cancel
                      </Button>
                      <Button
                        size="sm"
                        className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white"
                        onClick={() => handleComplete(job.id)}
                        disabled={completing === job.id}
                      >
                        {completing === job.id
                          ? <><Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />Confirming…</>
                          : <><CheckCircle2 className="w-3.5 h-3.5 mr-1.5" />Yes, Confirm</>}
                      </Button>
                    </div>
                  ) : (
                    <Button
                      size="sm"
                      className="w-48 bg-emerald-600 hover:bg-emerald-700 text-white"
                      onClick={() => setConfirmingId(job.id)}
                    >
                      <CheckCircle2 className="w-3.5 h-3.5 mr-1.5" />
                      Mark as Complete
                    </Button>
                  )
                )}

                {job.customer_confirmed && !job.worker_confirmed && (
                  <p className="text-xs text-muted-foreground flex items-center gap-1.5 pt-1 border-t border-border">
                    <Clock className="w-3.5 h-3.5" />
                    Waiting for {job.worker_name.split(" ")[0]} to confirm completion.
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
            <div key={job.id} className="rounded-xl border bg-card/50 p-4 flex items-center gap-3 opacity-75">
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

function ConfirmDot({ confirmed, label }: { confirmed: boolean; label: string }) {
  return (
    <span className={`flex items-center gap-1 ${confirmed ? "text-emerald-600" : "text-muted-foreground"}`}>
      {confirmed
        ? <CheckCircle2 className="w-3.5 h-3.5" />
        : <AlertCircle className="w-3.5 h-3.5" />}
      {label} {confirmed ? "confirmed" : "pending"}
    </span>
  );
}
