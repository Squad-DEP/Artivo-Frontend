"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import {
  Loader2, User, MapPin, Banknote, CheckCircle2,
  Clock, AlertCircle, CreditCard, Undo2,
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

function getBadge(job: ActiveJob): {
  label: string; dot: string; text: string;
  pill?: string; big?: boolean;
} {
  if (job.status === "completed")
    return { label: "Completed", dot: "bg-gray-400", text: "text-gray-500" };
  if (job.worker_confirmed && job.customer_confirmed)
    return { label: "Both confirmed", dot: "bg-emerald-500", text: "text-emerald-700" };
  if (job.worker_confirmed)
    return {
      label: "You marked as complete",
      dot: "bg-[var(--orange,#f97316)]", text: "text-[var(--orange,#f97316)]",
      pill: "bg-[var(--orange,#f97316)]/10 border border-[var(--orange,#f97316)]/30 text-[var(--orange,#f97316)]",
      big: true,
    };
  if (job.customer_confirmed)
    return {
      label: "Customer marked done",
      dot: "bg-purple-400", text: "text-purple-700",
      pill: "bg-purple-50 border border-purple-200 text-purple-700",
      big: true,
    };
  return { label: "Active", dot: "bg-emerald-500", text: "text-emerald-700" };
}

function isUnresolved(job: ActiveJob): boolean {
  return job.status !== "completed";
}

