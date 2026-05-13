import { describe, it, expect } from "vitest";
import { calculateBackoffDelay } from "@/lib/utils/sse-backoff";

describe("calculateBackoffDelay", () => {
  it("returns baseDelay for the first attempt", () => {
    expect(calculateBackoffDelay(1)).toBe(1000);
  });

  it("doubles the delay for each subsequent attempt", () => {
    expect(calculateBackoffDelay(2)).toBe(2000);
    expect(calculateBackoffDelay(3)).toBe(4000);
    expect(calculateBackoffDelay(4)).toBe(8000);
    expect(calculateBackoffDelay(5)).toBe(16000);
  });

  it("caps the delay at maxDelay", () => {
    expect(calculateBackoffDelay(6)).toBe(30000);
    expect(calculateBackoffDelay(7)).toBe(30000);
    expect(calculateBackoffDelay(10)).toBe(30000);
  });

  it("uses custom baseDelay", () => {
    expect(calculateBackoffDelay(1, 500)).toBe(500);
    expect(calculateBackoffDelay(2, 500)).toBe(1000);
    expect(calculateBackoffDelay(3, 500)).toBe(2000);
  });

  it("uses custom maxDelay", () => {
    expect(calculateBackoffDelay(5, 1000, 10000)).toBe(10000);
    expect(calculateBackoffDelay(4, 1000, 10000)).toBe(8000);
  });

  it("uses custom baseDelay and maxDelay together", () => {
    expect(calculateBackoffDelay(1, 2000, 5000)).toBe(2000);
    expect(calculateBackoffDelay(2, 2000, 5000)).toBe(4000);
    expect(calculateBackoffDelay(3, 2000, 5000)).toBe(5000);
  });
});
