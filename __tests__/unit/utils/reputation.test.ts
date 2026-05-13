import { describe, it, expect } from "vitest";
import { calculateCreditScore, calculateCompletionRate } from "@/lib/utils/reputation";

describe("calculateCreditScore", () => {
  it("returns 0 for a rating of 0", () => {
    expect(calculateCreditScore(0)).toBe(0);
  });

  it("returns 100 for a rating of 5", () => {
    expect(calculateCreditScore(5)).toBe(100);
  });

  it("returns 60 for a rating of 3", () => {
    expect(calculateCreditScore(3)).toBe(60);
  });

  it("rounds to the nearest integer", () => {
    // 4.3 * 20 = 86
    expect(calculateCreditScore(4.3)).toBe(86);
    // 3.7 * 20 = 74
    expect(calculateCreditScore(3.7)).toBe(74);
    // 2.15 * 20 = 43
    expect(calculateCreditScore(2.15)).toBe(43);
  });
});

describe("calculateCompletionRate", () => {
  it("returns 0 when total is 0", () => {
    expect(calculateCompletionRate(0, 0)).toBe(0);
  });

  it("returns 100 when all jobs are completed", () => {
    expect(calculateCompletionRate(10, 10)).toBe(100);
  });

  it("returns 0 when no jobs are completed", () => {
    expect(calculateCompletionRate(0, 5)).toBe(0);
  });

  it("returns the correct percentage", () => {
    expect(calculateCompletionRate(3, 4)).toBe(75);
    expect(calculateCompletionRate(7, 10)).toBe(70);
  });

  it("rounds to the nearest integer", () => {
    // 1/3 = 33.33... → 33
    expect(calculateCompletionRate(1, 3)).toBe(33);
    // 2/3 = 66.66... → 67
    expect(calculateCompletionRate(2, 3)).toBe(67);
  });
});
