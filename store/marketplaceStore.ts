import { create } from "zustand";
import { apiService } from "@/api/api-service";
import type { WorkerProfileSummary } from "@/api/types/worker";
import type { FeedResponse } from "@/api/types/marketplace-api";
import { mapFeedWorkerToSummary } from "@/api/mappers/feed-mapper";
import type { VerificationStatus, AvailabilityStatus } from "@/lib/constants/user-types";

const DEFAULT_PAGE_SIZE = 20;

export interface MarketplaceFilters {
  category?: string;
  location?: { city?: string; state?: string };
  minRating?: number;
  verificationStatus?: VerificationStatus;
  availability?: AvailabilityStatus;
  maxHourlyRate?: number;
  sortBy?: "rating" | "trust_score" | "completed_jobs" | "hourly_rate";
  sortOrder?: "asc" | "desc";
}

export interface MarketplaceState {
  // State
  workers: WorkerProfileSummary[];
  recommendations: WorkerProfileSummary[];
  total: number;
  page: number;
  hasMore: boolean;
  isLoading: boolean;
  isLoadingRecommendations: boolean;
  searchQuery: string;
  filters: MarketplaceFilters;
  error: string | null;
  matchExplanations: Record<string, string>;

  // Actions
  search: (query: string) => Promise<void>;
  setFilters: (filters: Partial<MarketplaceFilters>) => void;
  applyFilters: () => Promise<void>;
  loadMore: () => Promise<void>;
  fetchRecommendations: () => Promise<void>;
  reset: () => void;
}

/**
 * Constructs query parameters from the current search query, filters, and pagination state.
 * Maps frontend filter names to backend-expected parameter names:
 * - `category` → `job_type_id`
 * - `location.city` + `location.state` → `location` (comma-separated string)
 */
export function buildQueryParams(
  query: string,
  filters: MarketplaceFilters,
  page: number,
  limit: number
): Record<string, string> {
  const params: Record<string, string> = {};

  if (query) {
    params.query = query;
  }

  if (filters.category) {
    params.job_type_id = filters.category;
  }

  if (filters.location?.city || filters.location?.state) {
    const city = filters.location.city || "";
    const state = filters.location.state || "";

    if (city && state && city !== state) {
      params.location = `${city}, ${state}`;
    } else {
      params.location = city || state;
    }
  }

  if (filters.minRating !== undefined) {
    params.min_rating = String(filters.minRating);
  }

  if (filters.verificationStatus) {
    params.verification_status = filters.verificationStatus;
  }

  if (filters.availability) {
    params.availability = filters.availability;
  }

  if (filters.maxHourlyRate !== undefined) {
    params.max_hourly_rate = String(filters.maxHourlyRate);
  }

  if (filters.sortBy) {
    params.sort_by = filters.sortBy;
  }

  if (filters.sortOrder) {
    params.sort_order = filters.sortOrder;
  }

  params.page = String(page);
  params.limit = String(limit);

  return params;
}

const initialState = {
  workers: [] as WorkerProfileSummary[],
  recommendations: [] as WorkerProfileSummary[],
  total: 0,
  page: 1,
  hasMore: false,
  isLoading: false,
  isLoadingRecommendations: false,
  searchQuery: "",
  filters: {} as MarketplaceFilters,
  error: null as string | null,
  matchExplanations: {} as Record<string, string>,
};

export const useMarketplaceStore = create<MarketplaceState>()((set, get) => ({
  ...initialState,

  search: async (query: string) => {
    set({ isLoading: true, error: null, searchQuery: query, page: 1 });

    try {
      const { filters } = get();
      const queryParams = buildQueryParams(query, filters, 1, DEFAULT_PAGE_SIZE);

      const response = await apiService.get<FeedResponse>(
        "/customer/feed",
        { query: queryParams }
      );

      const workers = response.workers.map(mapFeedWorkerToSummary);

      const matchExplanations: Record<string, string> = {};
      for (const worker of response.workers) {
        if (worker.match_explanation) {
          matchExplanations[worker.id] = worker.match_explanation;
        }
      }

      set({
        workers,
        total: response.workers.length,
        page: 1,
        hasMore: response.workers.length >= DEFAULT_PAGE_SIZE,
        isLoading: false,
        matchExplanations,
      });
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : "Failed to search workers",
        isLoading: false,
      });
    }
  },

  setFilters: (filters: Partial<MarketplaceFilters>) => {
    set((state) => ({
      filters: { ...state.filters, ...filters },
    }));
  },

  applyFilters: async () => {
    set({ isLoading: true, error: null, page: 1 });

    try {
      const { searchQuery, filters } = get();
      const queryParams = buildQueryParams(searchQuery, filters, 1, DEFAULT_PAGE_SIZE);

      const response = await apiService.get<FeedResponse>(
        "/customer/feed",
        { query: queryParams }
      );

      const workers = response.workers.map(mapFeedWorkerToSummary);

      const matchExplanations: Record<string, string> = {};
      for (const worker of response.workers) {
        if (worker.match_explanation) {
          matchExplanations[worker.id] = worker.match_explanation;
        }
      }

      set({
        workers,
        total: response.workers.length,
        page: 1,
        hasMore: response.workers.length >= DEFAULT_PAGE_SIZE,
        isLoading: false,
        matchExplanations,
      });
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : "Failed to apply filters",
        isLoading: false,
      });
    }
  },

  loadMore: async () => {
    const { hasMore, isLoading, page, searchQuery, filters } = get();

    if (!hasMore || isLoading) return;

    set({ isLoading: true, error: null });

    try {
      const nextPage = page + 1;
      const queryParams = buildQueryParams(searchQuery, filters, nextPage, DEFAULT_PAGE_SIZE);

      const response = await apiService.get<FeedResponse>(
        "/customer/feed",
        { query: queryParams }
      );

      const workers = response.workers.map(mapFeedWorkerToSummary);

      const newExplanations: Record<string, string> = {};
      for (const worker of response.workers) {
        if (worker.match_explanation) {
          newExplanations[worker.id] = worker.match_explanation;
        }
      }

      set((state) => ({
        workers: [...state.workers, ...workers],
        total: state.total + response.workers.length,
        page: nextPage,
        hasMore: response.workers.length >= DEFAULT_PAGE_SIZE,
        isLoading: false,
        matchExplanations: { ...state.matchExplanations, ...newExplanations },
      }));
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : "Failed to load more workers",
        isLoading: false,
      });
    }
  },

  fetchRecommendations: async () => {
    set({ isLoadingRecommendations: true, error: null });

    try {
      const response = await apiService.get<FeedResponse>(
        "/customer/feed"
      );

      const recommendations = response.workers.map(mapFeedWorkerToSummary);

      set({
        recommendations,
        isLoadingRecommendations: false,
      });
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : "Failed to fetch recommendations",
        isLoadingRecommendations: false,
      });
    }
  },

  reset: () => {
    set(initialState);
  },
}));
