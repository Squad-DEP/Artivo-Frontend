/**
 * Validation utility functions for the Artivo Gig Worker Platform.
 *
 * Each validator returns a result object:
 *   { valid: boolean; error?: string; missingField?: string }
 *
 * Validates: Requirements 1.1, 2.1, 2.4, 3.1, 5.3, 9.1, 9.2
 */

export interface ValidationResult {
  valid: boolean;
  error?: string;
  missingField?: string;
}

/**
 * Validates a worker display name (1–100 characters).
 * Requirement 1.1
 */
export function validateDisplayName(value: unknown): ValidationResult {
  if (value === undefined || value === null || value === "") {
    return { valid: false, error: "Display name is required", missingField: "display_name" };
  }
  if (typeof value !== "string") {
    return { valid: false, error: "Display name must be a string" };
  }
  if (value.length < 1) {
    return { valid: false, error: "Display name must be at least 1 character" };
  }
  if (value.length > 100) {
    return { valid: false, error: "Display name must be at most 100 characters" };
  }
  return { valid: true };
}

/**
 * Validates a customer name (2–100 characters).
 * Requirement 2.1
 */
export function validateCustomerName(value: unknown): ValidationResult {
  if (value === undefined || value === null || value === "") {
    return { valid: false, error: "Customer name is required", missingField: "name" };
  }
  if (typeof value !== "string") {
    return { valid: false, error: "Customer name must be a string" };
  }
  if (value.length < 2) {
    return { valid: false, error: "Customer name must be at least 2 characters" };
  }
  if (value.length > 100) {
    return { valid: false, error: "Customer name must be at most 100 characters" };
  }
  return { valid: true };
}

/**
 * Validates a bio (1–500 characters).
 * Requirement 1.1
 */
export function validateBio(value: unknown): ValidationResult {
  if (value === undefined || value === null || value === "") {
    return { valid: false, error: "Bio is required", missingField: "bio" };
  }
  if (typeof value !== "string") {
    return { valid: false, error: "Bio must be a string" };
  }
  if (value.length < 1) {
    return { valid: false, error: "Bio must be at least 1 character" };
  }
  if (value.length > 500) {
    return { valid: false, error: "Bio must be at most 500 characters" };
  }
  return { valid: true };
}

/**
 * Validates a skills list (1–20 items).
 * Requirement 1.1
 */
export function validateSkillsList(value: unknown): ValidationResult {
  if (value === undefined || value === null) {
    return { valid: false, error: "Skills list is required", missingField: "skills" };
  }
  if (!Array.isArray(value)) {
    return { valid: false, error: "Skills must be a list" };
  }
  if (value.length < 1) {
    return { valid: false, error: "At least 1 skill is required", missingField: "skills" };
  }
  if (value.length > 20) {
    return { valid: false, error: "Skills list must have at most 20 items" };
  }
  return { valid: true };
}

/**
 * Validates a categories list (1–5 items).
 * Requirement 1.1
 */
export function validateCategoriesList(value: unknown): ValidationResult {
  if (value === undefined || value === null) {
    return { valid: false, error: "Categories list is required", missingField: "categories" };
  }
  if (!Array.isArray(value)) {
    return { valid: false, error: "Categories must be a list" };
  }
  if (value.length < 1) {
    return { valid: false, error: "At least 1 category is required", missingField: "categories" };
  }
  if (value.length > 5) {
    return { valid: false, error: "Categories list must have at most 5 items" };
  }
  return { valid: true };
}

/**
 * Validates service needs text (up to 500 characters, optional but if provided must be ≤ 500).
 * Requirement 2.1
 */
export function validateServiceNeeds(value: unknown): ValidationResult {
  if (value === undefined || value === null || value === "") {
    return { valid: false, error: "Service needs description is required", missingField: "service_needs" };
  }
  if (typeof value !== "string") {
    return { valid: false, error: "Service needs must be a string" };
  }
  if (value.length > 500) {
    return { valid: false, error: "Service needs must be at most 500 characters" };
  }
  return { valid: true };
}

/**
 * Validates a username (3–30 characters, lowercase letters, digits, and hyphens only).
 * Requirement 3.1
 */
export function validateUsername(value: unknown): ValidationResult {
  if (value === undefined || value === null || value === "") {
    return { valid: false, error: "Username is required", missingField: "username" };
  }
  if (typeof value !== "string") {
    return { valid: false, error: "Username must be a string" };
  }
  if (value.length < 3) {
    return { valid: false, error: "Username must be at least 3 characters" };
  }
  if (value.length > 30) {
    return { valid: false, error: "Username must be at most 30 characters" };
  }
  if (!/^[a-z0-9-]+$/.test(value)) {
    return { valid: false, error: "Username must contain only lowercase letters, digits, and hyphens" };
  }
  return { valid: true };
}

