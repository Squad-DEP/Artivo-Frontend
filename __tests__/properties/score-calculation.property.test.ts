import { describe, it, expect } from "vitest";
import * as fc from "fast-check";
import {
  calculateTrustScore,
  calculateCreditScore,
  determineTrustScoreTrend,
  determineCreditScoreTrend,
  filterEligibleProducts,
  TRUST_SCORE_WEIGHTS,
  CREDIT_SCORE_WEIGHTS,
  CREDIT_SCORE_MIN,
  CREDIT_SCORE_MAX,
  CREDIT_SCORE_RANGE,
  TRUST_SCORE_TREND_THRESHOLD,
  CREDIT_SCORE_TREND_THRESHOLD,
} from "@/lib/score-utils";
import type { CreditProduct } from "@/api/types/reputation";

// ─── Generators ──────────────────────────────────────────────────────────────

/** Generates a component score between 0 and 100 */
const componentScore = fc.double({ min: 0, max: 100, noNaN: true, noDefaultInfinity: true });

/** Generates trust score component inputs */
const trustScoreComponents = fc.record({
  completion_rate: componentScore,
  response_time: componentScore,
  customer_satisfaction: componentScore,
  verification_level: componentScore,
  platform_tenure: componentScore,
});

/** Generates credit score factor inputs */
const creditScoreFactors = fc.record({
  job_completion: componentScore,
  earnings_consistency: componentScore,
  tenure: componentScore,
  verification_level: componentScore,
  payment_history: componentScore,
});

/** Generates a valid credit product */
const creditProduct = fc.record({
  id: fc.uuid(),
  name: fc.string({ minLength: 1, maxLength: 50 }),
  type: fc.constantFrom("loan" as const, "savings" as const, "insurance" as const, "credit_line" as const),
  provider: fc.string({ minLength: 1, maxLength: 50 }),
  description: fc.string({ minLength: 1, maxLength: 200 }),
  min_credit_score: fc.integer({ min: 300, max: 850 }),
  max_amount: fc.option(fc.double({ min: 1000, max: 10_000_000, noNaN: true, noDefaultInfinity: true }), { nil: undefined }),
  interest_rate: fc.option(fc.double({ min: 0.01, max: 50, noNaN: true, noDefaultInfinity: true }), { nil: undefined }),
  terms: fc.option(fc.string({ minLength: 1, maxLength: 100 }), { nil: undefined }),
});

// ─── Property 10: Trust Score Weighted Calculation ───────────────────────────

/**
 * Property 10: Trust Score Weighted Calculation
 *
 * For any set of component scores where each component is between 0 and 100,
 * the trust score SHALL equal: (completion_rate × 0.30) + (response_time × 0.20) +
 * (customer_satisfaction × 0.25) + (verification_level × 0.15) + (platform_tenure × 0.10),
 * and the result SHALL always be between 0 and 100.
 *
 * Validates: Requirements 6.3
 */
describe("Feature: gig-worker-platform, Property 10: Trust Score Weighted Calculation", () => {
  it("produces a result between 0 and 100 for any valid component scores", () => {
    fc.assert(
      fc.property(trustScoreComponents, (components) => {
        const score = calculateTrustScore(components);
        expect(score).toBeGreaterThanOrEqual(0);
        expect(score).toBeLessThanOrEqual(100);
      }),
      { numRuns: 100 }
    );
  });

  it("equals the weighted sum of components for inputs in [0, 100]", () => {
    fc.assert(
      fc.property(trustScoreComponents, (components) => {
        const score = calculateTrustScore(components);
        const expected =
          components.completion_rate * TRUST_SCORE_WEIGHTS.completion_rate +
          components.response_time * TRUST_SCORE_WEIGHTS.response_time +
          components.customer_satisfaction * TRUST_SCORE_WEIGHTS.customer_satisfaction +
          components.verification_level * TRUST_SCORE_WEIGHTS.verification_level +
          components.platform_tenure * TRUST_SCORE_WEIGHTS.platform_tenure;

        // For inputs in [0, 100], the weighted sum is already in [0, 100]
        // so clamping should not change the value
        expect(score).toBeCloseTo(expected, 10);
      }),
      { numRuns: 100 }
    );
  });

  it("returns 0 when all components are 0", () => {
    const score = calculateTrustScore({
      completion_rate: 0,
      response_time: 0,
      customer_satisfaction: 0,
      verification_level: 0,
      platform_tenure: 0,
    });
    expect(score).toBe(0);
  });

  it("returns 100 when all components are 100", () => {
    const score = calculateTrustScore({
      completion_rate: 100,
      response_time: 100,
      customer_satisfaction: 100,
      verification_level: 100,
      platform_tenure: 100,
    });
    expect(score).toBe(100);
  });

  it("weights sum to 1.0 (ensuring full range coverage)", () => {
    const totalWeight =
      TRUST_SCORE_WEIGHTS.completion_rate +
      TRUST_SCORE_WEIGHTS.response_time +
      TRUST_SCORE_WEIGHTS.customer_satisfaction +
      TRUST_SCORE_WEIGHTS.verification_level +
      TRUST_SCORE_WEIGHTS.platform_tenure;
    expect(totalWeight).toBeCloseTo(1.0, 10);
  });
});

