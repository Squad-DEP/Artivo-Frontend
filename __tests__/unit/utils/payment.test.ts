import { describe, it, expect } from "vitest";
import { nairaToKobo } from "@/lib/utils/payment";

describe("nairaToKobo", () => {
  it("converts whole naira amounts to kobo", () => {
    expect(nairaToKobo(100)).toBe(10000);
    expect(nairaToKobo(1)).toBe(100);
    expect(nairaToKobo(5000)).toBe(500000);
  });

  it("converts decimal naira amounts to kobo", () => {
    expect(nairaToKobo(100.5)).toBe(10050);
    expect(nairaToKobo(99.99)).toBe(9999);
    expect(nairaToKobo(0.01)).toBe(1);
  });

  it("rounds to nearest kobo for sub-kobo amounts", () => {
    expect(nairaToKobo(10.005)).toBe(1001);
    expect(nairaToKobo(10.004)).toBe(1000);
  });

  it("returns a positive integer for positive input", () => {
    const result = nairaToKobo(1500.75);
    expect(result).toBe(150075);
    expect(Number.isInteger(result)).toBe(true);
    expect(result).toBeGreaterThan(0);
  });

  it("handles zero", () => {
    expect(nairaToKobo(0)).toBe(0);
  });
});
