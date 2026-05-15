"use client";

import * as React from "react";
import { useWorkerJobStore } from "@/store/workerJobStore";
import type { WorkerProposal } from "@/store/workerJobStore";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import type { StreamedJob } from "@/api/types/marketplace-api";
import { Plus, Check, X } from "lucide-react";

const formatBudget = (v: number | null | undefined) =>
  !v || v === 0 ? "Negotiable" : `₦${Number(v).toLocaleString("en-NG")}`;

type Tab = "available" | "applications";

export function WorkerJobFeed() {
  const {
    availableJobTypes,
    subscriptions,
    streamedJobs,
    proposals,
    isLoading,
    error,
    fetchJobTypes,
    fetchSubscriptions,
    fetchProposals,
    startPolling,
    stopPolling,
    subscribe,
    unsubscribe,
    acceptJob,
  } = useWorkerJobStore();

  const [tab, setTab] = React.useState<Tab>("available");
  const [proposedMin, setProposedMin] = React.useState<Record<string, string>>({});
  const [proposedMax, setProposedMax] = React.useState<Record<string, string>>({});
  const [acceptingJobId, setAcceptingJobId] = React.useState<string | null>(null);
  const [subscribeOpen, setSubscribeOpen] = React.useState(false);

  React.useEffect(() => {
    fetchJobTypes();
    fetchSubscriptions();
    fetchProposals();
    startPolling();
    return () => stopPolling();
  }, [fetchJobTypes, fetchSubscriptions, fetchProposals, startPolling, stopPolling]);

  const isSubscribed = (jobTypeId: string) =>
    subscriptions.some((sub) => sub.job_type_id === jobTypeId);

  const handleToggleSubscription = async (jobTypeId: string) => {
    if (isSubscribed(jobTypeId)) {
      await unsubscribe(jobTypeId);
    } else {
      await subscribe(jobTypeId);
    }
  };

  const handleAcceptJob = async (jobRequestId: string) => {
    const min = parseFloat(proposedMin[jobRequestId]);
    const max = parseFloat(proposedMax[jobRequestId]);
    if (!min || min <= 0 || !max || max <= 0 || max < min) return;
    setAcceptingJobId(jobRequestId);
    const ok = await acceptJob(jobRequestId, min, max);
    setAcceptingJobId(null);
    if (ok) {
      setProposedMin((prev) => { const next = { ...prev }; delete next[jobRequestId]; return next; });
      setProposedMax((prev) => { const next = { ...prev }; delete next[jobRequestId]; return next; });
      setTab("applications");
    }
  };

  const pendingCount = proposals.filter((p) => p.status === "pending").length;

  return (
    <div className="space-y-6">
      {/* Job Type Subscriptions */}
      <div className="rounded-lg border bg-card p-4 space-y-3">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h3 className="text-sm font-semibold text-foreground">Job Type Subscriptions</h3>
            <p className="text-xs text-muted-foreground mt-0.5">Only jobs from these types appear in your feed.</p>
          </div>
          <Popover open={subscribeOpen} onOpenChange={setSubscribeOpen}>
            <PopoverTrigger asChild>
              <Button variant="outline" size="sm" className="shrink-0 gap-1.5">
                <Plus className="w-3.5 h-3.5" />
                Add
              </Button>
            </PopoverTrigger>
            <PopoverContent align="end" className="w-56 p-1">
              {availableJobTypes.length === 0 ? (
                <p className="px-3 py-2 text-sm text-muted-foreground">No job types available.</p>
              ) : (
                availableJobTypes.map((jt) => {
                  const subscribed = isSubscribed(jt.id);
                  return (
                    <button
                      key={jt.id}
                      onClick={() => handleToggleSubscription(jt.id)}
                      className="w-full flex items-center gap-2.5 px-3 py-2 text-sm rounded hover:bg-muted transition-colors text-left cursor-pointer"
                    >
                      <span
                        className={cn(
                          "w-4 h-4 rounded border flex items-center justify-center shrink-0 transition-colors",
                          subscribed
                            ? "bg-[var(--orange,#f97316)] border-[var(--orange,#f97316)]"
                            : "border-border"
                        )}
                      >
                        {subscribed && <Check className="w-3 h-3 text-white" strokeWidth={3} />}
                      </span>
                      {jt.name}
                    </button>
                  );
                })
              )}
            </PopoverContent>
          </Popover>
        </div>

        {subscriptions.length === 0 ? (
          <p className="text-sm text-muted-foreground">No subscriptions yet — use Add to subscribe to job types.</p>
        ) : (
          <div className="flex flex-wrap gap-2">
            {subscriptions.map((sub) => (
              <span
                key={sub.job_type_id}
                className="inline-flex items-center gap-1.5 rounded-full border border-[var(--orange,#f97316)]/40 bg-[var(--orange,#f97316)]/10 px-3 py-1 text-xs font-medium text-[var(--orange,#f97316)]"
              >
                {sub.job_type_name}
                <button
                  onClick={() => handleToggleSubscription(sub.job_type_id)}
                  className="hover:opacity-70 transition-opacity cursor-pointer"
                  aria-label={`Unsubscribe from ${sub.job_type_name}`}
                >
                  <X className="w-3 h-3" />
                </button>
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Tabs */}
      <div className="border-b border-border">
        <div className="flex gap-0">
          <TabButton active={tab === "available"} onClick={() => setTab("available")}>
            Available Jobs
            {streamedJobs.length > 0 && (
              <span className="ml-1.5 inline-flex items-center justify-center rounded-full bg-primary/10 text-primary px-1.5 py-0.5 text-xs font-medium leading-none">
                {streamedJobs.length}
              </span>
            )}
          </TabButton>
          <TabButton active={tab === "applications"} onClick={() => setTab("applications")}>
            My Applications
            {pendingCount > 0 && (
              <span className="ml-1.5 inline-flex items-center justify-center rounded-full bg-amber-100 text-amber-700 px-1.5 py-0.5 text-xs font-medium leading-none">
                {pendingCount}
              </span>
            )}
          </TabButton>
        </div>
      </div>

      {error && (
        <div className="rounded-md border border-destructive/30 bg-destructive/5 p-3">
          <p className="text-sm text-destructive">{error}</p>
        </div>
      )}

      {/* Available Jobs tab */}
      {tab === "available" && (
        <div className="space-y-3">
          {streamedJobs.length === 0 ? (
            <div className="rounded-lg border bg-card p-8 text-center">
              <p className="text-sm text-muted-foreground">No open jobs at the moment. Check back soon.</p>
            </div>
          ) : (
            streamedJobs.map((job) => (
              <JobCard
                key={job.id}
                job={job}
                proposedMin={proposedMin[job.id] ?? ""}
                proposedMax={proposedMax[job.id] ?? ""}
                onMinChange={(v) => setProposedMin((prev) => ({ ...prev, [job.id]: v }))}
                onMaxChange={(v) => setProposedMax((prev) => ({ ...prev, [job.id]: v }))}
                onAccept={() => handleAcceptJob(job.id)}
                isAccepting={acceptingJobId === job.id}
              />
            ))
          )}
        </div>
      )}

      {/* Applications tab */}
      {tab === "applications" && (
        <div className="space-y-3">
          {proposals.length === 0 ? (
            <div className="rounded-lg border bg-card p-8 text-center">
              <p className="text-sm text-muted-foreground">No applications yet. Apply to jobs in the Available tab.</p>
            </div>
          ) : (
            proposals.map((proposal) => (
              <ProposalCard key={proposal.id} proposal={proposal} />
            ))
          )}
        </div>
      )}
    </div>
  );
}

function TabButton({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "flex items-center px-4 py-2.5 text-sm font-medium border-b-2 transition-colors",
        active
          ? "border-[var(--orange)] text-[var(--orange)]"
          : "border-transparent text-muted-foreground hover:text-foreground hover:border-gray-300"
      )}
    >
      {children}
    </button>
  );
}

function JobCard({
  job,
  proposedMin,
  proposedMax,
  onMinChange,
  onMaxChange,
  onAccept,
  isAccepting,
}: {
  job: StreamedJob;
  proposedMin: string;
  proposedMax: string;
  onMinChange: (value: string) => void;
  onMaxChange: (value: string) => void;
  onAccept: () => void;
  isAccepting: boolean;
}) {
  const min = parseFloat(proposedMin);
  const max = parseFloat(proposedMax);
  const isValid = min > 0 && max > 0 && max >= min;

  return (
    <div className="rounded-lg border bg-card p-4 space-y-3">
      <div className="flex items-start justify-between gap-3">
        <div className="space-y-1 min-w-0">
          <h4 className="text-sm font-semibold text-foreground truncate">{job.title}</h4>
          <p className="text-sm text-muted-foreground line-clamp-2">{job.description}</p>
        </div>
        <span className="shrink-0 inline-flex items-center rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-medium text-primary">
          {job.job_type}
        </span>
      </div>
      <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
        <span>{job.location}</span>
        <span>Budget: {formatBudget(job.budget)}</span>
        <span>By {job.customer_name}</span>
      </div>
      <div className="space-y-2 pt-1">
        <p className="text-xs font-medium text-muted-foreground">Your Price Range (₦)</p>
        <div className="flex items-center gap-2">
          <div className="flex-1">
            <Input
              type="number"
              min="1"
              step="any"
              placeholder="Min"
              value={proposedMin}
              onChange={(e) => onMinChange(e.target.value)}
              disabled={isAccepting}
              className="h-9 text-sm"
            />
          </div>
          <span className="text-xs text-muted-foreground shrink-0">to</span>
          <div className="flex-1">
            <Input
              type="number"
              min="1"
              step="any"
              placeholder="Max"
              value={proposedMax}
              onChange={(e) => onMaxChange(e.target.value)}
              disabled={isAccepting}
              className="h-9 text-sm"
            />
          </div>
          <Button onClick={onAccept} disabled={isAccepting || !isValid} size="sm" className="shrink-0">
            {isAccepting ? <><Spinner />Sending...</> : "Apply"}
          </Button>
        </div>
        {proposedMin && proposedMax && !isValid && (
          <p className="text-xs text-destructive">Max must be greater than or equal to min.</p>
        )}
      </div>
    </div>
  );
}

function ProposalCard({ proposal }: { proposal: WorkerProposal }) {
  const statusConfig = {
    pending: { label: "Awaiting review", className: "bg-amber-50 text-amber-700 border-amber-200" },
    accepted: { label: "Accepted", className: "bg-emerald-50 text-emerald-700 border-emerald-200" },
    rejected: { label: "Declined", className: "bg-red-50 text-red-600 border-red-200" },
  };
  const { label, className } = statusConfig[proposal.status] ?? statusConfig.pending;

  return (
    <div className="rounded-lg border bg-card p-4 space-y-3">
      <div className="flex items-start justify-between gap-3">
        <div className="space-y-1 min-w-0">
          <h4 className="text-sm font-semibold text-foreground truncate">{proposal.title}</h4>
          <p className="text-sm text-muted-foreground line-clamp-2">{proposal.description}</p>
        </div>
        <span className={cn("shrink-0 inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium", className)}>
          {label}
        </span>
      </div>
      <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
        <span>{proposal.location}</span>
        <span>Job budget: {formatBudget(proposal.budget)}</span>
        <span>By {proposal.customer_name}</span>
      </div>
      <div className="flex items-center justify-between pt-1 border-t border-border">
        <span className="text-xs text-muted-foreground">Your price range</span>
        <span className="text-sm font-semibold text-foreground">
          ₦{Number(proposal.proposed_amount).toLocaleString("en-NG")}
          {proposal.proposed_amount_max && proposal.proposed_amount_max > proposal.proposed_amount
            ? ` – ₦${Number(proposal.proposed_amount_max).toLocaleString("en-NG")}`
            : ""}
        </span>
      </div>
    </div>
  );
}

function Spinner() {
  return (
    <svg className="size-4 animate-spin mr-1.5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" aria-hidden="true">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
    </svg>
  );
}
