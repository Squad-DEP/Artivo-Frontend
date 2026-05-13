import { describe, it, expect, beforeEach, vi } from "vitest";
import { useMarketplaceStore, buildQueryParams } from "@/store/marketplaceStore";
import type { FeedResponse } from "@/api/types/marketplace-api";

// Mock the API service
vi.mock("@/api/api-service", () => ({
  apiService: {
    get: vi.fn(),
    post: vi.fn(),
  },
}));

import { apiService } from "@/api/api-service";

const mockedApiService = vi.mocked(apiService);

const makeFeedResponse = (count: number, withExplanation = false): FeedResponse => ({
  workers: Array.from({ length: count }, (_, i) => ({
    id: `worker-${i + 1}`,
    full_name: `Worker ${i + 1}`,
    display_name: `Display ${i + 1}`,
    photo_url: `https://example.com/photo-${i + 1}.jpg`,
    bio: `Bio for worker ${i + 1}`,
    skills: ["Plumbing", "Electrical"],
    location: "Ikeja, Lagos",
    credit_score: 80 + i,
    completion_rate: 90 + i,
    total_jobs: 10 + i,
    average_rating: 4.5,
    match_score: 0.9,
    match_explanation: withExplanation ? `Great match for worker ${i + 1}` : undefined,
  })),
});

