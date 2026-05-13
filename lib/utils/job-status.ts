/**
 * Job status derivation utilities.
 *
 * Validates: Requirements 4.3, 4.4, 5.4
 */

export type CompletionStatus = "completed" | "waiting" | "in_progress";

/**
 * Derives the job completion status from the two completion flags.
 *
 * - "completed" if both customer and worker have confirmed
 * - "waiting" if exactly one party has confirmed
 * - "in_progress" if neither has confirmed
 */
export function deriveCompletionStatus(
  customerCompleted: boolean,
  workerCompleted: boolean
): CompletionStatus {
  if (customerCompleted && workerCompleted) {
    return "completed";
  }
  if (customerCompleted || workerCompleted) {
    return "waiting";
  }
  return "in_progress";
}

/**
 * Determines whether the rating interface should be enabled.
 * Rating is only allowed when the job status is "completed".
 */
export function isRatingEnabled(jobStatus: string): boolean {
  return jobStatus === "completed";
}
