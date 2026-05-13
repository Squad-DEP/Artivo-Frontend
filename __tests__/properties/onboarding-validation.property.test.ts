import { describe, it, expect } from "vitest";
import * as fc from "fast-check";
import {
  validateDisplayName,
  validateCustomerName,
  validateBio,
  validateSkillsList,
  validateCategoriesList,
  validateServiceNeeds,
  validateUsername,
  validatePaymentAmount,
  validateJobTitle,
  validateJobDescription,
  validateCoverLetter,
  validateBudgetMin,
  validateStageCount,
  validateProposedAmount,
} from "@/lib/validators";

/**
 * Property 1: Onboarding Input Validation
 *
 * For any input string provided during onboarding, the validation function SHALL accept
 * display names of 1–100 characters, customer names of 2–100 characters, bios of 1–500
 * characters, skill lists of 1–20 items, category lists of 1–5 items, and service need
 * descriptions of up to 500 characters, while rejecting any input that falls outside
 * these bounds. Additionally, for any subset of required fields that is incomplete, the
 * validator SHALL correctly identify which specific field is missing.
 *
 * Validates: Requirements 1.1, 2.1, 2.4
 */
describe("Feature: gig-worker-platform, Property 1: Onboarding Input Validation", () => {
  describe("Display Name (1–100 characters)", () => {
    it("accepts any non-empty string of 1–100 characters", () => {
      fc.assert(
        fc.property(
          fc.string({ minLength: 1, maxLength: 100 }),
          (name) => {
            const result = validateDisplayName(name);
            expect(result.valid).toBe(true);
          }
        ),
        { numRuns: 100 }
      );
    });

    it("rejects any string longer than 100 characters", () => {
      fc.assert(
        fc.property(
          fc.string({ minLength: 101, maxLength: 300 }),
          (name) => {
            const result = validateDisplayName(name);
            expect(result.valid).toBe(false);
            expect(result.error).toBeDefined();
          }
        ),
        { numRuns: 100 }
      );
    });

    it("identifies missing field when value is empty/null/undefined", () => {
      fc.assert(
        fc.property(
          fc.constantFrom(null, undefined, ""),
          (value) => {
            const result = validateDisplayName(value);
            expect(result.valid).toBe(false);
            expect(result.missingField).toBe("display_name");
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  describe("Customer Name (2–100 characters)", () => {
    it("accepts any string of 2–100 characters", () => {
      fc.assert(
        fc.property(
          fc.string({ minLength: 2, maxLength: 100 }),
          (name) => {
            const result = validateCustomerName(name);
            expect(result.valid).toBe(true);
          }
        ),
        { numRuns: 100 }
      );
    });

    it("rejects any string shorter than 2 characters (non-empty)", () => {
      fc.assert(
        fc.property(
          fc.string({ minLength: 1, maxLength: 1 }),
          (name) => {
            const result = validateCustomerName(name);
            expect(result.valid).toBe(false);
            expect(result.error).toBeDefined();
          }
        ),
        { numRuns: 100 }
      );
    });

    it("rejects any string longer than 100 characters", () => {
      fc.assert(
        fc.property(
          fc.string({ minLength: 101, maxLength: 300 }),
          (name) => {
            const result = validateCustomerName(name);
            expect(result.valid).toBe(false);
            expect(result.error).toBeDefined();
          }
        ),
        { numRuns: 100 }
      );
    });

    it("identifies missing field when value is empty/null/undefined", () => {
      fc.assert(
        fc.property(
          fc.constantFrom(null, undefined, ""),
          (value) => {
            const result = validateCustomerName(value);
            expect(result.valid).toBe(false);
            expect(result.missingField).toBe("name");
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  describe("Bio (1–500 characters)", () => {
    it("accepts any non-empty string of 1–500 characters", () => {
      fc.assert(
        fc.property(
          fc.string({ minLength: 1, maxLength: 500 }),
          (bio) => {
            const result = validateBio(bio);
            expect(result.valid).toBe(true);
          }
        ),
        { numRuns: 100 }
      );
    });

    it("rejects any string longer than 500 characters", () => {
      fc.assert(
        fc.property(
          fc.string({ minLength: 501, maxLength: 700 }),
          (bio) => {
            const result = validateBio(bio);
            expect(result.valid).toBe(false);
            expect(result.error).toBeDefined();
          }
        ),
        { numRuns: 100 }
      );
    });

    it("identifies missing field when value is empty/null/undefined", () => {
      fc.assert(
        fc.property(
          fc.constantFrom(null, undefined, ""),
          (value) => {
            const result = validateBio(value);
            expect(result.valid).toBe(false);
            expect(result.missingField).toBe("bio");
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  describe("Skills List (1–20 items)", () => {
    it("accepts any array of 1–20 items", () => {
      fc.assert(
        fc.property(
          fc.array(fc.string({ minLength: 1 }), { minLength: 1, maxLength: 20 }),
          (skills) => {
            const result = validateSkillsList(skills);
            expect(result.valid).toBe(true);
          }
        ),
        { numRuns: 100 }
      );
    });

    it("rejects any array with more than 20 items", () => {
      fc.assert(
        fc.property(
          fc.array(fc.string({ minLength: 1 }), { minLength: 21, maxLength: 30 }),
          (skills) => {
            const result = validateSkillsList(skills);
            expect(result.valid).toBe(false);
            expect(result.error).toBeDefined();
          }
        ),
        { numRuns: 100 }
      );
    });

    it("rejects an empty array and identifies missing field", () => {
      const result = validateSkillsList([]);
      expect(result.valid).toBe(false);
      expect(result.missingField).toBe("skills");
    });

    it("identifies missing field when value is null/undefined", () => {
      fc.assert(
        fc.property(
          fc.constantFrom(null, undefined),
          (value) => {
            const result = validateSkillsList(value);
            expect(result.valid).toBe(false);
            expect(result.missingField).toBe("skills");
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  describe("Categories List (1–5 items)", () => {
    it("accepts any array of 1–5 items", () => {
      fc.assert(
        fc.property(
          fc.array(fc.string({ minLength: 1 }), { minLength: 1, maxLength: 5 }),
          (categories) => {
            const result = validateCategoriesList(categories);
            expect(result.valid).toBe(true);
          }
        ),
        { numRuns: 100 }
      );
    });

    it("rejects any array with more than 5 items", () => {
      fc.assert(
        fc.property(
          fc.array(fc.string({ minLength: 1 }), { minLength: 6, maxLength: 15 }),
          (categories) => {
            const result = validateCategoriesList(categories);
            expect(result.valid).toBe(false);
            expect(result.error).toBeDefined();
          }
        ),
        { numRuns: 100 }
      );
    });

    it("rejects an empty array and identifies missing field", () => {
      const result = validateCategoriesList([]);
      expect(result.valid).toBe(false);
      expect(result.missingField).toBe("categories");
    });

    it("identifies missing field when value is null/undefined", () => {
      fc.assert(
        fc.property(
          fc.constantFrom(null, undefined),
          (value) => {
            const result = validateCategoriesList(value);
            expect(result.valid).toBe(false);
            expect(result.missingField).toBe("categories");
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  describe("Service Needs (up to 500 characters)", () => {
    it("accepts any non-empty string of 1–500 characters", () => {
      fc.assert(
        fc.property(
          fc.string({ minLength: 1, maxLength: 500 }),
          (needs) => {
            const result = validateServiceNeeds(needs);
            expect(result.valid).toBe(true);
          }
        ),
        { numRuns: 100 }
      );
    });

    it("rejects any string longer than 500 characters", () => {
      fc.assert(
        fc.property(
          fc.string({ minLength: 501, maxLength: 700 }),
          (needs) => {
            const result = validateServiceNeeds(needs);
            expect(result.valid).toBe(false);
            expect(result.error).toBeDefined();
          }
        ),
        { numRuns: 100 }
      );
    });

    it("identifies missing field when value is empty/null/undefined", () => {
      fc.assert(
        fc.property(
          fc.constantFrom(null, undefined, ""),
          (value) => {
            const result = validateServiceNeeds(value);
            expect(result.valid).toBe(false);
            expect(result.missingField).toBe("service_needs");
          }
        ),
        { numRuns: 100 }
      );
    });
  });
});

/**
 * Property 4: Username Validation
 *
 * For any string, the username validator SHALL accept strings that are 3–30 characters
 * long and consist exclusively of lowercase letters (a-z), digits (0-9), and hyphens (-),
 * and SHALL reject all other strings.
 *
 * Validates: Requirements 3.1
 */
describe("Feature: gig-worker-platform, Property 4: Username Validation", () => {
  // Generator for valid username characters: lowercase letters, digits, hyphens
  const validUsernameChar = fc.mapToConstant(
    { num: 26, build: (v) => String.fromCharCode(97 + v) }, // a-z
    { num: 10, build: (v) => String.fromCharCode(48 + v) }, // 0-9
    { num: 1, build: () => "-" }                             // hyphen
  );

  const validUsername = fc
    .array(validUsernameChar, { minLength: 3, maxLength: 30 })
    .map((chars) => chars.join(""));

  it("accepts any string of 3–30 characters with only lowercase letters, digits, and hyphens", () => {
    fc.assert(
      fc.property(validUsername, (username) => {
        const result = validateUsername(username);
        expect(result.valid).toBe(true);
      }),
      { numRuns: 100 }
    );
  });

  it("rejects any valid-charset string shorter than 3 characters", () => {
    const shortUsername = fc
      .array(validUsernameChar, { minLength: 1, maxLength: 2 })
      .map((chars) => chars.join(""));

    fc.assert(
      fc.property(shortUsername, (username) => {
        const result = validateUsername(username);
        expect(result.valid).toBe(false);
      }),
      { numRuns: 100 }
    );
  });

  it("rejects any valid-charset string longer than 30 characters", () => {
    const longUsername = fc
      .array(validUsernameChar, { minLength: 31, maxLength: 50 })
      .map((chars) => chars.join(""));

    fc.assert(
      fc.property(longUsername, (username) => {
        const result = validateUsername(username);
        expect(result.valid).toBe(false);
      }),
      { numRuns: 100 }
    );
  });

  it("rejects any string containing uppercase letters", () => {
    // Generate a string of valid length but inject at least one uppercase letter
    const usernameWithUppercase = fc
      .tuple(
        fc.array(validUsernameChar, { minLength: 2, maxLength: 28 }),
        fc.integer({ min: 65, max: 90 }).map((c) => String.fromCharCode(c))
      )
      .map(([chars, upper]) => {
        const pos = Math.floor(chars.length / 2);
        chars.splice(pos, 0, upper);
        return chars.join("");
      })
      .filter((s) => s.length >= 3 && s.length <= 30);

    fc.assert(
      fc.property(usernameWithUppercase, (username) => {
        const result = validateUsername(username);
        expect(result.valid).toBe(false);
        expect(result.error).toContain("lowercase");
      }),
      { numRuns: 100 }
    );
  });

  it("rejects any string containing invalid special characters", () => {
    // Generate a string of valid length but inject at least one invalid character
    const invalidChars = fc.constantFrom("_", ".", "@", " ", "!", "#", "$", "%", "^", "&", "*");
    const usernameWithInvalid = fc
      .tuple(
        fc.array(validUsernameChar, { minLength: 2, maxLength: 28 }),
        invalidChars
      )
      .map(([chars, invalid]) => {
        const pos = Math.floor(chars.length / 2);
        chars.splice(pos, 0, invalid);
        return chars.join("");
      })
      .filter((s) => s.length >= 3 && s.length <= 30);

    fc.assert(
      fc.property(usernameWithInvalid, (username) => {
        const result = validateUsername(username);
        expect(result.valid).toBe(false);
      }),
      { numRuns: 100 }
    );
  });

  it("identifies missing field when value is empty/null/undefined", () => {
    fc.assert(
      fc.property(
        fc.constantFrom(null, undefined, ""),
        (value) => {
          const result = validateUsername(value);
          expect(result.valid).toBe(false);
          expect(result.missingField).toBe("username");
        }
      ),
      { numRuns: 100 }
    );
  });
});

/**
 * Property 8: Payment Amount Validation
 *
 * For any numeric amount, the payment validator SHALL accept values between 100 NGN
 * and 10,000,000 NGN inclusive, and SHALL reject values below 100 or above 10,000,000.
 *
 * Validates: Requirements 5.3
 */
describe("Feature: gig-worker-platform, Property 8: Payment Amount Validation", () => {
  it("accepts any number between 100 and 10,000,000 inclusive", () => {
    fc.assert(
      fc.property(
        fc.double({ min: 100, max: 10_000_000, noNaN: true }),
        (amount) => {
          const result = validatePaymentAmount(amount);
          expect(result.valid).toBe(true);
        }
      ),
      { numRuns: 100 }
    );
  });

  it("rejects any number below 100", () => {
    fc.assert(
      fc.property(
        fc.double({ min: -1_000_000, max: 99.99, noNaN: true }),
        (amount) => {
          const result = validatePaymentAmount(amount);
          expect(result.valid).toBe(false);
          expect(result.error).toBeDefined();
        }
      ),
      { numRuns: 100 }
    );
  });

  it("rejects any number above 10,000,000", () => {
    fc.assert(
      fc.property(
        fc.double({ min: 10_000_001, max: 100_000_000, noNaN: true }),
        (amount) => {
          const result = validatePaymentAmount(amount);
          expect(result.valid).toBe(false);
          expect(result.error).toBeDefined();
        }
      ),
      { numRuns: 100 }
    );
  });

  it("rejects non-number values", () => {
    fc.assert(
      fc.property(
        fc.oneof(fc.string(), fc.boolean(), fc.constant(NaN)),
        (value) => {
          const result = validatePaymentAmount(value);
          expect(result.valid).toBe(false);
        }
      ),
      { numRuns: 100 }
    );
  });

  it("identifies missing field when value is null/undefined", () => {
    fc.assert(
      fc.property(
        fc.constantFrom(null, undefined),
        (value) => {
          const result = validatePaymentAmount(value);
          expect(result.valid).toBe(false);
          expect(result.missingField).toBe("amount");
        }
      ),
      { numRuns: 100 }
    );
  });
});

/**
 * Property 16: Job Creation and Application Validation
 *
 * For any job creation input, the validator SHALL accept titles of 5–100 characters,
 * descriptions of 50–2000 characters, budget minimums ≥ 0.01, and stage counts of 0–20,
 * rejecting inputs outside these bounds. For any job application, the proposed amount
 * SHALL be validated as within the job's [budget_min, budget_max] range and the cover
 * letter SHALL be at most 2000 characters.
 *
 * Validates: Requirements 9.1, 9.2
 */
describe("Feature: gig-worker-platform, Property 16: Job Creation and Application Validation", () => {
  describe("Job Title (5–100 characters)", () => {
    it("accepts any string of 5–100 characters", () => {
      fc.assert(
        fc.property(
          fc.string({ minLength: 5, maxLength: 100 }),
          (title) => {
            const result = validateJobTitle(title);
            expect(result.valid).toBe(true);
          }
        ),
        { numRuns: 100 }
      );
    });

    it("rejects any string shorter than 5 characters (non-empty)", () => {
      fc.assert(
        fc.property(
          fc.string({ minLength: 1, maxLength: 4 }),
          (title) => {
            const result = validateJobTitle(title);
            expect(result.valid).toBe(false);
            expect(result.error).toBeDefined();
          }
        ),
        { numRuns: 100 }
      );
    });

    it("rejects any string longer than 100 characters", () => {
      fc.assert(
        fc.property(
          fc.string({ minLength: 101, maxLength: 300 }),
          (title) => {
            const result = validateJobTitle(title);
            expect(result.valid).toBe(false);
            expect(result.error).toBeDefined();
          }
        ),
        { numRuns: 100 }
      );
    });

    it("identifies missing field when value is empty/null/undefined", () => {
      fc.assert(
        fc.property(
          fc.constantFrom(null, undefined, ""),
          (value) => {
            const result = validateJobTitle(value);
            expect(result.valid).toBe(false);
            expect(result.missingField).toBe("title");
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  describe("Job Description (50–2000 characters)", () => {
    it("accepts any string of 50–2000 characters", () => {
      fc.assert(
        fc.property(
          fc.string({ minLength: 50, maxLength: 2000 }),
          (desc) => {
            const result = validateJobDescription(desc);
            expect(result.valid).toBe(true);
          }
        ),
        { numRuns: 100 }
      );
    });

    it("rejects any string shorter than 50 characters (non-empty)", () => {
      fc.assert(
        fc.property(
          fc.string({ minLength: 1, maxLength: 49 }),
          (desc) => {
            const result = validateJobDescription(desc);
            expect(result.valid).toBe(false);
            expect(result.error).toBeDefined();
          }
        ),
        { numRuns: 100 }
      );
    });

    it("rejects any string longer than 2000 characters", () => {
      fc.assert(
        fc.property(
          fc.string({ minLength: 2001, maxLength: 2500 }),
          (desc) => {
            const result = validateJobDescription(desc);
            expect(result.valid).toBe(false);
            expect(result.error).toBeDefined();
          }
        ),
        { numRuns: 100 }
      );
    });

    it("identifies missing field when value is empty/null/undefined", () => {
      fc.assert(
        fc.property(
          fc.constantFrom(null, undefined, ""),
          (value) => {
            const result = validateJobDescription(value);
            expect(result.valid).toBe(false);
            expect(result.missingField).toBe("description");
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  describe("Budget Minimum (≥ 0.01)", () => {
    it("accepts any number ≥ 0.01", () => {
      fc.assert(
        fc.property(
          fc.double({ min: 0.01, max: 10_000_000, noNaN: true }),
          (budget) => {
            const result = validateBudgetMin(budget);
            expect(result.valid).toBe(true);
          }
        ),
        { numRuns: 100 }
      );
    });

    it("rejects any number below 0.01", () => {
      fc.assert(
        fc.property(
          fc.double({ min: -1_000_000, max: 0.009, noNaN: true }),
          (budget) => {
            const result = validateBudgetMin(budget);
            expect(result.valid).toBe(false);
            expect(result.error).toBeDefined();
          }
        ),
        { numRuns: 100 }
      );
    });

    it("identifies missing field when value is null/undefined", () => {
      fc.assert(
        fc.property(
          fc.constantFrom(null, undefined),
          (value) => {
            const result = validateBudgetMin(value);
            expect(result.valid).toBe(false);
            expect(result.missingField).toBe("budget_min");
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  describe("Stage Count (0–20)", () => {
    it("accepts any integer between 0 and 20 inclusive", () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 0, max: 20 }),
          (count) => {
            const result = validateStageCount(count);
            expect(result.valid).toBe(true);
          }
        ),
        { numRuns: 100 }
      );
    });

    it("rejects any integer below 0", () => {
      fc.assert(
        fc.property(
          fc.integer({ min: -100, max: -1 }),
          (count) => {
            const result = validateStageCount(count);
            expect(result.valid).toBe(false);
            expect(result.error).toBeDefined();
          }
        ),
        { numRuns: 100 }
      );
    });

    it("rejects any integer above 20", () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 21, max: 100 }),
          (count) => {
            const result = validateStageCount(count);
            expect(result.valid).toBe(false);
            expect(result.error).toBeDefined();
          }
        ),
        { numRuns: 100 }
      );
    });

    it("rejects non-integer numbers", () => {
      fc.assert(
        fc.property(
          fc.double({ min: 0.01, max: 19.99, noNaN: true }).filter((n) => !Number.isInteger(n)),
          (count) => {
            const result = validateStageCount(count);
            expect(result.valid).toBe(false);
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  describe("Proposed Amount (within budget range)", () => {
    it("accepts any amount within [budgetMin, budgetMax]", () => {
      fc.assert(
        fc.property(
          fc.double({ min: 0.01, max: 1_000_000, noNaN: true }).chain((budgetMin) =>
            fc.double({ min: budgetMin, max: budgetMin + 1_000_000, noNaN: true }).chain(
              (budgetMax) =>
                fc.double({ min: budgetMin, max: budgetMax, noNaN: true }).map((amount) => ({
                  amount,
                  budgetMin,
                  budgetMax,
                }))
            )
          ),
          ({ amount, budgetMin, budgetMax }) => {
            const result = validateProposedAmount(amount, budgetMin, budgetMax);
            expect(result.valid).toBe(true);
          }
        ),
        { numRuns: 100 }
      );
    });

    it("rejects any amount below budgetMin", () => {
      fc.assert(
        fc.property(
          fc.double({ min: 100, max: 1_000_000, noNaN: true }).chain((budgetMin) =>
            fc.double({ min: budgetMin, max: budgetMin + 1_000_000, noNaN: true }).chain(
              (budgetMax) =>
                fc.double({ min: 0.01, max: budgetMin - 0.01, noNaN: true }).map((amount) => ({
                  amount,
                  budgetMin,
                  budgetMax,
                }))
            )
          ),
          ({ amount, budgetMin, budgetMax }) => {
            const result = validateProposedAmount(amount, budgetMin, budgetMax);
            expect(result.valid).toBe(false);
          }
        ),
        { numRuns: 100 }
      );
    });

    it("rejects any amount above budgetMax", () => {
      fc.assert(
        fc.property(
          fc.double({ min: 100, max: 1_000_000, noNaN: true }).chain((budgetMin) =>
            fc.double({ min: budgetMin, max: budgetMin + 1_000_000, noNaN: true }).chain(
              (budgetMax) =>
                fc
                  .double({ min: budgetMax + 0.01, max: budgetMax + 1_000_000, noNaN: true })
                  .map((amount) => ({
                    amount,
                    budgetMin,
                    budgetMax,
                  }))
            )
          ),
          ({ amount, budgetMin, budgetMax }) => {
            const result = validateProposedAmount(amount, budgetMin, budgetMax);
            expect(result.valid).toBe(false);
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  describe("Cover Letter (up to 2000 characters)", () => {
    it("accepts any non-empty string of 1–2000 characters", () => {
      fc.assert(
        fc.property(
          fc.string({ minLength: 1, maxLength: 2000 }),
          (letter) => {
            const result = validateCoverLetter(letter);
            expect(result.valid).toBe(true);
          }
        ),
        { numRuns: 100 }
      );
    });

    it("rejects any string longer than 2000 characters", () => {
      fc.assert(
        fc.property(
          fc.string({ minLength: 2001, maxLength: 2500 }),
          (letter) => {
            const result = validateCoverLetter(letter);
            expect(result.valid).toBe(false);
            expect(result.error).toBeDefined();
          }
        ),
        { numRuns: 100 }
      );
    });

    it("identifies missing field when value is empty/null/undefined", () => {
      fc.assert(
        fc.property(
          fc.constantFrom(null, undefined, ""),
          (value) => {
            const result = validateCoverLetter(value);
            expect(result.valid).toBe(false);
            expect(result.missingField).toBe("cover_letter");
          }
        ),
        { numRuns: 100 }
      );
    });
  });
});
