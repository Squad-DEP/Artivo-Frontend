"use client";

import * as React from "react";
import { useParams, useRouter } from "next/navigation";
import {
  ArrowLeft,
  Briefcase,
  MapPin,
  Calendar,
  DollarSign,
  Clock,
  Users,
  BarChart3,
  Loader2,
  AlertCircle,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { JobStageTracker } from "@/components/jobs/JobStageTracker";
import { StageCompletionDialog } from "@/components/jobs/StageCompletionDialog";
import { JobApplicationCard } from "@/components/jobs/JobApplicationCard";
import { JobApplicationForm } from "@/components/jobs/JobApplicationForm";
import { ReviewDialog } from "@/components/jobs/ReviewDialog";
import { PaymentDialog } from "@/components/payments/PaymentDialog";
import { useJobStore } from "@/store/jobStore";
import { useReputationStore } from "@/store/reputationStore";
import { useAuthStore } from "@/store/authStore";
import { JOB_STATUS } from "@/lib/constants/user-types";
import type { JobStage } from "@/api/types/job";

/**
 * JobDetailPage — full job view integrating JobStageTracker, JobApplicationCard list,
 * payment actions, review prompt, and job statistics.
 * Displays different views for worker vs customer.
 *
 * Validates: Requirements 9.3, 9.4, 9.5, 9.6, 9.7, 9.8, 9.9
 */
export default function JobDetailPage() {
  const params = useParams();
  const router = useRouter();
  const jobId = params.id as string;

  const {
    currentJob,
    applications,
    workerStats,
    customerStats,
    isLoading,
    error,
    fetchJobById,
    fetchStats,
    completeStage,
    confirmStageCompletion,
    disputeStage,
    clearError,
  } = useJobStore();

  // PaymentDialog component handles initiatePayment via paymentStore internally.
  // The flow: confirmStageCompletion → open PaymentDialog → initiatePayment (Req 9.5)
  const { fetchReputation } = useReputationStore();

  const { user, getUserType } = useAuthStore();
  const userType = getUserType();
  const isCustomer = userType === "customer";
  const isWorker = userType === "worker";

  // Dialog states
  const [stageDialogOpen, setStageDialogOpen] = React.useState(false);
  const [selectedStage, setSelectedStage] = React.useState<JobStage | null>(null);
  const [paymentDialogOpen, setPaymentDialogOpen] = React.useState(false);
  const [paymentStage, setPaymentStage] = React.useState<JobStage | null>(null);
  const [reviewDialogOpen, setReviewDialogOpen] = React.useState(false);

  // Fetch job data on mount
  React.useEffect(() => {
    if (jobId) {
      fetchJobById(jobId);
      fetchStats();
    }
  }, [jobId, fetchJobById, fetchStats]);

  // Determine if job is completed and review should be prompted
  const isJobCompleted = currentJob?.status === "completed";
  const allStagesPaid = currentJob?.stages?.every((s) => s.status === "paid") ?? false;
  const shouldPromptReview = isJobCompleted || allStagesPaid;

  // Determine if the current worker has already applied
  const hasWorkerApplied = isWorker && applications.some(
    (app) => app.worker_id === user?.id
  );

  // Determine if the job is open for applications
  const isOpenForApplications = currentJob?.status === "open";

  // Worker is assigned to this job
  const isAssignedWorker = isWorker && currentJob?.worker_id === user?.id;

  // Handlers
  const handleMarkComplete = async (stageId: string) => {
    if (!currentJob) return;
    await completeStage(currentJob.id, stageId);
  };

  const handleConfirmStage = (stageId: string) => {
    const stage = currentJob?.stages?.find((s) => s.id === stageId);
    if (stage) {
      setSelectedStage(stage);
      setStageDialogOpen(true);
    }
  };

  const handleDisputeStage = (stageId: string) => {
    const stage = currentJob?.stages?.find((s) => s.id === stageId);
    if (stage) {
      setSelectedStage(stage);
      setStageDialogOpen(true);
    }
  };

  const handleStageConfirm = async () => {
    if (!currentJob || !selectedStage) return;
    const success = await confirmStageCompletion(currentJob.id, selectedStage.id);
    if (success) {
      setStageDialogOpen(false);
      // After confirming stage completion, initiate payment for this stage (Req 9.5)
      setPaymentStage(selectedStage);
      setPaymentDialogOpen(true);
    }
  };

  const handleStageDispute = async (reason: string) => {
    if (!currentJob || !selectedStage) return;
    const success = await disputeStage(currentJob.id, selectedStage.id, reason);
    if (success) {
      setStageDialogOpen(false);
      setSelectedStage(null);
    }
  };

  const handlePaymentSuccess = async () => {
    setPaymentDialogOpen(false);
    setPaymentStage(null);

    // Refresh job data to get updated stage statuses
    if (jobId) {
      await fetchJobById(jobId);
    }

    // After successful payment, trigger reputation recalculation (Req 6.1, 6.2)
    fetchReputation();

    // Check if all stages are now paid (job completion) — show ReviewDialog (Req 9.7)
    const updatedJob = useJobStore.getState().currentJob;
    if (updatedJob) {
      const allPaid = updatedJob.stages?.every((s) => s.status === "paid") ?? false;
      if (allPaid && updatedJob.status !== "completed") {
        // Update job status to completed
        const { updateJob } = useJobStore.getState();
        await updateJob(updatedJob.id, { status: "completed" });
        // Re-fetch to get the updated status
        await fetchJobById(jobId);
      }
      // If all stages are paid, prompt for review
      const finalJob = useJobStore.getState().currentJob;
      const finalAllPaid = finalJob?.stages?.every((s) => s.status === "paid") ?? false;
      if (finalAllPaid || finalJob?.status === "completed") {
        setReviewDialogOpen(true);
      }
    }
  };

  const handleReviewSuccess = () => {
    setReviewDialogOpen(false);
    if (jobId) fetchJobById(jobId);
  };

  const handleApplicationAccepted = () => {
    if (jobId) fetchJobById(jobId);
  };

  // Format helpers
  const formatCurrency = (value: number): string => {
    return new Intl.NumberFormat("en-NG", {
      style: "currency",
      currency: "NGN",
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    }).format(value);
  };

  const formatDate = (dateStr: string): string => {
    return new Date(dateStr).toLocaleDateString("en-NG", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  };

  // Loading state
  if (isLoading && !currentJob) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="size-8 animate-spin text-muted-foreground" />
          <p className="text-sm text-muted-foreground">Loading job details...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error && !currentJob) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="flex flex-col items-center gap-3 text-center max-w-md">
          <AlertCircle className="size-8 text-destructive" />
          <p className="text-sm text-destructive font-medium">Failed to load job</p>
          <p className="text-xs text-muted-foreground">{error}</p>
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              clearError();
              fetchJobById(jobId);
            }}
          >
            Try Again
          </Button>
        </div>
      </div>
    );
  }

  if (!currentJob) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <p className="text-sm text-muted-foreground">Job not found</p>
      </div>
    );
  }

  const jobStatus = JOB_STATUS[currentJob.status] ?? {
    label: currentJob.status,
    color: "gray",
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <button
          onClick={() => router.back()}
          className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-4 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back
        </button>

        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0 flex-1">
            <h1 className="text-2xl font-bold text-foreground truncate">
              {currentJob.title}
            </h1>
            <div className="flex items-center gap-3 mt-2 flex-wrap">
              <span
                className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium bg-${jobStatus.color}-100 text-${jobStatus.color}-800`}
              >
                {jobStatus.label}
              </span>
              {currentJob.category && (
                <span className="text-sm text-muted-foreground flex items-center gap-1">
                  <Briefcase className="size-3.5" />
                  {currentJob.category.name}
                </span>
              )}
              {currentJob.location && (
                <span className="text-sm text-muted-foreground flex items-center gap-1">
                  <MapPin className="size-3.5" />
                  {currentJob.location.city}, {currentJob.location.state}
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Job Info Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <InfoCard
          icon={<DollarSign className="size-4" />}
          label="Budget"
          value={`${formatCurrency(currentJob.budget_min)} – ${formatCurrency(currentJob.budget_max)}`}
        />
        {currentJob.deadline && (
          <InfoCard
            icon={<Calendar className="size-4" />}
            label="Deadline"
            value={formatDate(currentJob.deadline)}
          />
        )}
        <InfoCard
          icon={<Clock className="size-4" />}
          label="Posted"
          value={formatDate(currentJob.created_at)}
        />
        {currentJob.stages && (
          <InfoCard
            icon={<BarChart3 className="size-4" />}
            label="Stages"
            value={`${currentJob.stages.length} stage${currentJob.stages.length !== 1 ? "s" : ""}`}
          />
        )}
      </div>

      {/* Description */}
      <section className="rounded-lg border border-border bg-card p-5">
        <h2 className="text-base font-semibold text-foreground mb-2">Description</h2>
        <p className="text-sm text-muted-foreground whitespace-pre-wrap leading-relaxed">
          {currentJob.description}
        </p>
      </section>

      {/* Stage Tracker — visible when job is in progress or completed */}
      {currentJob.stages &&
        currentJob.stages.length > 0 &&
        (currentJob.status === "in_progress" ||
          currentJob.status === "completed" ||
          currentJob.status === "disputed") && (
          <section className="rounded-lg border border-border bg-card p-5">
            <h2 className="text-base font-semibold text-foreground mb-4">
              Job Progress
            </h2>
            <JobStageTracker
              stages={currentJob.stages}
              role={isCustomer ? "customer" : "worker"}
              isLoading={isLoading}
              onMarkComplete={isAssignedWorker ? handleMarkComplete : undefined}
              onConfirm={isCustomer ? handleConfirmStage : undefined}
              onDispute={isCustomer ? handleDisputeStage : undefined}
            />
          </section>
        )}

      {/* Applications Section — visible to customer */}
      {isCustomer && applications.length > 0 && (
        <section className="rounded-lg border border-border bg-card p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-semibold text-foreground flex items-center gap-2">
              <Users className="size-4" />
              Applications ({applications.length})
            </h2>
          </div>
          <div className="space-y-3">
            {applications.map((application) => (
              <JobApplicationCard
                key={application.id}
                application={application}
                jobId={currentJob.id}
                isCustomer={isCustomer}
                onAccepted={handleApplicationAccepted}
              />
            ))}
          </div>
        </section>
      )}

      {/* Apply Form — visible to worker when job is open and they haven't applied */}
      {isWorker && isOpenForApplications && !hasWorkerApplied && !isAssignedWorker && (
        <section>
          <JobApplicationForm
            jobId={currentJob.id}
            budgetMin={currentJob.budget_min}
            budgetMax={currentJob.budget_max}
            onSuccess={() => fetchJobById(jobId)}
          />
        </section>
      )}

      {/* Already Applied Notice */}
      {isWorker && hasWorkerApplied && !isAssignedWorker && (
        <section className="rounded-lg border border-border bg-card p-5">
          <div className="flex items-center gap-3">
            <div className="size-10 rounded-full bg-green-100 flex items-center justify-center">
              <Briefcase className="size-5 text-green-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-foreground">
                Application Submitted
              </p>
              <p className="text-xs text-muted-foreground">
                You have already applied to this job. The customer will review your application.
              </p>
            </div>
          </div>
        </section>
      )}

      {/* Review Prompt — shown when all stages are completed and paid */}
      {shouldPromptReview && (
        <section className="rounded-lg border border-green-200 bg-green-50 p-5">
          <div className="flex items-start gap-3">
            <div className="size-10 rounded-full bg-green-100 flex items-center justify-center shrink-0">
              <BarChart3 className="size-5 text-green-600" />
            </div>
            <div className="flex-1">
              <h3 className="text-sm font-semibold text-green-900">
                Job Completed!
              </h3>
              <p className="text-xs text-green-700 mt-0.5">
                All stages have been completed and paid. Leave a review to help build trust on the platform.
              </p>
              <Button
                size="sm"
                className="mt-3"
                onClick={() => setReviewDialogOpen(true)}
              >
                Leave a Review
              </Button>
            </div>
          </div>
        </section>
      )}

      {/* Job Statistics */}
      {(workerStats || customerStats) && (
        <section className="rounded-lg border border-border bg-card p-5">
          <h2 className="text-base font-semibold text-foreground mb-4">
            Your Job Statistics
          </h2>
          {isWorker && workerStats && (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
              <StatCard label="Total Jobs" value={workerStats.total_jobs} />
              <StatCard label="Active Jobs" value={workerStats.active_jobs} />
              <StatCard label="Completed" value={workerStats.completed_jobs} />
              <StatCard
                label="Total Earned"
                value={formatCurrency(workerStats.total_earned)}
              />
              <StatCard
                label="Completion Rate"
                value={`${(workerStats.completion_rate * 100).toFixed(0)}%`}
              />
              <StatCard
                label="Avg Rating"
                value={workerStats.average_rating.toFixed(1)}
              />
            </div>
          )}
          {isCustomer && customerStats && (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
              <StatCard label="Total Jobs" value={customerStats.total_jobs} />
              <StatCard label="Active Jobs" value={customerStats.active_jobs} />
              <StatCard label="Completed" value={customerStats.completed_jobs} />
              <StatCard
                label="Total Spent"
                value={formatCurrency(customerStats.total_spent)}
              />
              <StatCard
                label="Pending Payments"
                value={formatCurrency(customerStats.pending_payments)}
              />
            </div>
          )}
        </section>
      )}

      {/* Assigned Worker Info — visible to customer when job is in progress */}
      {isCustomer && currentJob.worker && currentJob.status !== "open" && (
        <section className="rounded-lg border border-border bg-card p-5">
          <h2 className="text-base font-semibold text-foreground mb-3">
            Assigned Worker
          </h2>
          <div className="flex items-center gap-3">
            {currentJob.worker.profile_image_url ? (
              <img
                src={currentJob.worker.profile_image_url}
                alt={currentJob.worker.display_name}
                className="size-12 rounded-full object-cover"
              />
            ) : (
              <div className="size-12 rounded-full bg-primary/10 flex items-center justify-center">
                <span className="text-lg font-medium text-primary">
                  {currentJob.worker.display_name?.charAt(0)?.toUpperCase() ?? "W"}
                </span>
              </div>
            )}
            <div>
              <p className="text-sm font-medium text-foreground">
                {currentJob.worker.display_name}
              </p>
              <div className="flex items-center gap-2 text-xs text-muted-foreground mt-0.5">
                {currentJob.worker.rating > 0 && (
                  <span>★ {currentJob.worker.rating.toFixed(1)}</span>
                )}
                {currentJob.worker.completed_jobs > 0 && (
                  <span>{currentJob.worker.completed_jobs} jobs</span>
                )}
                {currentJob.worker.trust_score > 0 && (
                  <span>Trust: {currentJob.worker.trust_score}</span>
                )}
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Error Banner */}
      {error && currentJob && (
        <div
          className="rounded-md border border-destructive/50 bg-destructive/10 p-3"
          role="alert"
        >
          <div className="flex items-start gap-2">
            <AlertCircle className="size-4 mt-0.5 text-destructive shrink-0" />
            <div className="flex-1">
              <p className="text-sm text-destructive">{error}</p>
              <button
                onClick={clearError}
                className="text-xs text-destructive/70 hover:text-destructive underline mt-1"
              >
                Dismiss
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Dialogs */}
      {selectedStage && (
        <StageCompletionDialog
          open={stageDialogOpen}
          onOpenChange={setStageDialogOpen}
          stageName={selectedStage.title}
          stageAmount={selectedStage.amount}
          isLoading={isLoading}
          onConfirm={handleStageConfirm}
          onDispute={handleStageDispute}
        />
      )}

      {paymentStage && (
        <PaymentDialog
          open={paymentDialogOpen}
          onOpenChange={setPaymentDialogOpen}
          jobId={currentJob.id}
          stageId={paymentStage.id}
          stageName={paymentStage.title}
          defaultAmount={paymentStage.amount}
          onSuccess={handlePaymentSuccess}
        />
      )}

      <ReviewDialog
        open={reviewDialogOpen}
        onOpenChange={setReviewDialogOpen}
        jobId={currentJob.id}
        jobTitle={currentJob.title}
        revieweeId={
          isCustomer
            ? currentJob.worker_id ?? ""
            : currentJob.customer_id
        }
        revieweeName={
          isCustomer
            ? currentJob.worker?.display_name
            : currentJob.customer_name
        }
        onSuccess={handleReviewSuccess}
      />
    </div>
  );
}

// --- Helper Components ---

function InfoCard({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-lg border border-border bg-card p-3">
      <div className="flex items-center gap-1.5 text-muted-foreground mb-1">
        {icon}
        <span className="text-xs">{label}</span>
      </div>
      <p className="text-sm font-medium text-foreground truncate">{value}</p>
    </div>
  );
}

function StatCard({
  label,
  value,
}: {
  label: string;
  value: string | number;
}) {
  return (
    <div className="rounded-lg bg-muted/50 p-3">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="text-lg font-semibold text-foreground mt-0.5">{value}</p>
    </div>
  );
}
