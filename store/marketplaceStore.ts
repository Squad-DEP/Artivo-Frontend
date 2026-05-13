import { create } from "zustand";
import { apiService } from "@/api/api-service";
import type { WorkerProfileSummary, WorkerSearchResponse } from "@/api/types/worker";
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
 * Only includes parameters that have defined, non-empty values.
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
    params.category = filters.category;
  }

  if (filters.location?.city) {
    params.city = filters.location.city;
  }

  if (filters.location?.state) {
    params.state = filters.location.state;
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
};

export const useMarketplaceStore = create<MarketplaceState>()((set, get) => ({
  ...initialState,

  search: async (query: string) => {
    set({ isLoading: true, error: null, searchQuery: query, page: 1 });

    try {
      const { filters } = get();
      const queryParams = buildQueryParams(query, filters, 1, DEFAULT_PAGE_SIZE);

      const response = await apiService.get<WorkerSearchResponse>(
        "/workers/search",
        { query: queryParams }
      );

      set({
        workers: response.workers,
        total: response.total,
        page: response.page,
        hasMore: response.has_more,
        isLoading: false,
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

      const response = await apiService.get<WorkerSearchResponse>(
        "/workers/search",
        { query: queryParams }
      );

      set({
        workers: response.workers,
        total: response.total,
        page: response.page,
        hasMore: response.has_more,
        isLoading: false,
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

      const response = await apiService.get<WorkerSearchResponse>(
        "/workers/search",
        { query: queryParams }
      );

      set((state) => ({
        workers: [...state.workers, ...response.workers],
        total: response.total,
        page: response.page,
        hasMore: response.has_more,
        isLoading: false,
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
      const response = await apiService.get<WorkerSearchResponse>(
        "/workers/recommendations"
      );

      set({
        recommendations: response.workers,
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
