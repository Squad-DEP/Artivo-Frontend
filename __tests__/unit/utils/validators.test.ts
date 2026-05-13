import { describe, it, expect } from "vitest";
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

describe("validateDisplayName", () => {
  it("accepts a valid display name", () => {
    expect(validateDisplayName("John")).toEqual({ valid: true });
  });

  it("accepts a 1-character display name", () => {
    expect(validateDisplayName("A")).toEqual({ valid: true });
  });

  it("accepts a 100-character display name", () => {
    expect(validateDisplayName("a".repeat(100))).toEqual({ valid: true });
  });

  it("rejects an empty string", () => {
    const result = validateDisplayName("");
    expect(result.valid).toBe(false);
    expect(result.missingField).toBe("display_name");
  });

  it("rejects a string longer than 100 characters", () => {
    const result = validateDisplayName("a".repeat(101));
    expect(result.valid).toBe(false);
    expect(result.error).toContain("100");
  });

  it("rejects null/undefined", () => {
    expect(validateDisplayName(null).valid).toBe(false);
    expect(validateDisplayName(undefined).valid).toBe(false);
  });
});

describe("validateCustomerName", () => {
  it("accepts a valid customer name", () => {
    expect(validateCustomerName("Jo")).toEqual({ valid: true });
  });

  it("accepts a 100-character name", () => {
    expect(validateCustomerName("a".repeat(100))).toEqual({ valid: true });
  });

  it("rejects a 1-character name", () => {
    const result = validateCustomerName("A");
    expect(result.valid).toBe(false);
    expect(result.error).toContain("2");
  });

  it("rejects an empty string", () => {
    const result = validateCustomerName("");
    expect(result.valid).toBe(false);
    expect(result.missingField).toBe("name");
  });

  it("rejects a string longer than 100 characters", () => {
    const result = validateCustomerName("a".repeat(101));
    expect(result.valid).toBe(false);
  });
});

describe("validateBio", () => {
  it("accepts a valid bio", () => {
    expect(validateBio("I am a skilled artisan")).toEqual({ valid: true });
  });

  it("accepts a 1-character bio", () => {
    expect(validateBio("X")).toEqual({ valid: true });
  });

  it("accepts a 500-character bio", () => {
    expect(validateBio("a".repeat(500))).toEqual({ valid: true });
  });

  it("rejects an empty string", () => {
    const result = validateBio("");
    expect(result.valid).toBe(false);
    expect(result.missingField).toBe("bio");
  });

  it("rejects a bio longer than 500 characters", () => {
    const result = validateBio("a".repeat(501));
    expect(result.valid).toBe(false);
  });
});

describe("validateSkillsList", () => {
  it("accepts a list with 1 skill", () => {
    expect(validateSkillsList(["plumbing"])).toEqual({ valid: true });
  });

  it("accepts a list with 20 skills", () => {
    const skills = Array.from({ length: 20 }, (_, i) => `skill-${i}`);
    expect(validateSkillsList(skills)).toEqual({ valid: true });
  });

  it("rejects an empty list", () => {
    const result = validateSkillsList([]);
    expect(result.valid).toBe(false);
    expect(result.missingField).toBe("skills");
  });

  it("rejects a list with more than 20 skills", () => {
    const skills = Array.from({ length: 21 }, (_, i) => `skill-${i}`);
    const result = validateSkillsList(skills);
    expect(result.valid).toBe(false);
  });

  it("rejects null/undefined", () => {
    expect(validateSkillsList(null).valid).toBe(false);
    expect(validateSkillsList(undefined).valid).toBe(false);
  });

  it("rejects non-array values", () => {
    expect(validateSkillsList("plumbing").valid).toBe(false);
  });
});

describe("validateCategoriesList", () => {
  it("accepts a list with 1 category", () => {
    expect(validateCategoriesList(["home-repair"])).toEqual({ valid: true });
  });

  it("accepts a list with 5 categories", () => {
    const cats = ["a", "b", "c", "d", "e"];
    expect(validateCategoriesList(cats)).toEqual({ valid: true });
  });

  it("rejects an empty list", () => {
    const result = validateCategoriesList([]);
    expect(result.valid).toBe(false);
    expect(result.missingField).toBe("categories");
  });

  it("rejects a list with more than 5 categories", () => {
    const cats = ["a", "b", "c", "d", "e", "f"];
    const result = validateCategoriesList(cats);
    expect(result.valid).toBe(false);
  });
});

