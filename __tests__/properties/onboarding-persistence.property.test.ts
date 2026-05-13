import { describe, it, expect, beforeEach, vi } from "vitest";
import * as fc from "fast-check";
import { useOnboardingStore } from "@/store/onboardingStore";
import type { OnboardingStep, ChatMessage } from "@/store/onboardingStore";

// Mock the API service
vi.mock("@/api/api-service", () => ({
  apiService: {
    post: vi.fn(),
    get: vi.fn(),
  },
}));

// Mock zustand persist middleware to use in-memory storage
vi.mock("zustand/middleware", () => ({
  persist: (config: any) => config,
}));

import { apiService } from "@/api/api-service";

const mockedApiService = vi.mocked(apiService);

/**
 * Property 3: Onboarding State Persistence Round-Trip
 *
 * For any partial onboarding state (1 to 4 completed steps out of 5),
 * persisting the state and then resuming onboarding SHALL restore the exact
 * same step number and all previously collected field data without loss.
 *
 * Validates: Requirements 1.7
 */
describe("Feature: gig-worker-platform, Property 3: Onboarding State Persistence Round-Trip", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useOnboardingStore.getState().reset();
  });

  // Generator for field data based on field type
  const fieldDataArb = (field: string): fc.Arbitrary<unknown> => {
    switch (field) {
      case "display_name":
        return fc.string({ minLength: 1, maxLength: 100 });
      case "skills":
        return fc.array(fc.string({ minLength: 1, maxLength: 50 }), { minLength: 1, maxLength: 20 });
      case "categories":
        return fc.array(fc.string({ minLength: 1, maxLength: 50 }), { minLength: 1, maxLength: 5 });
      case "location":
        return fc.record({
          city: fc.string({ minLength: 1, maxLength: 50 }),
          state: fc.string({ minLength: 1, maxLength: 50 }),
          country: fc.string({ minLength: 1, maxLength: 50 }),
        });
      case "bio":
        return fc.string({ minLength: 1, maxLength: 500 });
      default:
        return fc.string({ minLength: 1, maxLength: 100 });
    }
  };

  // The 5 worker onboarding fields in order
  const WORKER_FIELDS = ["display_name", "skills", "categories", "location", "bio"];

  // Generator for a partial onboarding state with 1 to 4 completed steps
  const partialOnboardingStateArb = fc
    .integer({ min: 1, max: 4 })
    .chain((completedSteps) => {
      // Generate data for each completed step
      const fieldDataArbs = WORKER_FIELDS.slice(0, completedSteps).map((field) =>
        fieldDataArb(field)
      );

      return fc.tuple(...fieldDataArbs).map((fieldDataArray) => ({
        completedSteps,
        fieldData: fieldDataArray,
      }));
    });

  // Helper to build steps from field data
  function buildSteps(completedSteps: number, fieldData: unknown[]): OnboardingStep[] {
    return WORKER_FIELDS.map((field, index) => ({
      id: `step-${index + 1}`,
      stepNumber: index + 1,
      title: field.charAt(0).toUpperCase() + field.slice(1).replace("_", " "),
      prompt: `Enter your ${field}`,
      field: field as OnboardingStep["field"],
      completed: index < completedSteps,
      data: index < completedSteps ? fieldData[index] : undefined,
      followUpCount: 0,
    }));
  }

  // Helper to build partial profile from completed steps
  function buildPartialProfile(completedSteps: number, fieldData: unknown[]): Record<string, unknown> {
    const partialProfile: Record<string, unknown> = {};
    for (let i = 0; i < completedSteps; i++) {
      partialProfile[WORKER_FIELDS[i]] = fieldData[i];
    }
    return partialProfile;
  }

  it("restores the exact step number after persist and resume round-trip", async () => {
    await fc.assert(
      fc.asyncProperty(partialOnboardingStateArb, async ({ completedSteps, fieldData }) => {
        // Reset store before each iteration
        useOnboardingStore.getState().reset();
        vi.clearAllMocks();

        const steps = buildSteps(completedSteps, fieldData);
        const partialProfile = buildPartialProfile(completedSteps, fieldData);

        const messages: ChatMessage[] = [
          {
            id: "msg-welcome",
            role: "system",
            content: "Welcome!",
            timestamp: new Date().toISOString(),
          },
        ];

        // Simulate the API returning the persisted state on resume
        const resumeResponse = {
          currentStep: completedSteps,
          steps,
          messages,
          partialProfile,
          role: "worker" as const,
        };

        mockedApiService.get.mockResolvedValueOnce(resumeResponse);

        // Resume onboarding (simulates loading persisted state)
        await useOnboardingStore.getState().resumeOnboarding();

        const state = useOnboardingStore.getState();

        // The current step should be exactly the number of completed steps
        expect(state.currentStep).toBe(completedSteps);
      }),
      { numRuns: 100 }
    );
  });

  it("restores all previously collected field data without loss after round-trip", async () => {
    await fc.assert(
      fc.asyncProperty(partialOnboardingStateArb, async ({ completedSteps, fieldData }) => {
        // Reset store before each iteration
        useOnboardingStore.getState().reset();
        vi.clearAllMocks();

        const steps = buildSteps(completedSteps, fieldData);
        const partialProfile = buildPartialProfile(completedSteps, fieldData);

        const messages: ChatMessage[] = [
          {
            id: "msg-welcome",
            role: "system",
            content: "Welcome!",
            timestamp: new Date().toISOString(),
          },
        ];

        const resumeResponse = {
          currentStep: completedSteps,
          steps,
          messages,
          partialProfile,
          role: "worker" as const,
        };

        mockedApiService.get.mockResolvedValueOnce(resumeResponse);

        await useOnboardingStore.getState().resumeOnboarding();

        const state = useOnboardingStore.getState();

        // All completed steps should have their data preserved
        for (let i = 0; i < completedSteps; i++) {
          expect(state.steps[i].completed).toBe(true);
          expect(state.steps[i].data).toEqual(fieldData[i]);
        }

        // Partial profile should contain all collected field data
        for (let i = 0; i < completedSteps; i++) {
          expect(state.partialProfile).not.toBeNull();
          expect((state.partialProfile as Record<string, unknown>)[WORKER_FIELDS[i]]).toEqual(
            fieldData[i]
          );
        }

        // Incomplete steps should not have data
        for (let i = completedSteps; i < WORKER_FIELDS.length; i++) {
          expect(state.steps[i].completed).toBe(false);
          expect(state.steps[i].data).toBeUndefined();
        }
      }),
      { numRuns: 100 }
    );
  });

  it("preserves the role and total steps count after round-trip", async () => {
    await fc.assert(
      fc.asyncProperty(partialOnboardingStateArb, async ({ completedSteps, fieldData }) => {
        // Reset store before each iteration
        useOnboardingStore.getState().reset();
        vi.clearAllMocks();

        const steps = buildSteps(completedSteps, fieldData);
        const partialProfile = buildPartialProfile(completedSteps, fieldData);

        const messages: ChatMessage[] = [
          {
            id: "msg-welcome",
            role: "system",
            content: "Welcome!",
            timestamp: new Date().toISOString(),
          },
        ];

        const resumeResponse = {
          currentStep: completedSteps,
          steps,
          messages,
          partialProfile,
          role: "worker" as const,
        };

        mockedApiService.get.mockResolvedValueOnce(resumeResponse);

        await useOnboardingStore.getState().resumeOnboarding();

        const state = useOnboardingStore.getState();

        // Role should be preserved
        expect(state.role).toBe("worker");
        // Total steps should match the steps array length
        expect(state.totalSteps).toBe(WORKER_FIELDS.length);
        // Should not be in processing state
        expect(state.isProcessing).toBe(false);
        // Should not be in fallback mode
        expect(state.fallbackMode).toBe(false);
      }),
      { numRuns: 100 }
    );
  });
});
