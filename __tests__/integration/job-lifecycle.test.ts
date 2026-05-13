import { describe, it, expect, beforeEach, vi } from "vitest";
import { useJobStore } from "@/store/jobStore";
import { usePaymentStore } from "@/store/paymentStore";
import { useReputationStore } from "@/store/reputationStore";
import type { Job, JobApplication } from "@/api/types/job";

// Mock the API service
vi.mock("@/api/api-service", () => ({
  apiService: {
    post: vi.fn(),
    get: vi.fn(),
    put: vi.fn(),
  },
}));

import { apiService } from "@/api/api-service";

const mockedApiService = vi.mocked(apiService);

// --- Test Fixtures ---

function createMockJob(overrides: Partial<Job> = {}): Job {
  return {
    id: "job-1",
    title: "Fix Kitchen Plumbing",
    description: "Need a plumber to fix leaking pipes in the kitchen. The issue has been ongoing for a week.",
    category: "Home Services" as any,
    budget_min: 5000,
    budget_max: 15000,
    location: { city: "Lagos", state: "Lagos", country: "Nigeria" },
    customer_id: "customer-1",
    customer_name: "Chioma Okafor",
    status: "open" as any,
    stages: [
      {
        id: "stage-1",
        job_id: "job-1",
        title: "Inspection",
        description: "Inspect the plumbing issue",
        amount: 5000,
        status: "pending",
        created_at: "2024-01-01T00:00:00Z",
        order: 0,
      },
      {
        id: "stage-2",
        job_id: "job-1",
        title: "Repair",
        description: "Fix the leaking pipes",
        amount: 10000,
        status: "pending",
        created_at: "2024-01-01T00:00:00Z",
        order: 1,
      },
    ],
    created_at: "2024-01-01T00:00:00Z",
    updated_at: "2024-01-01T00:00:00Z",
    ...overrides,
  };
}

function createMockApplication(overrides: Partial<JobApplication> = {}): JobApplication {
  return {
    id: "app-1",
    job_id: "job-1",
    worker_id: "worker-1",
    worker: {
      id: "worker-1",
      display_name: "Adebayo Plumber",
      username: "adebayo-plumber",
      primary_skill: "Plumbing",
      trust_score: 85,
      rating: 4.7,
      completed_jobs: 42,
      location: { city: "Lagos", state: "Lagos", country: "Nigeria" },
      verification_status: "verified" as any,
      hourly_rate: 3000,
      avatar_url: null,
    },
    proposed_amount: 12000,
    cover_letter: "I have 5 years of plumbing experience and can fix this quickly.",
    estimated_duration: "2 days",
    status: "pending",
    created_at: "2024-01-02T00:00:00Z",
    updated_at: "2024-01-02T00:00:00Z",
    ...overrides,
  };
}

