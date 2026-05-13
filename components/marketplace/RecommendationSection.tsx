"use client";

import { useEffect } from "react";
import { Star, Loader2, Sparkles, ArrowRight } from "lucide-react";
import { useMarketplaceStore } from "@/store/marketplaceStore";
import { WorkerCard } from "./WorkerCard";
import type { WorkerProfileSummary } from "@/api/types/worker";
import Link from "next/link";

export interface RecommendationSectionProps {
  isNewCustomer?: boolean;
}

export function RecommendationSection({
  isNewCustomer = false,
}: RecommendationSectionProps) {
  const {
    recommendations,
    isLoadingRecommendations,
    error,
    fetchRecommendations,
  } = useMarketplaceStore();

  useEffect(() => {
    fetchRecommendations();
  }, [fetchRecommendations]);

  const displayWorkers: WorkerProfileSummary[] = isNewCustomer
    ? [...recommendations].sort((a, b) => b.trust_score - a.trust_score)
    : recommendations;

  if (isLoadingRecommendations) {
    return (
      <section className="py-6" aria-label="Loading recommendations">
        <div className="flex items-center gap-2 mb-4">
          <Loader2 className="w-5 h-5 text-[var(--orange)] animate-spin" />
          <span className="text-sm text-gray-500">
            Loading recommendations...
          </span>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {Array.from({ length: 3 }).map((_, i) => (
            <div
              key={i}
              className="bg-white rounded-2xl border border-gray-100 overflow-hidden animate-pulse"
            >
              <div className="h-32 bg-gray-200" />
              <div className="p-5 space-y-3">
                <div className="flex items-start gap-3">
                  <div className="w-11 h-11 rounded-full bg-gray-200" />
                  <div className="flex-1 space-y-2">
                    <div className="h-4 bg-gray-200 rounded w-3/4" />
                    <div className="h-3 bg-gray-200 rounded w-1/2" />
                  </div>
                </div>
                <div className="h-3 bg-gray-100 rounded w-full" />
                <div className="flex gap-2">
                  <div className="h-8 bg-gray-100 rounded-lg flex-1" />
                  <div className="h-8 bg-gray-100 rounded-lg flex-1" />
                  <div className="h-8 bg-gray-100 rounded-lg flex-1" />
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>
    );
  }

  if (error) {
    return (
      <section className="py-6" aria-label="Recommendation error">
        <div className="bg-red-50 border border-red-100 rounded-xl p-4 text-center">
          <p className="text-sm text-red-600">
            Unable to load recommendations. Please try again later.
          </p>
          <button
            onClick={() => fetchRecommendations()}
            className="mt-2 text-sm font-medium text-red-700 hover:text-red-800 underline"
          >
            Retry
          </button>
        </div>
      </section>
    );
  }

  if (displayWorkers.length === 0) {
    return null;
  }

  return (
    <section className="py-2" aria-label="Recommended artisans">
      {/* Section Header */}
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[var(--orange)] to-amber-500 flex items-center justify-center">
            <Sparkles className="w-4 h-4 text-white" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-gray-900">
              {isNewCustomer ? "Top Rated Workers" : "Recommended for You"}
            </h2>
            <p className="text-xs text-gray-500">
              {isNewCustomer
                ? "— sorted by trust score"
                : "Handpicked based on quality, reliability & reviews"}
            </p>
          </div>
        </div>
        <Link
          href="#"
          className="hidden sm:flex items-center gap-1 text-sm font-medium text-[var(--orange)] hover:underline"
        >
          View all
          <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      </div>

      {/* Worker Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 mt-5">
        {displayWorkers.slice(0, 3).map((worker, index) => (
          <WorkerCard
            key={worker.id}
            worker={worker}
            badge={index === 0 ? "ai-pick" : index === 1 ? "top-rated" : "ai-pick"}
            variant="featured"
          />
        ))}
      </div>
    </section>
  );
}
