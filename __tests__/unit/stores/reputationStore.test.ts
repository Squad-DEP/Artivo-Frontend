import { describe, it, expect, beforeEach, vi } from "vitest";
import { useReputationStore } from "@/store/reputationStore";

// Mock the API service
vi.mock("@/api/api-service", () => ({
  apiService: {
    get: vi.fn(),
    post: vi.fn(),
  },
}));

import { apiService } from "@/api/api-service";

const mockedApiService = vi.mocked(apiService);

const mockReputationData = {
  trust_score: {
    overall: 72,
    components: {
      completion_rate: 80,
      response_time: 70,
      customer_satisfaction: 75,
      verification_level: 60,
      tenure_months: 12,
    },
    badges: [
      {
        id: "badge-1",
        name: "Verified Identity",
        description: "Identity verified",
        icon: "shield",
        earned_at: "2024-01-01T00:00:00Z",
        category: "verification" as const,
      },
    ],
    last_updated: "2024-06-01T00:00:00Z",
    trend: "up" as const,
    trend_change: 3,
  },
  review_summary: {
    total_reviews: 15,
    average_rating: 4.5,
    rating_distribution: { 5: 8, 4: 4, 3: 2, 2: 1, 1: 0 },
    recent_reviews: [
      {
        id: "review-1",
        job_id: "job-1",
        job_title: "Plumbing Fix",
        reviewer_id: "user-1",
        reviewer_name: "Jane Doe",
        reviewee_id: "worker-1",
        rating: 5,
        comment: "Great work!",
        helpful_count: 3,
        created_at: "2024-05-15T00:00:00Z",
        updated_at: "2024-05-15T00:00:00Z",
        is_verified: true,
      },
    ],
  },
  history: [
    { date: "2024-06-01T00:00:00Z", trust_score: 72 },
    { date: "2024-05-01T00:00:00Z", trust_score: 69 },
  ],
  insights: [
    {
      type: "positive" as const,
      title: "Improving",
      description: "Your score is trending up",
      impact: 3,
    },
  ],
  rank_percentile: 75,
};

