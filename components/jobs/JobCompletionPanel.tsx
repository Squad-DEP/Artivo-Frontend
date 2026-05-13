"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import { apiService } from "@/api/api-service";
import { cn } from "@/lib/utils";
import { CheckCircle2, Circle, Loader2 } from "lucide-react";

interface ConfirmResponse {
  success: boolean;
  released: boolean;
  worker_confirmed: boolean;
  customer_confirmed: boolean;
  msg: string;
}

interface JobCompletionPanelProps {
  jobId: string;
  role: "customer" | "worker";
  /** Initial state from job status — treated as a hint, panel manages its own state after any action */
  customerCompleted: boolean;
  workerCompleted: boolean;
  onCompletionChange?: (released: boolean) => void;
}

type PanelStatus = "in_progress" | "waiting" | "completed";

function derivePanelStatus(customer: boolean, worker: boolean): PanelStatus {
  if (customer && worker) return "completed";
  if (customer || worker) return "waiting";
  return "in_progress";
}

export function JobCompletionPanel({
  jobId,
  role,
  customerCompleted: initialCustomer,
  workerCompleted: initialWorker,
  onCompletionChange,
}: JobCompletionPanelProps) {
  const [customerConfirmed, setCustomerConfirmed] = React.useState(initialCustomer);
  const [workerConfirmed, setWorkerConfirmed] = React.useState(initialWorker);
  const [isLoading, setIsLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  // Sync if parent refreshes job data
  React.useEffect(() => {
    setCustomerConfirmed(initialCustomer);
    setWorkerConfirmed(initialWorker);
  }, [initialCustomer, initialWorker]);

  const status = derivePanelStatus(customerConfirmed, workerConfirmed);
  const hasCurrentUserConfirmed = role === "customer" ? customerConfirmed : workerConfirmed;

  const handleMarkComplete = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const endpoint =
        role === "customer"
          ? `/customer/jobs/${jobId}/complete`
          : `/worker/jobs/${jobId}/complete`;

      const response = await apiService.post<ConfirmResponse>(endpoint);

      setWorkerConfirmed(response.worker_confirmed);
      setCustomerConfirmed(response.customer_confirmed);

      onCompletionChange?.(response.released);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to mark job as complete");
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

      {/* Confirmation indicators */}
      <div className="space-y-2">
        <ConfirmIndicator label="Customer" confirmed={customerConfirmed} />
        <ConfirmIndicator label="Worker" confirmed={workerConfirmed} />
      </div>

      {/* Waiting on other party */}
      {status === "waiting" && hasCurrentUserConfirmed && (
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Loader2 className="size-4 animate-spin shrink-0" />
          <span>Waiting for the other party to confirm</span>
        </div>
      )}

      {status === "waiting" && !hasCurrentUserConfirmed && (
        <p className="text-sm text-muted-foreground">
          The other party has confirmed. Review the work and mark complete when satisfied.
        </p>
      )}

      {/* Mark complete button */}
      {!hasCurrentUserConfirmed && status !== "completed" && (
        <Button onClick={handleMarkComplete} disabled={isLoading} className="w-full">
          {isLoading ? (
            <>
              <Loader2 className="size-4 animate-spin mr-2" />
              Marking Complete...
            </>
          ) : (
            "Mark as Complete"
          )}
        </Button>
      )}

      {/* Both confirmed */}
      {status === "completed" && (
        <div className="rounded-md border border-emerald-200 bg-emerald-50 dark:border-emerald-800 dark:bg-emerald-950 p-3">
          <p className="text-sm text-emerald-700 dark:text-emerald-300">
            Both parties confirmed. Payment has been released to the worker.
          </p>
        </div>
      )}

      {error && (
        <div
          className="rounded-md border border-destructive/50 bg-destructive/10 p-3"
          role="alert"
        >
          <p className="text-sm text-destructive">{error}</p>
        </div>
      )}
    </div>
  );
}

function StatusBadge({ status }: { status: PanelStatus }) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium",
        status === "completed" &&
          "bg-emerald-100 text-emerald-700 dark:bg-emerald-900 dark:text-emerald-300",
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

function ConfirmIndicator({ label, confirmed }: { label: string; confirmed: boolean }) {
  return (
    <div className="flex items-center gap-2">
      {confirmed ? (
        <CheckCircle2 className="size-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
      ) : (
        <Circle className="size-4 text-muted-foreground/40 shrink-0" />
      )}
      <span className={cn("text-sm", confirmed ? "text-foreground" : "text-muted-foreground")}>
        {label} {confirmed ? "confirmed" : "pending"}
      </span>
    </div>
  );
}
