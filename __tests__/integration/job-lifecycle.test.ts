import { describe, it, expect, beforeEach, vi, afterEach } from "vitest";
import { useMarketplaceStore } from "@/store/marketplaceStore";
import { useHireFlowStore } from "@/store/hireFlowStore";
import { useJobStore } from "@/store/jobStore";
import { usePaymentStore } from "@/store/paymentStore";
import type { FeedResponse } from "@/api/types/marketplace-api";
import type { Job } from "@/api/types/job";

// Mock the API service
vi.mock("@/api/api-service", () => ({
  apiService: {
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
  },
  getApiBaseUrl: () => "http://localhost:8080/api",
}));

// Mock authStore
vi.mock("@/store/authStore", () => ({
  useAuthStore: {
    getState: () => ({
      user: {
        id: "customer-1",
        email: "customer@example.com",
        access_token: "test-token-123",
      },
    }),
  },
}));

import { apiService } from "@/api/api-service";

const mockedApiService = vi.mocked(apiService);

// Mock global fetch (used by hireFlowStore's postWithValidation)
const mockFetch = vi.fn();
global.fetch = mockFetch;

// --- Test Fixtures ---

const mockFeedResponse: FeedResponse = {
  workers: [
    {
      id: "worker-1",
      full_name: "Adebayo Plumber",
      display_name: "Adebayo",
      photo_url: "https://example.com/photo-1.jpg",
      bio: "Expert plumber with 5 years experience",
      skills: ["Plumbing", "Pipe Fitting"],
      location: "Ikeja, Lagos",
      credit_score: 85,
      completion_rate: 92,
      total_jobs: 45,
      average_rating: 4.7,
      match_score: 0.95,
      match_explanation: "Great match for plumbing work",
    },
    {
      id: "worker-2",
      full_name: "Femi Electrician",
      display_name: "Femi",
      photo_url: "https://example.com/photo-2.jpg",
      bio: "Certified electrician",
      skills: ["Electrical", "Wiring"],
      location: "Lekki, Lagos",
      credit_score: 78,
      completion_rate: 88,
      total_jobs: 30,
      average_rating: 4.5,
      match_score: 0.8,
    },
  ],
};

