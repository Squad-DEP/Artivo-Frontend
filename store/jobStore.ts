import { create } from "zustand";
import { apiService } from "@/api/api-service";
import type {
  Job,
  JobApplication,
  JobSearchParams,
  JobSearchResponse,
  CreateJobRequest,
  UpdateJobRequest,
  CustomerJobStats,
  WorkerJobStats,
  JobStage,
} from "@/api/types/job";
import type { CreateReviewRequest } from "@/api/types/reputation";
import type { AdvanceRequest, AdvanceRequestsResponse, AdvanceRequestResponse } from "@/api/types/marketplace-api";

interface JobState {
  // State
  jobs: Job[];
  currentJob: Job | null;
  applications: JobApplication[];
  advanceRequests: AdvanceRequest[];
  workerStats: WorkerJobStats | null;
  customerStats: CustomerJobStats | null;
  isLoading: boolean;
  error: string | null;

  // Actions
  fetchJobs: (params?: JobSearchParams) => Promise<void>;
  fetchJobById: (id: string) => Promise<void>;
  createJob: (data: CreateJobRequest) => Promise<string | null>;
  updateJob: (id: string, data: UpdateJobRequest) => Promise<boolean>;
  applyToJob: (
    jobId: string,
    application: {
      proposed_amount: number;
      cover_letter?: string;
      estimated_duration?: string;
    }
  ) => Promise<boolean>;
  acceptApplication: (
    jobId: string,
    applicationId: string
  ) => Promise<boolean>;
  completeStage: (jobId: string, stageId: string) => Promise<boolean>;
  confirmStageCompletion: (
    jobId: string,
    stageId: string
  ) => Promise<boolean>;
  disputeStage: (
    jobId: string,
    stageId: string,
    reason: string
  ) => Promise<boolean>;
  submitReview: (data: CreateReviewRequest) => Promise<boolean>;
  fetchStats: () => Promise<void>;
  fetchAdvanceRequests: (jobId: string) => Promise<void>;
  requestAdvance: (jobId: string, amount: number, reason?: string) => Promise<boolean>;
  approveAdvance: (requestId: string) => Promise<boolean>;
  rejectAdvance: (requestId: string) => Promise<boolean>;
  clearError: () => void;
}

/**
 * Normalizes a job that has no explicit stages into a single-stage job
 * with the full job amount, per Requirement 9.8.
 */
function normalizeSingleStageJob(job: Job): Job {
  if (job.stages && job.stages.length > 0) {
    return job;
  }

  const singleStage: JobStage = {
    id: `${job.id}-full`,
    job_id: job.id,
    title: job.title,
    description: job.description,
    amount: job.final_amount ?? job.budget_max,
    status: mapJobStatusToStageStatus(job.status),
    created_at: job.created_at,
    order: 0,
  };

  return { ...job, stages: [singleStage] };
}

function mapJobStatusToStageStatus(
  jobStatus: string
): "pending" | "in_progress" | "completed" | "paid" {
  switch (jobStatus) {
    case "completed":
      return "paid";
    case "in_progress":
      return "in_progress";
    default:
      return "pending";
  }
}