describe("reputationStore", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Reset store state
    useReputationStore.setState({
      trustScore: null,
      reviewSummary: null,
      history: [],
      insights: [],
      isLoading: false,
      error: null,
    });
  });

  describe("fetchReputation", () => {
    it("should fetch reputation data and update state", async () => {
      mockedApiService.get.mockResolvedValueOnce(mockReputationData);

      await useReputationStore.getState().fetchReputation();
      const state = useReputationStore.getState();

      expect(mockedApiService.get).toHaveBeenCalledWith("/reputation");
      expect(state.trustScore).not.toBeNull();
      expect(state.trustScore!.badges).toHaveLength(1);
      expect(state.reviewSummary).not.toBeNull();
      expect(state.reviewSummary!.total_reviews).toBe(15);
      expect(state.history).toHaveLength(2);
      expect(state.insights).toHaveLength(1);
      expect(state.isLoading).toBe(false);
      expect(state.error).toBeNull();
    });

    it("should calculate trust score using score-utils", async () => {
      mockedApiService.get.mockResolvedValueOnce(mockReputationData);

      await useReputationStore.getState().fetchReputation();
      const state = useReputationStore.getState();

      // Expected: 80*0.30 + 70*0.20 + 75*0.25 + 60*0.15 + 12*0.10
      // = 24 + 14 + 18.75 + 9 + 1.2 = 66.95
      expect(state.trustScore!.overall).toBeCloseTo(66.95, 1);
    });

    it("should retain previous score on API error (Requirement 6.8)", async () => {
      // First, set some existing state
      useReputationStore.setState({
        trustScore: mockReputationData.trust_score,
      });

      mockedApiService.get.mockRejectedValueOnce(new Error("Service unavailable"));

      await useReputationStore.getState().fetchReputation();
      const state = useReputationStore.getState();

      // Previous trust score should be retained
      expect(state.trustScore).not.toBeNull();
      expect(state.trustScore!.overall).toBe(72);
      expect(state.error).toBe("Service unavailable");
      expect(state.isLoading).toBe(false);
    });

    it("should set loading state during fetch", async () => {
      let loadingDuringFetch = false;

      mockedApiService.get.mockImplementationOnce(async () => {
        loadingDuringFetch = useReputationStore.getState().isLoading;
        return mockReputationData;
      });

      await useReputationStore.getState().fetchReputation();

      expect(loadingDuringFetch).toBe(true);
      expect(useReputationStore.getState().isLoading).toBe(false);
    });
  });

  describe("fetchReviews", () => {
    it("should fetch reviews and update reviewSummary", async () => {
      const mockReviewSummary = {
        total_reviews: 10,
        average_rating: 4.2,
        rating_distribution: { 5: 5, 4: 3, 3: 1, 2: 1, 1: 0 },
        recent_reviews: [],
      };

      mockedApiService.get.mockResolvedValueOnce(mockReviewSummary);

      await useReputationStore.getState().fetchReviews();
      const state = useReputationStore.getState();

      expect(mockedApiService.get).toHaveBeenCalledWith("/reputation/reviews", {
        query: {},
      });
      expect(state.reviewSummary).toEqual(mockReviewSummary);
      expect(state.isLoading).toBe(false);
      expect(state.error).toBeNull();
    });

    it("should pass page parameter when provided", async () => {
      mockedApiService.get.mockResolvedValueOnce({
        total_reviews: 10,
        average_rating: 4.2,
        rating_distribution: { 5: 5, 4: 3, 3: 1, 2: 1, 1: 0 },
        recent_reviews: [],
      });

      await useReputationStore.getState().fetchReviews(2);

      expect(mockedApiService.get).toHaveBeenCalledWith("/reputation/reviews", {
        query: { page: "2" },
      });
    });

    it("should set error on failure", async () => {
      mockedApiService.get.mockRejectedValueOnce(new Error("Network error"));

      await useReputationStore.getState().fetchReviews();
      const state = useReputationStore.getState();

      expect(state.error).toBe("Network error");
      expect(state.isLoading).toBe(false);
    });
  });

  describe("respondToReview", () => {
    beforeEach(() => {
      useReputationStore.setState({
        reviewSummary: mockReputationData.review_summary,
      });
    });

    it("should post response and update local state", async () => {
      mockedApiService.post.mockResolvedValueOnce({
        id: "review-1",
        response: "Thank you!",
        response_at: "2024-06-01T00:00:00Z",
      });

      const result = await useReputationStore
        .getState()
        .respondToReview("review-1", "Thank you!");

      expect(result).toBe(true);
      expect(mockedApiService.post).toHaveBeenCalledWith(
        "/reputation/reviews/:id/respond",
        {
          params: { id: "review-1" },
          body: { response: "Thank you!" },
        }
      );

      const state = useReputationStore.getState();
      const updatedReview = state.reviewSummary!.recent_reviews.find(
        (r) => r.id === "review-1"
      );
      expect(updatedReview!.response).toBe("Thank you!");
      expect(updatedReview!.response_at).toBeDefined();
    });

    it("should return false and set error on failure", async () => {
      mockedApiService.post.mockRejectedValueOnce(new Error("Forbidden"));

      const result = await useReputationStore
        .getState()
        .respondToReview("review-1", "Thanks");

      expect(result).toBe(false);
      expect(useReputationStore.getState().error).toBe("Forbidden");
    });

    it("should handle responding when reviewSummary is null", async () => {
      useReputationStore.setState({ reviewSummary: null });

      mockedApiService.post.mockResolvedValueOnce({
        id: "review-1",
        response: "Thank you!",
      });

      const result = await useReputationStore
        .getState()
        .respondToReview("review-1", "Thank you!");

      expect(result).toBe(true);
      // Should not throw even when reviewSummary is null
      expect(useReputationStore.getState().reviewSummary).toBeNull();
    });
  });
});
