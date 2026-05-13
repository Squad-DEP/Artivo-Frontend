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
import { useJobStore } from "@/store/jobStore";
import { cn } from "@/lib/utils";

interface ReviewDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  jobId: string;
  jobTitle?: string;
  revieweeId: string;
  revieweeName?: string;
  onSuccess?: () => void;
}

export function ReviewDialog({
  open,
  onOpenChange,
  jobId,
  jobTitle,
  revieweeId,
  revieweeName,
  onSuccess,
}: ReviewDialogProps) {
  const [rating, setRating] = React.useState<number>(0);
  const [hoveredRating, setHoveredRating] = React.useState<number>(0);
  const [comment, setComment] = React.useState("");
  const [validationError, setValidationError] = React.useState<string | null>(
    null
  );

  const { submitReview, isLoading, error } = useJobStore();

  // Reset state when dialog opens
  React.useEffect(() => {
    if (open) {
      setRating(0);
      setHoveredRating(0);
      setComment("");
      setValidationError(null);
    }
  }, [open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validate rating
    if (rating < 1 || rating > 5) {
      setValidationError("Please select a rating between 1 and 5 stars");
      return;
    }

    // Validate comment
    if (!comment.trim()) {
      setValidationError("Please provide a comment for your review");
      return;
    }

    setValidationError(null);

    const success = await submitReview({
      job_id: jobId,
      reviewee_id: revieweeId,
      rating,
      comment: comment.trim(),
    });

    if (success) {
      onSuccess?.();
      onOpenChange(false);
    }
  };

  const displayRating = hoveredRating || rating;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Leave a Review</DialogTitle>
          <DialogDescription>
            {jobTitle
              ? `Share your experience for "${jobTitle}"`
              : "Share your experience working on this job"}
            {revieweeName && (
              <span className="block mt-1">
                Reviewing: <span className="font-medium">{revieweeName}</span>
              </span>
            )}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
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
                    "hover:scale-110 transition-transform"
                  )}
                  onClick={() => setRating(star)}
                  onMouseEnter={() => setHoveredRating(star)}
                  onMouseLeave={() => setHoveredRating(0)}
                  disabled={isLoading}
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
              htmlFor="review-comment"
              className="text-sm font-medium text-foreground"
            >
              Comment
            </label>
            <textarea
              id="review-comment"
              value={comment}
              onChange={(e) => {
                setComment(e.target.value);
                if (validationError) setValidationError(null);
              }}
              placeholder="Describe your experience..."
              rows={4}
              disabled={isLoading}
              className={cn(
                "flex w-full rounded-md border bg-transparent px-3 py-2 text-sm shadow-xs transition-colors resize-none",
                "placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring",
                "disabled:cursor-not-allowed disabled:opacity-50",
                validationError
                  ? "border-destructive focus-visible:ring-destructive"
                  : "border-input"
              )}
              aria-invalid={!!validationError}
              aria-describedby={
                validationError ? "review-error" : undefined
              }
            />
          </div>

          {/* Validation Error */}
          {validationError && (
            <p
              id="review-error"
              className="text-xs text-destructive"
              role="alert"
            >
              {validationError}
            </p>
          )}

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
              onClick={() => onOpenChange(false)}
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading || rating === 0}>
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
                "Submit Review"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
