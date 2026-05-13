"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import { useJobStore } from "@/store/jobStore";
import {
  validateProposedAmount,
  validateCoverLetter,
} from "@/lib/validators";
import { cn } from "@/lib/utils";

interface JobApplicationFormProps {
  jobId: string;
  budgetMin: number;
  budgetMax: number;
  onSuccess?: () => void;
}

/**
 * JobApplicationForm — worker applies to a job with proposed amount
 * (within budget range), cover letter (up to 2000 chars), and estimated duration.
 *
 * Validates: Requirements 9.2
 */
export function JobApplicationForm({
  jobId,
  budgetMin,
  budgetMax,
  onSuccess,
}: JobApplicationFormProps) {
  const [proposedAmount, setProposedAmount] = React.useState<string>("");
  const [coverLetter, setCoverLetter] = React.useState<string>("");
  const [estimatedDuration, setEstimatedDuration] = React.useState<string>("");
  const [errors, setErrors] = React.useState<Record<string, string>>({});

  const { applyToJob, isLoading, error: storeError } = useJobStore();

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};

    // Validate proposed amount
    const numericAmount = parseFloat(proposedAmount);
    const amountResult = validateProposedAmount(
      isNaN(numericAmount) ? undefined : numericAmount,
      budgetMin,
      budgetMax
    );
    if (!amountResult.valid) {
      newErrors.proposed_amount = amountResult.error ?? "Invalid amount";
    }

    // Validate cover letter
    const coverLetterResult = validateCoverLetter(coverLetter);
    if (!coverLetterResult.valid) {
      newErrors.cover_letter = coverLetterResult.error ?? "Invalid cover letter";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validate()) return;

    const success = await applyToJob(jobId, {
      proposed_amount: parseFloat(proposedAmount),
      cover_letter: coverLetter || undefined,
      estimated_duration: estimatedDuration || undefined,
    });

    if (success) {
      // Reset form
      setProposedAmount("");
      setCoverLetter("");
      setEstimatedDuration("");
      setErrors({});
      onSuccess?.();
    }
  };

  const formatCurrency = (value: number): string => {
    return new Intl.NumberFormat("en-NG", {
      style: "currency",
      currency: "NGN",
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    }).format(value);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="rounded-lg border border-border bg-card p-4 space-y-4">
        <h3 className="text-base font-semibold text-foreground">
          Apply for this Job
        </h3>

        {/* Budget Range Info */}
        <div className="rounded-md bg-muted/50 p-3">
          <p className="text-xs text-muted-foreground">Budget Range</p>
          <p className="text-sm font-medium text-foreground">
            {formatCurrency(budgetMin)} – {formatCurrency(budgetMax)}
          </p>
        </div>

        {/* Proposed Amount */}
        <div className="space-y-1.5">
          <label
            htmlFor="proposed-amount"
            className="text-sm font-medium text-foreground"
          >
            Proposed Amount (NGN) <span className="text-destructive">*</span>
          </label>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
              ₦
            </span>
            <input
              id="proposed-amount"
              type="number"
              step="0.01"
              value={proposedAmount}
              onChange={(e) => {
                setProposedAmount(e.target.value);
                if (errors.proposed_amount) {
                  setErrors((prev) => {
                    const next = { ...prev };
                    delete next.proposed_amount;
                    return next;
                  });
                }
              }}
              placeholder={`${budgetMin} – ${budgetMax}`}
              disabled={isLoading}
              className={cn(
                "flex h-9 w-full rounded-md border bg-transparent pl-7 pr-3 py-1 text-sm shadow-xs transition-colors",
                "placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring",
                "disabled:cursor-not-allowed disabled:opacity-50",
                errors.proposed_amount
                  ? "border-destructive focus-visible:ring-destructive"
                  : "border-input"
              )}
              aria-invalid={!!errors.proposed_amount}
              aria-describedby={
                errors.proposed_amount ? "proposed-amount-error" : undefined
              }
            />
          </div>
          {errors.proposed_amount && (
            <p
              id="proposed-amount-error"
              className="text-xs text-destructive"
              role="alert"
            >
              {errors.proposed_amount}
            </p>
          )}
        </div>

        {/* Cover Letter */}
        <div className="space-y-1.5">
          <label
            htmlFor="cover-letter"
            className="text-sm font-medium text-foreground"
          >
            Cover Letter <span className="text-destructive">*</span>
          </label>
          <textarea
            id="cover-letter"
            value={coverLetter}
            onChange={(e) => {
              setCoverLetter(e.target.value);
              if (errors.cover_letter) {
                setErrors((prev) => {
                  const next = { ...prev };
                  delete next.cover_letter;
                  return next;
                });
              }
            }}
            placeholder="Describe why you're a great fit for this job..."
            rows={4}
            maxLength={2000}
            disabled={isLoading}
            className={cn(
              "flex w-full rounded-md border bg-transparent px-3 py-2 text-sm shadow-xs transition-colors resize-y",
              "placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring",
              "disabled:cursor-not-allowed disabled:opacity-50",
              errors.cover_letter
                ? "border-destructive focus-visible:ring-destructive"
                : "border-input"
            )}
            aria-invalid={!!errors.cover_letter}
            aria-describedby={
              errors.cover_letter ? "cover-letter-error" : undefined
            }
          />
          <div className="flex items-center justify-between">
            {errors.cover_letter ? (
              <p
                id="cover-letter-error"
                className="text-xs text-destructive"
                role="alert"
              >
                {errors.cover_letter}
              </p>
            ) : (
              <span />
            )}
            <p className="text-xs text-muted-foreground">
              {coverLetter.length}/2000
            </p>
          </div>
        </div>

        {/* Estimated Duration */}
        <div className="space-y-1.5">
          <label
            htmlFor="estimated-duration"
            className="text-sm font-medium text-foreground"
          >
            Estimated Duration
          </label>
          <input
            id="estimated-duration"
            type="text"
            value={estimatedDuration}
            onChange={(e) => setEstimatedDuration(e.target.value)}
            placeholder="e.g., 2 weeks, 1 month"
            disabled={isLoading}
            className={cn(
              "flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-xs transition-colors",
              "placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring",
              "disabled:cursor-not-allowed disabled:opacity-50"
            )}
          />
          <p className="text-xs text-muted-foreground">
            Optional — how long you expect the job to take
          </p>
        </div>

        {/* Store Error */}
        {storeError && (
          <div
            className="rounded-md border border-destructive/50 bg-destructive/10 p-3"
            role="alert"
          >
            <p className="text-sm text-destructive">{storeError}</p>
          </div>
        )}

        {/* Submit Button */}
        <Button type="submit" className="w-full" disabled={isLoading}>
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
            "Submit Application"
          )}
        </Button>
      </div>
    </form>
  );
}
