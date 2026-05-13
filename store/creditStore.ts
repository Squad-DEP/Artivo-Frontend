import { create } from "zustand";
import { apiService } from "@/api/api-service";
import {
  calculateCreditScore,
  determineCreditScoreTrend,
  filterEligibleProducts,
} from "@/lib/score-utils";
import type {
  CreditScore,
  CreditHistory,
  CreditInsight,
  WorkerCreditProfile,
} from "@/api/types/reputation";

interface CreditState {
  // State
  creditScore: CreditScore | null;
  history: CreditHistory[];
  insights: CreditInsight[];
  financialSummary: WorkerCreditProfile["financial_summary"] | null;
  consentEnabled: boolean;
  isLoading: boolean;
  error: string | null;

  // Actions
  fetchCreditProfile: () => Promise<void>;
  toggleConsent: (enabled: boolean) => Promise<boolean>;
}

export const useCreditStore = create<CreditState>()((set, get) => ({
  creditScore: null,
  history: [],
  insights: [],
  financialSummary: null,
  consentEnabled: false,
  isLoading: false,
  error: null,

  fetchCreditProfile: async () => {
    set({ isLoading: true, error: null });

    try {
      const profile = await apiService.get<WorkerCreditProfile>("/credit");

      // Use score-utils to recalculate credit score from components for client-side validation
      const calculatedScore = calculateCreditScore(profile.credit_score.components);

      // Determine trend from history if available
      let trend = profile.credit_score.trend;
      let trendChange = profile.credit_score.trend_change;
      if (profile.history.length > 0) {
        // Find score from ~30 days ago for trend calculation
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
        const previousEntry = profile.history.find(
          (entry) => new Date(entry.date) <= thirtyDaysAgo
        );
        if (previousEntry) {
          trend = determineCreditScoreTrend(calculatedScore, previousEntry.score);
          trendChange = calculatedScore - previousEntry.score;
        }
      }

      // Filter eligible products using score-utils
      const eligibleProducts = filterEligibleProducts(
        calculatedScore,
        profile.credit_score.eligible_products
      );

      const creditScore: CreditScore = {
        ...profile.credit_score,
        score: calculatedScore,
        trend,
        trend_change: trendChange,
        eligible_products: eligibleProducts,
      };

      set({
        creditScore,
        history: profile.history,
        insights: profile.insights,
        financialSummary: profile.financial_summary,
        isLoading: false,
        error: null,
      });
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : "Failed to fetch credit profile",
        isLoading: false,
      });
    }
  },

  toggleConsent: async (enabled: boolean) => {
    set({ error: null });

    try {
      await apiService.put<{ consent_enabled: boolean }>("/credit/consent", {
        body: { consent_enabled: enabled },
      });

      set({ consentEnabled: enabled });
      return true;
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : "Failed to update consent",
      });
      return false;
    }
  },
}));
