/**
 * Calculates the reconnection delay using exponential backoff.
 *
 * @param attempt - The reconnection attempt number (1-based)
 * @param baseDelay - The base delay in milliseconds (default: 1000ms)
 * @param maxDelay - The maximum delay cap in milliseconds (default: 30000ms)
 * @returns The delay in milliseconds before the next reconnection attempt
 */
export function calculateBackoffDelay(
  attempt: number,
  baseDelay: number = 1000,
  maxDelay: number = 30000
): number {
  return Math.min(baseDelay * Math.pow(2, attempt - 1), maxDelay);
}