describe("marketplaceStore", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useMarketplaceStore.getState().reset();
  });

  describe("search()", () => {
    it("should call GET /customer/feed with query params", async () => {
      const feedResponse = makeFeedResponse(2);
      mockedApiService.get.mockResolvedValueOnce(feedResponse);

      await useMarketplaceStore.getState().search("plumber");

      expect(mockedApiService.get).toHaveBeenCalledWith("/customer/feed", {
        query: expect.objectContaining({
          query: "plumber",
          page: "1",
          limit: "20",
        }),
      });
    });

    it("should include filters in query params when searching", async () => {
      const feedResponse = makeFeedResponse(1);
      mockedApiService.get.mockResolvedValueOnce(feedResponse);

      useMarketplaceStore.getState().setFilters({
        category: "plumbing-id",
        location: { city: "Ikeja", state: "Lagos" },
      });

      await useMarketplaceStore.getState().search("fix pipe");

      expect(mockedApiService.get).toHaveBeenCalledWith("/customer/feed", {
        query: expect.objectContaining({
          query: "fix pipe",
          job_type_id: "plumbing-id",
          location: "Ikeja, Lagos",
        }),
      });
    });

    it("should set isLoading to true during fetch and false after", async () => {
      mockedApiService.get.mockImplementation(
        () => new Promise((resolve) => setTimeout(() => resolve(makeFeedResponse(1)), 10))
      );

      const promise = useMarketplaceStore.getState().search("test");
      expect(useMarketplaceStore.getState().isLoading).toBe(true);

      await promise;
      expect(useMarketplaceStore.getState().isLoading).toBe(false);
    });

    it("should reset page to 1 on new search", async () => {
      mockedApiService.get.mockResolvedValueOnce(makeFeedResponse(1));

      await useMarketplaceStore.getState().search("new query");
      const state = useMarketplaceStore.getState();

      expect(state.page).toBe(1);
      expect(state.searchQuery).toBe("new query");
    });
  });

  describe("applyFilters()", () => {
    it("should map category filter to job_type_id param", async () => {
      mockedApiService.get.mockResolvedValueOnce(makeFeedResponse(1));

      useMarketplaceStore.getState().setFilters({ category: "electrical-id" });
      await useMarketplaceStore.getState().applyFilters();

      expect(mockedApiService.get).toHaveBeenCalledWith("/customer/feed", {
        query: expect.objectContaining({
          job_type_id: "electrical-id",
        }),
      });
    });

    it("should map location filter to location string (city, state)", async () => {
      mockedApiService.get.mockResolvedValueOnce(makeFeedResponse(1));

      useMarketplaceStore.getState().setFilters({
        location: { city: "Ikeja", state: "Lagos" },
      });
      await useMarketplaceStore.getState().applyFilters();

      expect(mockedApiService.get).toHaveBeenCalledWith("/customer/feed", {
        query: expect.objectContaining({
          location: "Ikeja, Lagos",
        }),
      });
    });

    it("should use only city when state is not provided", async () => {
      mockedApiService.get.mockResolvedValueOnce(makeFeedResponse(1));

      useMarketplaceStore.getState().setFilters({
        location: { city: "Ikeja" },
      });
      await useMarketplaceStore.getState().applyFilters();

      expect(mockedApiService.get).toHaveBeenCalledWith("/customer/feed", {
        query: expect.objectContaining({
          location: "Ikeja",
        }),
      });
    });

    it("should use only state when city is not provided", async () => {
      mockedApiService.get.mockResolvedValueOnce(makeFeedResponse(1));

      useMarketplaceStore.getState().setFilters({
        location: { state: "Lagos" },
      });
      await useMarketplaceStore.getState().applyFilters();

      expect(mockedApiService.get).toHaveBeenCalledWith("/customer/feed", {
        query: expect.objectContaining({
          location: "Lagos",
        }),
      });
    });

    it("should use single value when city equals state", async () => {
      mockedApiService.get.mockResolvedValueOnce(makeFeedResponse(1));

      useMarketplaceStore.getState().setFilters({
        location: { city: "Lagos", state: "Lagos" },
      });
      await useMarketplaceStore.getState().applyFilters();

      expect(mockedApiService.get).toHaveBeenCalledWith("/customer/feed", {
        query: expect.objectContaining({
          location: "Lagos",
        }),
      });
    });
  });

  describe("response mapping via mapFeedWorkerToSummary", () => {
    it("should map backend workers to WorkerProfileSummary", async () => {
      const feedResponse = makeFeedResponse(1);
      mockedApiService.get.mockResolvedValueOnce(feedResponse);

      await useMarketplaceStore.getState().search("test");
      const state = useMarketplaceStore.getState();

      expect(state.workers).toHaveLength(1);
      const worker = state.workers[0];
      expect(worker.id).toBe("worker-1");
      expect(worker.display_name).toBe("Display 1");
      expect(worker.profile_image_url).toBe("https://example.com/photo-1.jpg");
      expect(worker.skills).toEqual(["Plumbing", "Electrical"]);
      expect(worker.trust_score).toBe(80);
      expect(worker.rating).toBe(4.5);
      expect(worker.completed_jobs).toBe(10);
      expect(worker.location).toEqual({ city: "Ikeja", state: "Lagos" });
    });

    it("should populate matchExplanations from response", async () => {
      const feedResponse = makeFeedResponse(2, true);
      mockedApiService.get.mockResolvedValueOnce(feedResponse);

      await useMarketplaceStore.getState().search("test");
      const state = useMarketplaceStore.getState();

      expect(state.matchExplanations["worker-1"]).toBe("Great match for worker 1");
      expect(state.matchExplanations["worker-2"]).toBe("Great match for worker 2");
    });

    it("should not include matchExplanation entries for workers without one", async () => {
      const feedResponse = makeFeedResponse(2, false);
      mockedApiService.get.mockResolvedValueOnce(feedResponse);

      await useMarketplaceStore.getState().search("test");
      const state = useMarketplaceStore.getState();

      expect(Object.keys(state.matchExplanations)).toHaveLength(0);
    });
  });

  describe("error handling", () => {
    it("should set error state when API call fails with Error", async () => {
      mockedApiService.get.mockRejectedValueOnce(new Error("Network timeout"));

      await useMarketplaceStore.getState().search("test");
      const state = useMarketplaceStore.getState();

      expect(state.error).toBe("Network timeout");
      expect(state.isLoading).toBe(false);
      expect(state.workers).toHaveLength(0);
    });

    it("should set generic error message for non-Error exceptions", async () => {
      mockedApiService.get.mockRejectedValueOnce("unknown error");

      await useMarketplaceStore.getState().search("test");
      const state = useMarketplaceStore.getState();

      expect(state.error).toBe("Failed to search workers");
      expect(state.isLoading).toBe(false);
    });

    it("should set error state when applyFilters fails", async () => {
      mockedApiService.get.mockRejectedValueOnce(new Error("Server error"));

      await useMarketplaceStore.getState().applyFilters();
      const state = useMarketplaceStore.getState();

      expect(state.error).toBe("Server error");
      expect(state.isLoading).toBe(false);
    });

    it("should clear error on successful subsequent call", async () => {
      mockedApiService.get.mockRejectedValueOnce(new Error("First error"));
      await useMarketplaceStore.getState().search("fail");
      expect(useMarketplaceStore.getState().error).toBe("First error");

      mockedApiService.get.mockResolvedValueOnce(makeFeedResponse(1));
      await useMarketplaceStore.getState().search("success");
      expect(useMarketplaceStore.getState().error).toBeNull();
    });
  });

  describe("loadMore()", () => {
    it("should append workers to existing list", async () => {
      // First load
      const firstPage = makeFeedResponse(20);
      mockedApiService.get.mockResolvedValueOnce(firstPage);
      await useMarketplaceStore.getState().search("test");

      expect(useMarketplaceStore.getState().workers).toHaveLength(20);
      expect(useMarketplaceStore.getState().hasMore).toBe(true);

      // Load more
      const secondPage = makeFeedResponse(5);
      mockedApiService.get.mockResolvedValueOnce(secondPage);
      await useMarketplaceStore.getState().loadMore();

      const state = useMarketplaceStore.getState();
      expect(state.workers).toHaveLength(25);
      expect(state.page).toBe(2);
    });

    it("should increment page number", async () => {
      const firstPage = makeFeedResponse(20);
      mockedApiService.get.mockResolvedValueOnce(firstPage);
      await useMarketplaceStore.getState().search("test");

      const secondPage = makeFeedResponse(20);
      mockedApiService.get.mockResolvedValueOnce(secondPage);
      await useMarketplaceStore.getState().loadMore();

      expect(useMarketplaceStore.getState().page).toBe(2);

      const thirdPage = makeFeedResponse(10);
      mockedApiService.get.mockResolvedValueOnce(thirdPage);
      await useMarketplaceStore.getState().loadMore();

      expect(useMarketplaceStore.getState().page).toBe(3);
    });

    it("should not load more when hasMore is false", async () => {
      // Load less than page size so hasMore is false
      const feedResponse = makeFeedResponse(5);
      mockedApiService.get.mockResolvedValueOnce(feedResponse);
      await useMarketplaceStore.getState().search("test");

      expect(useMarketplaceStore.getState().hasMore).toBe(false);

      await useMarketplaceStore.getState().loadMore();

      // Should not have made another API call
      expect(mockedApiService.get).toHaveBeenCalledTimes(1);
    });

    it("should not load more when already loading", async () => {
      const firstPage = makeFeedResponse(20);
      mockedApiService.get.mockResolvedValueOnce(firstPage);
      await useMarketplaceStore.getState().search("test");

      // Simulate slow response
      mockedApiService.get.mockImplementation(
        () => new Promise((resolve) => setTimeout(() => resolve(makeFeedResponse(5)), 100))
      );

      const firstLoadMore = useMarketplaceStore.getState().loadMore();
      // Try to load more again while first is in progress
      await useMarketplaceStore.getState().loadMore();

      await firstLoadMore;

      // Only the search + one loadMore call should have been made
      expect(mockedApiService.get).toHaveBeenCalledTimes(2);
    });

    it("should set hasMore to false when fewer than page size workers returned", async () => {
      const firstPage = makeFeedResponse(20);
      mockedApiService.get.mockResolvedValueOnce(firstPage);
      await useMarketplaceStore.getState().search("test");

      const secondPage = makeFeedResponse(10);
      mockedApiService.get.mockResolvedValueOnce(secondPage);
      await useMarketplaceStore.getState().loadMore();

      expect(useMarketplaceStore.getState().hasMore).toBe(false);
    });

    it("should merge matchExplanations from loadMore", async () => {
      const firstPage = makeFeedResponse(20, true);
      mockedApiService.get.mockResolvedValueOnce(firstPage);
      await useMarketplaceStore.getState().search("test");

      const secondPage: FeedResponse = {
        workers: [
          {
            id: "worker-new",
            full_name: "New Worker",
            display_name: "New Display",
            photo_url: "https://example.com/new.jpg",
            bio: "New bio",
            skills: ["Carpentry"],
            location: "Abuja",
            credit_score: 75,
            completion_rate: 85,
            total_jobs: 5,
            average_rating: 4.0,
            match_score: 0.8,
            match_explanation: "New match explanation",
          },
        ],
      };
      mockedApiService.get.mockResolvedValueOnce(secondPage);
      await useMarketplaceStore.getState().loadMore();

      const state = useMarketplaceStore.getState();
      // Original explanations still present
      expect(state.matchExplanations["worker-1"]).toBe("Great match for worker 1");
      // New explanation added
      expect(state.matchExplanations["worker-new"]).toBe("New match explanation");
    });
  });

  describe("buildQueryParams()", () => {
    it("should include query when provided", () => {
      const params = buildQueryParams("plumber", {}, 1, 20);
      expect(params.query).toBe("plumber");
    });

    it("should not include query key when empty string", () => {
      const params = buildQueryParams("", {}, 1, 20);
      expect(params.query).toBeUndefined();
    });

    it("should map category to job_type_id", () => {
      const params = buildQueryParams("", { category: "plumbing-123" }, 1, 20);
      expect(params.job_type_id).toBe("plumbing-123");
      expect(params.category).toBeUndefined();
    });

    it("should map location city and state to comma-separated location string", () => {
      const params = buildQueryParams("", { location: { city: "Ikeja", state: "Lagos" } }, 1, 20);
      expect(params.location).toBe("Ikeja, Lagos");
    });

    it("should always include page and limit", () => {
      const params = buildQueryParams("", {}, 3, 10);
      expect(params.page).toBe("3");
      expect(params.limit).toBe("10");
    });

    it("should include minRating as min_rating string", () => {
      const params = buildQueryParams("", { minRating: 4 }, 1, 20);
      expect(params.min_rating).toBe("4");
    });

    it("should include sortBy and sortOrder", () => {
      const params = buildQueryParams("", { sortBy: "rating", sortOrder: "desc" }, 1, 20);
      expect(params.sort_by).toBe("rating");
      expect(params.sort_order).toBe("desc");
    });
  });
});