export const useJobStore = create<JobState>()((set, get) => ({
  // Initial state
  jobs: [],
  currentJob: null,
  applications: [],
  advanceRequests: [],
  workerStats: null,
  customerStats: null,
  isLoading: false,
  error: null,

  fetchJobs: async (params?: JobSearchParams) => {
    set({ isLoading: true, error: null });

    try {
      const query: Record<string, string> = {};

      if (params?.query) query.query = params.query;
      if (params?.category) query.category = params.category;
      if (params?.status) query.status = params.status;
      if (params?.is_remote !== undefined)
        query.is_remote = String(params.is_remote);
      if (params?.min_budget !== undefined)
        query.min_budget = String(params.min_budget);
      if (params?.max_budget !== undefined)
        query.max_budget = String(params.max_budget);
      if (params?.posted_within_days !== undefined)
        query.posted_within_days = String(params.posted_within_days);
      if (params?.page !== undefined) query.page = String(params.page);
      if (params?.limit !== undefined) query.limit = String(params.limit);
      if (params?.sort_by) query.sort_by = params.sort_by;
      if (params?.sort_order) query.sort_order = params.sort_order;
      if (params?.location?.city) query["location.city"] = params.location.city;
      if (params?.location?.state)
        query["location.state"] = params.location.state;
      if (params?.location?.country)
        query["location.country"] = params.location.country;

      const response = await apiService.get<JobSearchResponse>("/jobs", {
        query,
      });

      set({ jobs: response.jobs as unknown as Job[], isLoading: false });
    } catch (error) {
      set({
        error:
          error instanceof Error ? error.message : "Failed to fetch jobs",
        isLoading: false,
      });
    }
  },

  fetchJobById: async (id: string) => {
    set({ isLoading: true, error: null });

    try {
      const job = await apiService.get<Job>(`/jobs/:id`, {
        params: { id },
      });

      const normalizedJob = normalizeSingleStageJob(job);

      // Also fetch applications for this job
      try {
        const applications = await apiService.get<JobApplication[]>(
          `/jobs/:id/applications`,
          { params: { id } }
        );
        set({ currentJob: normalizedJob, applications, isLoading: false });
      } catch {
        // Applications may not be accessible (e.g., worker viewing)
        set({ currentJob: normalizedJob, applications: [], isLoading: false });
      }
    } catch (error) {
      set({
        error:
          error instanceof Error ? error.message : "Failed to fetch job",
        isLoading: false,
      });
    }
  },

  createJob: async (data: CreateJobRequest) => {
    set({ isLoading: true, error: null });

    try {
      const response = await apiService.post<{ id: string }>("/jobs", {
        body: data,
      });

      set({ isLoading: false });
      return response.id;
    } catch (error) {
      set({
        error:
          error instanceof Error ? error.message : "Failed to create job",
        isLoading: false,
      });
      return null;
    }
  },

  updateJob: async (id: string, data: UpdateJobRequest) => {
    set({ isLoading: true, error: null });

    try {
      const updatedJob = await apiService.put<Job>(`/jobs/:id`, {
        params: { id },
        body: data,
      });

      const normalizedJob = normalizeSingleStageJob(updatedJob);

      set((state) => ({
        currentJob:
          state.currentJob?.id === id ? normalizedJob : state.currentJob,
        jobs: state.jobs.map((j) =>
          j.id === id ? normalizedJob : j
        ),
        isLoading: false,
      }));
      return true;
    } catch (error) {
      set({
        error:
          error instanceof Error ? error.message : "Failed to update job",
        isLoading: false,
      });
      return false;
    }
  },

  applyToJob: async (
    jobId: string,
    application: {
      proposed_amount: number;
      cover_letter?: string;
      estimated_duration?: string;
    }
  ) => {
    set({ isLoading: true, error: null });

    try {
      await apiService.post<JobApplication>(`/jobs/:id/apply`, {
        params: { id: jobId },
        body: application,
      });

      set({ isLoading: false });
      return true;
    } catch (error) {
      set({
        error:
          error instanceof Error
            ? error.message
            : "Failed to apply to job",
        isLoading: false,
      });
      return false;
    }
  },

  acceptApplication: async (jobId: string, applicationId: string) => {
    set({ isLoading: true, error: null });

    try {
      await apiService.post<{ job: unknown; escrow: unknown; requires_payment: boolean }>(
        `/customer/hire`,
        { body: { proposal_id: applicationId } }
      );

      set((state) => ({
        applications: state.applications.map((app) =>
          app.id === applicationId
            ? { ...app, status: "accepted" as const }
            : app.job_id === jobId
              ? { ...app, status: "rejected" as const }
              : app
        ),
        isLoading: false,
      }));
      return true;
    } catch (error) {
      set({
        error:
          error instanceof Error
            ? error.message
            : "Failed to accept application",
        isLoading: false,
      });
      return false;
    }
  },

  completeStage: async (jobId: string, stageId: string) => {
    set({ isLoading: true, error: null });

    try {
      const updatedJob = await apiService.post<Job>(
        `/jobs/:id/stages/:stageId/complete`,
        {
          params: { id: jobId, stageId },
        }
      );

      const normalizedJob = normalizeSingleStageJob(updatedJob);

      set((state) => ({
        currentJob:
          state.currentJob?.id === jobId ? normalizedJob : state.currentJob,
        isLoading: false,
      }));
      return true;
    } catch (error) {
      set({
        error:
          error instanceof Error
            ? error.message
            : "Failed to complete stage",
        isLoading: false,
      });
      return false;
    }
  },

  confirmStageCompletion: async (jobId: string, stageId: string) => {
    set({ isLoading: true, error: null });

    try {
      const updatedJob = await apiService.post<Job>(
        `/jobs/:id/stages/:stageId/confirm`,
        {
          params: { id: jobId, stageId },
        }
      );

      const normalizedJob = normalizeSingleStageJob(updatedJob);

      set((state) => ({
        currentJob:
          state.currentJob?.id === jobId ? normalizedJob : state.currentJob,
        isLoading: false,
      }));
      return true;
    } catch (error) {
      set({
        error:
          error instanceof Error
            ? error.message
            : "Failed to confirm stage completion",
        isLoading: false,
      });
      return false;
    }
  },

  disputeStage: async (jobId: string, stageId: string, reason: string) => {
    set({ isLoading: true, error: null });

    try {
      const updatedJob = await apiService.post<Job>(
        `/jobs/:id/stages/:stageId/dispute`,
        {
          params: { id: jobId, stageId },
          body: { reason },
        }
      );

      const normalizedJob = normalizeSingleStageJob(updatedJob);

      set((state) => ({
        currentJob:
          state.currentJob?.id === jobId ? normalizedJob : state.currentJob,
        isLoading: false,
      }));
      return true;
    } catch (error) {
      set({
        error:
          error instanceof Error
            ? error.message
            : "Failed to dispute stage",
        isLoading: false,
      });
      return false;
    }
  },

  submitReview: async (data: CreateReviewRequest) => {
    set({ isLoading: true, error: null });

    try {
      await apiService.post<void>(`/jobs/:id/review`, {
        params: { id: data.job_id },
        body: data,
      });

      set({ isLoading: false });
      return true;
    } catch (error) {
      set({
        error:
          error instanceof Error
            ? error.message
            : "Failed to submit review",
        isLoading: false,
      });
      return false;
    }
  },

  fetchStats: async () => {
    set({ isLoading: true, error: null });

    try {
      // Attempt to fetch both worker and customer stats
      // The API will return the appropriate one based on the user's role
      try {
        const workerStats = await apiService.get<WorkerJobStats>(
          "/jobs/stats/worker"
        );
        set((state) => ({ workerStats, isLoading: false }));
      } catch {
        // Not a worker, try customer stats
        try {
          const customerStats = await apiService.get<CustomerJobStats>(
            "/jobs/stats/customer"
          );
          set((state) => ({ customerStats, isLoading: false }));
        } catch {
          set({ isLoading: false });
        }
      }
    } catch (error) {
      set({
        error:
          error instanceof Error
            ? error.message
            : "Failed to fetch job stats",
        isLoading: false,
      });
    }
  },

  fetchAdvanceRequests: async (jobId: string) => {
    try {
      const data = await apiService.get<AdvanceRequestsResponse>(
        `/customer/advance-requests/${jobId}`
      );
      set({ advanceRequests: data.advance_requests });
    } catch {
      // non-critical
    }
  },

  requestAdvance: async (jobId: string, amount: number, reason?: string) => {
    set({ isLoading: true, error: null });
    try {
      await apiService.post<AdvanceRequestResponse>("/worker/request-advance", {
        body: { job_id: jobId, amount, reason },
      });
      set({ isLoading: false });
      return true;
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : "Failed to request advance",
        isLoading: false,
      });
      return false;
    }
  },

  approveAdvance: async (requestId: string) => {
    set({ isLoading: true, error: null });
    try {
      const data = await apiService.post<AdvanceRequestResponse>(
        `/customer/approve-advance/${requestId}`
      );
      set((state) => ({
        advanceRequests: state.advanceRequests.map((r) =>
          r.id === requestId ? data.advance_request : r
        ),
        isLoading: false,
      }));
      return true;
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : "Failed to approve advance",
        isLoading: false,
      });
      return false;
    }
  },

  rejectAdvance: async (requestId: string) => {
    set({ isLoading: true, error: null });
    try {
      const data = await apiService.post<AdvanceRequestResponse>(
        `/customer/reject-advance/${requestId}`
      );
      set((state) => ({
        advanceRequests: state.advanceRequests.map((r) =>
          r.id === requestId ? data.advance_request : r
        ),
        isLoading: false,
      }));
      return true;
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : "Failed to reject advance",
        isLoading: false,
      });
      return false;
    }
  },

  clearError: () => set({ error: null }),
}));
