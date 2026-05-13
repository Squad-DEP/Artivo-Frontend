"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Users, MapPin, ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { useOnboardingStore } from "@/store/onboardingStore";
import type { ChatMessage } from "@/store/onboardingStore";
import OnboardingChat from "@/components/onboarding/OnboardingChat";
import OnboardingProgress from "@/components/onboarding/OnboardingProgress";
import { CategorySelector } from "@/components/onboarding/CategorySelector";
import { LocationInput } from "@/components/onboarding/LocationInput";
import { apiService } from "@/api/api-service";
import type { WorkerProfileSummary } from "@/api/types/worker";
import type { Location } from "@/api/types/worker";

interface RecommendedWorkersResponse {
  workers: WorkerProfileSummary[];
}

export default function CustomerOnboardingPage() {
  const router = useRouter();
  const {
    currentStep,
    totalSteps,
    steps,
    messages,
    isProcessing,
    error,
    fallbackMode,
    partialProfile,
    initOnboarding,
    confirmExtraction,
    completeOnboarding,
    reset,
  } = useOnboardingStore();

  const [recommendedWorkers, setRecommendedWorkers] = useState<WorkerProfileSummary[]>([]);
  const [isLoadingWorkers, setIsLoadingWorkers] = useState(false);
  const [isCompleting, setIsCompleting] = useState(false);
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [locationValue, setLocationValue] = useState<Partial<Location>>({});

  // Initialize onboarding for customer role
  useEffect(() => {
    initOnboarding("customer");
    return () => {
      // Don't reset on unmount — persist state for resume capability
    };
  }, [initOnboarding]);

  // Fetch recommended workers when service categories are confirmed
  const fetchRecommendedWorkers = useCallback(async (categories: string[], location?: Partial<Location>) => {
    if (categories.length === 0) return;

    setIsLoadingWorkers(true);
    try {
      const query: Record<string, string> = {
        limit: "5",
      };

      if (categories.length > 0) {
        query.category = categories[0]; // Primary category for search
      }

      if (location?.city) {
        query.city = location.city;
      }
      if (location?.state) {
        query.state = location.state;
      }

      const response = await apiService.get<RecommendedWorkersResponse>(
        "/workers/recommendations",
        { query }
      );

      setRecommendedWorkers(response.workers.slice(0, 5));
    } catch {
      // Non-blocking — recommendations are optional
      setRecommendedWorkers([]);
    } finally {
      setIsLoadingWorkers(false);
    }
  }, []);

  // Handle category confirmation from fallback selector
  const handleCategoryConfirm = useCallback(async (categories: string[]) => {
    const currentStepData = steps[currentStep];
    if (!currentStepData) return;

    setSelectedCategories(categories);
    await confirmExtraction(currentStepData.id, categories);

    // Fetch recommended workers based on selected categories and location
    const location = partialProfile?.location;
    await fetchRecommendedWorkers(categories, location ?? undefined);
  }, [steps, currentStep, confirmExtraction, partialProfile, fetchRecommendedWorkers]);

  // Handle location confirmation from fallback input
  const handleLocationConfirm = useCallback(async (location: Partial<Location>) => {
    const currentStepData = steps[currentStep];
    if (!currentStepData) return;

    await confirmExtraction(currentStepData.id, location);
  }, [steps, currentStep, confirmExtraction]);

  // Handle confirmation of extracted data from chat
  const handleConfirmExtraction = useCallback(async (message: ChatMessage) => {
    const currentStepData = steps[currentStep];
    if (!currentStepData || !message.extractedData) return;

    await confirmExtraction(currentStepData.id, message.extractedData);

    // If this was the service needs step, fetch recommendations
    if (currentStepData.field === "categories" && message.extractedData) {
      const categories = Array.isArray(message.extractedData.categories)
        ? (message.extractedData.categories as string[])
        : Array.isArray(message.extractedData)
          ? (message.extractedData as unknown as string[])
          : [];

      if (categories.length > 0) {
        const location = partialProfile?.location;
        await fetchRecommendedWorkers(categories, location ?? undefined);
      }
    }
  }, [steps, currentStep, confirmExtraction, partialProfile, fetchRecommendedWorkers]);

  // Complete onboarding and redirect
  const handleComplete = useCallback(async () => {
    setIsCompleting(true);
    const success = await completeOnboarding();
    if (success) {
      reset();
      // Redirect to dashboard with recommended workers flag
      router.push("/dashboard?onboarding=complete&recommendations=true");
    }
    setIsCompleting(false);
  }, [completeOnboarding, reset, router]);

  // Auto-complete when all steps are done
  useEffect(() => {
    if (currentStep >= totalSteps && totalSteps > 0 && !isCompleting) {
      handleComplete();
    }
  }, [currentStep, totalSteps, handleComplete, isCompleting]);

  // Determine if we need to show fallback UI
  const currentStepData = steps[currentStep];
  const showCategoryFallback = fallbackMode && currentStepData?.field === "categories";
  const showLocationFallback = fallbackMode && currentStepData?.field === "location";

  // Find the last message that requires confirmation
  const lastConfirmationMessage = [...messages].reverse().find(
    (m) => m.requiresConfirmation && m.extractedData
  );

  return (
    <main className="flex flex-col h-full max-w-2xl mx-auto w-full px-4 py-6">
      {/* Header */}
      <div className="flex-shrink-0 mb-6">
        <h1 className="text-2xl sm:text-3xl font-semibold text-gray-900 tracking-tight mb-2">
          Let&apos;s get you set up
        </h1>
        <p className="text-sm text-gray-500">
          Tell us what you need and we&apos;ll find the right workers for you.
        </p>

        {/* Progress indicator */}
        <div className="mt-4">
          <OnboardingProgress
            currentStep={Math.min(currentStep + 1, totalSteps)}
            totalSteps={totalSteps}
          />
        </div>
      </div>

      {/* Chat area */}
      <div className="flex-1 min-h-0 flex flex-col">
        <OnboardingChat />

        {/* Confirmation actions for extracted data */}
        {lastConfirmationMessage && !isProcessing && currentStep < totalSteps && (
          <div className="flex items-center gap-3 pt-3 border-t border-gray-100">
            <button
              onClick={() => handleConfirmExtraction(lastConfirmationMessage)}
              className={cn(
                "inline-flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-medium transition-all",
                "bg-[var(--orange)] text-white hover:bg-[var(--orange)]/90",
                "focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-[#FF6200]/30"
              )}
            >
              Confirm
              <ArrowRight className="w-4 h-4" />
            </button>
            <span className="text-xs text-gray-400">
              or type to edit your response
            </span>
          </div>
        )}

        {/* Category fallback selector */}
        {showCategoryFallback && (
          <div className="mt-4 p-4 bg-gray-50 rounded-2xl border border-gray-100">
            <p className="text-sm font-medium text-gray-700 mb-3">
              Select the services you&apos;re looking for:
            </p>
            <CategorySelector
              selected={selectedCategories}
              onChange={setSelectedCategories}
              maxCategories={5}
            />
            <button
              onClick={() => handleCategoryConfirm(selectedCategories)}
              disabled={selectedCategories.length === 0}
              className={cn(
                "mt-4 inline-flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-medium transition-all",
                "bg-[var(--orange)] text-white hover:bg-[var(--orange)]/90",
                "disabled:opacity-50 disabled:cursor-not-allowed",
                "focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-[#FF6200]/30"
              )}
            >
              Continue
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Location fallback input */}
        {showLocationFallback && (
          <div className="mt-4 p-4 bg-gray-50 rounded-2xl border border-gray-100">
            <LocationInput
              value={locationValue}
              onChange={setLocationValue}
              requireCountry={false}
            />
            <button
              onClick={() => handleLocationConfirm(locationValue)}
              disabled={!locationValue.city || !locationValue.state}
              className={cn(
                "mt-4 inline-flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-medium transition-all",
                "bg-[var(--orange)] text-white hover:bg-[var(--orange)]/90",
                "disabled:opacity-50 disabled:cursor-not-allowed",
                "focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-[#FF6200]/30"
              )}
            >
              Continue
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Recommended Workers section */}
        {recommendedWorkers.length > 0 && (
          <div className="mt-4 p-4 bg-[#FF6200]/5 rounded-2xl border border-[#FF6200]/10">
            <div className="flex items-center gap-2 mb-3">
              <Users className="w-4 h-4 text-[var(--orange)]" />
              <h3 className="text-sm font-semibold text-gray-900">
                Recommended Workers
              </h3>
            </div>
            <div className="space-y-2">
              {recommendedWorkers.map((worker) => (
                <div
                  key={worker.id}
                  className="flex items-center gap-3 p-3 bg-white rounded-xl border border-gray-100"
                >
                  <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center text-sm font-medium text-gray-600">
                    {worker.display_name.charAt(0).toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">
                      {worker.display_name}
                    </p>
                    <div className="flex items-center gap-2 text-xs text-gray-500">
                      <span>{worker.primary_category}</span>
                      {worker.location && (
                        <>
                          <span>·</span>
                          <span className="flex items-center gap-0.5">
                            <MapPin className="w-3 h-3" />
                            {worker.location.city}
                          </span>
                        </>
                      )}
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-xs font-medium text-[var(--orange)]">
                      ★ {worker.rating.toFixed(1)}
                    </p>
                    <p className="text-xs text-gray-400">
                      {worker.completed_jobs} jobs
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Loading workers indicator */}
        {isLoadingWorkers && (
          <div className="mt-4 flex items-center gap-2 text-sm text-gray-500">
            <Loader2 className="w-4 h-4 animate-spin text-[var(--orange)]" />
            <span>Finding matching workers...</span>
          </div>
        )}

        {/* Completing state */}
        {isCompleting && (
          <div className="mt-4 flex items-center justify-center gap-2 p-4">
            <Loader2 className="w-5 h-5 animate-spin text-[var(--orange)]" />
            <span className="text-sm text-gray-600">
              Creating your profile...
            </span>
          </div>
        )}

        {/* Error display */}
        {error && (
          <div className="mt-4 p-3 bg-red-50 border border-red-100 rounded-xl">
            <p className="text-sm text-red-600">{error}</p>
          </div>
        )}
      </div>
    </main>
  );
}
