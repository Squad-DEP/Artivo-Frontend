import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { useWorkerJobStore } from "@/store/workerJobStore";
import type { StreamedJob } from "@/api/types/marketplace-api";

vi.mock("@/api/api-service", () => ({
  apiService: {
    get: vi.fn(),
    post: vi.fn(),
  },
  getApiBaseUrl: () => "http://localhost:8080/api",
}));

vi.mock("@/store/authStore", () => ({
  useAuthStore: {
    getState: () => ({
      user: { id: "worker-user-id", email: "artisan@example.com", access_token: "test-auth-token" },
    }),
  },
}));

import { apiService } from "@/api/api-service";
const mockedApiService = vi.mocked(apiService);

function createMockStreamedJob(overrides: Partial<StreamedJob> = {}): StreamedJob {
  return {
    id: "job-req-1",
    title: "Fix Kitchen Plumbing",
    description: "Need a plumber to fix leaking pipes",
    location: "Lagos",
    budget: 15000,
    job_type: "Plumbing",
    customer_name: "Chioma Okafor",
    created_at: "2024-01-15T10:00:00Z",
    ...overrides,
  };
}

describe("Integration: Worker Job Flow (Subscribe → Poll → Accept)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
    useWorkerJobStore.getState().reset();
  });

  afterEach(() => {
    useWorkerJobStore.getState().stopPolling();
    vi.useRealTimers();
  });

  describe("Full Flow: Fetch Job Types → Subscribe → Fetch Jobs → Accept", () => {
    it("should complete the full artisan job discovery and acceptance flow", async () => {
      // Step 1: Fetch available job types
      const jobTypesResponse = [
        { id: "jt-plumbing", name: "Plumbing", description: "Plumbing and pipe repair services" },
        { id: "jt-electrical", name: "Electrical", description: "Electrical wiring and repair" },
        { id: "jt-painting", name: "Painting", description: "Interior and exterior painting" },
      ];
      mockedApiService.get.mockResolvedValueOnce(jobTypesResponse);
      await useWorkerJobStore.getState().fetchJobTypes();

      let state = useWorkerJobStore.getState();
      expect(state.availableJobTypes).toHaveLength(3);
      expect(state.availableJobTypes[0].id).toBe("jt-plumbing");
      expect(state.availableJobTypes[1].name).toBe("Electrical");
      expect(state.error).toBeNull();

      // Step 2: Subscribe to a job type
      const subscriptionResponse = {
        subscription: { id: "sub-1", job_type_id: "jt-plumbing", created_at: "2024-01-15T09:00:00Z" },
      };
      mockedApiService.post.mockResolvedValueOnce(subscriptionResponse);
      const subscribeResult = await useWorkerJobStore.getState().subscribe("jt-plumbing");

      expect(subscribeResult).toBe(true);
      state = useWorkerJobStore.getState();
      expect(state.subscriptions).toHaveLength(1);
      expect(state.subscriptions[0].job_type_id).toBe("jt-plumbing");

      // Step 3: Fetch jobs → verify streamedJobs populated
      const jobsResponse = {
        jobs: [
          createMockStreamedJob({ id: "job-req-1", title: "Fix Kitchen Plumbing", budget: 15000 }),
          createMockStreamedJob({ id: "job-req-2", title: "Bathroom Pipe Repair", budget: 20000, customer_name: "Emeka Nwosu" }),
        ],
      };
      mockedApiService.get.mockResolvedValueOnce(jobsResponse);
      await useWorkerJobStore.getState().fetchJobs();

      state = useWorkerJobStore.getState();
      expect(state.streamedJobs).toHaveLength(2);
      expect(state.streamedJobs[0].id).toBe("job-req-1");
      expect(state.streamedJobs[1].budget).toBe(20000);

      // Step 4: Accept a job → verify it's removed from feed
      mockedApiService.post.mockResolvedValueOnce({ msg: "Job accepted successfully" });
      // fetchProposals called after accept
      mockedApiService.get.mockResolvedValueOnce({ proposals: [] });

      const acceptResult = await useWorkerJobStore.getState().acceptJob("job-req-1", 14000);

      expect(acceptResult).toBe(true);
      expect(mockedApiService.post).toHaveBeenCalledWith("/worker/accept-job", {
        body: { job_request_id: "job-req-1", proposed_amount: 14000 },
      });

      state = useWorkerJobStore.getState();
      expect(state.streamedJobs).toHaveLength(1);
      expect(state.streamedJobs[0].id).toBe("job-req-2");
      expect(state.isLoading).toBe(false);
      expect(state.error).toBeNull();
    });

    it("should handle 409 conflict when accepting a job already taken", async () => {
      mockedApiService.get.mockResolvedValueOnce({
        jobs: [
          createMockStreamedJob({ id: "job-req-1" }),
          createMockStreamedJob({ id: "job-req-2", title: "Paint Living Room" }),
        ],
      });
      await useWorkerJobStore.getState().fetchJobs();

      expect(useWorkerJobStore.getState().streamedJobs).toHaveLength(2);

      mockedApiService.post.mockRejectedValueOnce(
        new Error("409: Job already accepted by another worker")
      );
      const acceptResult = await useWorkerJobStore.getState().acceptJob("job-req-1", 14000);

      expect(acceptResult).toBe(false);
      const state = useWorkerJobStore.getState();
      expect(state.error).toBe("This job has already been accepted by another worker");
      expect(state.streamedJobs).toHaveLength(1);
      expect(state.streamedJobs[0].id).toBe("job-req-2");
    });
  });

  describe("Polling Lifecycle", () => {
    it("should replace jobs list on each poll (not accumulate)", async () => {
      mockedApiService.get.mockResolvedValueOnce({ jobs: [createMockStreamedJob({ id: "job-1" })] });
      await useWorkerJobStore.getState().fetchJobs();
      expect(useWorkerJobStore.getState().streamedJobs).toHaveLength(1);

      // Second poll returns different jobs
      mockedApiService.get.mockResolvedValueOnce({
        jobs: [
          createMockStreamedJob({ id: "job-2" }),
          createMockStreamedJob({ id: "job-3" }),
        ],
      });
      await useWorkerJobStore.getState().fetchJobs();

      const state = useWorkerJobStore.getState();
      expect(state.streamedJobs).toHaveLength(2);
      expect(state.streamedJobs.map((j) => j.id)).toEqual(["job-2", "job-3"]);
    });

    it("should stop polling on stopPolling()", async () => {
      mockedApiService.get.mockResolvedValue({ jobs: [] });
      useWorkerJobStore.getState().startPolling();
      await vi.runAllTimersAsync();

      useWorkerJobStore.getState().stopPolling();
      const callsBefore = mockedApiService.get.mock.calls.length;

      vi.advanceTimersByTime(30_000);
      expect(mockedApiService.get.mock.calls.length).toBe(callsBefore);
    });
  });

  describe("Subscription Management", () => {
    it("should manage multiple subscriptions independently", async () => {
      mockedApiService.post.mockResolvedValueOnce({
        subscription: { id: "sub-1", job_type_id: "jt-plumbing", created_at: "2024-01-15T09:00:00Z" },
      });
      await useWorkerJobStore.getState().subscribe("jt-plumbing");

      mockedApiService.post.mockResolvedValueOnce({
        subscription: { id: "sub-2", job_type_id: "jt-electrical", created_at: "2024-01-15T09:01:00Z" },
      });
      await useWorkerJobStore.getState().subscribe("jt-electrical");

      expect(useWorkerJobStore.getState().subscriptions).toHaveLength(2);

      mockedApiService.post.mockResolvedValueOnce({ msg: "Unsubscribed" });
      await useWorkerJobStore.getState().unsubscribe("jt-plumbing");

      const state = useWorkerJobStore.getState();
      expect(state.subscriptions).toHaveLength(1);
      expect(state.subscriptions[0].job_type_id).toBe("jt-electrical");
    });

    it("should handle subscription failure gracefully", async () => {
      mockedApiService.post.mockRejectedValueOnce(new Error("Failed to subscribe to job type"));
      const result = await useWorkerJobStore.getState().subscribe("jt-plumbing");

      expect(result).toBe(false);
      expect(useWorkerJobStore.getState().subscriptions).toHaveLength(0);
      expect(useWorkerJobStore.getState().error).toBe("Failed to subscribe to job type");
    });
  });

  describe("Error Recovery", () => {
    it("should allow accepting another job after a conflict error", async () => {
      mockedApiService.get.mockResolvedValueOnce({
        jobs: [
          createMockStreamedJob({ id: "job-req-1" }),
          createMockStreamedJob({ id: "job-req-2", title: "Paint Wall" }),
          createMockStreamedJob({ id: "job-req-3", title: "Fix Wiring" }),
        ],
      });
      await useWorkerJobStore.getState().fetchJobs();

      mockedApiService.post.mockRejectedValueOnce(new Error("409: already accepted"));
      await useWorkerJobStore.getState().acceptJob("job-req-1", 14000);

      expect(useWorkerJobStore.getState().error).toBe("This job has already been accepted by another worker");
      expect(useWorkerJobStore.getState().streamedJobs).toHaveLength(2);

      mockedApiService.post.mockResolvedValueOnce({ msg: "Job accepted" });
      mockedApiService.get.mockResolvedValueOnce({ proposals: [] });
      const result = await useWorkerJobStore.getState().acceptJob("job-req-2", 10000);

      expect(result).toBe(true);
      expect(useWorkerJobStore.getState().error).toBeNull();
      expect(useWorkerJobStore.getState().streamedJobs).toHaveLength(1);
    });

    it("should reset all state cleanly", async () => {
      mockedApiService.get.mockResolvedValueOnce([{ id: "jt-1", name: "Plumbing", description: "Plumbing" }]);
      await useWorkerJobStore.getState().fetchJobTypes();

      mockedApiService.post.mockResolvedValueOnce({
        subscription: { id: "sub-1", job_type_id: "jt-1", created_at: "2024-01-15T09:00:00Z" },
      });
      await useWorkerJobStore.getState().subscribe("jt-1");

      mockedApiService.get.mockResolvedValueOnce({ jobs: [createMockStreamedJob()] });
      await useWorkerJobStore.getState().fetchJobs();

      expect(useWorkerJobStore.getState().streamedJobs).toHaveLength(1);

      useWorkerJobStore.getState().reset();

      const state = useWorkerJobStore.getState();
      expect(state.availableJobTypes).toEqual([]);
      expect(state.subscriptions).toEqual([]);
      expect(state.streamedJobs).toEqual([]);
      expect(state.proposals).toEqual([]);
      expect(state.isLoading).toBe(false);
      expect(state.error).toBeNull();
    });
  });
});
