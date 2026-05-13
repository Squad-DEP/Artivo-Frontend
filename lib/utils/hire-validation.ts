/**
 * Hire flow validation utilities.
 *
 * Validates: Requirements 2.4
 */

import type { RequestJobPayload } from "@/api/types/marketplace-api";

export interface JobRequestValidationResult {
  valid: boolean;
  errors: Record<string, string>;
}

/**
 * Validates a job request payload ensuring all 5 required fields are present and non-empty.
 * Fields: job_type_id, title, description, location, budget.
 */
export function validateJobRequest(
  payload: Partial<RequestJobPayload>
): JobRequestValidationResult {
  const errors: Record<string, string> = {};

  if (!payload.job_type_id || payload.job_type_id.trim() === "") {
    errors.job_type_id = "Job type is required";
  }

  if (!payload.title || payload.title.trim() === "") {
    errors.title = "Title is required";
  }

  if (!payload.description || payload.description.trim() === "") {
    errors.description = "Description is required";
  }

  if (!payload.location || payload.location.trim() === "") {
    errors.location = "Location is required";
  }

  if (payload.budget === undefined || payload.budget === null) {
    errors.budget = "Budget is required";
  } else if (payload.budget <= 0) {
    errors.budget = "Budget must be a positive number";
  }

  return {
    valid: Object.keys(errors).length === 0,
    errors,
  };
}
