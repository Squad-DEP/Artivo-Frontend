"use client";

import { useEffect, useCallback, useMemo, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { useOnboardingStore } from "@/store/onboardingStore";
import { usePaymentStore } from "@/store/paymentStore";
import OnboardingChat from "@/components/onboarding/OnboardingChat";
import OnboardingProgress from "@/components/onboarding/OnboardingProgress";
import SkillConfirmation from "@/components/onboarding/SkillConfirmation";
import SkillFallbackSelector from "@/components/onboarding/SkillFallbackSelector";
import { CategorySelector } from "@/components/onboarding/CategorySelector";
import { LocationInput } from "@/components/onboarding/LocationInput";
import { ErrorBanner } from "@/components/ui/ErrorBanner";
import { ErrorToast, useErrorToast } from "@/components/ui/ErrorToast";
import { SERVICE_CATEGORIES } from "@/lib/constants/categories";
import type { ExtractedSkill } from "@/components/onboarding/SkillConfirmation";
import type { PredefinedSkill } from "@/components/onboarding/SkillFallbackSelector";
import type { Location } from "@/api/types/worker";

/**
 * Build predefined skills list from service categories for the fallback selector.
 */
function buildPredefinedSkills(): PredefinedSkill[] {
  return SERVICE_CATEGORIES.flatMap((cat) =>
    cat.subcategories.map((sub) => ({
      name: sub,
      category: cat.name,
    }))
  );
}

export default function WorkerOnboardingPage() {
  const router = useRouter();
  const {
    currentStep,
    totalSteps,
    steps,
    messages,
    isProcessing,
    fallbackMode,
    partialProfile,
    error,
    initOnboarding,
    confirmExtraction,
    editExtraction,
    completeOnboarding,
    reset,
  } = useOnboardingStore();

  const {
    createVirtualAccount,
    virtualAccountError,
    isCreatingVirtualAccount,
    clearVirtualAccountError,
  } = usePaymentStore();

  const predefinedSkills = useMemo(() => buildPredefinedSkills(), []);
  const { toast, showToast, hideToast } = useErrorToast();
  const [virtualAccountFailed, setVirtualAccountFailed] = useState(false);
  const retryTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const completionTriggeredRef = useRef(false);

  // Initialize onboarding on mount if not already started
  useEffect(() => {
    if (steps.length === 0) {
      initOnboarding("worker");
    }
  }, [steps.length, initOnboarding]);

  // Persist partial state on abandonment (beforeunload)
  useEffect(() => {
    const handleBeforeUnload = () => {
      // The store uses zustand persist middleware, so state is auto-persisted
      // No additional action needed — partial state is already in localStorage
    };

    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, []);

  // Cleanup background retry timeout on unmount
  useEffect(() => {
    return () => {
      if (retryTimeoutRef.current) {
        clearTimeout(retryTimeoutRef.current);
      }
    };
  }, []);

  // Handle onboarding completion with virtual account creation
  useEffect(() => {
    const handleCompletion = async () => {
      if (
        currentStep >= totalSteps &&
        totalSteps > 0 &&
        steps.length > 0 &&
        steps.every((s) => s.completed) &&
        !completionTriggeredRef.current
      ) {
        completionTriggeredRef.current = true;
        const success = await completeOnboarding();
        if (success) {
          reset();

          // Trigger Squad virtual account creation (Requirement 5.1)
          const accountCreated = await createVirtualAccount();

          if (!accountCreated) {
            // Handle failure gracefully (Requirement 5.2):
            // Show error banner, allow dashboard access, schedule background retry
            setVirtualAccountFailed(true);

            // Schedule background retry within 5 minutes (Requirement 5.2)
            retryTimeoutRef.current = setTimeout(async () => {
              await createVirtualAccount();
            }, 5 * 60 * 1000);
          }

          // Always redirect to dashboard regardless of virtual account status (Requirement 5.2)
          router.push("/dashboard");
        } else {
          completionTriggeredRef.current = false;
        }
      }
    };

    handleCompletion();
  }, [currentStep, totalSteps, steps, completeOnboarding, reset, router, createVirtualAccount]);

  const currentStepData = steps[currentStep] ?? null;

  // --- Skill Confirmation Handlers ---

  const handleSkillAccept = useCallback(
    (skills: ExtractedSkill[]) => {
      if (!currentStepData) return;
      const skillNames = skills.map((s) => s.name);
      confirmExtraction(currentStepData.id, skillNames);
    },
    [currentStepData, confirmExtraction]
  );

  const handleSkillEdit = useCallback(
    (skills: ExtractedSkill[]) => {
      if (!currentStepData) return;
      const skillNames = skills.map((s) => s.name);
      editExtraction(currentStepData.id, skillNames);
    },
    [currentStepData, editExtraction]
  );

  // --- Skill Fallback Handler ---

  const handleFallbackSubmit = useCallback(
    (skills: { name: string; years_experience: number }[]) => {
      if (!currentStepData) return;
      const skillNames = skills.map((s) => s.name);
      confirmExtraction(currentStepData.id, skillNames);
    },
    [currentStepData, confirmExtraction]
  );

  // --- Category Handlers ---

  const handleCategoryChange = useCallback(
    (categories: string[]) => {
      if (!currentStepData) return;
      // Immediately confirm categories when selected
      confirmExtraction(currentStepData.id, categories);
    },
    [currentStepData, confirmExtraction]
  );

  // --- Location Handler ---

  const handleLocationChange = useCallback(
    (location: Partial<Location>) => {
      if (!currentStepData) return;
      // Only confirm when all required fields are filled
      if (location.city && location.state && location.country) {
        confirmExtraction(currentStepData.id, location);
      }
    },
    [currentStepData, confirmExtraction]
  );

  // --- Determine what to show for the current step ---

  const lastMessage = messages[messages.length - 1];
  const showConfirmation = lastMessage?.requiresConfirmation && currentStepData;

  // Check if we should show a fallback UI for the current step
  const showFallback = fallbackMode && currentStepData;

  // Determine extracted skills for confirmation
  const extractedSkills: ExtractedSkill[] = useMemo(() => {
    if (!showConfirmation || currentStepData?.field !== "skills") return [];
    const data = lastMessage?.extractedData;
    if (!data) return [];

    // The extracted data could be an array of skill objects or skill names
    if (Array.isArray(data.skills)) {
      return (data.skills as Array<{ name: string; years_experience?: number }>).map((s) => ({
        name: typeof s === "string" ? s : s.name,
        years_experience: typeof s === "string" ? 1 : (s.years_experience ?? 1),
      }));
    }

    // If extractedData itself is an array
    if (Array.isArray(data)) {
      return (data as Array<{ name: string; years_experience?: number } | string>).map((s) => ({
        name: typeof s === "string" ? s : s.name,
        years_experience: typeof s === "string" ? 1 : (s.years_experience ?? 1),
      }));
    }

    return [];
  }, [showConfirmation, currentStepData?.field, lastMessage?.extractedData]);

  // Render fallback or confirmation UI based on current step field
  const renderStepUI = () => {
    if (!currentStepData) return null;

    const { field } = currentStepData;

    // Fallback mode — show manual selectors
    if (showFallback) {
      switch (field) {
        case "skills":
          return (
            <div className="mt-4">
              <SkillFallbackSelector
                predefinedSkills={predefinedSkills}
                onSubmit={handleFallbackSubmit}
                maxSkills={20}
              />
            </div>
          );
        case "categories":
          return (
            <div className="mt-4">
              <CategorySelector
                selected={(currentStepData.data as string[]) ?? []}
                onChange={handleCategoryChange}
                maxCategories={5}
              />
            </div>
          );
        case "location":
          return (
            <div className="mt-4">
              <LocationInput
                value={(currentStepData.data as Partial<Location>) ?? {}}
                onChange={handleLocationChange}
                requireCountry={true}
              />
            </div>
          );
        default:
          return null;
      }
    }

    // Confirmation mode — show extracted data for confirmation
    if (showConfirmation) {
      switch (field) {
        case "skills":
          if (extractedSkills.length > 0) {
            return (
              <div className="mt-4">
                <SkillConfirmation
                  skills={extractedSkills}
                  onAccept={handleSkillAccept}
                  onEdit={handleSkillEdit}
                />
              </div>
            );
          }
          return null;
        case "categories": {
          const extractedCategories = lastMessage?.extractedData?.categories;
          if (Array.isArray(extractedCategories)) {
            return (
              <div className="mt-4">
                <CategorySelector
                  selected={extractedCategories as string[]}
                  onChange={handleCategoryChange}
                  maxCategories={5}
                />
              </div>
            );
          }
          return null;
        }
        case "location": {
          const extractedLocation = lastMessage?.extractedData?.location ?? lastMessage?.extractedData;
          if (extractedLocation && typeof extractedLocation === "object") {
            return (
              <div className="mt-4">
                <LocationInput
                  value={extractedLocation as Partial<Location>}
                  onChange={handleLocationChange}
                  requireCountry={true}
                />
              </div>
            );
          }
          return null;
        }
        default:
          // For display_name and bio, confirmation is handled via chat
          // The user can type "yes" or the store handles it
          return null;
      }
    }

    return null;
  };

  return (
    <main className="flex flex-col h-[calc(100vh-120px)] max-w-2xl mx-auto w-full px-4">
      {/* Header with progress */}
      <div className="flex items-center justify-between py-4 shrink-0">
        <h1 className="text-lg font-semibold text-[#333]">
          Set Up Your Profile
        </h1>
        <OnboardingProgress
          currentStep={Math.min(currentStep + 1, totalSteps)}
          totalSteps={totalSteps}
        />
      </div>

      {/* NLP Failure Banner — Requirement 1.6: NLP failure → fallback */}
      {fallbackMode && (
        <div className="shrink-0 mb-3">
          <ErrorBanner
            message="Automatic extraction unavailable"
            description="We couldn't understand your input. Please select your information manually below."
            variant="warning"
            onDismiss={() => {}}
          />
        </div>
      )}

      {/* Virtual Account Creation Failure Banner — Requirement 5.2 */}
      {virtualAccountFailed && virtualAccountError && (
        <div className="shrink-0 mb-3">
          <ErrorBanner
            message="Virtual account creation failed"
            description="We couldn't set up your payment account. It will be retried automatically. You can still access your dashboard."
            variant="warning"
            onDismiss={() => {
              setVirtualAccountFailed(false);
              clearVirtualAccountError();
            }}
            onRetry={async () => {
              const success = await createVirtualAccount();
              if (success) {
                setVirtualAccountFailed(false);
              }
            }}
            retryLabel="Retry now"
          />
        </div>
      )}

      {/* Network Error Toast */}
      <ErrorToast
        message={toast.message}
        visible={toast.visible}
        onDismiss={hideToast}
        onRetry={toast.onRetry}
        variant={toast.variant}
      />

      {/* Chat area */}
      <div className="flex-1 min-h-0 flex flex-col">
        <OnboardingChat />

        {/* Step-specific UI (confirmation/fallback) */}
        {renderStepUI()}
      </div>
    </main>
  );
}
