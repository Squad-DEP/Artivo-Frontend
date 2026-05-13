import { create } from "zustand";
import { apiService } from "@/api/api-service";
import type {
  TrustScore,
  ReviewSummary,
  ReputationHistory,
  ReputationInsight,
  Review,
  WorkerReputation,
} from "@/api/types/reputation";
import {
  calculateTrustScore,
  determineTrustScoreTrend,
} from "@/lib/score-utils";

// ─── Interfaces ──────────────────────────────────────────────────────────────

interface ReputationState {
  // State
  trustScore: TrustScore | null;
  reviewSummary: ReviewSummary | null;
  history: ReputationHistory[];
  insights: ReputationInsight[];
  isLoading: boolean;
  error: string | null;

  // Actions
  fetchReputation: () => Promise<void>;
  fetchReviews: (page?: number) => Promise<void>;
  respondToReview: (reviewId: string, response: string) => Promise<boolean>;
}

// ─── Store ───────────────────────────────────────────────────────────────────

export const useReputationStore = create<ReputationState>()((set, get) => ({
  // Initial state
  trustScore: null,
  reviewSummary: null,
  history: [],
  insights: [],
  isLoading: false,
  error: null,

  // ─── Actions ─────────────────────────────────────────────────────────────

  /**
   * Fetches the full reputation profile including trust score, history, and insights.
   * Uses score-utils for trust score calculation and trend determination.
   * Requirements: 6.1, 6.2, 6.3, 6.4, 6.6, 6.8
   */
  fetchReputation: async () => {
    set({ isLoading: true, error: null });

    try {
      const data = await apiService.get<WorkerReputation>("/reputation");

      // Use score-utils to recalculate trust score from components for client-side verification
      const components = data.trust_score.components;
      const calculatedScore = calculateTrustScore({
        completion_rate: components.completion_rate,
        response_time: components.response_time,
        customer_satisfaction: components.customer_satisfaction,
        verification_level: components.verification_level,
        platform_tenure: components.tenure_months,
      });

      // Determine trend from history if available
      let trend = data.trust_score.trend;
      if (data.history.length > 0) {
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

        const previousEntry = data.history.find(
          (entry) => new Date(entry.date) <= thirtyDaysAgo
        );

        if (previousEntry) {
          trend = determineTrustScoreTrend(
            data.trust_score.overall,
            previousEntry.trust_score
          );
        }
      }

      set({
        trustScore: {
          ...data.trust_score,
          overall: calculatedScore,
          trend,
        },
        reviewSummary: data.review_summary,
        history: data.history,
        insights: data.insights,
        isLoading: false,
        error: null,
      });
    } catch (error) {
      // Requirement 6.8: Retain previous score on error
      set({
        isLoading: false,
        error:
          error instanceof Error
            ? error.message
            : "Failed to fetch reputation data",
      });
    }
  },

  /**
   * Fetches reviews with pagination support.
   * Requirements: 6.6, 6.7
   */
  fetchReviews: async (page?: number) => {
    set({ isLoading: true, error: null });

    try {
      const query: Record<string, string> = {};
      if (page !== undefined) {
        query.page = String(page);
      }

      const data = await apiService.get<ReviewSummary>("/reputation/reviews", {
        query,
      });

      set({
        reviewSummary: data,
        isLoading: false,
        error: null,
      });
    } catch (error) {
      set({
        isLoading: false,
        error:
          error instanceof Error ? error.message : "Failed to fetch reviews",
      });
    }
  },

  /**
   * Responds to a specific review.
   * Requirements: 6.7
   */
  respondToReview: async (
    reviewId: string,
    response: string
  ): Promise<boolean> => {
    set({ error: null });

    try {
      await apiService.post<Review>("/reputation/reviews/:id/respond", {
        params: { id: reviewId },
        body: { response },
      });

      // Update the review in the local state if it exists in reviewSummary
      const { reviewSummary } = get();
      if (reviewSummary) {
        const updatedReviews = reviewSummary.recent_reviews.map((review) =>
          review.id === reviewId
            ? {
                ...review,
                response,
                response_at: new Date().toISOString(),
              }
            : review
        );

        set({
          reviewSummary: {
            ...reviewSummary,
            recent_reviews: updatedReviews,
          },
        });
      }

      return true;
    } catch (error) {
      set({
        error:
          error instanceof Error
            ? error.message
            : "Failed to respond to review",
      });
      return false;
    }
  },
}));
