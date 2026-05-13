"use client";

import * as React from "react";
import { useWorkerJobStore } from "@/store/workerJobStore";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import type { StreamedJob } from "@/api/types/marketplace-api";

export function WorkerJobFeed() {
  const {
    availableJobTypes,
    subscriptions,
    streamedJobs,
    connectionStatus,
    isLoading,
    error,
    fetchJobTypes,
    subscribe,
    unsubscribe,
    connectStream,
    disconnectStream,
    acceptJob,
  } = useWorkerJobStore();

  // Track proposed amounts per job
  const [proposedAmounts, setProposedAmounts] = React.useState<
    Record<string, string>
  >({});
  const [acceptingJobId, setAcceptingJobId] = React.useState<string | null>(
    null
  );

  // Connect SSE on mount, disconnect on unmount
  React.useEffect(() => {
    connectStream();
    return () => {
      disconnectStream();
    };
  }, [connectStream, disconnectStream]);

  // Fetch job types on mount
  React.useEffect(() => {
    fetchJobTypes();
  }, [fetchJobTypes]);

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
    const amountStr = proposedAmounts[jobRequestId];
    const amount = parseFloat(amountStr);

    if (!amountStr || isNaN(amount) || amount <= 0) return;

    setAcceptingJobId(jobRequestId);
    await acceptJob(jobRequestId, amount);
    setAcceptingJobId(null);

    // Clear the proposed amount for this job
    setProposedAmounts((prev) => {
      const next = { ...prev };
      delete next[jobRequestId];
      return next;
    });
  };

  const handleAmountChange = (jobId: string, value: string) => {
    setProposedAmounts((prev) => ({ ...prev, [jobId]: value }));
  };

  const handleReconnect = () => {
    connectStream();
  };

  return (
    <div className="space-y-6">
      {/* Connection Status Indicator */}
      <ConnectionStatusIndicator
        status={connectionStatus}
        onReconnect={handleReconnect}
      />

      {/* Error Display */}
      {error && connectionStatus === "error" && (
        <div
          className="rounded-md border border-gray-200 bg-gray-50 p-3"
          role="alert"
        >
          <p className="text-sm text-gray-600">Unable to connect. Check your connection and try again.</p>
        </div>
      )}

      {/* Job Type Subscriptions */}
      <div className="rounded-lg border bg-card p-4 space-y-3">
        <h3 className="text-sm font-semibold text-foreground">
          Job Type Subscriptions
        </h3>
        <p className="text-sm text-muted-foreground">
          Subscribe to job types to receive relevant notifications.
        </p>

        {availableJobTypes.length === 0 && !isLoading && (
          <p className="text-sm text-muted-foreground">
            No job types available.
          </p>
        )}

        {isLoading && availableJobTypes.length === 0 && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Spinner />
            <span>Loading job types...</span>
          </div>
        )}

        <div className="flex flex-wrap gap-2">
          {availableJobTypes.map((jobType) => {
            const subscribed = isSubscribed(jobType.id);
            return (
              <Button
                key={jobType.id}
                variant={subscribed ? "default" : "outline"}
                size="sm"
                onClick={() => handleToggleSubscription(jobType.id)}
                disabled={isLoading}
                aria-pressed={subscribed}
                title={jobType.description}
              >
                {subscribed && (
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="size-3.5"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    aria-hidden="true"
                  >
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                )}
                {jobType.name}
              </Button>
            );
          })}
        </div>
      </div>

      {/* Real-Time Job Feed */}
      <div className="space-y-3">
        <h3 className="text-sm font-semibold text-foreground">
          Available Jobs
        </h3>

        {streamedJobs.length === 0 && (
          <div className="rounded-lg border bg-card p-6 text-center">
            <p className="text-sm text-muted-foreground">
              {connectionStatus === "connected"
                ? "No jobs available yet. New jobs will appear here in real time."
                : "Connect to start receiving job notifications."}
            </p>
          </div>
        )}

        <div className="space-y-3">
          {streamedJobs.map((job) => (
            <JobCard
              key={job.id}
              job={job}
              proposedAmount={proposedAmounts[job.id] ?? ""}
              onAmountChange={(value) => handleAmountChange(job.id, value)}
              onAccept={() => handleAcceptJob(job.id)}
              isAccepting={acceptingJobId === job.id}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

// --- Sub-components ---

function ConnectionStatusIndicator({
  status,
  onReconnect,
}: {
  status: "disconnected" | "connecting" | "connected" | "error";
  onReconnect: () => void;
}) {
  return (
    <div className="flex items-center justify-between rounded-lg border bg-card px-4 py-2">
      <div className="flex items-center gap-2">
        <span
          className={cn(
            "size-2.5 rounded-full",
            status === "connected" && "bg-green-500",
            status === "connecting" && "bg-yellow-500 animate-pulse",
            status === "disconnected" && "bg-gray-400",
            status === "error" && "bg-red-500"
          )}
          aria-hidden="true"
        />
        <span className="text-sm text-muted-foreground">
          {status === "connected" && "Connected"}
          {status === "connecting" && "Reconnecting..."}
          {status === "disconnected" && "Disconnected"}
          {status === "error" && "Connection lost"}
        </span>
      </div>

      {status === "error" && (
        <Button variant="outline" size="sm" onClick={onReconnect}>
          Reconnect
        </Button>
      )}
    </div>
  );
}

function JobCard({
  job,
  proposedAmount,
  onAmountChange,
  onAccept,
  isAccepting,
}: {
  job: StreamedJob;
  proposedAmount: string;
  onAmountChange: (value: string) => void;
  onAccept: () => void;
  isAccepting: boolean;
}) {
  const formattedBudget = new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency: "NGN",
    minimumFractionDigits: 0,
  }).format(job.budget);

  const isAmountValid =
    proposedAmount !== "" &&
    !isNaN(parseFloat(proposedAmount)) &&
    parseFloat(proposedAmount) > 0;

  return (
    <div className="rounded-lg border bg-card p-4 space-y-3">
      <div className="flex items-start justify-between gap-3">
        <div className="space-y-1 min-w-0">
          <h4 className="text-sm font-semibold text-foreground truncate">
            {job.title}
          </h4>
          <p className="text-sm text-muted-foreground line-clamp-2">
            {job.description}
          </p>
        </div>
        <span className="shrink-0 inline-flex items-center rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-medium text-primary">
          {job.job_type}
        </span>
      </div>

      <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
        <span className="flex items-center gap-1">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="size-3.5"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z" />
            <circle cx="12" cy="10" r="3" />
          </svg>
          {job.location}
        </span>
        <span className="flex items-center gap-1">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="size-3.5"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <line x1="12" y1="1" x2="12" y2="23" />
            <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
          </svg>
          Budget: {formattedBudget}
        </span>
        <span className="flex items-center gap-1">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="size-3.5"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" />
            <circle cx="12" cy="7" r="4" />
          </svg>
          {job.customer_name}
        </span>
      </div>

      {/* Accept section */}
      <div className="flex items-end gap-2 pt-1">
        <div className="flex-1">
          <label
            htmlFor={`amount-${job.id}`}
            className="text-xs font-medium text-muted-foreground mb-1 block"
          >
            Proposed Amount (₦)
          </label>
          <Input
            id={`amount-${job.id}`}
            type="number"
            min="1"
            step="any"
            placeholder="Enter amount"
            value={proposedAmount}
            onChange={(e) => onAmountChange(e.target.value)}
            disabled={isAccepting}
            className="h-9 text-sm"
          />
        </div>
        <Button
          onClick={onAccept}
          disabled={isAccepting || !isAmountValid}
          size="sm"
          className="shrink-0"
        >
          {isAccepting ? (
            <>
              <Spinner />
              Accepting...
            </>
          ) : (
            "Accept"
          )}
        </Button>
      </div>
    </div>
  );
}

function Spinner() {
  return (
    <svg
      className="size-4 animate-spin"
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
      aria-hidden="true"
    >
      <circle
        className="opacity-25"
        cx="12"
        cy="12"
        r="10"
        stroke="currentColor"
        strokeWidth="4"
      />
      <path
        className="opacity-75"
        fill="currentColor"
        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
      />
    </svg>
  );
}
