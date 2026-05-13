"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ErrorToast, useErrorToast } from "@/components/ui/ErrorToast";
import { useHireFlowStore } from "@/store/hireFlowStore";
import { useWorkerJobStore } from "@/store/workerJobStore";
import { useAuthStore } from "@/store/authStore";
import { cn } from "@/lib/utils";
import { CheckCircle2, ShieldCheck } from "lucide-react";

interface HireDialogProps {
  isOpen: boolean;
  onClose: () => void;
  workerName: string;
  workerId: string;
  workerUsername: string;
}

function Spinner({ className }: { className?: string }) {
  return (
    <svg
      className={cn("animate-spin", className)}
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
    >
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
    </svg>
  );
}

export function HireDialog({
  isOpen,
  onClose,
  workerName,
  workerId,
}: HireDialogProps) {
  const router = useRouter();

  const [title, setTitle] = React.useState("");
  const [description, setDescription] = React.useState("");
  const [location, setLocation] = React.useState("");
  const [budget, setBudget] = React.useState("");
  const [jobTypeId, setJobTypeId] = React.useState("");

  const {
    step,
    jobRequest,
    job,
    paymentResult,
    isLoading,
    error,
    validationErrors,
    createJobRequest,
    hireWorker,
    openSquadModal,
    reset,
  } = useHireFlowStore();

  const { availableJobTypes, fetchJobTypes } = useWorkerJobStore();
  const user = useAuthStore((state) => state.user);

  const { toast, showToast, hideToast } = useErrorToast();

  // Fetch job types when dialog opens
  React.useEffect(() => {
    if (isOpen) fetchJobTypes();
  }, [isOpen, fetchJobTypes]);

  // Reset form + store when dialog closes
  React.useEffect(() => {
    if (!isOpen) {
      setTitle("");
      setDescription("");
      setLocation("");
      setBudget("");
      setJobTypeId("");
      reset();
    }
  }, [isOpen, reset]);

  // Show success toast when payment is confirmed
  React.useEffect(() => {
    if (step === "complete" && paymentResult) {
      showToast(`Payment of ₦${paymentResult.amount.toLocaleString()} confirmed`, {
        variant: "success",
        detail: `Ref: ${paymentResult.transactionReference}`,
      });
    }
  }, [step, paymentResult, showToast]);

  const numericBudget = parseFloat(budget);
  const isFormValid =
    jobTypeId.trim() !== "" &&
    title.trim() !== "" &&
    description.trim() !== "" &&
    location.trim() !== "" &&
    budget.trim() !== "" &&
    !isNaN(numericBudget) &&
    numericBudget > 0;

  const handleJobRequestSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await createJobRequest({
      job_type_id: jobTypeId,
      title: title.trim(),
      description: description.trim(),
      location: location.trim(),
      budget: numericBudget,
    });
  };

  const handleHireWorker = async () => {
    if (!jobRequest) return;
    await hireWorker(jobRequest.id, workerId, numericBudget);
  };

  const handleOpenPayment = () => {
    if (!job) return;
    openSquadModal(user?.email ?? "", numericBudget, job.id);
  };

  const handleViewJob = () => {
    if (job) router.push(`/dashboard/jobs/${job.id}`);
    onClose();
  };

  return (
    <>
      <Dialog open={isOpen} onOpenChange={(open) => { if (!open) onClose(); }}>
        <DialogContent className="sm:max-w-md">

          {/* ── Step 1: Job details form ─────────────────────────────── */}
          {(step === "idle" || step === "requesting") && (
            <>
              <DialogHeader>
                <DialogTitle>Hire {workerName}</DialogTitle>
                <DialogDescription>
                  Describe the job you need done. All fields are required.
                </DialogDescription>
              </DialogHeader>

              <form onSubmit={handleJobRequestSubmit} className="space-y-4">
                {/* Job Type */}
                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground">Job Type</label>
                  <Select value={jobTypeId} onValueChange={setJobTypeId}>
                    <SelectTrigger className={cn("w-full", validationErrors.job_type_id && "border-destructive")}>
                      <SelectValue placeholder="Select a job type" />
                    </SelectTrigger>
                    <SelectContent>
                      {availableJobTypes.map((jt) => (
                        <SelectItem key={jt.id} value={jt.id}>{jt.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {validationErrors.job_type_id && (
                    <p className="text-xs text-destructive" role="alert">{validationErrors.job_type_id}</p>
                  )}
                </div>

                {/* Title */}
                <div className="space-y-2">
                  <label htmlFor="hire-title" className="text-sm font-medium text-foreground">Title</label>
                  <input
                    id="hire-title"
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="e.g. Fix kitchen plumbing"
                    disabled={isLoading}
                    className={cn(
                      "flex h-9 w-full rounded-md border bg-transparent px-3 py-1 text-sm shadow-xs transition-colors",
                      "placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring",
                      "disabled:cursor-not-allowed disabled:opacity-50",
                      validationErrors.title ? "border-destructive focus-visible:ring-destructive" : "border-input"
                    )}
                  />
                  {validationErrors.title && (
                    <p className="text-xs text-destructive" role="alert">{validationErrors.title}</p>
                  )}
                </div>

                {/* Description */}
                <div className="space-y-2">
                  <label htmlFor="hire-description" className="text-sm font-medium text-foreground">Description</label>
                  <textarea
                    id="hire-description"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Describe what you need done..."
                    rows={3}
                    disabled={isLoading}
                    className={cn(
                      "flex w-full rounded-md border bg-transparent px-3 py-2 text-sm shadow-xs transition-colors resize-none",
                      "placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring",
                      "disabled:cursor-not-allowed disabled:opacity-50",
                      validationErrors.description ? "border-destructive focus-visible:ring-destructive" : "border-input"
                    )}
                  />
                  {validationErrors.description && (
                    <p className="text-xs text-destructive" role="alert">{validationErrors.description}</p>
                  )}
                </div>

                {/* Location */}
                <div className="space-y-2">
                  <label htmlFor="hire-location" className="text-sm font-medium text-foreground">Location</label>
                  <input
                    id="hire-location"
                    type="text"
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    placeholder="e.g. Lagos, Ikeja"
                    disabled={isLoading}
                    className={cn(
                      "flex h-9 w-full rounded-md border bg-transparent px-3 py-1 text-sm shadow-xs transition-colors",
                      "placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring",
                      "disabled:cursor-not-allowed disabled:opacity-50",
                      validationErrors.location ? "border-destructive focus-visible:ring-destructive" : "border-input"
                    )}
                  />
                  {validationErrors.location && (
                    <p className="text-xs text-destructive" role="alert">{validationErrors.location}</p>
                  )}
                </div>

                {/* Budget */}
                <div className="space-y-2">
                  <label htmlFor="hire-budget" className="text-sm font-medium text-foreground">Budget (NGN)</label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">₦</span>
                    <input
                      id="hire-budget"
                      type="number"
                      min="1"
                      step="0.01"
                      value={budget}
                      onChange={(e) => setBudget(e.target.value)}
                      placeholder="Enter budget"
                      disabled={isLoading}
                      className={cn(
                        "flex h-9 w-full rounded-md border bg-transparent pl-7 pr-3 py-1 text-sm shadow-xs transition-colors",
                        "placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring",
                        "disabled:cursor-not-allowed disabled:opacity-50",
                        validationErrors.budget ? "border-destructive focus-visible:ring-destructive" : "border-input"
                      )}
                    />
                  </div>
                  {validationErrors.budget && (
                    <p className="text-xs text-destructive" role="alert">{validationErrors.budget}</p>
                  )}
                </div>

                {error && !Object.keys(validationErrors).length && (
                  <div className="rounded-md border border-destructive/50 bg-destructive/10 p-3" role="alert">
                    <p className="text-sm text-destructive">{error}</p>
                  </div>
                )}

                <DialogFooter>
                  <Button type="button" variant="outline" onClick={onClose} disabled={isLoading}>Cancel</Button>
                  <Button type="submit" disabled={!isFormValid || isLoading}>
                    {isLoading ? <><Spinner className="size-4 mr-2" />Submitting...</> : "Continue"}
                  </Button>
                </DialogFooter>
              </form>
            </>
          )}

          {/* ── Step 2: Confirm hire ─────────────────────────────────── */}
          {step === "hiring" && (
            <>
              <DialogHeader>
                <DialogTitle>Confirm Hire</DialogTitle>
                <DialogDescription>Review the details below and confirm hiring.</DialogDescription>
              </DialogHeader>

              <div className="space-y-4">
                <div className="rounded-md border p-4 space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Worker</span>
                    <span className="text-sm font-medium">{workerName}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Job</span>
                    <span className="text-sm font-medium">{title}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Amount</span>
                    <span className="text-sm font-medium">₦{numericBudget.toLocaleString()}</span>
                  </div>
                </div>

                {error && (
                  <div className="rounded-md border border-destructive/50 bg-destructive/10 p-3" role="alert">
                    <p className="text-sm text-destructive">{error}</p>
                  </div>
                )}

                <DialogFooter>
                  <Button type="button" variant="outline" onClick={onClose} disabled={isLoading}>Cancel</Button>
                  <Button type="button" onClick={handleHireWorker} disabled={isLoading}>
                    {isLoading ? <><Spinner className="size-4 mr-2" />Hiring...</> : "Confirm & Pay"}
                  </Button>
                </DialogFooter>
              </div>
            </>
          )}

          {/* ── Step 3: Pay via Squad ────────────────────────────────── */}
          {step === "paying" && (
            <>
              <DialogHeader>
                <DialogTitle>Complete Payment</DialogTitle>
                <DialogDescription>
                  Pay ₦{numericBudget.toLocaleString()} to proceed with hiring {workerName}.
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-4">
                <div className="rounded-md border p-4 text-center space-y-1">
                  <p className="text-2xl font-bold">₦{numericBudget.toLocaleString()}</p>
                  <p className="text-sm text-muted-foreground">Processed securely via Squad</p>
                </div>

                {error && (
                  <div className="rounded-md border border-destructive/50 bg-destructive/10 p-3" role="alert">
                    <p className="text-sm text-destructive">{error}</p>
                  </div>
                )}

                <DialogFooter>
                  <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
                  <Button type="button" onClick={handleOpenPayment}>Pay with Squad</Button>
                </DialogFooter>
              </div>
            </>
          )}

          {/* ── Step 3b: Verifying with backend ─────────────────────── */}
          {step === "verifying" && (
            <>
              <DialogHeader>
                <DialogTitle>Verifying Payment</DialogTitle>
                <DialogDescription>
                  Confirming your payment with our payment provider…
                </DialogDescription>
              </DialogHeader>

              <div className="flex flex-col items-center justify-center py-8 gap-3">
                <ShieldCheck className="size-10 text-primary opacity-40" />
                <Spinner className="size-6 text-primary" />
                <p className="text-sm text-muted-foreground">This usually takes a few seconds.</p>
              </div>
            </>
          )}

          {/* ── Step 4: Success ──────────────────────────────────────── */}
          {step === "complete" && paymentResult && (
            <>
              <DialogHeader>
                <DialogTitle>Hire Successful!</DialogTitle>
                <DialogDescription>
                  You&apos;ve hired {workerName}. Funds are held in escrow until the job is done.
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-4">
                <div className="rounded-md border border-emerald-200 bg-emerald-50 dark:border-emerald-800 dark:bg-emerald-950 p-5 space-y-3">
                  <div className="flex items-center justify-center">
                    <CheckCircle2 className="size-10 text-emerald-600 dark:text-emerald-400" />
                  </div>
                  <div className="text-center space-y-0.5">
                    <p className="text-lg font-semibold text-emerald-700 dark:text-emerald-300">
                      ₦{paymentResult.amount.toLocaleString()} confirmed
                    </p>
                    <p className="text-xs text-emerald-600/70 dark:text-emerald-400/70 font-mono">
                      {paymentResult.transactionReference}
                    </p>
                  </div>
                  <div className="border-t border-emerald-200 dark:border-emerald-700 pt-3 space-y-1.5">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Worker</span>
                      <span className="font-medium">{workerName}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Job</span>
                      <span className="font-medium">{title}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Status</span>
                      <span className="font-medium text-emerald-600 dark:text-emerald-400 capitalize">
                        {paymentResult.status}
                      </span>
                    </div>
                  </div>
                </div>

                <DialogFooter>
                  <Button type="button" onClick={handleViewJob}>View Job</Button>
                </DialogFooter>
              </div>
            </>
          )}

        </DialogContent>
      </Dialog>

      {/* Global success / error toast */}
      <ErrorToast
        message={toast.message}
        visible={toast.visible}
        onDismiss={hideToast}
        onRetry={toast.onRetry}
        variant={toast.variant}
        detail={toast.detail}
      />
    </>
  );
}
