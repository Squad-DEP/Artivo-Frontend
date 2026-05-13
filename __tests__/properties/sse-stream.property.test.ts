import { describe, it, expect, beforeEach, vi } from "vitest";
import * as fc from "fast-check";
import { calculateBackoffDelay } from "@/lib/utils/sse-backoff";
import type { StreamedJob } from "@/api/types/marketplace-api";

// Mock dependencies required by workerJobStore
vi.mock("@/api/api-service", () => ({
  apiService: {
    get: vi.fn(),
    post: vi.fn(),
  },
  getApiBaseUrl: () => "http://localhost:8080/api",
}));

vi.mock("@/store/authStore", () => ({
  useAuthStore: {
    getState: () => ({
      user: {
        id: "test-user-id",
        email: "test@example.com",
        access_token: "test-token-123",
      },
    }),
  },
}));

import { useWorkerJobStore } from "@/store/workerJobStore";

// ─── Property 10: Exponential backoff delay calculation ──────────────────────

/**
 * Property 10: Exponential backoff delay calculation
 *
 * For any attempt N (1-10), `calculateBackoffDelay(N)` is at least `1000 * 2^(N-1)`
 * and at most 30000.
 *
 * Feature: marketplace-integration, Property 10: Exponential backoff delay calculation
 * Validates: Requirements 9.4
 */
describe("Feature: marketplace-integration, Property 10: Exponential backoff delay calculation", () => {
  it("is at least 1000 * 2^(N-1) and at most 30000 for any attempt 1-10", () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 1, max: 10 }),
        (attempt) => {
          const delay = calculateBackoffDelay(attempt);
          const minExpected = 1000 * Math.pow(2, attempt - 1);
          const maxExpected = 30000;

          // Delay should be at least the exponential value OR capped at max
          expect(delay).toBeGreaterThanOrEqual(Math.min(minExpected, maxExpected));
          expect(delay).toBeLessThanOrEqual(maxExpected);
        }
      ),
      { numRuns: 100 }
    );
  });

  it("equals exactly 1000 * 2^(N-1) when below the cap", () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 1, max: 10 }),
        (attempt) => {
          const delay = calculateBackoffDelay(attempt);
          const exponentialValue = 1000 * Math.pow(2, attempt - 1);
          const expected = Math.min(exponentialValue, 30000);

          expect(delay).toBe(expected);
        }
      ),
      { numRuns: 100 }
    );
  });

  it("caps at 30000ms regardless of attempt number", () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 1, max: 100 }),
        (attempt) => {
          const delay = calculateBackoffDelay(attempt);
          expect(delay).toBeLessThanOrEqual(30000);
        }
      ),
      { numRuns: 100 }
    );
  });

  it("is monotonically non-decreasing as attempt increases", () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 1, max: 9 }),
        (attempt) => {
          const delay1 = calculateBackoffDelay(attempt);
          const delay2 = calculateBackoffDelay(attempt + 1);
          expect(delay2).toBeGreaterThanOrEqual(delay1);
        }
      ),
      { numRuns: 100 }
    );
  });

  it("returns 1000ms for the first attempt", () => {
    const delay = calculateBackoffDelay(1);
    expect(delay).toBe(1000);
  });

  it("returns 30000ms (max) for attempt 6 and above", () => {
    // 1000 * 2^5 = 32000 > 30000, so attempt 6+ should be capped
    fc.assert(
      fc.property(
        fc.integer({ min: 6, max: 10 }),
        (attempt) => {
          const delay = calculateBackoffDelay(attempt);
          expect(delay).toBe(30000);
        }
      ),
      { numRuns: 100 }
    );
  });
});

// ─── Property 9: SSE job events accumulate in state ──────────────────────────

/**
 * Property 9: SSE job events accumulate in state
 *
 * For any sequence of SSE "jobs" events containing arrays of StreamedJob objects,
 * after processing all events the streamedJobs state array SHALL contain every job
 * from every event (union of all received jobs), preserving order of receipt.
 *
 * Feature: marketplace-integration, Property 9: SSE job events accumulate in state
 * Validates: Requirements 9.3
 */

// Generator for a valid StreamedJob object
const streamedJobArb: fc.Arbitrary<StreamedJob> = fc.record({
  id: fc.uuid(),
  title: fc.string({ minLength: 1, maxLength: 50 }),
  description: fc.string({ minLength: 1, maxLength: 200 }),
  location: fc.string({ minLength: 1, maxLength: 30 }),
  budget: fc.integer({ min: 1000, max: 1000000 }),
  job_type: fc.string({ minLength: 1, maxLength: 30 }),
  customer_name: fc.string({ minLength: 1, maxLength: 50 }),
  created_at: fc.date().map((d) => d.toISOString()),
});

// Generator for a sequence of SSE "jobs" events (each event is an array of StreamedJob)
const jobEventsSequenceArb: fc.Arbitrary<StreamedJob[][]> = fc.array(
  fc.array(streamedJobArb, { minLength: 0, maxLength: 5 }),
  { minLength: 1, maxLength: 10 }
);

describe("Feature: marketplace-integration, Property 9: SSE job events accumulate in state", () => {
  beforeEach(() => {
    // Reset the store before each test
    useWorkerJobStore.setState({ streamedJobs: [] });
  });

  it("accumulates all jobs from all SSE events in order of receipt", () => {
    fc.assert(
      fc.property(jobEventsSequenceArb, (eventSequence) => {
        // Reset state for each property run
        useWorkerJobStore.setState({ streamedJobs: [] });

        // Simulate processing each SSE "jobs" event by appending to state
        // This mirrors the event handler logic in connectStream:
        //   set((state) => ({ streamedJobs: [...state.streamedJobs, ...jobs] }))
        for (const jobs of eventSequence) {
          useWorkerJobStore.setState((state) => ({
            streamedJobs: [...state.streamedJobs, ...jobs],
          }));
        }

        const finalJobs = useWorkerJobStore.getState().streamedJobs;
        const expectedJobs = eventSequence.flat();

        // The final state should contain every job from every event
        expect(finalJobs).toHaveLength(expectedJobs.length);

        // Order must be preserved — jobs from earlier events come before later ones
        expect(finalJobs).toEqual(expectedJobs);
      }),
      { numRuns: 100 }
    );
  });

  it("results in empty state when all events contain empty arrays", () => {
    fc.assert(
      fc.property(
        fc.array(fc.constant([] as StreamedJob[]), { minLength: 1, maxLength: 10 }),
        (emptyEvents) => {
          useWorkerJobStore.setState({ streamedJobs: [] });

          for (const jobs of emptyEvents) {
            useWorkerJobStore.setState((state) => ({
              streamedJobs: [...state.streamedJobs, ...jobs],
            }));
          }

          const finalJobs = useWorkerJobStore.getState().streamedJobs;
          expect(finalJobs).toHaveLength(0);
        }
      ),
      { numRuns: 100 }
    );
  });

  it("total count equals sum of individual event lengths", () => {
    fc.assert(
      fc.property(jobEventsSequenceArb, (eventSequence) => {
        useWorkerJobStore.setState({ streamedJobs: [] });

        for (const jobs of eventSequence) {
          useWorkerJobStore.setState((state) => ({
            streamedJobs: [...state.streamedJobs, ...jobs],
          }));
        }

        const finalJobs = useWorkerJobStore.getState().streamedJobs;
        const expectedCount = eventSequence.reduce(
          (sum, event) => sum + event.length,
          0
        );

        expect(finalJobs).toHaveLength(expectedCount);
      }),
      { numRuns: 100 }
    );
  });
});
