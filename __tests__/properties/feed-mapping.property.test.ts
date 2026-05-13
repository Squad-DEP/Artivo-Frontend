// Feature: marketplace-integration, Property 2: Feed worker mapping preserves all required fields

import { describe, it, expect } from "vitest";
import * as fc from "fast-check";
import { mapFeedWorkerToSummary } from "@/api/mappers/feed-mapper";
import type { BackendFeedWorker } from "@/api/types/marketplace-api";

/**
 * Property 2: Feed worker mapping preserves all required fields
 *
 * For any valid BackendFeedWorker object returned by the feed endpoint,
 * mapFeedWorkerToSummary SHALL produce a WorkerProfileSummary where:
 * - display_name equals full_name or display_name (whichever is non-empty, preferring display_name)
 * - profile_image_url equals photo_url
 * - skills equals the input skills array
 * - trust_score equals credit_score
 * - rating equals average_rating
 * - completed_jobs equals total_jobs
 * - tagline equals match_explanation when present
 *
 * Validates: Requirements 1.3
 */
describe("Feature: marketplace-integration, Property 2: Feed worker mapping preserves all required fields", () => {
  // Arbitrary for a valid BackendFeedWorker with non-empty display_name
  const backendFeedWorkerWithDisplayNameArb: fc.Arbitrary<BackendFeedWorker> = fc.record({
    id: fc.uuid(),
    full_name: fc.string({ minLength: 1, maxLength: 100 }),
    display_name: fc.string({ minLength: 1, maxLength: 100 }),
    photo_url: fc.webUrl(),
    bio: fc.string({ maxLength: 500 }),
    skills: fc.array(fc.string({ minLength: 1, maxLength: 50 }), { minLength: 1, maxLength: 10 }),
    location: fc.string({ minLength: 1, maxLength: 100 }),
    credit_score: fc.integer({ min: 0, max: 100 }),
    completion_rate: fc.integer({ min: 0, max: 100 }),
    total_jobs: fc.integer({ min: 0, max: 10000 }),
    average_rating: fc.double({ min: 0, max: 5, noNaN: true }),
    match_score: fc.double({ min: 0, max: 100, noNaN: true }),
    match_explanation: fc.option(fc.string({ minLength: 1, maxLength: 200 }), { nil: undefined }),
  });

  // Arbitrary for a BackendFeedWorker with empty display_name (falls back to full_name)
  const backendFeedWorkerWithEmptyDisplayNameArb: fc.Arbitrary<BackendFeedWorker> = fc.record({
    id: fc.uuid(),
    full_name: fc.string({ minLength: 1, maxLength: 100 }),
    display_name: fc.constant(""),
    photo_url: fc.webUrl(),
    bio: fc.string({ maxLength: 500 }),
    skills: fc.array(fc.string({ minLength: 1, maxLength: 50 }), { minLength: 1, maxLength: 10 }),
    location: fc.string({ minLength: 1, maxLength: 100 }),
    credit_score: fc.integer({ min: 0, max: 100 }),
    completion_rate: fc.integer({ min: 0, max: 100 }),
    total_jobs: fc.integer({ min: 0, max: 10000 }),
    average_rating: fc.double({ min: 0, max: 5, noNaN: true }),
    match_score: fc.double({ min: 0, max: 100, noNaN: true }),
    match_explanation: fc.option(fc.string({ minLength: 1, maxLength: 200 }), { nil: undefined }),
  });

  it("preserves display_name (preferring display_name over full_name when non-empty)", () => {
    fc.assert(
      fc.property(backendFeedWorkerWithDisplayNameArb, (worker) => {
        const summary = mapFeedWorkerToSummary(worker);
        expect(summary.display_name).toBe(worker.display_name);
      }),
      { numRuns: 100 }
    );
  });

  it("falls back to full_name when display_name is empty", () => {
    fc.assert(
      fc.property(backendFeedWorkerWithEmptyDisplayNameArb, (worker) => {
        const summary = mapFeedWorkerToSummary(worker);
        expect(summary.display_name).toBe(worker.full_name);
      }),
      { numRuns: 100 }
    );
  });

  it("maps profile_image_url from photo_url", () => {
    fc.assert(
      fc.property(backendFeedWorkerWithDisplayNameArb, (worker) => {
        const summary = mapFeedWorkerToSummary(worker);
        expect(summary.profile_image_url).toBe(worker.photo_url);
      }),
      { numRuns: 100 }
    );
  });

  it("preserves skills array exactly", () => {
    fc.assert(
      fc.property(backendFeedWorkerWithDisplayNameArb, (worker) => {
        const summary = mapFeedWorkerToSummary(worker);
        expect(summary.skills).toEqual(worker.skills);
      }),
      { numRuns: 100 }
    );
  });

  it("maps trust_score from credit_score", () => {
    fc.assert(
      fc.property(backendFeedWorkerWithDisplayNameArb, (worker) => {
        const summary = mapFeedWorkerToSummary(worker);
        expect(summary.trust_score).toBe(worker.credit_score);
      }),
      { numRuns: 100 }
    );
  });

  it("maps rating from average_rating", () => {
    fc.assert(
      fc.property(backendFeedWorkerWithDisplayNameArb, (worker) => {
        const summary = mapFeedWorkerToSummary(worker);
        expect(summary.rating).toBe(worker.average_rating);
      }),
      { numRuns: 100 }
    );
  });

  it("maps completed_jobs from total_jobs", () => {
    fc.assert(
      fc.property(backendFeedWorkerWithDisplayNameArb, (worker) => {
        const summary = mapFeedWorkerToSummary(worker);
        expect(summary.completed_jobs).toBe(worker.total_jobs);
      }),
      { numRuns: 100 }
    );
  });

  it("maps tagline from match_explanation when present", () => {
    // Use a worker that always has match_explanation defined
    const workerWithExplanationArb: fc.Arbitrary<BackendFeedWorker> = fc.record({
      id: fc.uuid(),
      full_name: fc.string({ minLength: 1, maxLength: 100 }),
      display_name: fc.string({ minLength: 1, maxLength: 100 }),
      photo_url: fc.webUrl(),
      bio: fc.string({ maxLength: 500 }),
      skills: fc.array(fc.string({ minLength: 1, maxLength: 50 }), { minLength: 1, maxLength: 10 }),
      location: fc.string({ minLength: 1, maxLength: 100 }),
      credit_score: fc.integer({ min: 0, max: 100 }),
      completion_rate: fc.integer({ min: 0, max: 100 }),
      total_jobs: fc.integer({ min: 0, max: 10000 }),
      average_rating: fc.double({ min: 0, max: 5, noNaN: true }),
      match_score: fc.double({ min: 0, max: 100, noNaN: true }),
      match_explanation: fc.string({ minLength: 1, maxLength: 200 }),
    });

    fc.assert(
      fc.property(workerWithExplanationArb, (worker) => {
        const summary = mapFeedWorkerToSummary(worker);
        expect(summary.tagline).toBe(worker.match_explanation);
      }),
      { numRuns: 100 }
    );
  });

  it("sets tagline to undefined when match_explanation is absent", () => {
    const workerWithoutExplanationArb: fc.Arbitrary<BackendFeedWorker> = fc.record({
      id: fc.uuid(),
      full_name: fc.string({ minLength: 1, maxLength: 100 }),
      display_name: fc.string({ minLength: 1, maxLength: 100 }),
      photo_url: fc.webUrl(),
      bio: fc.string({ maxLength: 500 }),
      skills: fc.array(fc.string({ minLength: 1, maxLength: 50 }), { minLength: 1, maxLength: 10 }),
      location: fc.string({ minLength: 1, maxLength: 100 }),
      credit_score: fc.integer({ min: 0, max: 100 }),
      completion_rate: fc.integer({ min: 0, max: 100 }),
      total_jobs: fc.integer({ min: 0, max: 10000 }),
      average_rating: fc.double({ min: 0, max: 5, noNaN: true }),
      match_score: fc.double({ min: 0, max: 100, noNaN: true }),
    });

    fc.assert(
      fc.property(workerWithoutExplanationArb, (worker) => {
        const summary = mapFeedWorkerToSummary(worker);
        expect(summary.tagline).toBeUndefined();
      }),
      { numRuns: 100 }
    );
  });
});