/**
 * Validates a payment amount (100–10,000,000 NGN inclusive).
 * Requirement 5.3
 */
export function validatePaymentAmount(value: unknown): ValidationResult {
  if (value === undefined || value === null) {
    return { valid: false, error: "Payment amount is required", missingField: "amount" };
  }
  if (typeof value !== "number" || isNaN(value)) {
    return { valid: false, error: "Payment amount must be a number" };
  }
  if (value < 100) {
    return { valid: false, error: "Payment amount must be at least 100 NGN" };
  }
  if (value > 10_000_000) {
    return { valid: false, error: "Payment amount must be at most 10,000,000 NGN" };
  }
  return { valid: true };
}

/**
 * Validates a job title (5–100 characters).
 * Requirement 9.1
 */
export function validateJobTitle(value: unknown): ValidationResult {
  if (value === undefined || value === null || value === "") {
    return { valid: false, error: "Job title is required", missingField: "title" };
  }
  if (typeof value !== "string") {
    return { valid: false, error: "Job title must be a string" };
  }
  if (value.length < 5) {
    return { valid: false, error: "Job title must be at least 5 characters" };
  }
  if (value.length > 100) {
    return { valid: false, error: "Job title must be at most 100 characters" };
  }
  return { valid: true };
}

/**
 * Validates a job description (50–2000 characters).
 * Requirement 9.1
 */
export function validateJobDescription(value: unknown): ValidationResult {
  if (value === undefined || value === null || value === "") {
    return { valid: false, error: "Job description is required", missingField: "description" };
  }
  if (typeof value !== "string") {
    return { valid: false, error: "Job description must be a string" };
  }
  if (value.length < 50) {
    return { valid: false, error: "Job description must be at least 50 characters" };
  }
  if (value.length > 2000) {
    return { valid: false, error: "Job description must be at most 2000 characters" };
  }
  return { valid: true };
}

/**
 * Validates a cover letter (up to 2000 characters).
 * Requirement 9.2
 */
export function validateCoverLetter(value: unknown): ValidationResult {
  if (value === undefined || value === null || value === "") {
    return { valid: false, error: "Cover letter is required", missingField: "cover_letter" };
  }
  if (typeof value !== "string") {
    return { valid: false, error: "Cover letter must be a string" };
  }
  if (value.length > 2000) {
    return { valid: false, error: "Cover letter must be at most 2000 characters" };
  }
  return { valid: true };
}

/**
 * Validates a budget minimum value (≥ 0.01).
 * Requirement 9.1
 */
export function validateBudgetMin(value: unknown): ValidationResult {
  if (value === undefined || value === null) {
    return { valid: false, error: "Budget minimum is required", missingField: "budget_min" };
  }
  if (typeof value !== "number" || isNaN(value)) {
    return { valid: false, error: "Budget minimum must be a number" };
  }
  if (value < 0.01) {
    return { valid: false, error: "Budget minimum must be at least 0.01" };
  }
  return { valid: true };
}

/**
 * Validates a stage count (0–20).
 * Requirement 9.1
 */
export function validateStageCount(value: unknown): ValidationResult {
  if (value === undefined || value === null) {
    return { valid: false, error: "Stage count is required", missingField: "stages" };
  }
  if (typeof value !== "number" || isNaN(value) || !Number.isInteger(value)) {
    return { valid: false, error: "Stage count must be an integer" };
  }
  if (value < 0) {
    return { valid: false, error: "Stage count must be at least 0" };
  }
  if (value > 20) {
    return { valid: false, error: "Stage count must be at most 20" };
  }
  return { valid: true };
}

/**
 * Validates a proposed amount is within a job's budget range [budgetMin, budgetMax].
 * Requirement 9.2
 */
export function validateProposedAmount(
  value: unknown,
  budgetMin: number,
  budgetMax: number
): ValidationResult {
  if (value === undefined || value === null) {
    return { valid: false, error: "Proposed amount is required", missingField: "proposed_amount" };
  }
  if (typeof value !== "number" || isNaN(value)) {
    return { valid: false, error: "Proposed amount must be a number" };
  }
  if (value < budgetMin) {
    return { valid: false, error: `Proposed amount must be at least ${budgetMin}` };
  }
  if (value > budgetMax) {
    return { valid: false, error: `Proposed amount must be at most ${budgetMax}` };
  }
  return { valid: true };
}