describe("validateServiceNeeds", () => {
  it("accepts a valid service needs description", () => {
    expect(validateServiceNeeds("I need a plumber")).toEqual({ valid: true });
  });

  it("accepts a 500-character description", () => {
    expect(validateServiceNeeds("a".repeat(500))).toEqual({ valid: true });
  });

  it("rejects a description longer than 500 characters", () => {
    const result = validateServiceNeeds("a".repeat(501));
    expect(result.valid).toBe(false);
  });

  it("rejects an empty string", () => {
    const result = validateServiceNeeds("");
    expect(result.valid).toBe(false);
    expect(result.missingField).toBe("service_needs");
  });
});

describe("validateUsername", () => {
  it("accepts a valid username with lowercase letters", () => {
    expect(validateUsername("john")).toEqual({ valid: true });
  });

  it("accepts a username with digits", () => {
    expect(validateUsername("john123")).toEqual({ valid: true });
  });

  it("accepts a username with hyphens", () => {
    expect(validateUsername("john-doe")).toEqual({ valid: true });
  });

  it("accepts a 3-character username", () => {
    expect(validateUsername("abc")).toEqual({ valid: true });
  });

  it("accepts a 30-character username", () => {
    expect(validateUsername("a".repeat(30))).toEqual({ valid: true });
  });

  it("rejects a 2-character username", () => {
    const result = validateUsername("ab");
    expect(result.valid).toBe(false);
  });

  it("rejects a 31-character username", () => {
    const result = validateUsername("a".repeat(31));
    expect(result.valid).toBe(false);
  });

  it("rejects uppercase letters", () => {
    const result = validateUsername("John");
    expect(result.valid).toBe(false);
    expect(result.error).toContain("lowercase");
  });

  it("rejects special characters", () => {
    expect(validateUsername("john_doe").valid).toBe(false);
    expect(validateUsername("john.doe").valid).toBe(false);
    expect(validateUsername("john@doe").valid).toBe(false);
  });

  it("rejects spaces", () => {
    expect(validateUsername("john doe").valid).toBe(false);
  });
});

describe("validatePaymentAmount", () => {
  it("accepts 100 NGN (minimum)", () => {
    expect(validatePaymentAmount(100)).toEqual({ valid: true });
  });

  it("accepts 10,000,000 NGN (maximum)", () => {
    expect(validatePaymentAmount(10_000_000)).toEqual({ valid: true });
  });

  it("accepts a value in the middle of the range", () => {
    expect(validatePaymentAmount(5000)).toEqual({ valid: true });
  });

  it("rejects 99 NGN (below minimum)", () => {
    const result = validatePaymentAmount(99);
    expect(result.valid).toBe(false);
  });

  it("rejects 10,000,001 NGN (above maximum)", () => {
    const result = validatePaymentAmount(10_000_001);
    expect(result.valid).toBe(false);
  });

  it("rejects non-number values", () => {
    expect(validatePaymentAmount("100").valid).toBe(false);
    expect(validatePaymentAmount(NaN).valid).toBe(false);
  });

  it("rejects null/undefined", () => {
    expect(validatePaymentAmount(null).valid).toBe(false);
    expect(validatePaymentAmount(undefined).valid).toBe(false);
  });
});

describe("validateJobTitle", () => {
  it("accepts a valid job title", () => {
    expect(validateJobTitle("Fix my kitchen sink")).toEqual({ valid: true });
  });

  it("accepts a 5-character title", () => {
    expect(validateJobTitle("abcde")).toEqual({ valid: true });
  });

  it("accepts a 100-character title", () => {
    expect(validateJobTitle("a".repeat(100))).toEqual({ valid: true });
  });

  it("rejects a 4-character title", () => {
    const result = validateJobTitle("abcd");
    expect(result.valid).toBe(false);
  });

  it("rejects a 101-character title", () => {
    const result = validateJobTitle("a".repeat(101));
    expect(result.valid).toBe(false);
  });

  it("rejects empty string", () => {
    const result = validateJobTitle("");
    expect(result.valid).toBe(false);
    expect(result.missingField).toBe("title");
  });
});