export function WorkerActiveJobsView({
  highlightJobId,
  onUnresolvedCount,
}: {
  highlightJobId?: string;
  onUnresolvedCount?: (count: number) => void;
}) {
  const [jobs, setJobs] = useState<ActiveJob[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [completing, setCompleting] = useState<string | null>(null);
  const [uncompleting, setUncompleting] = useState<string | null>(null);
  const [confirmingId, setConfirmingId] = useState<string | null>(null);
  const [actionError, setActionError] = useState<Record<string, string>>({});
  const highlightRef = useRef<HTMLDivElement | null>(null);

  const fetchJobs = useCallback(async () => {
    try {
      const data = await apiService.get<{ jobs: ActiveJob[] }>("/worker/my-jobs");
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

  useEffect(() => { fetchJobs(); }, [fetchJobs]);

  useEffect(() => {
    if (highlightJobId && highlightRef.current) {
      highlightRef.current.scrollIntoView({ behavior: "smooth", block: "center" });
    }
  }, [highlightJobId, jobs]);

  async function handleComplete(jobId: string) {
    setCompleting(jobId);
    setActionError((prev) => { const n = { ...prev }; delete n[jobId]; return n; });
    try {
      await apiService.post<{ success: boolean }>(`/worker/complete-job/${jobId}`, {});
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
      await apiService.post<{ success: boolean }>(`/worker/uncomplete-job/${jobId}`, {});
      await fetchJobs();
    } catch (e: any) {
      setActionError((prev) => ({ ...prev, [jobId]: e?.message ?? "Could not undo completion." }));
    } finally {
      setUncompleting(null);
    }
  }

  if (isLoading) {
    return (
      <div className="space-y-3">
        {[1, 2, 3].map((i) => (
          <div key={i} className="rounded-2xl border border-gray-200 bg-gray-50 overflow-hidden animate-pulse">
            {/* Status badge */}
            <div className="px-4 pt-3.5 pb-0">
              <div className="h-4 w-16 bg-gray-200 rounded-full" />
            </div>
            {/* Title + description */}
            <div className="px-4 pt-3 pb-0 space-y-2">
              <div className="h-5 w-3/4 bg-gray-200 rounded" />
              <div className="h-3 w-full bg-gray-200 rounded" />
            </div>
            {/* Meta chips */}
            <div className="px-4 pt-3 pb-0 flex gap-2">
              <div className="h-6 w-24 bg-gray-200 rounded-full" />
              <div className="h-6 w-20 bg-gray-200 rounded-full" />
              <div className="h-6 w-16 bg-gray-200 rounded-full" />
            </div>
            {/* Confirmation row */}
            <div className="mx-4 mt-3 rounded-xl bg-gray-100 border border-gray-200 px-3 py-2.5 flex items-center gap-4">
              <div className="h-4 w-20 bg-gray-200 rounded" />
              <div className="w-px h-4 bg-gray-200" />
              <div className="h-4 w-24 bg-gray-200 rounded" />
            </div>
            {/* Action button */}
            <div className="px-4 pt-3 pb-4">
              <div className="h-11 w-full bg-gray-200 rounded-lg" />
            </div>
          </div>
        ))}
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
    return <EmptyJobsState />;
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
              isUncompleting={uncompleting === job.id}
              actionError={actionError[job.id]}
              onConfirmStart={() => setConfirmingId(job.id)}
              onConfirmCancel={() => setConfirmingId(null)}
              onComplete={() => handleComplete(job.id)}
              onUncomplete={() => handleUncomplete(job.id)}
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
              isUncompleting={false}
              actionError={undefined}
              onConfirmStart={() => {}}
              onConfirmCancel={() => {}}
              onComplete={() => {}}
              onUncomplete={() => {}}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function JobCard({
  job, isHighlighted, highlightRef,
  isConfirming, isCompleting, isUncompleting,
  actionError,
  onConfirmStart, onConfirmCancel, onComplete, onUncomplete,
}: {
  job: ActiveJob;
  isHighlighted: boolean;
  highlightRef?: React.Ref<HTMLDivElement>;
  isConfirming: boolean;
  isCompleting: boolean;
  isUncompleting: boolean;
  actionError?: string;
  onConfirmStart: () => void;
  onConfirmCancel: () => void;
  onComplete: () => void;
  onUncomplete: () => void;
}) {
  const badge = getBadge(job);
  const isCompleted = job.status === "completed";
  const canComplete = !job.worker_confirmed && !isCompleted;
  const canUncomplete = job.worker_confirmed && !isCompleted;
  const oneConfirmed = (job.worker_confirmed || job.customer_confirmed) && !isCompleted;

  return (
    <div
      ref={highlightRef}
      className={cn(
        "rounded-2xl border border-gray-200 bg-gray-50 transition-all duration-500 overflow-hidden",
        oneConfirmed && "bg-gradient-to-bl from-orange-100 via-gray-50 to-gray-50",
        isHighlighted && "ring-2 ring-[var(--orange)] ring-offset-2 shadow-md",
        isCompleted && "opacity-70"
      )}
    >
      {/* ── Top bar: status badge + undo button ── */}
      <div className="flex items-center justify-between px-4 pt-3.5 pb-0">
        {badge.big ? (
          <span className={cn(
            "inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-sm font-semibold",
            badge.pill
          )}>
            <span className={cn("w-2 h-2 rounded-full shrink-0", badge.dot)} />
            {badge.label}
          </span>
        ) : (
          <span className={cn("flex items-center gap-1.5 text-xs font-medium", badge.text)}>
            <span className={cn("w-1.5 h-1.5 rounded-full shrink-0", badge.dot)} />
            {badge.label}
          </span>
        )}
        <div className="flex items-center gap-2">
          {job.payment_method === "offline" && (
            <span className="flex items-center gap-1 text-xs text-muted-foreground">
              <CreditCard className="w-3 h-3" /> Cash
            </span>
          )}
          {canUncomplete && (
            <button
              onClick={onUncomplete}
              disabled={isUncompleting}
              title="Mark as not finished"
              className="inline-flex items-center gap-1 rounded-full border border-gray-200 bg-white px-2.5 py-1 text-xs font-medium text-muted-foreground hover:border-destructive/40 hover:text-destructive transition-colors cursor-pointer disabled:opacity-50"
            >
              {isUncompleting
                ? <Loader2 className="w-3 h-3 animate-spin" />
                : <Undo2 className="w-3 h-3" />}
              Not done?
            </button>
          )}
        </div>
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
      <div className="mx-4 mt-3 rounded-xl bg-gray-100 border border-gray-300 px-3 py-2.5 flex items-center gap-4">
        <ConfirmPin confirmed={job.worker_confirmed} label="You" />
        <div className="w-px h-4 bg-border" />
        <ConfirmPin confirmed={job.customer_confirmed} label={job.customer_name.split(" ")[0]} />
      </div>

      {/* ── Inline action error ── */}
      {actionError && (
        <div className="mx-4 mt-2 flex items-start gap-2 text-xs text-destructive bg-destructive/5 border border-destructive/20 rounded-lg px-3 py-2">
          <AlertCircle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
          <span>{actionError}</span>
        </div>
      )}

      {/* ── Waiting message ── */}
      {job.worker_confirmed && !job.customer_confirmed && !isCompleted && !actionError && (
        <div className="mx-4 mt-2 flex justify-center items-start gap-2 text-xs text-gray-400 rounded-lg px-3 pt-2">
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
                variant="outline"
                className="flex-1 h-11 text-sm"
                onClick={onConfirmCancel}
                disabled={isCompleting}
              >
                Cancel
              </Button>
              <Button
                className="flex-1 h-11 text-sm bg-emerald-600 hover:bg-emerald-700 text-white"
                onClick={onComplete}
                disabled={isCompleting}
              >
                {isCompleting
                  ? <><Loader2 className="w-4 h-4 mr-1.5 animate-spin" />Confirming…</>
                  : <><CheckCircle2 className="w-4 h-4 mr-1.5" />Yes, I'm Done</>}
              </Button>
            </div>
          ) : (
            <Button
              className="w-full h-11 text-sm bg-emerald-600 hover:bg-emerald-700 text-white"
              onClick={onConfirmStart}
            >
              <CheckCircle2 className="w-4 h-4 mr-1.5" />
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

// ─── Empty State ─────────────────────────────────────────────────────────────

const TIPS = [
  "Update your portfolio with completed work to attract more customers",
  "A detailed bio helps customers understand your expertise",
  "Respond to proposals quickly — speed builds trust",
  "Add photos of past projects to stand out in search results",
  "Keep your availability status current so customers know you're ready",
  "Workers with 5+ skills get 3× more job invites on average",
  "Set a competitive hourly rate based on your experience level",
];

function EmptyJobsState() {
  const [tipIndex, setTipIndex] = useState(0);
  const [fade, setFade] = useState(true);

  useEffect(() => {
    const interval = setInterval(() => {
      setFade(false);
      setTimeout(() => {
        setTipIndex((prev) => (prev + 1) % TIPS.length);
        setFade(true);
      }, 300);
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="flex flex-col items-center justify-center rounded-2xl border border-gray-200 bg-gradient-to-b from-gray-50 to-white py-16 px-6 text-center">
      {/* Icon */}
      <div className="w-16 h-16 rounded-2xl bg-[var(--orange)]/10 flex items-center justify-center mb-5">
        <Banknote className="w-8 h-8 text-[var(--orange)]" />
      </div>

      {/* Heading */}
      <h3 className="text-lg font-semibold text-gray-900 mb-1">No active jobs yet</h3>
      <p className="text-sm text-muted-foreground max-w-xs">
        Browse the job feed and send proposals to get hired. Your active jobs will show up here.
      </p>

      {/* CTA */}
      <Button
        className="mt-6 bg-[var(--orange)] hover:bg-[var(--orange)]/90 text-white px-6"
        onClick={() => window.location.href = "/dashboard/jobs?tab=feed"}
      >
        Browse Job Feed
      </Button>

      {/* Rotating tip */}
      <div className="mt-8 w-full max-w-sm">
        <div className="rounded-xl bg-gray-100 border border-gray-200 px-4 py-3">
          <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider mb-1">
            💡 Tip
          </p>
          <p
            className={cn(
              "text-sm text-[var(--orange)] transition-opacity duration-300",
              fade ? "opacity-100" : "opacity-0"
            )}
          >
            {TIPS[tipIndex]}
          </p>
        </div>
      </div>
    </div>
  );
}