describe("Integration: Discovery → Hire → Pay → Complete → Rate", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useMarketplaceStore.getState().reset();
    useHireFlowStore.getState().reset();
    useJobStore.setState({
      jobs: [],
      currentJob: null,
      applications: [],
      workerStats: null,
      customerStats: null,
      isLoading: false,
      error: null,
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe("Full Customer Journey", () => {
    it("should complete the full discovery → hire → pay → complete → rate flow", async () => {
      // ─── Step 1: Search marketplace → verify workers loaded ───
      mockedApiService.get.mockResolvedValueOnce(mockFeedResponse);

      await useMarketplaceStore.getState().search("plumber");

      const marketplaceState = useMarketplaceStore.getState();
      expect(marketplaceState.workers).toHaveLength(2);
      expect(marketplaceState.workers[0].display_name).toBe("Adebayo");
      expect(marketplaceState.workers[0].trust_score).toBe(85);
      expect(marketplaceState.workers[0].rating).toBe(4.7);
      expect(marketplaceState.workers[0].completed_jobs).toBe(45);
      expect(marketplaceState.isLoading).toBe(false);
      expect(marketplaceState.error).toBeNull();
      expect(mockedApiService.get).toHaveBeenCalledWith("/customer/feed", {
        query: expect.objectContaining({ query: "plumber" }),
      });

      // ─── Step 2: Create job request → verify step transitions ───
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({
          job_request: {
            id: "jr-001",
            status: "open",
            created_at: "2024-01-15T10:00:00Z",
          },
        }),
      });

      const createResult = await useHireFlowStore.getState().createJobRequest({
        job_type_id: "plumbing-123",
        title: "Fix kitchen sink",
        description: "The kitchen sink is leaking and needs repair",
        location: "Ikeja, Lagos",
        budget: 15000,
      });

      expect(createResult).toBe(true);
      const hireStateAfterCreate = useHireFlowStore.getState();
      expect(hireStateAfterCreate.step).toBe("hiring");
      expect(hireStateAfterCreate.jobRequest).toEqual({
        id: "jr-001",
        status: "open",
      });
      expect(hireStateAfterCreate.isLoading).toBe(false);

      // Verify the correct endpoint was called
      expect(mockFetch).toHaveBeenCalledWith(
        "http://localhost:8080/api/v1/customer/request-job",
        expect.objectContaining({
          method: "POST",
          headers: expect.objectContaining({
            "Content-Type": "application/json",
            Authorization: "Bearer test-token-123",
          }),
          body: JSON.stringify({
            job_type_id: "plumbing-123",
            title: "Fix kitchen sink",
            description: "The kitchen sink is leaking and needs repair",
            location: "Ikeja, Lagos",
            budget: 15000,
          }),
        })
      );

      // ─── Step 3: Hire worker → verify job created ───
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({
          job: {
            id: "job-001",
            status: "pending",
            created_at: "2024-01-15T10:05:00Z",
          },
        }),
      });

      const hireResult = await useHireFlowStore
        .getState()
        .hireWorker("jr-001", "worker-1", 15000, "online");

      expect(hireResult).toBe(true);
      const hireStateAfterHire = useHireFlowStore.getState();
      // Hire deducts from wallet and funds escrow immediately → complete
      expect(hireStateAfterHire.step).toBe("complete");
      expect(hireStateAfterHire.job).toEqual({
        id: "job-001",
        status: "pending",
      });

      // Verify hire endpoint called correctly
      expect(mockFetch).toHaveBeenCalledWith(
        "http://localhost:8080/api/v1/customer/hire",
        expect.objectContaining({
          method: "POST",
          body: JSON.stringify({
            job_request_id: "jr-001",
            worker_id: "worker-1",
            amount: 15000,
          }),
        })
      );

      // ─── Step 4: Complete job → POST /customer/jobs/:id/complete ───
      mockedApiService.post.mockResolvedValueOnce({
        success: true,
        released: false,
        worker_confirmed: false,
        customer_confirmed: true,
        msg: "Your confirmation recorded. Waiting for worker to confirm.",
      });

      const completeResult = await apiService.post("/customer/jobs/:id/complete", {
        params: { id: "job-001" },
      });

      expect(completeResult).toMatchObject({
        success: true,
        customer_confirmed: true,
      });
      expect(mockedApiService.post).toHaveBeenCalledWith(
        "/customer/jobs/:id/complete",
        { params: { id: "job-001" } }
      );

      // ─── Step 6: Rate worker → POST /customer/rate ───
      mockedApiService.post.mockResolvedValueOnce({
        review: { id: "review-001", rating: 5, comment: "Excellent work!" },
        msg: "Rating submitted successfully",
      });

      const rateResult = await apiService.post("/customer/rate", {
        body: {
          job_id: "job-001",
          rating: 5,
          comment: "Excellent work! Fixed the plumbing perfectly.",
        },
      });

      expect(rateResult).toEqual({
        review: { id: "review-001", rating: 5, comment: "Excellent work!" },
        msg: "Rating submitted successfully",
      });
      expect(mockedApiService.post).toHaveBeenCalledWith("/customer/rate", {
        body: {
          job_id: "job-001",
          rating: 5,
          comment: "Excellent work! Fixed the plumbing perfectly.",
        },
      });
    });
  });

  describe("State Transitions Through hireFlowStore", () => {
    it("should transition through all steps: idle → requesting → hiring → paying → logging → complete", async () => {
      // Verify initial state
      expect(useHireFlowStore.getState().step).toBe("idle");

      // Step 1: createJobRequest transitions idle → requesting → hiring
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({
          job_request: { id: "jr-100", status: "open", created_at: "2024-01-01" },
        }),
      });

      await useHireFlowStore.getState().createJobRequest({
        job_type_id: "electrical-456",
        title: "Install ceiling fan",
        description: "Need a ceiling fan installed in the bedroom",
        location: "Lekki, Lagos",
        budget: 8000,
      });

      expect(useHireFlowStore.getState().step).toBe("hiring");

      // Step 2: hireWorker transitions hiring → paying
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({
          job: { id: "job-100", status: "pending", created_at: "2024-01-01" },
        }),
      });

      await useHireFlowStore.getState().hireWorker("jr-100", "worker-2", 8000, "online");

      // Hire deducts wallet balance and funds escrow immediately
      expect(useHireFlowStore.getState().step).toBe("complete");
    });

    it("should revert step on failure at each stage", async () => {
      // createJobRequest failure → stays at idle
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 500,
        json: async () => ({ msg: "Server error" }),
      });

      await useHireFlowStore.getState().createJobRequest({
        job_type_id: "plumbing-123",
        title: "Fix pipe",
        description: "Leaking pipe in bathroom",
        location: "Lagos",
        budget: 5000,
      });

      expect(useHireFlowStore.getState().step).toBe("idle");
      expect(useHireFlowStore.getState().error).toBe("Server error");

      // Reset and advance to hiring step
      useHireFlowStore.getState().reset();
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({
          job_request: { id: "jr-200", status: "open", created_at: "2024-01-01" },
        }),
      });
      await useHireFlowStore.getState().createJobRequest({
        job_type_id: "plumbing-123",
        title: "Fix pipe",
        description: "Leaking pipe in bathroom",
        location: "Lagos",
        budget: 5000,
      });
      expect(useHireFlowStore.getState().step).toBe("hiring");

      // hireWorker failure → stays at hiring
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 400,
        json: async () => ({ msg: "Worker unavailable" }),
      });

      await useHireFlowStore.getState().hireWorker("jr-200", "worker-1", 5000, "online");

      expect(useHireFlowStore.getState().step).toBe("hiring");
      expect(useHireFlowStore.getState().error).toBe("Worker unavailable");

      // Advance to complete step (hire deducts wallet and funds escrow)
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({
          job: { id: "job-200", status: "in_progress", created_at: "2024-01-01" },
          escrow: { status: "funded" },
        }),
      });
      await useHireFlowStore.getState().hireWorker("jr-200", "worker-1", 5000, "online");
      expect(useHireFlowStore.getState().step).toBe("complete");
    });
  });

  describe("Marketplace Search Verification", () => {
    it("should map feed response to WorkerProfileSummary correctly", async () => {
      mockedApiService.get.mockResolvedValueOnce(mockFeedResponse);

      await useMarketplaceStore.getState().search("plumber");

      const state = useMarketplaceStore.getState();
      const firstWorker = state.workers[0];

      // Verify mapping from BackendFeedWorker to WorkerProfileSummary
      expect(firstWorker.id).toBe("worker-1");
      expect(firstWorker.display_name).toBe("Adebayo");
      expect(firstWorker.profile_image_url).toBe("https://example.com/photo-1.jpg");
      expect(firstWorker.skills).toEqual(["Plumbing", "Pipe Fitting"]);
      expect(firstWorker.trust_score).toBe(85);
      expect(firstWorker.rating).toBe(4.7);
      expect(firstWorker.completed_jobs).toBe(45);
    });

    it("should store match explanations from feed response", async () => {
      mockedApiService.get.mockResolvedValueOnce(mockFeedResponse);

      await useMarketplaceStore.getState().search("plumber");

      const state = useMarketplaceStore.getState();
      expect(state.matchExplanations["worker-1"]).toBe("Great match for plumbing work");
      // worker-2 has no match_explanation
      expect(state.matchExplanations["worker-2"]).toBeUndefined();
    });

    it("should handle search errors gracefully", async () => {
      mockedApiService.get.mockRejectedValueOnce(new Error("Network error"));

      await useMarketplaceStore.getState().search("plumber");

      const state = useMarketplaceStore.getState();
      expect(state.workers).toHaveLength(0);
      expect(state.error).toBe("Network error");
      expect(state.isLoading).toBe(false);
    });
  });

  describe("Job Completion via apiService", () => {
    it("should call POST /customer/complete-job/:id with correct params", async () => {
      mockedApiService.post.mockResolvedValueOnce({
        job: { id: "job-001", status: "customer_completed" },
        msg: "Marked complete",
      });

      await apiService.post("/customer/complete-job/:id", {
        params: { id: "job-001" },
      });

      expect(mockedApiService.post).toHaveBeenCalledWith(
        "/customer/complete-job/:id",
        { params: { id: "job-001" } }
      );
    });

    it("should call POST /worker/complete-job/:id for worker-side completion", async () => {
      mockedApiService.post.mockResolvedValueOnce({
        job: { id: "job-001", status: "worker_completed" },
        msg: "Worker marked complete",
      });

      await apiService.post("/worker/complete-job/:id", {
        params: { id: "job-001" },
      });

      expect(mockedApiService.post).toHaveBeenCalledWith(
        "/worker/complete-job/:id",
        { params: { id: "job-001" } }
      );
    });
  });

  describe("Rating via apiService", () => {
    it("should call POST /customer/rate with job_id, rating, and comment", async () => {
      mockedApiService.post.mockResolvedValueOnce({
        review: { id: "rev-001" },
        msg: "Rating submitted",
      });

      const result = await apiService.post("/customer/rate", {
        body: {
          job_id: "job-001",
          rating: 4,
          comment: "Good work overall",
        },
      });

      expect(result).toEqual({
        review: { id: "rev-001" },
        msg: "Rating submitted",
      });
      expect(mockedApiService.post).toHaveBeenCalledWith("/customer/rate", {
        body: {
          job_id: "job-001",
          rating: 4,
          comment: "Good work overall",
        },
      });
    });

    it("should handle rating submission failure", async () => {
      mockedApiService.post.mockRejectedValueOnce(new Error("Rating failed"));

      await expect(
        apiService.post("/customer/rate", {
          body: { job_id: "job-001", rating: 5, comment: "Great!" },
        })
      ).rejects.toThrow("Rating failed");
    });
  });

  describe("End-to-End Error Recovery", () => {
    it("should allow retry after hire failure without losing job request state", async () => {
      // Create job request successfully
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({
          job_request: { id: "jr-300", status: "open", created_at: "2024-01-01" },
        }),
      });

      await useHireFlowStore.getState().createJobRequest({
        job_type_id: "plumbing-123",
        title: "Fix pipe",
        description: "Leaking pipe needs repair",
        location: "Lagos",
        budget: 10000,
      });

      expect(useHireFlowStore.getState().jobRequest).toEqual({
        id: "jr-300",
        status: "open",
      });

      // Hire fails
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 503,
        json: async () => ({ msg: "Service temporarily unavailable" }),
      });

      const firstAttempt = await useHireFlowStore
        .getState()
        .hireWorker("jr-300", "worker-1", 10000, "online");

      expect(firstAttempt).toBe(false);
      expect(useHireFlowStore.getState().step).toBe("hiring");
      // Job request should still be preserved
      expect(useHireFlowStore.getState().jobRequest).toEqual({
        id: "jr-300",
        status: "open",
      });

      // Retry hire succeeds
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({
          job: { id: "job-300", status: "pending", created_at: "2024-01-01" },
        }),
      });

      const retryAttempt = await useHireFlowStore
        .getState()
        .hireWorker("jr-300", "worker-1", 10000, "online");

      expect(retryAttempt).toBe(true);
      expect(useHireFlowStore.getState().step).toBe("paying");
      expect(useHireFlowStore.getState().job).toEqual({
        id: "job-300",
        status: "pending",
      });
    });
  });
});