describe("validateJobDescription", () => {
  it("accepts a valid description", () => {
    expect(validateJobDescription("a".repeat(50))).toEqual({ valid: true });
  });

  it("accepts a 2000-character description", () => {
    expect(validateJobDescription("a".repeat(2000))).toEqual({ valid: true });
  });

  it("rejects a 49-character description", () => {
    const result = validateJobDescription("a".repeat(49));
    expect(result.valid).toBe(false);
  });

  it("rejects a 2001-character description", () => {
    const result = validateJobDescription("a".repeat(2001));
    expect(result.valid).toBe(false);
  });

  it("rejects empty string", () => {
    const result = validateJobDescription("");
    expect(result.valid).toBe(false);
    expect(result.missingField).toBe("description");
  });
});

describe("validateCoverLetter", () => {
  it("accepts a valid cover letter", () => {
    expect(validateCoverLetter("I am interested in this job")).toEqual({ valid: true });
  });

  it("accepts a 2000-character cover letter", () => {
    expect(validateCoverLetter("a".repeat(2000))).toEqual({ valid: true });
  });

  it("rejects a cover letter longer than 2000 characters", () => {
    const result = validateCoverLetter("a".repeat(2001));
    expect(result.valid).toBe(false);
  });

  it("rejects empty string", () => {
    const result = validateCoverLetter("");
    expect(result.valid).toBe(false);
    expect(result.missingField).toBe("cover_letter");
  });
});

describe("validateBudgetMin", () => {
  it("accepts 0.01 (minimum)", () => {
    expect(validateBudgetMin(0.01)).toEqual({ valid: true });
  });

  it("accepts a large value", () => {
    expect(validateBudgetMin(1000000)).toEqual({ valid: true });
  });

  it("rejects 0", () => {
    const result = validateBudgetMin(0);
    expect(result.valid).toBe(false);
  });

  it("rejects negative values", () => {
    const result = validateBudgetMin(-1);
    expect(result.valid).toBe(false);
  });

  it("rejects null/undefined", () => {
    expect(validateBudgetMin(null).valid).toBe(false);
    expect(validateBudgetMin(undefined).valid).toBe(false);
  });
});

describe("validateStageCount", () => {
  it("accepts 0 stages", () => {
    expect(validateStageCount(0)).toEqual({ valid: true });
  });

  it("accepts 20 stages", () => {
    expect(validateStageCount(20)).toEqual({ valid: true });
  });

  it("accepts a value in the middle", () => {
    expect(validateStageCount(10)).toEqual({ valid: true });
  });

  it("rejects negative values", () => {
    const result = validateStageCount(-1);
    expect(result.valid).toBe(false);
  });

  it("rejects values above 20", () => {
    const result = validateStageCount(21);
    expect(result.valid).toBe(false);
  });

  it("rejects non-integer values", () => {
    const result = validateStageCount(5.5);
    expect(result.valid).toBe(false);
  });
});

describe("validateProposedAmount", () => {
  it("accepts an amount equal to budget min", () => {
    expect(validateProposedAmount(1000, 1000, 5000)).toEqual({ valid: true });
  });

  it("accepts an amount equal to budget max", () => {
    expect(validateProposedAmount(5000, 1000, 5000)).toEqual({ valid: true });
  });

  it("accepts an amount within the range", () => {
    expect(validateProposedAmount(3000, 1000, 5000)).toEqual({ valid: true });
  });

  it("rejects an amount below budget min", () => {
    const result = validateProposedAmount(999, 1000, 5000);
    expect(result.valid).toBe(false);
    expect(result.error).toContain("1000");
  });

  it("rejects an amount above budget max", () => {
    const result = validateProposedAmount(5001, 1000, 5000);
    expect(result.valid).toBe(false);
    expect(result.error).toContain("5000");
  });

  it("rejects null/undefined", () => {
    expect(validateProposedAmount(null, 1000, 5000).valid).toBe(false);
    expect(validateProposedAmount(undefined, 1000, 5000).valid).toBe(false);
  });

  it("rejects non-number values", () => {
    expect(validateProposedAmount("3000", 1000, 5000).valid).toBe(false);
  });
});
