import { describe, it, expect } from "vitest";
import { mapFeedWorkerToSummary, parseLocation } from "@/api/mappers/feed-mapper";
import type { BackendFeedWorker } from "@/api/types/marketplace-api";

describe("parseLocation", () => {
  it("returns city and state as the same value for a single location string", () => {
    const result = parseLocation("Lagos");
    expect(result).toEqual({ city: "Lagos", state: "Lagos" });
  });

  it("splits comma-separated location into city and state", () => {
    const result = parseLocation("Ikeja, Lagos");
    expect(result).toEqual({ city: "Ikeja", state: "Lagos" });
  });

  it("trims whitespace from parts", () => {
    const result = parseLocation("  Ikeja ,  Lagos  ");
    expect(result).toEqual({ city: "Ikeja", state: "Lagos" });
  });

  it("returns empty strings for empty input", () => {
    const result = parseLocation("");
    expect(result).toEqual({ city: "", state: "" });
  });

  it("handles multiple commas by using first two parts", () => {
    const result = parseLocation("Ikeja, Lagos, Nigeria");
    expect(result).toEqual({ city: "Ikeja", state: "Lagos" });
  });
});

describe("mapFeedWorkerToSummary", () => {
  const baseWorker: BackendFeedWorker = {
    id: "worker-123",
    full_name: "John Doe",
    display_name: "Johnny D",
    photo_url: "https://example.com/photo.jpg",
    bio: "Experienced plumber",
    skills: ["Plumbing", "Electrical"],
    location: "Lagos",
    credit_score: 85,
    completion_rate: 92,
    total_jobs: 45,
    average_rating: 4.5,
    match_score: 0.9,
    match_explanation: "Great match for your plumbing needs",
  };

  it("maps all required fields correctly", () => {
    const result = mapFeedWorkerToSummary(baseWorker);

    expect(result.id).toBe("worker-123");
    expect(result.user_id).toBe("worker-123");
    expect(result.display_name).toBe("Johnny D");
    expect(result.profile_image_url).toBe("https://example.com/photo.jpg");
    expect(result.skills).toEqual(["Plumbing", "Electrical"]);
    expect(result.primary_category).toBe("Plumbing");
    expect(result.location).toEqual({ city: "Lagos", state: "Lagos" });
    expect(result.trust_score).toBe(85);
    expect(result.rating).toBe(4.5);
    expect(result.reviews_count).toBe(0);
    expect(result.completed_jobs).toBe(45);
    expect(result.verification_status).toBe("verified");
    expect(result.availability).toBe("available");
    expect(result.tagline).toBe("Great match for your plumbing needs");
  });

  it("falls back to full_name when display_name is empty", () => {
    const worker = { ...baseWorker, display_name: "" };
    const result = mapFeedWorkerToSummary(worker);
    expect(result.display_name).toBe("John Doe");
  });

  it("uses 'General' as primary_category when skills array is empty", () => {
    const worker = { ...baseWorker, skills: [] };
    const result = mapFeedWorkerToSummary(worker);
    expect(result.primary_category).toBe("General");
  });

  it("sets tagline to undefined when match_explanation is not provided", () => {
    const worker = { ...baseWorker, match_explanation: undefined };
    const result = mapFeedWorkerToSummary(worker);
    expect(result.tagline).toBeUndefined();
  });
});
