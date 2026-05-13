import { describe, it, expect } from "vitest";
import * as fc from "fast-check";
import { validateJobRequest } from "@/lib/utils/hire-validation";

// ─── Generators ──────────────────────────────────────────────────────────────

/** Generates a non-empty trimmed string (valid field value) */
const nonEmptyString = fc.string({ minLength: 1, maxLength: 100 }).filter(
  (s) => s.trim().length > 0
);

/** Generates a positive budget value */
const positiveBudget = fc.double({ min: 0.01, max: 10_000_000, noNaN: true, noDefaultInfinity: true });

/** Generates a complete valid payload */
const validPayload = fc.record({
  job_type_id: nonEmptyString,
  title: nonEmptyString,
  description: nonEmptyString,
  location: nonEmptyString,
  budget: positiveBudget,
});

/** The 5 required field names */
const requiredFields = ["job_type_id", "title", "description", "location", "budget"] as const;

// ─── Property 3: Job request validation rejects incomplete payloads ──────────

/**
 * Property 3: Job request validation rejects incomplete payloads
 *
 * For any subset of the 5 required fields missing at least one, `validateJobRequest`
 * SHALL reject. For any payload with all 5 non-empty fields, validation SHALL pass.
 *
 * Feature: marketplace-integration, Property 3: Job request validation rejects incomplete payloads
 * Validates: Requirements 2.4
 */
describe("Feature: marketplace-integration, Property 3: Job request validation rejects incomplete payloads", () => {
  it("rejects any payload missing at least one required field", () => {
    fc.assert(
      fc.property(
        validPayload,
        fc.subarray([...requiredFields], { minLength: 1 }),
        (payload, fieldsToRemove) => {
          // Create a copy with some fields removed
          const incomplete = { ...payload };
          for (const field of fieldsToRemove) {
            delete (incomplete as Record<string, unknown>)[field];
          }

          const result = validateJobRequest(incomplete);
          expect(result.valid).toBe(false);
          expect(Object.keys(result.errors).length).toBeGreaterThan(0);
        }
      ),
      { numRuns: 100 }
    );
  });

  it("passes validation when all 5 required fields are present and non-empty", () => {
    fc.assert(
      fc.property(validPayload, (payload) => {
        const result = validateJobRequest(payload);
        expect(result.valid).toBe(true);
        expect(Object.keys(result.errors).length).toBe(0);
      }),
      { numRuns: 100 }
    );
  });

  it("rejects payloads with empty string fields", () => {
    fc.assert(
      fc.property(
        validPayload,
        fc.constantFrom("job_type_id", "title", "description", "location"),
        (payload, fieldToEmpty) => {
          const withEmpty = { ...payload, [fieldToEmpty]: "" };
          const result = validateJobRequest(withEmpty);
          expect(result.valid).toBe(false);
          expect(result.errors[fieldToEmpty]).toBeDefined();
        }
      ),
      { numRuns: 100 }
    );
  });

  it("rejects payloads with whitespace-only string fields", () => {
    fc.assert(
      fc.property(
        validPayload,
        fc.constantFrom("job_type_id", "title", "description", "location"),
        fc.integer({ min: 1, max: 10 }).map((n) => " ".repeat(n)),
        (payload, fieldToWhitespace, whitespace) => {
          const withWhitespace = { ...payload, [fieldToWhitespace]: whitespace };
          const result = validateJobRequest(withWhitespace);
          expect(result.valid).toBe(false);
          expect(result.errors[fieldToWhitespace]).toBeDefined();
        }
      ),
      { numRuns: 100 }
    );
  });

  it("rejects payloads with zero or negative budget", () => {
    fc.assert(
      fc.property(
        validPayload,
        fc.double({ min: -10_000_000, max: 0, noNaN: true, noDefaultInfinity: true }),
        (payload, invalidBudget) => {
          const withBadBudget = { ...payload, budget: invalidBudget };
          const result = validateJobRequest(withBadBudget);
          expect(result.valid).toBe(false);
          expect(result.errors.budget).toBeDefined();
        }
      ),
      { numRuns: 100 }
    );
  });
});
