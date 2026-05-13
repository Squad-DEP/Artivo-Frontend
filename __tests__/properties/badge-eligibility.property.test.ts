import { describe, it, expect } from "vitest";
import * as fc from "fast-check";
import {
  checkBadgeEligibility,
  BADGE_THRESHOLDS,
  type BadgeEligibilityInput,
} from "@/lib/score-utils";

// ─── Generators ──────────────────────────────────────────────────────────────

/** Generates a rating between 1.0 and 5.0 */
const rating = fc.double({ min: 1.0, max: 5.0, noNaN: true, noDefaultInfinity: true });

/** Generates a response time in hours (0 to 24) */
const responseTimeHours = fc.double({ min: 0, max: 24, noNaN: true, noDefaultInfinity: true });

/** Generates a completed jobs count (0 to 500) */
const completedJobsCount = fc.integer({ min: 0, max: 500 });

/** Generates a full BadgeEligibilityInput */
const badgeEligibilityInput: fc.Arbitrary<BadgeEligibilityInput> = fc.record({
  identityVerified: fc.boolean(),
  monthlyAverageRatings: fc.array(rating, { minLength: 0, maxLength: 12 }),
  dailyResponseTimesHours: fc.array(responseTimeHours, { minLength: 0, maxLength: 60 }),
  completedJobsCount: completedJobsCount,
});

// ─── Property 12: Badge Eligibility ─────────────────────────────────────────

/**
 * Property 12: Badge Eligibility
 *
 * For any worker profile state, the badge eligibility function SHALL award
 * "Verified Identity" if and only if verification is complete,
 * "Top Rated" if and only if average rating ≥ 4.8 for 3 consecutive months,
 * "Fast Responder" if and only if average response time < 2 hours for 30 consecutive days,
 * and job count badges at exactly 50, 100, and 250 completed jobs.
 *
 * Validates: Requirements 6.5
 */
