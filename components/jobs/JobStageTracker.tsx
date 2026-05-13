"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { JobStage } from "@/api/types/job";

export interface JobStageTrackerProps {
  stages: JobStage[];
  /** Current user role viewing the tracker */
  role: "worker" | "customer";
  /** Whether actions are currently loading */
  isLoading?: boolean;
  /** Called when a worker marks a stage as complete */
  onMarkComplete?: (stageId: string) => void;
  /** Called when a customer wants to confirm stage completion */
  onConfirm?: (stageId: string) => void;
  /** Called when a customer wants to dispute stage completion */
  onDispute?: (stageId: string) => void;
}

const STAGE_STATUS_CONFIG = {
  pending: {
    label: "Pending",
    dotColor: "bg-gray-300",
    lineColor: "bg-gray-200",
    textColor: "text-gray-500",
    bgColor: "bg-gray-50",
  },
  in_progress: {
    label: "In Progress",
    dotColor: "bg-blue-500",
    lineColor: "bg-blue-200",
    textColor: "text-blue-700",
    bgColor: "bg-blue-50",
  },
  completed: {
    label: "Completed",
    dotColor: "bg-green-500",
    lineColor: "bg-green-200",
    textColor: "text-green-700",
    bgColor: "bg-green-50",
  },
  paid: {
    label: "Paid",
    dotColor: "bg-emerald-600",
    lineColor: "bg-emerald-300",
    textColor: "text-emerald-700",
    bgColor: "bg-emerald-50",
  },
} as const;

export function JobStageTracker({
  stages,
  role,
  isLoading = false,
  onMarkComplete,
  onConfirm,
  onDispute,
}: JobStageTrackerProps) {
  const sortedStages = [...stages].sort((a, b) => a.order - b.order);
  const isSingleStage = sortedStages.length === 1;

  return (
    <div className="space-y-1" role="list" aria-label="Job stages">
      {sortedStages.map((stage, index) => {
        const config = STAGE_STATUS_CONFIG[stage.status];
        const isLast = index === sortedStages.length - 1;

        return (
          <div key={stage.id} className="relative" role="listitem">
            <div className="flex gap-3">
              {/* Timeline indicator */}
              <div className="flex flex-col items-center">
                <div
                  className={cn(
                    "size-3 rounded-full mt-1.5 shrink-0",
                    config.dotColor
                  )}
                  aria-hidden="true"
                />
                {!isLast && (
                  <div
                    className={cn("w-0.5 flex-1 min-h-8", config.lineColor)}
                    aria-hidden="true"
                  />
                )}
              </div>

              {/* Stage content */}
              <div
                className={cn(
                  "flex-1 rounded-lg border p-3 mb-2",
                  config.bgColor
                )}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <h4 className="text-sm font-medium truncate">
                        {isSingleStage ? "Full Job" : stage.title}
                      </h4>
                      <span
                        className={cn(
                          "inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium",
                          config.textColor,
                          config.bgColor
                        )}
                      >
                        {config.label}
                      </span>
                    </div>
                    {stage.description && !isSingleStage && (
                      <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">
                        {stage.description}
                      </p>
                    )}
                    <p className="text-xs text-muted-foreground mt-1">
                      Amount: ₦{stage.amount.toLocaleString()}
                    </p>
                  </div>

                  {/* Action buttons */}
                  <div className="flex items-center gap-1.5 shrink-0">
                    {role === "worker" && stage.status === "in_progress" && (
                      <Button
                        size="sm"
                        variant="default"
                        onClick={() => onMarkComplete?.(stage.id)}
                        disabled={isLoading}
                        aria-label={`Mark ${isSingleStage ? "job" : stage.title} as complete`}
                      >
                        Mark Complete
                      </Button>
                    )}

                    {role === "customer" && stage.status === "completed" && (
                      <>
                        <Button
                          size="sm"
                          variant="default"
                          onClick={() => onConfirm?.(stage.id)}
                          disabled={isLoading}
                          aria-label={`Confirm completion of ${isSingleStage ? "job" : stage.title}`}
                        >
                          Confirm
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => onDispute?.(stage.id)}
                          disabled={isLoading}
                          aria-label={`Dispute completion of ${isSingleStage ? "job" : stage.title}`}
                        >
                          Dispute
                        </Button>
                      </>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
