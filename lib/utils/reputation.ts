/**
 * Reputation calculation utilities for the marketplace integration.
 *
 * These functions derive display-ready reputation metrics from raw profile data
 * returned by the backend feed and profile endpoints.
 */

/**
 * Calculates a credit score on a 0–100 scale from an average rating (0–5).
 *
 * Formula: Math.round(averageRating × 20)
 *
 * Validates: Requirements 12.2
 */
export function calculateCreditScore(averageRating: number): number {
  return Math.round(averageRating * 20);
}

/**
 * Calculates the completion rate as a percentage of completed jobs over total jobs.
 *
 * Returns 0 when total is 0 to avoid division by zero.
 *
 * Validates: Requirements 12.3
 */
export function calculateCompletionRate(completed: number, total: number): number {
  if (total === 0) return 0;
  return Math.round((completed / total) * 100);
}