// ─── Property 11: Score Trend Determination ──────────────────────────────────

/**
 * Property 11: Score Trend Determination
 *
 * For any current score and previous score measured 30 days apart, the trend SHALL be
 * "up" if the difference is ≥ 2 points (for trust score) or ≥ 5 points (for credit score),
 * "down" if the difference is ≤ -2 points (trust) or ≤ -5 points (credit),
 * and "stable" otherwise.
 *
 * Validates: Requirements 6.4, 7.4
 */
describe("Feature: gig-worker-platform, Property 11: Score Trend Determination", () => {
  describe("Trust Score Trend (±2 threshold)", () => {
    it("returns 'up' when current - previous >= 2", () => {
      fc.assert(
        fc.property(
          fc.double({ min: 0, max: 100, noNaN: true, noDefaultInfinity: true }),
          fc.double({ min: TRUST_SCORE_TREND_THRESHOLD, max: 100, noNaN: true, noDefaultInfinity: true }),
          (previous, diff) => {
            const current = previous + diff;
            const trend = determineTrustScoreTrend(current, previous);
            expect(trend).toBe("up");
          }
        ),
        { numRuns: 100 }
      );
    });

    it("returns 'down' when current - previous <= -2", () => {
      fc.assert(
        fc.property(
          fc.double({ min: 0, max: 100, noNaN: true, noDefaultInfinity: true }),
          fc.double({ min: TRUST_SCORE_TREND_THRESHOLD, max: 100, noNaN: true, noDefaultInfinity: true }),
          (previous, diff) => {
            const current = previous - diff;
            const trend = determineTrustScoreTrend(current, previous);
            expect(trend).toBe("down");
          }
        ),
        { numRuns: 100 }
      );
    });

    it("returns 'stable' when |current - previous| < 2", () => {
      fc.assert(
        fc.property(
          fc.double({ min: 0, max: 100, noNaN: true, noDefaultInfinity: true }),
          fc.double({ min: -TRUST_SCORE_TREND_THRESHOLD + 0.001, max: TRUST_SCORE_TREND_THRESHOLD - 0.001, noNaN: true, noDefaultInfinity: true }),
          (previous, diff) => {
            const current = previous + diff;
            const trend = determineTrustScoreTrend(current, previous);
            expect(trend).toBe("stable");
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  describe("Credit Score Trend (±5 threshold)", () => {
    it("returns 'up' when current - previous >= 5", () => {
      fc.assert(
        fc.property(
          fc.double({ min: 300, max: 850, noNaN: true, noDefaultInfinity: true }),
          fc.double({ min: CREDIT_SCORE_TREND_THRESHOLD, max: 550, noNaN: true, noDefaultInfinity: true }),
          (previous, diff) => {
            const current = previous + diff;
            const trend = determineCreditScoreTrend(current, previous);
            expect(trend).toBe("up");
          }
        ),
        { numRuns: 100 }
      );
    });

    it("returns 'down' when current - previous <= -5", () => {
      fc.assert(
        fc.property(
          fc.double({ min: 300, max: 850, noNaN: true, noDefaultInfinity: true }),
          fc.double({ min: CREDIT_SCORE_TREND_THRESHOLD, max: 550, noNaN: true, noDefaultInfinity: true }),
          (previous, diff) => {
            const current = previous - diff;
            const trend = determineCreditScoreTrend(current, previous);
            expect(trend).toBe("down");
          }
        ),
        { numRuns: 100 }
      );
    });

    it("returns 'stable' when |current - previous| < 5", () => {
      fc.assert(
        fc.property(
          fc.double({ min: 300, max: 850, noNaN: true, noDefaultInfinity: true }),
          fc.double({ min: -CREDIT_SCORE_TREND_THRESHOLD + 0.001, max: CREDIT_SCORE_TREND_THRESHOLD - 0.001, noNaN: true, noDefaultInfinity: true }),
          (previous, diff) => {
            const current = previous + diff;
            const trend = determineCreditScoreTrend(current, previous);
            expect(trend).toBe("stable");
          }
        ),
        { numRuns: 100 }
      );
    });
  });
});

// ─── Property 13: Credit Score Bounds ────────────────────────────────────────

/**
 * Property 13: Credit Score Bounds
 *
 * For any set of credit score factor inputs, the calculated credit score SHALL always
 * be between 300 and 850 inclusive, with an initial score of exactly 300 for workers
 * with no platform activity.
 *
 * Validates: Requirements 7.1
 */
describe("Feature: gig-worker-platform, Property 13: Credit Score Bounds", () => {
  it("always produces a score between 300 and 850 for any valid factor inputs", () => {
    fc.assert(
      fc.property(creditScoreFactors, (factors) => {
        const score = calculateCreditScore(factors);
        expect(score).toBeGreaterThanOrEqual(CREDIT_SCORE_MIN);
        expect(score).toBeLessThanOrEqual(CREDIT_SCORE_MAX);
      }),
      { numRuns: 100 }
    );
  });

  it("returns exactly 300 when all factors are 0 (no platform activity)", () => {
    const score = calculateCreditScore({
      job_completion: 0,
      earnings_consistency: 0,
      tenure: 0,
      verification_level: 0,
      payment_history: 0,
    });
    expect(score).toBe(CREDIT_SCORE_MIN);
  });

  it("returns exactly 850 when all factors are 100 (maximum activity)", () => {
    const score = calculateCreditScore({
      job_completion: 100,
      earnings_consistency: 100,
      tenure: 100,
      verification_level: 100,
      payment_history: 100,
    });
    expect(score).toBe(CREDIT_SCORE_MAX);
  });

  it("never exceeds 850 even with extreme inputs", () => {
    fc.assert(
      fc.property(
        fc.record({
          job_completion: fc.double({ min: 0, max: 200, noNaN: true, noDefaultInfinity: true }),
          earnings_consistency: fc.double({ min: 0, max: 200, noNaN: true, noDefaultInfinity: true }),
          tenure: fc.double({ min: 0, max: 200, noNaN: true, noDefaultInfinity: true }),
          verification_level: fc.double({ min: 0, max: 200, noNaN: true, noDefaultInfinity: true }),
          payment_history: fc.double({ min: 0, max: 200, noNaN: true, noDefaultInfinity: true }),
        }),
        (factors) => {
          const score = calculateCreditScore(factors);
          expect(score).toBeLessThanOrEqual(CREDIT_SCORE_MAX);
          expect(score).toBeGreaterThanOrEqual(CREDIT_SCORE_MIN);
        }
      ),
      { numRuns: 100 }
    );
  });
});

// ─── Property 14: Credit Score Weighted Calculation ──────────────────────────

/**
 * Property 14: Credit Score Weighted Calculation
 *
 * For any set of factor scores (each 0–100), the credit score SHALL be calculated as:
 * 300 + ((job_completion × 0.25 + earnings_consistency × 0.25 + tenure × 0.15 +
 * verification_level × 0.15 + payment_history × 0.20) / 100) × 550,
 * producing a value in the range [300, 850].
 *
 * Validates: Requirements 7.2
 */
describe("Feature: gig-worker-platform, Property 14: Credit Score Weighted Calculation", () => {
  it("equals the formula: 300 + ((weighted_sum) / 100) × 550 for inputs in [0, 100]", () => {
    fc.assert(
      fc.property(creditScoreFactors, (factors) => {
        const score = calculateCreditScore(factors);

        const weightedSum =
          factors.job_completion * CREDIT_SCORE_WEIGHTS.job_completion +
          factors.earnings_consistency * CREDIT_SCORE_WEIGHTS.earnings_consistency +
          factors.tenure * CREDIT_SCORE_WEIGHTS.tenure +
          factors.verification_level * CREDIT_SCORE_WEIGHTS.verification_level +
          factors.payment_history * CREDIT_SCORE_WEIGHTS.payment_history;

        const expected = CREDIT_SCORE_MIN + (weightedSum / 100) * CREDIT_SCORE_RANGE;

        expect(score).toBeCloseTo(expected, 10);
      }),
      { numRuns: 100 }
    );
  });

  it("produces a value in the range [300, 850] for any valid inputs", () => {
    fc.assert(
      fc.property(creditScoreFactors, (factors) => {
        const score = calculateCreditScore(factors);
        expect(score).toBeGreaterThanOrEqual(300);
        expect(score).toBeLessThanOrEqual(850);
      }),
      { numRuns: 100 }
    );
  });

  it("uses correct weights that sum to 1.0", () => {
    const totalWeight =
      CREDIT_SCORE_WEIGHTS.job_completion +
      CREDIT_SCORE_WEIGHTS.earnings_consistency +
      CREDIT_SCORE_WEIGHTS.tenure +
      CREDIT_SCORE_WEIGHTS.verification_level +
      CREDIT_SCORE_WEIGHTS.payment_history;
    expect(totalWeight).toBeCloseTo(1.0, 10);
  });

  it("is monotonically non-decreasing: higher factor scores produce higher or equal credit scores", () => {
    fc.assert(
      fc.property(
        creditScoreFactors,
        fc.record({
          job_completion: componentScore,
          earnings_consistency: componentScore,
          tenure: componentScore,
          verification_level: componentScore,
          payment_history: componentScore,
        }),
        (factors1, factors2) => {
          // Create factors where each component of factors2 >= factors1
          const higher = {
            job_completion: Math.max(factors1.job_completion, factors2.job_completion),
            earnings_consistency: Math.max(factors1.earnings_consistency, factors2.earnings_consistency),
            tenure: Math.max(factors1.tenure, factors2.tenure),
            verification_level: Math.max(factors1.verification_level, factors2.verification_level),
            payment_history: Math.max(factors1.payment_history, factors2.payment_history),
          };
          const lower = {
            job_completion: Math.min(factors1.job_completion, factors2.job_completion),
            earnings_consistency: Math.min(factors1.earnings_consistency, factors2.earnings_consistency),
            tenure: Math.min(factors1.tenure, factors2.tenure),
            verification_level: Math.min(factors1.verification_level, factors2.verification_level),
            payment_history: Math.min(factors1.payment_history, factors2.payment_history),
          };

          const higherScore = calculateCreditScore(higher);
          const lowerScore = calculateCreditScore(lower);

          expect(higherScore).toBeGreaterThanOrEqual(lowerScore);
        }
      ),
      { numRuns: 100 }
    );
  });
});

// ─── Property 15: Financial Product Eligibility Filtering ────────────────────

/**
 * Property 15: Financial Product Eligibility Filtering
 *
 * For any credit score value and list of financial products with minimum score thresholds,
 * the eligibility filter SHALL mark a product as eligible if and only if the worker's
 * score is greater than or equal to the product's minimum threshold.
 *
 * Validates: Requirements 7.5
 */
describe("Feature: gig-worker-platform, Property 15: Financial Product Eligibility Filtering", () => {
  it("includes only products where credit score >= min_credit_score", () => {
    fc.assert(
      fc.property(
        fc.double({ min: 300, max: 850, noNaN: true, noDefaultInfinity: true }),
        fc.array(creditProduct, { minLength: 0, maxLength: 20 }),
        (score, products) => {
          const eligible = filterEligibleProducts(score, products as CreditProduct[]);

          // Every eligible product must have min_credit_score <= score
          for (const product of eligible) {
            expect(score).toBeGreaterThanOrEqual(product.min_credit_score);
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  it("excludes all products where credit score < min_credit_score", () => {
    fc.assert(
      fc.property(
        fc.double({ min: 300, max: 850, noNaN: true, noDefaultInfinity: true }),
        fc.array(creditProduct, { minLength: 0, maxLength: 20 }),
        (score, products) => {
          const eligible = filterEligibleProducts(score, products as CreditProduct[]);
          const eligibleIds = new Set(eligible.map((p) => p.id));

          // Every product NOT in eligible must have min_credit_score > score
          for (const product of products) {
            if (!eligibleIds.has(product.id)) {
              expect(product.min_credit_score).toBeGreaterThan(score);
            }
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  it("returns all products when score is at maximum (850)", () => {
    fc.assert(
      fc.property(
        fc.array(creditProduct, { minLength: 1, maxLength: 10 }),
        (products) => {
          const eligible = filterEligibleProducts(850, products as CreditProduct[]);
          expect(eligible.length).toBe(products.length);
        }
      ),
      { numRuns: 100 }
    );
  });

  it("returns empty array when no products meet the threshold", () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 300, max: 400 }),
        fc.array(
          creditProduct.map((p) => ({ ...p, min_credit_score: 800 })),
          { minLength: 1, maxLength: 10 }
        ),
        (score, products) => {
          const eligible = filterEligibleProducts(score, products as CreditProduct[]);
          expect(eligible.length).toBe(0);
        }
      ),
      { numRuns: 100 }
    );
  });

  it("preserves the original product objects in the result", () => {
    fc.assert(
      fc.property(
        fc.double({ min: 300, max: 850, noNaN: true, noDefaultInfinity: true }),
        fc.array(creditProduct, { minLength: 1, maxLength: 10 }),
        (score, products) => {
          const eligible = filterEligibleProducts(score, products as CreditProduct[]);

          // Each eligible product should be reference-equal to one in the input
          for (const product of eligible) {
            expect(products).toContain(product);
          }
        }
      ),
      { numRuns: 100 }
    );
  });
});
