"use client";

import { cn } from "@/lib/utils";

interface OnboardingProgressProps {
  currentStep: number;
  totalSteps: number;
  className?: string;
}

export default function OnboardingProgress({
  currentStep,
  totalSteps,
  className,
}: OnboardingProgressProps) {
  return (
    <div
      className={cn("flex items-center gap-3", className)}
      role="progressbar"
      aria-valuenow={currentStep}
      aria-valuemin={1}
      aria-valuemax={totalSteps}
      aria-label={`Step ${currentStep} of ${totalSteps}`}
    >
      <div className="flex items-center gap-2">
        {Array.from({ length: totalSteps }, (_, i) => {
          const stepNumber = i + 1;
          const isCompleted = stepNumber < currentStep;
          const isCurrent = stepNumber === currentStep;

          return (
            <div
              key={stepNumber}
              className={cn(
                "h-2 rounded-full transition-all duration-300",
                isCurrent
                  ? "w-8 bg-[var(--orange)]"
                  : isCompleted
                    ? "w-8 bg-[var(--orange)]/60"
                    : "w-8 bg-gray-200"
              )}
            />
          );
        })}
      </div>

      <span className="text-sm font-medium text-gray-500">
        {currentStep}/{totalSteps}
      </span>
    </div>
  );
}
