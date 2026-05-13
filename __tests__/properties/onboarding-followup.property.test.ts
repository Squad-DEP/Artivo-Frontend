import { describe, it, expect, beforeEach, vi } from "vitest";
import * as fc from "fast-check";
import { useOnboardingStore } from "@/store/onboardingStore";

/**
 * Property 2: Onboarding Follow-Up Limit
 *
 * For any onboarding step and any sequence of user responses that fail NLP extraction,
 * the system SHALL ask at most 2 follow-up clarification questions per field before
 * activating the manual fallback mode.
 *
 * Validates: Requirements 1.4, 1.6
 */

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

describe("Feature: gig-worker-platform, Property 2: Onboarding Follow-Up Limit", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useOnboardingStore.getState().reset();
  });

  it("for any onboarding step and any sequence of user responses that fail NLP extraction, the system SHALL ask at most 2 follow-up clarification questions per field before activating the manual fallback mode", async () => {
    await fc.assert(
      fc.asyncProperty(
        // Generate a role (worker has 5 steps, customer has 3)
        fc.constantFrom("worker" as const, "customer" as const),
        // Generate which step index to test (0-based)
        fc.nat({ max: 4 }),
        // Generate arbitrary user response texts for failed attempts
        fc.array(fc.string({ minLength: 1, maxLength: 200 }), { minLength: 2, maxLength: 2 }),
        // Generate follow-up messages from the API
        fc.array(fc.string({ minLength: 5, maxLength: 100 }), { minLength: 2, maxLength: 2 }),
        async (role, stepIndexRaw, userTexts, followUpTexts) => {
          // Reset store state
          vi.clearAllMocks();
          useOnboardingStore.getState().reset();
          useOnboardingStore.getState().initOnboarding(role);

          const state = useOnboardingStore.getState();
          const maxStepIndex = state.steps.length - 1;
          const stepIndex = stepIndexRaw % (maxStepIndex + 1);

          // Navigate to the target step by confirming previous steps
          for (let i = 0; i < stepIndex; i++) {
            mockedApiService.post.mockResolvedValueOnce({});
            await useOnboardingStore
              .getState()
              .confirmExtraction(state.steps[i].id, `test-data-${i}`);
          }

          // Now we're at the target step — simulate failed extractions
          // First failed attempt
          mockedApiService.post.mockResolvedValueOnce({
            extracted: {},
            confidence: 0.3,
            followUp: followUpTexts[0],
          });
          await useOnboardingStore.getState().submitResponse(userTexts[0]);

          // After 1 failed attempt: followUpCount should be 1, fallback NOT active
          let currentState = useOnboardingStore.getState();
          expect(currentState.steps[stepIndex].followUpCount).toBe(1);
          expect(currentState.fallbackMode).toBe(false);

          // Second failed attempt
          mockedApiService.post.mockResolvedValueOnce({
            extracted: {},
            confidence: 0.2,
            followUp: followUpTexts[1],
          });
          await useOnboardingStore.getState().submitResponse(userTexts[1]);

          // After 2 failed attempts: followUpCount should be 2, fallback MUST be active
          currentState = useOnboardingStore.getState();
          expect(currentState.steps[stepIndex].followUpCount).toBe(2);
          expect(currentState.fallbackMode).toBe(true);
        }
      ),
      { numRuns: 100 }
    );
  });

  it("followUpCount never exceeds 2 before fallback activates for any step", async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.constantFrom("worker" as const, "customer" as const),
        fc.nat({ max: 4 }),
        // Generate 1 to 5 failed response texts to simulate various sequences
        fc.array(fc.string({ minLength: 1, maxLength: 100 }), { minLength: 1, maxLength: 5 }),
        async (role, stepIndexRaw, userTexts) => {
          vi.clearAllMocks();
          useOnboardingStore.getState().reset();
          useOnboardingStore.getState().initOnboarding(role);

          const state = useOnboardingStore.getState();
          const maxStepIndex = state.steps.length - 1;
          const stepIndex = stepIndexRaw % (maxStepIndex + 1);

          // Navigate to the target step
          for (let i = 0; i < stepIndex; i++) {
            mockedApiService.post.mockResolvedValueOnce({});
            await useOnboardingStore
              .getState()
              .confirmExtraction(state.steps[i].id, `data-${i}`);
          }

          // Submit failed responses up to the generated count
          for (let attempt = 0; attempt < userTexts.length; attempt++) {
            const currentState = useOnboardingStore.getState();

            // If fallback is already active, stop submitting
            if (currentState.fallbackMode) {
              break;
            }

            mockedApiService.post.mockResolvedValueOnce({
              extracted: {},
              confidence: 0.2,
              followUp: `Clarification attempt ${attempt + 1}`,
            });
            await useOnboardingStore.getState().submitResponse(userTexts[attempt]);
          }

          const finalState = useOnboardingStore.getState();

          // The followUpCount for the step should never exceed MAX_FOLLOW_UPS (2)
          expect(finalState.steps[stepIndex].followUpCount).toBeLessThanOrEqual(2);

          // If we submitted 2 or more failed attempts, fallback must be active
          if (userTexts.length >= 2) {
            expect(finalState.fallbackMode).toBe(true);
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  it("successful extraction does not trigger fallback even after one failed attempt", async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.constantFrom("worker" as const, "customer" as const),
        // Generate a user text for the failed attempt
        fc.string({ minLength: 1, maxLength: 100 }),
        // Generate a user text for the successful attempt
        fc.string({ minLength: 1, maxLength: 100 }),
        // Generate extracted data value
        fc.string({ minLength: 1, maxLength: 50 }),
        async (role, failedText, successText, extractedValue) => {
          vi.clearAllMocks();
          useOnboardingStore.getState().reset();
          useOnboardingStore.getState().initOnboarding(role);

          const currentStep = useOnboardingStore.getState().steps[0];

          // First attempt fails (followUpCount becomes 1)
          mockedApiService.post.mockResolvedValueOnce({
            extracted: {},
            confidence: 0.3,
            followUp: "Could you clarify?",
          });
          await useOnboardingStore.getState().submitResponse(failedText);

          let currentState = useOnboardingStore.getState();
          expect(currentState.steps[0].followUpCount).toBe(1);
          expect(currentState.fallbackMode).toBe(false);

          // Second attempt succeeds (high confidence, no followUp)
          mockedApiService.post.mockResolvedValueOnce({
            extracted: { [currentStep.field]: extractedValue },
            confidence: 0.9,
          });
          await useOnboardingStore.getState().submitResponse(successText);

          currentState = useOnboardingStore.getState();
          // Fallback should NOT be activated since extraction succeeded
          expect(currentState.fallbackMode).toBe(false);
          // followUpCount stays at 1 (not incremented on success)
          expect(currentState.steps[0].followUpCount).toBe(1);
        }
      ),
      { numRuns: 100 }
    );
  });

  it("the system asks at most 2 follow-up clarification questions before fallback", async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.constantFrom("worker" as const, "customer" as const),
        fc.nat({ max: 4 }),
        async (role, stepIndexRaw) => {
          vi.clearAllMocks();
          useOnboardingStore.getState().reset();
          useOnboardingStore.getState().initOnboarding(role);

          const state = useOnboardingStore.getState();
          const maxStepIndex = state.steps.length - 1;
          const stepIndex = stepIndexRaw % (maxStepIndex + 1);

          // Navigate to the target step
          for (let i = 0; i < stepIndex; i++) {
            mockedApiService.post.mockResolvedValueOnce({});
            await useOnboardingStore
              .getState()
              .confirmExtraction(state.steps[i].id, `data-${i}`);
          }

          // Count follow-up messages (non-fallback system messages after user responses)
          let followUpCount = 0;

          // Submit 3 failed attempts (more than the limit)
          for (let attempt = 0; attempt < 3; attempt++) {
            const currentState = useOnboardingStore.getState();
            if (currentState.fallbackMode) break;

            const messagesBefore = currentState.messages.length;

            mockedApiService.post.mockResolvedValueOnce({
              extracted: {},
              confidence: 0.2,
              followUp: `Follow-up question ${attempt + 1}`,
            });
            await useOnboardingStore.getState().submitResponse(`attempt ${attempt}`);

            const newState = useOnboardingStore.getState();
            // If fallback was NOT activated, a follow-up question was asked
            if (!newState.fallbackMode) {
              followUpCount++;
            }
          }

          // The system should have asked at most 2 follow-up questions
          // (1 follow-up after the first failure, then fallback activates on the second)
          expect(followUpCount).toBeLessThanOrEqual(2);

          // Fallback must be active after 2 failed attempts
          expect(useOnboardingStore.getState().fallbackMode).toBe(true);
          expect(useOnboardingStore.getState().steps[stepIndex].followUpCount).toBe(2);
        }
      ),
      { numRuns: 100 }
    );
  });
});