describe("Feature: gig-worker-platform, Property 12: Badge Eligibility", () => {
  describe("Verified Identity badge", () => {
    it("is awarded if and only if identity verification is complete", () => {
      fc.assert(
        fc.property(badgeEligibilityInput, (input) => {
          const result = checkBadgeEligibility(input);
          expect(result.verifiedIdentity).toBe(input.identityVerified);
        }),
        { numRuns: 100 }
      );
    });
  });

  describe("Top Rated badge", () => {
    it("is awarded when the first 3 months all have ratings >= 4.8", () => {
      fc.assert(
        fc.property(
          fc.array(
            fc.double({ min: 4.8, max: 5.0, noNaN: true, noDefaultInfinity: true }),
            { minLength: 3, maxLength: 12 }
          ),
          fc.boolean(),
          fc.array(responseTimeHours, { minLength: 0, maxLength: 60 }),
          completedJobsCount,
          (ratings, identityVerified, responseTimes, jobs) => {
            const input: BadgeEligibilityInput = {
              identityVerified,
              monthlyAverageRatings: ratings,
              dailyResponseTimesHours: responseTimes,
              completedJobsCount: jobs,
            };
            const result = checkBadgeEligibility(input);
            expect(result.topRated).toBe(true);
          }
        ),
        { numRuns: 100 }
      );
    });

    it("is NOT awarded when fewer than 3 months of data exist", () => {
      fc.assert(
        fc.property(
          fc.array(rating, { minLength: 0, maxLength: 2 }),
          fc.boolean(),
          fc.array(responseTimeHours, { minLength: 0, maxLength: 60 }),
          completedJobsCount,
          (ratings, identityVerified, responseTimes, jobs) => {
            const input: BadgeEligibilityInput = {
              identityVerified,
              monthlyAverageRatings: ratings,
              dailyResponseTimesHours: responseTimes,
              completedJobsCount: jobs,
            };
            const result = checkBadgeEligibility(input);
            expect(result.topRated).toBe(false);
          }
        ),
        { numRuns: 100 }
      );
    });

    it("is NOT awarded when any of the first 3 months has rating < 4.8", () => {
      fc.assert(
        fc.property(
          // Generate 3+ months where at least one of the first 3 is below 4.8
          fc.integer({ min: 0, max: 2 }).chain((badIndex) =>
            fc.tuple(
              fc.array(
                fc.double({ min: 4.8, max: 5.0, noNaN: true, noDefaultInfinity: true }),
                { minLength: 3, maxLength: 3 }
              ),
              fc.double({ min: 1.0, max: 4.799, noNaN: true, noDefaultInfinity: true }),
              fc.constant(badIndex)
            )
          ),
          fc.boolean(),
          fc.array(responseTimeHours, { minLength: 0, maxLength: 60 }),
          completedJobsCount,
          ([ratings, badRating, badIndex], identityVerified, responseTimes, jobs) => {
            const modifiedRatings = [...ratings];
            modifiedRatings[badIndex] = badRating;

            const input: BadgeEligibilityInput = {
              identityVerified,
              monthlyAverageRatings: modifiedRatings,
              dailyResponseTimesHours: responseTimes,
              completedJobsCount: jobs,
            };
            const result = checkBadgeEligibility(input);
            expect(result.topRated).toBe(false);
          }
        ),
        { numRuns: 100 }
      );
    });

    it("is awarded if and only if the first 3 months all have ratings >= 4.8", () => {
      fc.assert(
        fc.property(badgeEligibilityInput, (input) => {
          const result = checkBadgeEligibility(input);

          const hasEnoughMonths =
            input.monthlyAverageRatings.length >= BADGE_THRESHOLDS.TOP_RATED_CONSECUTIVE_MONTHS;
          const allHighRated = hasEnoughMonths &&
            input.monthlyAverageRatings
              .slice(0, BADGE_THRESHOLDS.TOP_RATED_CONSECUTIVE_MONTHS)
              .every((r) => r >= BADGE_THRESHOLDS.TOP_RATED_MIN_RATING);

          expect(result.topRated).toBe(allHighRated);
        }),
        { numRuns: 100 }
      );
    });
  });

  describe("Fast Responder badge", () => {
    it("is awarded when the first 30 days all have response time < 2 hours", () => {
      fc.assert(
        fc.property(
          fc.array(
            fc.double({ min: 0, max: 1.999, noNaN: true, noDefaultInfinity: true }),
            { minLength: 30, maxLength: 60 }
          ),
          fc.boolean(),
          fc.array(rating, { minLength: 0, maxLength: 12 }),
          completedJobsCount,
          (responseTimes, identityVerified, ratings, jobs) => {
            const input: BadgeEligibilityInput = {
              identityVerified,
              monthlyAverageRatings: ratings,
              dailyResponseTimesHours: responseTimes,
              completedJobsCount: jobs,
            };
            const result = checkBadgeEligibility(input);
            expect(result.fastResponder).toBe(true);
          }
        ),
        { numRuns: 100 }
      );
    });

    it("is NOT awarded when fewer than 30 days of data exist", () => {
      fc.assert(
        fc.property(
          fc.array(responseTimeHours, { minLength: 0, maxLength: 29 }),
          fc.boolean(),
          fc.array(rating, { minLength: 0, maxLength: 12 }),
          completedJobsCount,
          (responseTimes, identityVerified, ratings, jobs) => {
            const input: BadgeEligibilityInput = {
              identityVerified,
              monthlyAverageRatings: ratings,
              dailyResponseTimesHours: responseTimes,
              completedJobsCount: jobs,
            };
            const result = checkBadgeEligibility(input);
            expect(result.fastResponder).toBe(false);
          }
        ),
        { numRuns: 100 }
      );
    });

    it("is NOT awarded when any of the first 30 days has response time >= 2 hours", () => {
      fc.assert(
        fc.property(
          // Generate 30+ days where at least one of the first 30 is >= 2 hours
          fc.integer({ min: 0, max: 29 }).chain((badIndex) =>
            fc.tuple(
              fc.array(
                fc.double({ min: 0, max: 1.999, noNaN: true, noDefaultInfinity: true }),
                { minLength: 30, maxLength: 30 }
              ),
              fc.double({ min: 2.0, max: 24, noNaN: true, noDefaultInfinity: true }),
              fc.constant(badIndex)
            )
          ),
          fc.boolean(),
          fc.array(rating, { minLength: 0, maxLength: 12 }),
          completedJobsCount,
          ([times, badTime, badIndex], identityVerified, ratings, jobs) => {
            const modifiedTimes = [...times];
            modifiedTimes[badIndex] = badTime;

            const input: BadgeEligibilityInput = {
              identityVerified,
              monthlyAverageRatings: ratings,
              dailyResponseTimesHours: modifiedTimes,
              completedJobsCount: jobs,
            };
            const result = checkBadgeEligibility(input);
            expect(result.fastResponder).toBe(false);
          }
        ),
        { numRuns: 100 }
      );
    });

    it("is awarded if and only if the first 30 days all have response time < 2 hours", () => {
      fc.assert(
        fc.property(badgeEligibilityInput, (input) => {
          const result = checkBadgeEligibility(input);

          const hasEnoughDays =
            input.dailyResponseTimesHours.length >= BADGE_THRESHOLDS.FAST_RESPONDER_CONSECUTIVE_DAYS;
          const allFast = hasEnoughDays &&
            input.dailyResponseTimesHours
              .slice(0, BADGE_THRESHOLDS.FAST_RESPONDER_CONSECUTIVE_DAYS)
              .every((t) => t < BADGE_THRESHOLDS.FAST_RESPONDER_MAX_HOURS);

          expect(result.fastResponder).toBe(allFast);
        }),
        { numRuns: 100 }
      );
    });
  });

  describe("Job count milestone badges", () => {
    it("awards milestones at exactly 50, 100, and 250 completed jobs", () => {
      fc.assert(
        fc.property(badgeEligibilityInput, (input) => {
          const result = checkBadgeEligibility(input);

          const expectedMilestones = BADGE_THRESHOLDS.JOB_COUNT_MILESTONES.filter(
            (milestone) => input.completedJobsCount >= milestone
          );

          expect(result.jobMilestones).toEqual(expectedMilestones);
        }),
        { numRuns: 100 }
      );
    });

    it("awards no milestones when completed jobs < 50", () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 0, max: 49 }),
          fc.boolean(),
          fc.array(rating, { minLength: 0, maxLength: 12 }),
          fc.array(responseTimeHours, { minLength: 0, maxLength: 60 }),
          (jobs, identityVerified, ratings, responseTimes) => {
            const input: BadgeEligibilityInput = {
              identityVerified,
              monthlyAverageRatings: ratings,
              dailyResponseTimesHours: responseTimes,
              completedJobsCount: jobs,
            };
            const result = checkBadgeEligibility(input);
            expect(result.jobMilestones).toEqual([]);
          }
        ),
        { numRuns: 100 }
      );
    });

    it("awards [50] when 50 <= completed jobs < 100", () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 50, max: 99 }),
          fc.boolean(),
          fc.array(rating, { minLength: 0, maxLength: 12 }),
          fc.array(responseTimeHours, { minLength: 0, maxLength: 60 }),
          (jobs, identityVerified, ratings, responseTimes) => {
            const input: BadgeEligibilityInput = {
              identityVerified,
              monthlyAverageRatings: ratings,
              dailyResponseTimesHours: responseTimes,
              completedJobsCount: jobs,
            };
            const result = checkBadgeEligibility(input);
            expect(result.jobMilestones).toEqual([50]);
          }
        ),
        { numRuns: 100 }
      );
    });

    it("awards [50, 100] when 100 <= completed jobs < 250", () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 100, max: 249 }),
          fc.boolean(),
          fc.array(rating, { minLength: 0, maxLength: 12 }),
          fc.array(responseTimeHours, { minLength: 0, maxLength: 60 }),
          (jobs, identityVerified, ratings, responseTimes) => {
            const input: BadgeEligibilityInput = {
              identityVerified,
              monthlyAverageRatings: ratings,
              dailyResponseTimesHours: responseTimes,
              completedJobsCount: jobs,
            };
            const result = checkBadgeEligibility(input);
            expect(result.jobMilestones).toEqual([50, 100]);
          }
        ),
        { numRuns: 100 }
      );
    });

    it("awards [50, 100, 250] when completed jobs >= 250", () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 250, max: 500 }),
          fc.boolean(),
          fc.array(rating, { minLength: 0, maxLength: 12 }),
          fc.array(responseTimeHours, { minLength: 0, maxLength: 60 }),
          (jobs, identityVerified, ratings, responseTimes) => {
            const input: BadgeEligibilityInput = {
              identityVerified,
              monthlyAverageRatings: ratings,
              dailyResponseTimesHours: responseTimes,
              completedJobsCount: jobs,
            };
            const result = checkBadgeEligibility(input);
            expect(result.jobMilestones).toEqual([50, 100, 250]);
          }
        ),
        { numRuns: 100 }
      );
    });
  });
});
