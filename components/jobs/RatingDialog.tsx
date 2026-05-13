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
import { apiService } from "@/api/api-service";
import { isRatingEnabled } from "@/lib/utils/job-status";
import { RatePayload, RateResponse } from "@/api/types/marketplace-api";
import { cn } from "@/lib/utils";

interface RatingDialogProps {
  isOpen: boolean;
  onClose: () => void;
  jobId: string;
  jobStatus: string;
  role: "customer" | "worker";
  onRatingSubmitted?: () => void;
}

export function RatingDialog({
  isOpen,
  onClose,
  jobId,
  jobStatus,
  role,
  onRatingSubmitted,
}: RatingDialogProps) {
  const [rating, setRating] = React.useState<number>(0);
  const [hoveredRating, setHoveredRating] = React.useState<number>(0);
  const [comment, setComment] = React.useState("");
  const [isLoading, setIsLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [isSuccess, setIsSuccess] = React.useState(false);

  const enabled = isRatingEnabled(jobStatus);

  // Reset state when dialog opens (but preserve input on failure for retry)
  React.useEffect(() => {
    if (isOpen) {
      setError(null);
      setIsSuccess(false);
    }
  }, [isOpen]);

  const handleClose = () => {
    if (!isLoading) {
      // Reset form state on close
      setRating(0);
      setHoveredRating(0);
      setComment("");
      setError(null);
      setIsSuccess(false);
      onClose();
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!enabled || rating === 0) return;

    setIsLoading(true);
    setError(null);

    const payload: RatePayload = {
      job_id: jobId,
      rating,
      comment: comment.trim(),
    };

    const endpoint =
      role === "customer" ? "/customer/rate" : "/worker/rate-customer";

    try {
      await apiService.post<RateResponse>(endpoint, { body: payload });
      setIsSuccess(true);
      onRatingSubmitted?.();
    } catch (err) {
      // Preserve input on failure for retry
      const message =
        err instanceof Error ? err.message : "Failed to submit rating";
      setError(message);
    } finally {
      setIsLoading(false);
    }
  };

  const displayRating = hoveredRating || rating;

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && handleClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>
            {isSuccess ? "Rating Submitted" : "Rate this Job"}
          </DialogTitle>
          <DialogDescription>
            {isSuccess
              ? "Thank you for your feedback!"
              : "Share your experience by selecting a rating and leaving an optional comment."}
          </DialogDescription>
        </DialogHeader>

        {isSuccess ? (
          <div className="flex flex-col items-center gap-3 py-4">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="size-12 text-green-500"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
              <polyline points="22 4 12 14.01 9 11.01" />
            </svg>
            <p className="text-sm text-muted-foreground">
              Your rating has been recorded successfully.
            </p>
            <Button onClick={handleClose} className="mt-2">
              Close
            </Button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Disabled notice */}
            {!enabled && (
              <div
                className="rounded-md border border-amber-200 bg-amber-50 p-3 dark:border-amber-800 dark:bg-amber-950"
                role="alert"
              >
                <p className="text-sm text-amber-800 dark:text-amber-200">
                  Rating is only available for completed jobs.
                </p>
              </div>
            )}

            {/* Star Rating */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">
                Rating
              </label>
              <div
                className="flex items-center gap-1"
                role="radiogroup"
                aria-label="Rating"
              >
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    role="radio"
                    aria-checked={rating === star}
                    aria-label={`${star} star${star !== 1 ? "s" : ""}`}
                    className={cn(
                      "p-0.5 rounded transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                      "hover:scale-110 transition-transform",
                      !enabled && "opacity-50 cursor-not-allowed"
                    )}
                    onClick={() => enabled && setRating(star)}
                    onMouseEnter={() => enabled && setHoveredRating(star)}
                    onMouseLeave={() => setHoveredRating(0)}
                    disabled={!enabled || isLoading}
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 24 24"
                      className={cn(
                        "size-7 transition-colors",
                        star <= displayRating
                          ? "fill-yellow-400 text-yellow-400"
                          : "fill-none text-muted-foreground/40"
                      )}
                      stroke="currentColor"
                      strokeWidth="1.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                    </svg>
                  </button>
                ))}
                {displayRating > 0 && (
                  <span className="ml-2 text-sm text-muted-foreground">
                    {displayRating}/5
                  </span>
                )}
              </div>
            </div>

            {/* Comment */}
            <div className="space-y-2">
              <label
                htmlFor="rating-comment"
                className="text-sm font-medium text-foreground"
              >
                Comment{" "}
                <span className="text-muted-foreground font-normal">
                  (optional)
                </span>
              </label>
              <textarea
                id="rating-comment"
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder="Share your experience..."
                rows={3}
                disabled={!enabled || isLoading}
                className={cn(
                  "flex w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-xs transition-colors resize-none",
                  "placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring",
                  "disabled:cursor-not-allowed disabled:opacity-50"
                )}
              />
            </div>

            {/* API Error */}
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
                  >
                    <circle cx="12" cy="12" r="10" />
                    <line x1="12" y1="8" x2="12" y2="12" />
                    <line x1="12" y1="16" x2="12.01" y2="16" />
                  </svg>
                  <p className="text-sm text-destructive">{error}</p>
                </div>
              </div>
            )}

            {/* Footer Actions */}
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={handleClose}
                disabled={isLoading}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={!enabled || isLoading || rating === 0}
              >
                {isLoading ? (
                  <>
                    <svg
                      className="size-4 animate-spin"
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
                    Submitting...
                  </>
                ) : (
                  "Submit Rating"
                )}
              </Button>
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
