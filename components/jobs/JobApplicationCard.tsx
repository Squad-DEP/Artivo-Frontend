"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import { useJobStore } from "@/store/jobStore";
import type { JobApplication } from "@/api/types/job";
import { cn } from "@/lib/utils";

interface JobApplicationCardProps {
  application: JobApplication;
  jobId: string;
  /** Whether the current user is the customer who owns the job */
  isCustomer?: boolean;
  onAccepted?: () => void;
  onRejected?: () => void;
}

const statusStyles: Record<
  JobApplication["status"],
  { label: string; className: string }
> = {
  pending: {
    label: "Pending",
    className: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400",
  },
  accepted: {
    label: "Accepted",
    className: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400",
  },
  rejected: {
    label: "Rejected",
    className: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400",
  },
  withdrawn: {
    label: "Withdrawn",
    className: "bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400",
  },
};

/**
 * JobApplicationCard — displays a job application with accept/reject actions
 * for customers.
 *
 * Validates: Requirements 9.3
 */
export function JobApplicationCard({
  application,
  jobId,
  isCustomer = false,
  onAccepted,
  onRejected,
}: JobApplicationCardProps) {
  const { acceptApplication, isLoading } = useJobStore();
  const [actionInProgress, setActionInProgress] = React.useState<
    "accept" | "reject" | null
  >(null);

  const formatCurrency = (value: number): string =>
    `₦${Number(value).toLocaleString("en-NG")}`;

  const formatDate = (dateStr: string): string => {
    return new Date(dateStr).toLocaleDateString("en-NG", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  };

  const handleAccept = async () => {
    setActionInProgress("accept");
    const success = await acceptApplication(jobId, application.id);
    setActionInProgress(null);
    if (success) {
      onAccepted?.();
    }
  };

  const handleReject = async () => {
    // Rejection is handled by accepting another application,
    // which auto-rejects others per Requirement 9.3.
    // For explicit reject, we call the same store action pattern.
    setActionInProgress("reject");
    // Note: The API doesn't have a dedicated reject endpoint per the design.
    // Rejecting is implicit when another application is accepted.
    // This button is a UX convenience that could call a reject endpoint if available.
    setActionInProgress(null);
    onRejected?.();
  };

  const status = statusStyles[application.status];
  const isPending = application.status === "pending";

  return (
    <div className="rounded-lg border border-border bg-card p-4 space-y-3">
      {/* Header: Worker info + Status */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          {/* Worker Avatar */}
          {application.worker?.profile_image_url ? (
            <img
              src={application.worker.profile_image_url}
              alt={application.worker.display_name}
              className="size-10 rounded-full object-cover shrink-0"
            />
          ) : (
            <div className="size-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
              <span className="text-sm font-medium text-primary">
                {application.worker?.display_name?.charAt(0)?.toUpperCase() ?? "W"}
              </span>
            </div>
          )}

          <div className="min-w-0">
            <p className="text-sm font-medium text-foreground truncate">
              {application.worker?.display_name ?? "Worker"}
            </p>
            {application.worker?.primary_category && (
              <p className="text-xs text-muted-foreground truncate">
                {application.worker.primary_category}
              </p>
            )}
          </div>
        </div>

        {/* Status Badge */}
        <span
          className={cn(
            "inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium shrink-0",
            status.className
          )}
        >
          {status.label}
        </span>
      </div>

      {/* Application Details */}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <p className="text-xs text-muted-foreground">Proposed Amount</p>
          <p className="text-sm font-medium text-foreground">
            {formatCurrency(application.proposed_amount)}
          </p>
        </div>
        {application.estimated_duration && (
          <div>
            <p className="text-xs text-muted-foreground">Est. Duration</p>
            <p className="text-sm font-medium text-foreground">
              {application.estimated_duration}
            </p>
          </div>
        )}
      </div>

      {/* Cover Letter */}
      {application.cover_letter && (
        <div className="space-y-1">
          <p className="text-xs text-muted-foreground">Cover Letter</p>
          <p className="text-sm text-foreground leading-relaxed line-clamp-4">
            {application.cover_letter}
          </p>
        </div>
      )}

      {/* Worker Stats */}
      {application.worker && (
        <div className="flex items-center gap-3 text-xs text-muted-foreground">
          {application.worker.rating > 0 && (
            <span className="flex items-center gap-1">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="size-3.5 text-yellow-500"
                viewBox="0 0 24 24"
                fill="currentColor"
              >
                <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
              </svg>
              {application.worker.rating.toFixed(1)}
            </span>
          )}
          {application.worker.completed_jobs > 0 && (
            <span>{application.worker.completed_jobs} jobs completed</span>
          )}
          {application.worker.trust_score > 0 && (
            <span>Trust: {application.worker.trust_score}</span>
          )}
        </div>
      )}

      {/* Applied Date */}
      <p className="text-xs text-muted-foreground">
        Applied {formatDate(application.created_at)}
      </p>

      {/* Actions (visible to customer for pending applications) */}
      {isCustomer && isPending && (
        <div className="flex items-center gap-2 pt-1">
          <Button
            size="sm"
            onClick={handleAccept}
            disabled={isLoading || actionInProgress !== null}
          >
            {actionInProgress === "accept" ? (
              <>
                <svg
                  className="size-3.5 animate-spin"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
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
                Accepting...
              </>
            ) : (
              "Accept"
            )}
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={handleReject}
            disabled={isLoading || actionInProgress !== null}
          >
            {actionInProgress === "reject" ? "Rejecting..." : "Reject"}
          </Button>
        </div>
      )}
    </div>
  );
}
