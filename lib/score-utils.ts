import type { CreditProduct } from "@/api/types/reputation";

// ─── Trust Score Weights (Requirement 6.3) ───────────────────────────────────

export const TRUST_SCORE_WEIGHTS = {
  completion_rate: 0.3,
  response_time: 0.2,
  customer_satisfaction: 0.25,
  verification_level: 0.15,
  platform_tenure: 0.1,
} as const;

// ─── Credit Score Weights (Requirement 7.2) ──────────────────────────────────

export const CREDIT_SCORE_WEIGHTS = {
  job_completion: 0.25,
  earnings_consistency: 0.25,
  tenure: 0.15,
  verification_level: 0.15,
  payment_history: 0.2,
} as const;

export const CREDIT_SCORE_MIN = 300;
export const CREDIT_SCORE_MAX = 850;
export const CREDIT_SCORE_RANGE = CREDIT_SCORE_MAX - CREDIT_SCORE_MIN; // 550

// ─── Trend Thresholds (Requirements 6.4, 7.4) ───────────────────────────────

export const TRUST_SCORE_TREND_THRESHOLD = 2;
export const CREDIT_SCORE_TREND_THRESHOLD = 5;

// ─── Badge Thresholds (Requirement 6.5) ──────────────────────────────────────

export const BADGE_THRESHOLDS = {
  TOP_RATED_MIN_RATING: 4.8,
  TOP_RATED_CONSECUTIVE_MONTHS: 3,
  FAST_RESPONDER_MAX_HOURS: 2,
  FAST_RESPONDER_CONSECUTIVE_DAYS: 30,
  JOB_COUNT_MILESTONES: [50, 100, 250] as const,
} as const;

// ─── Trust Score Calculation (Requirement 6.3) ───────────────────────────────

/**
 * Calculates the weighted trust score from component scores.
 * Each component should be in the range 0–100.
 * Result is clamped to [0, 100].
 *
 * Formula: completion_rate × 0.30 + response_time × 0.20 +
 *          customer_satisfaction × 0.25 + verification_level × 0.15 +
 *          platform_tenure × 0.10
 */
export function calculateTrustScore(components: {
  completion_rate: number;
  response_time: number;
  customer_satisfaction: number;
  verification_level: number;
  platform_tenure: number;
}): number {
  const raw =
    components.completion_rate * TRUST_SCORE_WEIGHTS.completion_rate +
    components.response_time * TRUST_SCORE_WEIGHTS.response_time +
    components.customer_satisfaction * TRUST_SCORE_WEIGHTS.customer_satisfaction +
    components.verification_level * TRUST_SCORE_WEIGHTS.verification_level +
    components.platform_tenure * TRUST_SCORE_WEIGHTS.platform_tenure;

  return Math.min(100, Math.max(0, raw));
}


// ─── Credit Score Calculation (Requirements 7.1, 7.2) ────────────────────────

/**
 * Calculates the credit score from factor scores.
 * Each factor should be in the range 0–100.
 * Result is clamped to [300, 850].
 *
 * Formula: 300 + ((weighted_sum) / 100) × 550
 * where weighted_sum = job_completion × 0.25 + earnings_consistency × 0.25 +
 *                      tenure × 0.15 + verification_level × 0.15 +
 *                      payment_history × 0.20
 */
export function calculateCreditScore(factors: {
  job_completion: number;
  earnings_consistency: number;
  tenure: number;
  verification_level: number;
  payment_history: number;
}): number {
  const weightedSum =
    factors.job_completion * CREDIT_SCORE_WEIGHTS.job_completion +
    factors.earnings_consistency * CREDIT_SCORE_WEIGHTS.earnings_consistency +
    factors.tenure * CREDIT_SCORE_WEIGHTS.tenure +
    factors.verification_level * CREDIT_SCORE_WEIGHTS.verification_level +
    factors.payment_history * CREDIT_SCORE_WEIGHTS.payment_history;

  const raw = CREDIT_SCORE_MIN + (weightedSum / 100) * CREDIT_SCORE_RANGE;

  return Math.min(CREDIT_SCORE_MAX, Math.max(CREDIT_SCORE_MIN, raw));
}

// ─── Trend Determination (Requirements 6.4, 7.4) ────────────────────────────