describe("Integration: Job Lifecycle", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Reset stores
    useJobStore.setState({
      jobs: [],
      currentJob: null,
      applications: [],
      workerStats: null,
      customerStats: null,
      isLoading: false,
      error: null,
    });
    usePaymentStore.setState({
      virtualAccount: null,
      transactions: [],
      totalTransactions: 0,
      currentPage: 1,
      isLoading: false,
      error: null,
      retryAttempts: {},
      virtualAccountError: null,
      isCreatingVirtualAccount: false,
    });
  });

  describe("Full Job Lifecycle: Create → Apply → Accept → Complete → Pay → Review", () => {
    it("should complete the full job lifecycle with multi-stage job", async () => {
      const mockJob = createMockJob();

      // Step 1: Customer creates a job
      mockedApiService.post.mockResolvedValueOnce({ id: "job-1" });

      const jobId = await useJobStore.getState().createJob({
        title: "Fix Kitchen Plumbing",
        description: "Need a plumber to fix leaking pipes in the kitchen. The issue has been ongoing for a week.",
        category_id: "home-services",
        budget_min: 5000,
        budget_max: 15000,
        location: { city: "Lagos", state: "Lagos", country: "Nigeria" },
        stages: [
          { title: "Inspection", description: "Inspect the plumbing issue", amount: 5000 },
          { title: "Repair", description: "Fix the leaking pipes", amount: 10000 },
        ],
      });

      expect(jobId).toBe("job-1");
      expect(mockedApiService.post).toHaveBeenCalledWith("/jobs", {
        body: expect.objectContaining({
          title: "Fix Kitchen Plumbing",
          budget_min: 5000,
          budget_max: 15000,
        }),
      });

      // Step 2: Worker applies to the job
      mockedApiService.post.mockResolvedValueOnce(createMockApplication());

      const applyResult = await useJobStore.getState().applyToJob("job-1", {
        proposed_amount: 12000,
        cover_letter: "I have 5 years of plumbing experience and can fix this quickly.",
        estimated_duration: "2 days",
      });

      expect(applyResult).toBe(true);
      expect(mockedApiService.post).toHaveBeenCalledWith("/jobs/:id/apply", {
        params: { id: "job-1" },
        body: {
          proposed_amount: 12000,
          cover_letter: "I have 5 years of plumbing experience and can fix this quickly.",
          estimated_duration: "2 days",
        },
      });

      // Step 3: Customer views the job (sets currentJob) then accepts the application
      useJobStore.setState({ currentJob: mockJob, applications: [createMockApplication()] });

      const jobInProgress = createMockJob({
        status: "in_progress" as any,
        worker_id: "worker-1",
        stages: [
          { ...mockJob.stages[0], status: "in_progress" },
          { ...mockJob.stages[1], status: "pending" },
        ],
      });
      mockedApiService.post.mockResolvedValueOnce(jobInProgress);

      const acceptResult = await useJobStore.getState().acceptApplication("job-1", "app-1");

      expect(acceptResult).toBe(true);
      expect(mockedApiService.post).toHaveBeenCalledWith(
        "/jobs/:id/applications/:appId/accept",
        { params: { id: "job-1", appId: "app-1" } }
      );

      // Verify job status updated
      let state = useJobStore.getState();
      expect(state.currentJob?.status).toBe("in_progress");

      // Step 4: Worker completes stage 1
      const jobStage1Completed = createMockJob({
        status: "in_progress" as any,
        worker_id: "worker-1",
        stages: [
          { ...mockJob.stages[0], status: "completed" },
          { ...mockJob.stages[1], status: "pending" },
        ],
      });
      mockedApiService.post.mockResolvedValueOnce(jobStage1Completed);

      const completeStage1 = await useJobStore.getState().completeStage("job-1", "stage-1");
      expect(completeStage1).toBe(true);

      // Step 5: Customer confirms stage 1 completion
      const jobStage1Confirmed = createMockJob({
        status: "in_progress" as any,
        worker_id: "worker-1",
        stages: [
          { ...mockJob.stages[0], status: "paid" },
          { ...mockJob.stages[1], status: "in_progress" },
        ],
      });
      mockedApiService.post.mockResolvedValueOnce(jobStage1Confirmed);

      const confirmStage1 = await useJobStore.getState().confirmStageCompletion("job-1", "stage-1");
      expect(confirmStage1).toBe(true);

      state = useJobStore.getState();
      expect(state.currentJob?.stages[0].status).toBe("paid");

      // Step 6: Payment for stage 1
      mockedApiService.post.mockResolvedValueOnce({});

      const paymentResult = await usePaymentStore
        .getState()
        .initiatePayment("job-1", "stage-1", "mobile_money", 5000);
      expect(paymentResult).toBe(true);

      // Step 7: Worker completes stage 2
      const jobStage2Completed = createMockJob({
        status: "in_progress" as any,
        worker_id: "worker-1",
        stages: [
          { ...mockJob.stages[0], status: "paid" },
          { ...mockJob.stages[1], status: "completed" },
        ],
      });
      mockedApiService.post.mockResolvedValueOnce(jobStage2Completed);

      const completeStage2 = await useJobStore.getState().completeStage("job-1", "stage-2");
      expect(completeStage2).toBe(true);

      // Step 8: Customer confirms stage 2 completion
      const jobAllPaid = createMockJob({
        status: "completed" as any,
        worker_id: "worker-1",
        stages: [
          { ...mockJob.stages[0], status: "paid" },
          { ...mockJob.stages[1], status: "paid" },
        ],
      });
      mockedApiService.post.mockResolvedValueOnce(jobAllPaid);

      const confirmStage2 = await useJobStore.getState().confirmStageCompletion("job-1", "stage-2");
      expect(confirmStage2).toBe(true);

      state = useJobStore.getState();
      expect(state.currentJob?.status).toBe("completed");
      expect(state.currentJob?.stages.every((s) => s.status === "paid")).toBe(true);

      // Step 9: Payment for stage 2
      mockedApiService.post.mockResolvedValueOnce({});

      const payment2Result = await usePaymentStore
        .getState()
        .initiatePayment("job-1", "stage-2", "bank_transfer", 10000);
      expect(payment2Result).toBe(true);

      // Step 10: Customer submits review
      mockedApiService.post.mockResolvedValueOnce({});

      const reviewResult = await useJobStore.getState().submitReview({
        job_id: "job-1",
        reviewee_id: "worker-1",
        rating: 5,
        comment: "Excellent work! Fixed the plumbing perfectly.",
      });

      expect(reviewResult).toBe(true);
      expect(mockedApiService.post).toHaveBeenCalledWith("/jobs/:id/review", {
        params: { id: "job-1" },
        body: {
          job_id: "job-1",
          reviewee_id: "worker-1",
          rating: 5,
          comment: "Excellent work! Fixed the plumbing perfectly.",
        },
      });
    });

    it("should handle single-stage job (no explicit stages) as full amount", async () => {
      // Job with no stages — should be normalized to single stage
      const singleStageJob: Job = {
        id: "job-2",
        title: "Quick Electrical Fix",
        description: "Need someone to replace a faulty light switch in the living room quickly.",
        category: "Home Services" as any,
        budget_min: 2000,
        budget_max: 5000,
        final_amount: 3000,
        location: { city: "Lagos", state: "Lagos", country: "Nigeria" },
        customer_id: "customer-1",
        status: "open" as any,
        stages: [], // No explicit stages
        created_at: "2024-01-01T00:00:00Z",
        updated_at: "2024-01-01T00:00:00Z",
      };

      // Fetch job — store normalizes it
      mockedApiService.get
        .mockResolvedValueOnce(singleStageJob) // job fetch
        .mockRejectedValueOnce(new Error("Not found")); // applications fetch (worker view)

      await useJobStore.getState().fetchJobById("job-2");

      const state = useJobStore.getState();
      expect(state.currentJob).not.toBeNull();
      expect(state.currentJob!.stages).toHaveLength(1);
      expect(state.currentJob!.stages[0].id).toBe("job-2-full");
      expect(state.currentJob!.stages[0].amount).toBe(3000); // Uses final_amount
      expect(state.currentJob!.stages[0].title).toBe("Quick Electrical Fix");
    });

    it("should handle stage dispute and revert to in_progress", async () => {
      const mockJob = createMockJob({
        status: "in_progress" as any,
        worker_id: "worker-1",
        stages: [
          {
            id: "stage-1",
            job_id: "job-1",
            title: "Inspection",
            description: "Inspect the plumbing issue",
            amount: 5000,
            status: "completed",
            created_at: "2024-01-01T00:00:00Z",
            order: 0,
          },
          {
            id: "stage-2",
            job_id: "job-1",
            title: "Repair",
            description: "Fix the leaking pipes",
            amount: 10000,
            status: "pending",
            created_at: "2024-01-01T00:00:00Z",
            order: 1,
          },
        ],
      });

      // Set current job
      useJobStore.setState({ currentJob: mockJob });

      // Customer disputes stage 1
      const disputedJob = createMockJob({
        status: "in_progress" as any,
        worker_id: "worker-1",
        stages: [
          { ...mockJob.stages[0], status: "in_progress" }, // Reverted
          { ...mockJob.stages[1], status: "pending" },
        ],
      });
      mockedApiService.post.mockResolvedValueOnce(disputedJob);

      const disputeResult = await useJobStore
        .getState()
        .disputeStage("job-1", "stage-1", "Work was not completed properly");

      expect(disputeResult).toBe(true);
      expect(mockedApiService.post).toHaveBeenCalledWith(
        "/jobs/:id/stages/:stageId/dispute",
        {
          params: { id: "job-1", stageId: "stage-1" },
          body: { reason: "Work was not completed properly" },
        }
      );

      const state = useJobStore.getState();
      expect(state.currentJob?.stages[0].status).toBe("in_progress");
    });
  });

  describe("Job Application Flow", () => {
    it("should fetch job with applications for customer view", async () => {
      const mockJob = createMockJob();
      const mockApplications = [
        createMockApplication(),
        createMockApplication({
          id: "app-2",
          worker_id: "worker-2",
          worker: {
            id: "worker-2",
            display_name: "Femi Electrician",
            username: "femi-electrician",
            primary_skill: "Electrical",
            trust_score: 72,
            rating: 4.3,
            completed_jobs: 28,
            location: { city: "Lagos", state: "Lagos", country: "Nigeria" },
            verification_status: "verified" as any,
            hourly_rate: 2500,
            avatar_url: null,
          },
          proposed_amount: 14000,
        }),
      ];

      mockedApiService.get
        .mockResolvedValueOnce(mockJob) // job fetch
        .mockResolvedValueOnce(mockApplications); // applications fetch

      await useJobStore.getState().fetchJobById("job-1");

      const state = useJobStore.getState();
      expect(state.currentJob).not.toBeNull();
      expect(state.applications).toHaveLength(2);
      expect(state.applications[0].proposed_amount).toBe(12000);
      expect(state.applications[1].proposed_amount).toBe(14000);
    });

    it("should reject other applications when one is accepted", async () => {
      // Set up state with multiple applications
      useJobStore.setState({
        currentJob: createMockJob(),
        applications: [
          createMockApplication({ id: "app-1", status: "pending" }),
          createMockApplication({ id: "app-2", worker_id: "worker-2", status: "pending" }),
          createMockApplication({ id: "app-3", worker_id: "worker-3", status: "pending" }),
        ],
      });

      const acceptedJob = createMockJob({
        status: "in_progress" as any,
        worker_id: "worker-1",
      });
      mockedApiService.post.mockResolvedValueOnce(acceptedJob);

      await useJobStore.getState().acceptApplication("job-1", "app-1");

      const state = useJobStore.getState();
      expect(state.applications.find((a) => a.id === "app-1")?.status).toBe("accepted");
      expect(state.applications.find((a) => a.id === "app-2")?.status).toBe("rejected");
      expect(state.applications.find((a) => a.id === "app-3")?.status).toBe("rejected");
    });
  });

  describe("Job Statistics", () => {
    it("should fetch worker job statistics", async () => {
      const mockWorkerStats = {
        total_jobs: 50,
        active_jobs: 3,
        completed_jobs: 42,
        total_earned: 1_500_000,
        pending_earnings: 45_000,
        completion_rate: 0.84,
        average_rating: 4.7,
      };

      mockedApiService.get.mockResolvedValueOnce(mockWorkerStats);

      await useJobStore.getState().fetchStats();

      const state = useJobStore.getState();
      expect(state.workerStats).toEqual(mockWorkerStats);
      expect(state.workerStats?.total_earned).toBe(1_500_000);
      expect(state.workerStats?.completion_rate).toBe(0.84);
    });
  });

  describe("Error Handling in Job Lifecycle", () => {
    it("should handle job creation failure", async () => {
      mockedApiService.post.mockRejectedValueOnce(new Error("Validation failed"));

      const jobId = await useJobStore.getState().createJob({
        title: "Test",
        description: "A".repeat(50),
        category_id: "test",
        budget_min: 1000,
        budget_max: 5000,
        location: { city: "Lagos", state: "Lagos", country: "Nigeria" },
      });

      expect(jobId).toBeNull();
      expect(useJobStore.getState().error).toBe("Validation failed");
    });

    it("should handle application failure", async () => {
      mockedApiService.post.mockRejectedValueOnce(new Error("Job no longer accepting applications"));

      const result = await useJobStore.getState().applyToJob("job-1", {
        proposed_amount: 10000,
        cover_letter: "I can do this.",
      });

      expect(result).toBe(false);
      expect(useJobStore.getState().error).toBe("Job no longer accepting applications");
    });

    it("should handle stage completion failure", async () => {
      useJobStore.setState({ currentJob: createMockJob({ status: "in_progress" as any }) });

      mockedApiService.post.mockRejectedValueOnce(new Error("Stage not in correct state"));

      const result = await useJobStore.getState().completeStage("job-1", "stage-1");

      expect(result).toBe(false);
      expect(useJobStore.getState().error).toBe("Stage not in correct state");
    });
  });
});
