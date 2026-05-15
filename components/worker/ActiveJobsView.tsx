"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import {
  Loader2, User, MapPin, Banknote, CheckCircle2,
  Clock, AlertCircle, CreditCard,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { apiService } from "@/api/api-service";
import { cn } from "@/lib/utils";

interface ActiveJob {
  id: string;
  job_request_id: string;
  customer_id: string;
  customer_name: string;
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

const fmt = (v: number) => `₦${Number(v).toLocaleString("en-NG")}`;

function getBadge(job: ActiveJob): { label: string; dot: string; text: string } {
  if (job.status === "completed")
    return { label: "Completed", dot: "bg-gray-400", text: "text-gray-500" };
  if (job.worker_confirmed && job.customer_confirmed)
    return { label: "Both confirmed", dot: "bg-emerald-500", text: "text-emerald-700" };
  if (job.worker_confirmed)
    return { label: "Waiting for customer", dot: "bg-amber-400", text: "text-amber-700" };
  if (job.customer_confirmed)
    return { label: "Customer marked done", dot: "bg-purple-400", text: "text-purple-700" };
  return { label: "Active", dot: "bg-emerald-500", text: "text-emerald-700" };
}

export function WorkerActiveJobsView({ highlightJobId }: { highlightJobId?: string }) {
  const [jobs, setJobs] = useState<ActiveJob[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [completing, setCompleting] = useState<string | null>(null);
  const [confirmingId, setConfirmingId] = useState<string | null>(null);
  const highlightRef = useRef<HTMLDivElement | null>(null);

  const fetchJobs = useCallback(async () => {
    try {
      const data = await apiService.get<{ jobs: ActiveJob[] }>("/worker/my-jobs");
      setJobs(data.jobs ?? []);
      setError(null);
    } catch {
      setError("Failed to load active jobs.");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => { fetchJobs(); }, [fetchJobs]);

  // Scroll highlighted job into view once data loads
  useEffect(() => {
    if (highlightJobId && highlightRef.current) {
      highlightRef.current.scrollIntoView({ behavior: "smooth", block: "center" });
    }
  }, [highlightJobId, jobs]);

  async function handleComplete(jobId: string) {
    setCompleting(jobId);
    try {
      await apiService.post<{ success: boolean }>(`/worker/complete-job/${jobId}`, {});
      await fetchJobs();
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
        <Loader2 className="w-4 h-4 animate-spin" /> Loading your jobs…
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
        <p className="text-sm text-muted-foreground">No jobs yet.</p>
        <p className="text-xs text-muted-foreground mt-1">Apply to jobs in the feed to get started.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {activeJobs.length > 0 && (
        <div className="space-y-3">
          {activeJobs.map((job) => (
            <JobCard
              key={job.id}
              job={job}
              isHighlighted={job.id === highlightJobId}
              highlightRef={job.id === highlightJobId ? highlightRef : undefined}
              isConfirming={confirmingId === job.id}
              isCompleting={completing === job.id}
              onConfirmStart={() => setConfirmingId(job.id)}
              onConfirmCancel={() => setConfirmingId(null)}
              onComplete={() => handleComplete(job.id)}
            />
          ))}
        </div>
      )}

      {completedJobs.length > 0 && (
        <div className="space-y-2">
          <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-widest">
            Completed
          </p>
          {completedJobs.map((job) => (
            <JobCard
              key={job.id}
              job={job}
              isHighlighted={job.id === highlightJobId}
              highlightRef={job.id === highlightJobId ? highlightRef : undefined}
              isConfirming={false}
              isCompleting={false}
              onConfirmStart={() => {}}
              onConfirmCancel={() => {}}
              onComplete={() => {}}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function JobCard({
  job, isHighlighted, highlightRef,
  isConfirming, isCompleting,
  onConfirmStart, onConfirmCancel, onComplete,
}: {
  job: ActiveJob;
  isHighlighted: boolean;
  highlightRef?: React.Ref<HTMLDivElement>;
  isConfirming: boolean;
  isCompleting: boolean;
  onConfirmStart: () => void;
  onConfirmCancel: () => void;
  onComplete: () => void;
}) {
  const badge = getBadge(job);
  const isCompleted = job.status === "completed";
  const canComplete = !job.worker_confirmed && !isCompleted;

  return (
    <div
      ref={highlightRef}
      className={cn(
        "rounded-2xl border bg-card transition-all duration-500",
        isHighlighted && "ring-2 ring-[var(--orange)] ring-offset-2 shadow-md",
        isCompleted && "opacity-70"
      )}
    >
      {/* ── Top bar: status badge ── */}
      <div className="flex items-center justify-between px-4 pt-3.5 pb-0">
        <span className={cn("flex items-center gap-1.5 text-xs font-medium", badge.text)}>
          <span className={cn("w-1.5 h-1.5 rounded-full shrink-0", badge.dot)} />
          {badge.label}
        </span>
        {job.payment_method === "offline" && (
          <span className="flex items-center gap-1 text-xs text-muted-foreground">
            <CreditCard className="w-3 h-3" /> Cash
          </span>
        )}
      </div>

      {/* ── Title + description ── */}
      <div className="px-4 pt-2 pb-0">
        <h4 className="text-base font-semibold text-foreground leading-snug">{job.title}</h4>
        {job.description && (
          <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2 leading-relaxed">
            {job.description}
          </p>
        )}
      </div>

      {/* ── Meta chips row ── */}
      <div className="px-4 pt-3 pb-0 flex flex-wrap items-center gap-2">
        <Chip icon={<User className="w-3 h-3" />} label={job.customer_name} bold />
        {job.location && <Chip icon={<MapPin className="w-3 h-3" />} label={job.location} />}
        <Chip
          icon={<Banknote className="w-3 h-3" />}
          label={fmt(job.amount)}
          className="font-semibold text-foreground"
        />
      </div>

      {/* ── Confirmation row ── */}
      <div className="mx-4 mt-3 rounded-xl bg-muted/50 border border-border/60 px-3 py-2.5 flex items-center gap-4">
        <ConfirmPin confirmed={job.worker_confirmed} label="You" />
        <div className="w-px h-4 bg-border" />
        <ConfirmPin
          confirmed={job.customer_confirmed}
          label={job.customer_name.split(" ")[0]}
        />
      </div>

      {/* ── Waiting message ── */}
      {job.worker_confirmed && !job.customer_confirmed && !isCompleted && (
        <div className="mx-4 mt-2 flex items-start gap-2 text-xs text-amber-700 bg-amber-50 border border-amber-100 rounded-lg px-3 py-2">
          <Clock className="w-3.5 h-3.5 shrink-0 mt-0.5" />
          <span>
            Waiting for {job.customer_name.split(" ")[0]} to confirm.
            Payment releases once both confirm.
          </span>
        </div>
      )}

      {/* ── Action ── */}
      <div className="px-4 pt-3 pb-4">
        {canComplete && (
          isConfirming ? (
            <div className="flex gap-2">
              <Button
                size="sm"
                variant="outline"
                className="flex-1"
                onClick={onConfirmCancel}
                disabled={isCompleting}
              >
                Cancel
              </Button>
              <Button
                size="sm"
                className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white"
                onClick={onComplete}
                disabled={isCompleting}
              >
                {isCompleting
                  ? <><Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />Confirming…</>
                  : <><CheckCircle2 className="w-3.5 h-3.5 mr-1.5" />Yes, I'm Done</>}
              </Button>
            </div>
          ) : (
            <Button
              size="sm"
              className="w-full bg-emerald-600 hover:bg-emerald-700 text-white"
              onClick={onConfirmStart}
            >
              <CheckCircle2 className="w-3.5 h-3.5 mr-1.5" />
              Mark Job as Complete
            </Button>
          )
        )}
        {isCompleted && (
          <p className="text-xs text-emerald-600 flex items-center gap-1.5 font-medium">
            <CheckCircle2 className="w-3.5 h-3.5" /> Job complete · payment transferred
          </p>
        )}
      </div>
    </div>
  );
}

function Chip({
  icon, label, bold, className,
}: {
  icon: React.ReactNode;
  label: string;
  bold?: boolean;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 text-xs text-muted-foreground bg-muted/60 rounded-full px-2.5 py-1",
        bold && "text-foreground font-medium",
        className
      )}
    >
      {icon}
      {label}
    </span>
  );
}

function ConfirmPin({ confirmed, label }: { confirmed: boolean; label: string }) {
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
