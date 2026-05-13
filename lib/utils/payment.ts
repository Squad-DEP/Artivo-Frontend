/**
 * Payment conversion utilities.
 *
 * Validates: Requirements 3.2
 */

/**
 * Converts a Naira amount to kobo (smallest currency unit).
 * Always returns a positive integer for positive input.
 *
 * @param amount - Amount in Naira (e.g., 1500.50)
 * @returns Amount in kobo (e.g., 150050)
 */
export function nairaToKobo(amount: number): number {
  return Math.round(amount * 100);
}
