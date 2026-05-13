"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import { apiService } from "@/api/api-service";
import {
  deriveCompletionStatus,
  isRatingEnabled,
  type CompletionStatus,
} from "@/lib/utils/job-status";
import { cn } from "@/lib/utils";

interface JobCompletionPanelProps {
  jobId: string;
  role: "customer" | "worker";
  customerCompleted: boolean;
  workerCompleted: boolean;
  onCompletionChange?: () => void;
}

export function JobCompletionPanel({
  jobId,
  role,
  customerCompleted,
  workerCompleted,
  onCompletionChange,
}: JobCompletionPanelProps) {
  const [isLoading, setIsLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const status: CompletionStatus = deriveCompletionStatus(
    customerCompleted,
    workerCompleted
  );

  const hasCurrentUserCompleted =
    role === "customer" ? customerCompleted : workerCompleted;

  const ratingEnabled = isRatingEnabled(status);

  const handleMarkComplete = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const endpoint =
        role === "customer"
          ? `/customer/complete-job/${jobId}`
          : `/worker/complete-job/${jobId}`;

      await apiService.post(endpoint);
      onCompletionChange?.();
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Failed to mark job as complete";
      setError(message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="rounded-lg border bg-card p-4 space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-foreground">
          Job Completion
        </h3>
        <StatusBadge status={status} />
      </div>

      {/* Completion indicators */}
      <div className="space-y-2">
        <CompletionIndicator
          label="Customer"
          completed={customerCompleted}
        />
        <CompletionIndicator
          label="Worker"
          completed={workerCompleted}
        />
      </div>

      {/* Waiting indicator */}
      {status === "waiting" && !hasCurrentUserCompleted && (
        <p className="text-sm text-muted-foreground">
          The other party has confirmed completion. Please review and mark
          complete when satisfied.
        </p>
      )}

      {status === "waiting" && hasCurrentUserCompleted && (
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
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
          <span>Waiting for other party to confirm completion</span>
        </div>
      )}

      {/* Mark Complete button */}
      {!hasCurrentUserCompleted && status !== "completed" && (
        <Button
          onClick={handleMarkComplete}
          disabled={isLoading}
          className="w-full"
        >
          {isLoading ? (
            <>
              <svg
                className="size-4 animate-spin mr-2"
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
              Marking Complete...
            </>
          ) : (
            "Mark Complete"
          )}
        </Button>
      )}

      {/* Completed state with rating prompt */}
      {ratingEnabled && (
        <div className="rounded-md border border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-950 p-3">
          <p className="text-sm text-green-700 dark:text-green-300">
            Both parties have confirmed completion. You can now rate your
            experience.
          </p>
        </div>
      )}

      {/* Error display */}
      {error && (
        <div
          className="rounded-md border border-destructive/50 bg-destructive/10 p-3"
          role="alert"
        >
          <div className="flex items-start gap-2">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="size-4 mt-0.5 text-destructive shrink-0"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="8" x2="12" y2="12" />
              <line x1="12" y1="16" x2="12.01" y2="16" />
            </svg>
            <p className="text-sm text-destructive">{error}</p>
          </div>
        </div>
      )}
    </div>
  );
}

function StatusBadge({ status }: { status: CompletionStatus }) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium",
        status === "completed" &&
          "bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300",
        status === "waiting" &&
          "bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300",
        status === "in_progress" &&
          "bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300"
      )}
    >
      {status === "completed" && "Completed"}
      {status === "waiting" && "Waiting"}
      {status === "in_progress" && "In Progress"}
    </span>
  );
}

function CompletionIndicator({
  label,
  completed,
}: {
  label: string;
  completed: boolean;
}) {
  return (
    <div className="flex items-center gap-2">
      {completed ? (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="size-4 text-green-600 dark:text-green-400"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
          <polyline points="22 4 12 14.01 9 11.01" />
        </svg>
      ) : (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="size-4 text-muted-foreground/40"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <circle cx="12" cy="12" r="10" />
        </svg>
      )}
      <span
        className={cn(
          "text-sm",
          completed ? "text-foreground" : "text-muted-foreground"
        )}
      >
        {label} {completed ? "confirmed" : "pending"}
      </span>
    </div>
  );
}