export type TrendDirection = "up" | "down" | "stable";

/**
 * Determines the trust score trend direction based on the difference
 * between the current score and the score from 30 days ago.
 * "up" if increased by ≥ 2 points, "down" if decreased by ≥ 2 points,
 * "stable" otherwise.
 */
export function determineTrustScoreTrend(
  currentScore: number,
  previousScore: number
): TrendDirection {
  const diff = currentScore - previousScore;

  if (diff >= TRUST_SCORE_TREND_THRESHOLD) {
    return "up";
  }
  if (diff <= -TRUST_SCORE_TREND_THRESHOLD) {
    return "down";
  }
  return "stable";
}

/**
 * Determines the credit score trend direction based on the difference
 * between the current score and the score from 30 days ago.
 * "up" if increased by ≥ 5 points, "down" if decreased by ≥ 5 points,
 * "stable" otherwise.
 */
export function determineCreditScoreTrend(
  currentScore: number,
  previousScore: number
): TrendDirection {
  const diff = currentScore - previousScore;

  if (diff >= CREDIT_SCORE_TREND_THRESHOLD) {
    return "up";
  }
  if (diff <= -CREDIT_SCORE_TREND_THRESHOLD) {
    return "down";
  }
  return "stable";
}

// ─── Badge Eligibility (Requirement 6.5) ─────────────────────────────────────

export interface BadgeEligibilityInput {
  /** Whether identity verification is complete */
  identityVerified: boolean;
  /** Monthly average ratings for the last N months (most recent first) */
  monthlyAverageRatings: number[];
  /** Daily average response times in hours for the last N days (most recent first) */
  dailyResponseTimesHours: number[];
  /** Total number of completed jobs */
  completedJobsCount: number;
}

export interface EligibleBadges {
  verifiedIdentity: boolean;
  topRated: boolean;
  fastResponder: boolean;
  jobMilestones: number[]; // which milestones have been reached (50, 100, 250)
}

/**
 * Checks badge eligibility based on worker profile state.
 *
 * - "Verified Identity": identity verification is complete
 * - "Top Rated": average rating ≥ 4.8 for 3 consecutive months
 * - "Fast Responder": average response time < 2 hours for 30 consecutive days
 * - Job count badges: at 50, 100, and 250 completed jobs
 */
export function checkBadgeEligibility(
  input: BadgeEligibilityInput
): EligibleBadges {
  // Verified Identity
  const verifiedIdentity = input.identityVerified;

  // Top Rated: need at least 3 months of data, all ≥ 4.8
  const topRated =
    input.monthlyAverageRatings.length >= BADGE_THRESHOLDS.TOP_RATED_CONSECUTIVE_MONTHS &&
    input.monthlyAverageRatings
      .slice(0, BADGE_THRESHOLDS.TOP_RATED_CONSECUTIVE_MONTHS)
      .every((rating) => rating >= BADGE_THRESHOLDS.TOP_RATED_MIN_RATING);

  // Fast Responder: need at least 30 days of data, all < 2 hours
  const fastResponder =
    input.dailyResponseTimesHours.length >= BADGE_THRESHOLDS.FAST_RESPONDER_CONSECUTIVE_DAYS &&
    input.dailyResponseTimesHours
      .slice(0, BADGE_THRESHOLDS.FAST_RESPONDER_CONSECUTIVE_DAYS)
      .every((time) => time < BADGE_THRESHOLDS.FAST_RESPONDER_MAX_HOURS);

  // Job count milestones
  const jobMilestones = BADGE_THRESHOLDS.JOB_COUNT_MILESTONES.filter(
    (milestone) => input.completedJobsCount >= milestone
  );

  return {
    verifiedIdentity,
    topRated,
    fastResponder,
    jobMilestones: [...jobMilestones],
  };
}

// ─── Financial Product Eligibility (Requirement 7.5) ─────────────────────────

/**
 * Filters financial products based on the worker's current credit score.
 * A product is eligible if the worker's score meets or exceeds the product's
 * minimum score threshold.
 */
export function filterEligibleProducts(
  creditScore: number,
  products: CreditProduct[]
): CreditProduct[] {
  return products.filter(
    (product) => creditScore >= product.min_credit_score
  );
}
