import { describe, it, expect } from "vitest";
import { validateJobRequest } from "@/lib/utils/hire-validation";

describe("validateJobRequest", () => {
  const validPayload = {
    job_type_id: "plumbing-001",
    title: "Fix kitchen sink",
    description: "Need a plumber to fix a leaking kitchen sink",
    location: "Lagos",
    budget: 5000,
  };

  it("accepts a valid payload with all 5 fields", () => {
    const result = validateJobRequest(validPayload);
    expect(result.valid).toBe(true);
    expect(result.errors).toEqual({});
  });

  it("rejects when job_type_id is missing", () => {
    const { job_type_id, ...rest } = validPayload;
    const result = validateJobRequest(rest);
    expect(result.valid).toBe(false);
    expect(result.errors.job_type_id).toBeDefined();
  });

  it("rejects when title is missing", () => {
    const { title, ...rest } = validPayload;
    const result = validateJobRequest(rest);
    expect(result.valid).toBe(false);
    expect(result.errors.title).toBeDefined();
  });

  it("rejects when description is missing", () => {
    const { description, ...rest } = validPayload;
    const result = validateJobRequest(rest);
    expect(result.valid).toBe(false);
    expect(result.errors.description).toBeDefined();
  });

  it("rejects when location is missing", () => {
    const { location, ...rest } = validPayload;
    const result = validateJobRequest(rest);
    expect(result.valid).toBe(false);
    expect(result.errors.location).toBeDefined();
  });

  it("rejects when budget is missing", () => {
    const { budget, ...rest } = validPayload;
    const result = validateJobRequest(rest);
    expect(result.valid).toBe(false);
    expect(result.errors.budget).toBeDefined();
  });

  it("rejects when budget is zero", () => {
    const result = validateJobRequest({ ...validPayload, budget: 0 });
    expect(result.valid).toBe(false);
    expect(result.errors.budget).toBeDefined();
  });

  it("rejects when budget is negative", () => {
    const result = validateJobRequest({ ...validPayload, budget: -100 });
    expect(result.valid).toBe(false);
    expect(result.errors.budget).toBeDefined();
  });

  it("rejects empty string fields", () => {
    const result = validateJobRequest({
      job_type_id: "",
      title: "",
      description: "",
      location: "",
      budget: 5000,
    });
    expect(result.valid).toBe(false);
    expect(Object.keys(result.errors)).toHaveLength(4);
  });

  it("rejects whitespace-only string fields", () => {
    const result = validateJobRequest({
      job_type_id: "   ",
      title: "   ",
      description: "   ",
      location: "   ",
      budget: 5000,
    });
    expect(result.valid).toBe(false);
    expect(result.errors.job_type_id).toBeDefined();
    expect(result.errors.title).toBeDefined();
    expect(result.errors.description).toBeDefined();
    expect(result.errors.location).toBeDefined();
  });

  it("reports all missing fields at once", () => {
    const result = validateJobRequest({});
    expect(result.valid).toBe(false);
    expect(Object.keys(result.errors)).toHaveLength(5);
  });
});
