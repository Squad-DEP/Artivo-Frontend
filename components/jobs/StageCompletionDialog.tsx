"use client";

import * as React from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export interface StageCompletionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  stageName: string;
  stageAmount: number;
  /** Whether the dialog is in loading state */
  isLoading?: boolean;
  /** Called when the customer confirms stage completion */
  onConfirm: () => void;
  /** Called when the customer disputes stage completion with a reason */
  onDispute: (reason: string) => void;
}

export function StageCompletionDialog({
  open,
  onOpenChange,
  stageName,
  stageAmount,
  isLoading = false,
  onConfirm,
  onDispute,
}: StageCompletionDialogProps) {
  const [mode, setMode] = React.useState<"choose" | "dispute">("choose");
  const [disputeReason, setDisputeReason] = React.useState("");
  const [validationError, setValidationError] = React.useState<string | null>(
    null
  );

  // Reset state when dialog opens
  React.useEffect(() => {
    if (open) {
      setMode("choose");
      setDisputeReason("");
      setValidationError(null);
    }
  }, [open]);

  const handleConfirm = () => {
    onConfirm();
  };

  const handleDisputeSubmit = () => {
    const trimmed = disputeReason.trim();
    if (!trimmed) {
      setValidationError("Please provide a reason for the dispute");
      return;
    }
    if (trimmed.length > 1000) {
      setValidationError("Dispute reason must be 1000 characters or less");
      return;
    }
    setValidationError(null);
    onDispute(trimmed);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>
            {mode === "choose" ? "Stage Completion" : "Dispute Stage"}
          </DialogTitle>
          <DialogDescription>
            {mode === "choose"
              ? `The worker has marked "${stageName}" as complete. Please review and confirm or dispute.`
              : `Provide a reason for disputing the completion of "${stageName}".`}
          </DialogDescription>
        </DialogHeader>

        {mode === "choose" && (
          <div className="space-y-4">
            {/* Stage summary */}
            <div className="rounded-md border bg-muted/50 p-3">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">{stageName}</span>
                <span className="text-sm text-muted-foreground">
                  ₦{stageAmount.toLocaleString()}
                </span>
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Confirming will initiate payment for this stage.
              </p>
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={isLoading}
              >
                Cancel
              </Button>
              <Button
                type="button"
                variant="destructive"
                onClick={() => setMode("dispute")}
                disabled={isLoading}
              >
                Dispute
              </Button>
              <Button
                type="button"
                onClick={handleConfirm}
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
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
                    Confirming...
                  </>
                ) : (
                  "Confirm Completion"
                )}
              </Button>
            </DialogFooter>
          </div>
        )}

        {mode === "dispute" && (
          <div className="space-y-4">
            <div className="space-y-2">
              <label
                htmlFor="dispute-reason"
                className="text-sm font-medium text-foreground"
              >
                Dispute Reason
              </label>
              <textarea
                id="dispute-reason"
                value={disputeReason}
                onChange={(e) => {
                  setDisputeReason(e.target.value);
                  if (validationError) setValidationError(null);
                }}
                placeholder="Explain why you are disputing this stage completion..."
                rows={4}
                disabled={isLoading}
                className={cn(
                  "flex w-full rounded-md border bg-transparent px-3 py-2 text-sm shadow-xs transition-colors",
                  "placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring",
                  "disabled:cursor-not-allowed disabled:opacity-50 resize-none",
                  validationError
                    ? "border-destructive focus-visible:ring-destructive"
                    : "border-input"
                )}
                aria-invalid={!!validationError}
                aria-describedby={
                  validationError ? "dispute-reason-error" : undefined
                }
              />
              {validationError && (
                <p
                  id="dispute-reason-error"
                  className="text-xs text-destructive"
                  role="alert"
                >
                  {validationError}
                </p>
              )}
              <p className="text-xs text-muted-foreground">
                {disputeReason.length}/1000 characters
              </p>
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setMode("choose")}
                disabled={isLoading}
              >
                Back
              </Button>
              <Button
                type="button"
                variant="destructive"
                onClick={handleDisputeSubmit}
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
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
                    Submitting...
                  </>
                ) : (
                  "Submit Dispute"
                )}
              </Button>
            </DialogFooter>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
