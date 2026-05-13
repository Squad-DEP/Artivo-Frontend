import { describe, it, expect } from "vitest";
import { deriveCompletionStatus, isRatingEnabled } from "@/lib/utils/job-status";

describe("deriveCompletionStatus", () => {
  it('returns "completed" when both parties have confirmed', () => {
    expect(deriveCompletionStatus(true, true)).toBe("completed");
  });

  it('returns "waiting" when only customer has confirmed', () => {
    expect(deriveCompletionStatus(true, false)).toBe("waiting");
  });

  it('returns "waiting" when only worker has confirmed', () => {
    expect(deriveCompletionStatus(false, true)).toBe("waiting");
  });

  it('returns "in_progress" when neither has confirmed', () => {
    expect(deriveCompletionStatus(false, false)).toBe("in_progress");
  });
});

describe("isRatingEnabled", () => {
  it('returns true when status is "completed"', () => {
    expect(isRatingEnabled("completed")).toBe(true);
  });

  it('returns false for "in_progress"', () => {
    expect(isRatingEnabled("in_progress")).toBe(false);
  });

  it('returns false for "waiting"', () => {
    expect(isRatingEnabled("waiting")).toBe(false);
  });

  it('returns false for "open"', () => {
    expect(isRatingEnabled("open")).toBe(false);
  });

  it('returns false for "pending"', () => {
    expect(isRatingEnabled("pending")).toBe(false);
  });

  it('returns false for "paid"', () => {
    expect(isRatingEnabled("paid")).toBe(false);
  });

  it('returns false for "worker_completed"', () => {
    expect(isRatingEnabled("worker_completed")).toBe(false);
  });

  it('returns false for "customer_completed"', () => {
    expect(isRatingEnabled("customer_completed")).toBe(false);
  });
});
