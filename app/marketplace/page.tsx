"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { ChevronRight, Loader2, Star, Search, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SearchBar } from "@/components/marketplace/SearchBar";
import { MarketplaceFilters } from "@/components/marketplace/MarketplaceFilters";
import { WorkerCard } from "@/components/marketplace/WorkerCard";
import { RecommendationSection } from "@/components/marketplace/RecommendationSection";
import { ErrorBanner } from "@/components/ui/ErrorBanner";
import { useMarketplaceStore } from "@/store/marketplaceStore";

const QUICK_PROMPTS = [
  "I need my house rewired",
  "Looking for a tailor for aso-oke",
  "Fix my leaking pipes",
  "Wedding photographer needed",
];

export default function MarketplacePage() {
  const router = useRouter();
  const {
    workers,
    total,
    hasMore,
    isLoading,
    searchQuery,
    error,
    search,
    loadMore,
  } = useMarketplaceStore();

  useEffect(() => {
    search("");
  }, [search]);

  const hasResults = workers.length > 0;

  return (
    <div className="min-h-screen overflow-y-auto bg-gray-50">
      {/* Hero Section - Intent Driven */}
      <section className="relative overflow-hidden bg-gradient-to-b from-[var(--artivo-warm)] via-amber-50/50 to-gray-50 pt-28 pb-6">
        <div className="px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
          <button
            onClick={() => router.back()}
            className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-800 transition-colors mb-4"
          >
            <ArrowLeft className="w-4 h-4" />
            Back
          </button>
          {/* Hero Content */}
          <div className="text-center max-w-2xl mx-auto mb-6">
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">
              What do you need done?
            </h1>
            <p className="text-sm sm:text-base text-gray-600">
              Find verified artisans near you — matched by AI for quality and reliability
            </p>
          </div>

          {/* Search */}
          <div className="max-w-2xl mx-auto mb-4">
            <SearchBar placeholder="Describe what you need — e.g. 'fix my AC unit in Lekki'" />
          </div>

          {/* Quick Prompts */}
          <div className="flex flex-wrap items-center justify-center gap-2 max-w-2xl mx-auto">
            {QUICK_PROMPTS.map((prompt) => (
              <button
                key={prompt}
                onClick={() => search(prompt)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium text-gray-600 bg-white cursor-pointer border border-gray-200 hover:border-[var(--orange)]/50 hover:text-[var(--orange)] transition-colors shadow-sm"
              >
                <Search className="w-3 h-3" />
                {prompt}
              </button>
            ))}
          </div>
        </div>

        {/* Decorative gradient fade */}
        <div className="absolute bottom-0 left-0 right-0 h-8 bg-gradient-to-b from-transparent to-gray-50" />
      </section>

      {/* Main Content */}
      <section className="px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto pb-12">
        {/* Recommended / Spotlight Section */}
        <RecommendationSection isNewCustomer={false} />

        {/* Divider */}
        <div className="my-8 border-t border-gray-200" />

        {/* Filters */}
        <MarketplaceFilters />

        {/* All Workers Section */}
        <div className="mt-8">
          {/* Section Header */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <h2 className="text-xl font-bold text-gray-900">All Artisans</h2>
              {total > 0 && (
                <span className="text-xs font-medium text-gray-500 bg-gray-200 px-2.5 py-1 rounded-full">
                  {total} available
                </span>
              )}
            </div>
            <select className="bg-white border border-gray-200 text-gray-700 text-sm rounded-lg px-3 py-2 focus:outline-none focus:border-[var(--orange)]">
              <option>Most Relevant</option>
              <option>Highest Rated</option>
              <option>Most Jobs</option>
              <option>Lowest Price</option>
              <option>Fastest Response</option>
            </select>
          </div>

          {/* Error State */}
          {error && (
            <ErrorBanner
              message="Failed to load artisans"
              description={error}
              onRetry={() => search(searchQuery)}
              retryLabel="Try again"
              className="mb-6"
            />
          )}

          {/* Loading State */}
          {isLoading && workers.length === 0 && (
            <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-5">
              {Array.from({ length: 6 }).map((_, i) => (
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
                      <div className="h-7 bg-gray-100 rounded-lg flex-1" />
                      <div className="h-7 bg-gray-100 rounded-lg flex-1" />
                      <div className="h-7 bg-gray-100 rounded-lg flex-1" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Worker Cards Grid */}
          {hasResults && (
            <>
              <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-5">
                {workers.map((worker, index) => (
                  <motion.div
                    key={worker.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.03 }}
                  >
                    <WorkerCard worker={worker} />
                  </motion.div>
                ))}
              </div>

              {/* Load More */}
              {hasMore && (
                <div className="mt-8 text-center">
                  <Button
                    onClick={loadMore}
                    disabled={isLoading}
                    variant="outline"
                    className="px-8 py-3 border-gray-200 hover:border-[var(--orange)] hover:text-[var(--orange)]"
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Loading...
                      </>
                    ) : (
                      <>
                        Load More
                        <ChevronRight className="w-4 h-4 ml-2" />
                      </>
                    )}
                  </Button>
                </div>
              )}
            </>
          )}

          {/* Empty State */}
          {!isLoading && !hasResults && !error && (
            <div className="text-center py-16">
              <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-4">
                <Star className="w-8 h-8 text-gray-300" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                No artisans found
              </h3>
              <p className="text-gray-500 mb-4">
                Try broadening your search or adjusting your filters
              </p>
              <Button
                onClick={() => {
                  useMarketplaceStore.getState().reset();
                  search("");
                }}
                variant="outline"
                className="border-[var(--orange)] text-[var(--orange)] hover:bg-[var(--orange)]/5"
              >
                Clear all filters
              </Button>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
