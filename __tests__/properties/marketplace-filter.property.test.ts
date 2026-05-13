import { describe, it, expect, vi } from "vitest";
import * as fc from "fast-check";

// Mock the API service to prevent Supabase initialization
vi.mock("@/api/api-service", () => ({
  apiService: {
    get: vi.fn(),
    post: vi.fn(),
  },
}));

import { buildQueryParams, MarketplaceFilters } from "@/store/marketplaceStore";

/**
 * Property 7: Marketplace Filter Query Construction
 *
 * For any combination of marketplace filter values (category, location, minimum rating,
 * verification status, availability, sort order), the marketplace store SHALL construct
 * API query parameters that exactly represent the selected filters with no omissions or additions.
 *
 * Validates: Requirements 4.5
 */
describe("Feature: gig-worker-platform, Property 7: Marketplace Filter Query Construction", () => {
  // Arbitraries for filter values
  const categoryArb = fc.option(fc.string({ minLength: 1, maxLength: 50 }), { nil: undefined });
  const cityArb = fc.option(fc.string({ minLength: 1, maxLength: 50 }), { nil: undefined });
  const stateArb = fc.option(fc.string({ minLength: 1, maxLength: 50 }), { nil: undefined });
  const minRatingArb = fc.option(fc.double({ min: 1, max: 5, noNaN: true }), { nil: undefined });
  const verificationStatusArb = fc.option(
    fc.constantFrom("unverified" as const, "pending" as const, "verified" as const, "rejected" as const),
    { nil: undefined }
  );
  const availabilityArb = fc.option(
    fc.constantFrom("available" as const, "busy" as const, "offline" as const),
    { nil: undefined }
  );
  const maxHourlyRateArb = fc.option(fc.double({ min: 0.01, max: 100000, noNaN: true }), { nil: undefined });
  const sortByArb = fc.option(
    fc.constantFrom("rating" as const, "trust_score" as const, "completed_jobs" as const, "hourly_rate" as const),
    { nil: undefined }
  );
  const sortOrderArb = fc.option(
    fc.constantFrom("asc" as const, "desc" as const),
    { nil: undefined }
  );
  const queryArb = fc.oneof(fc.constant(""), fc.string({ minLength: 1, maxLength: 100 }));
  const pageArb = fc.integer({ min: 1, max: 100 });
  const limitArb = fc.integer({ min: 1, max: 100 });

  const filtersArb = fc.record({
    category: categoryArb,
    location: fc.record({
      city: cityArb,
      state: stateArb,
    }).map((loc) => {
      // If both are undefined, return undefined for the whole location
      if (loc.city === undefined && loc.state === undefined) return undefined;
      return loc;
    }),
    minRating: minRatingArb,
    verificationStatus: verificationStatusArb,
    availability: availabilityArb,
    maxHourlyRate: maxHourlyRateArb,
    sortBy: sortByArb,
    sortOrder: sortOrderArb,
  }) as fc.Arbitrary<MarketplaceFilters>;

  it("includes all defined filter values in query params with no omissions", () => {
    fc.assert(
      fc.property(
        queryArb,
        filtersArb,
        pageArb,
        limitArb,
        (query, filters, page, limit) => {
          const params = buildQueryParams(query, filters, page, limit);

          // Check query is included when non-empty
          if (query) {
            expect(params.query).toBe(query);
          } else {
            expect(params).not.toHaveProperty("query");
          }

          // Check category
          if (filters.category) {
            expect(params.category).toBe(filters.category);
          } else {
            expect(params).not.toHaveProperty("category");
          }

          // Check location city
          if (filters.location?.city) {
            expect(params.city).toBe(filters.location.city);
          } else {
            expect(params).not.toHaveProperty("city");
          }

          // Check location state
          if (filters.location?.state) {
            expect(params.state).toBe(filters.location.state);
          } else {
            expect(params).not.toHaveProperty("state");
          }

          // Check minRating
          if (filters.minRating !== undefined) {
            expect(params.min_rating).toBe(String(filters.minRating));
          } else {
            expect(params).not.toHaveProperty("min_rating");
          }

          // Check verificationStatus
          if (filters.verificationStatus) {
            expect(params.verification_status).toBe(filters.verificationStatus);
          } else {
            expect(params).not.toHaveProperty("verification_status");
          }

          // Check availability
          if (filters.availability) {
            expect(params.availability).toBe(filters.availability);
          } else {
            expect(params).not.toHaveProperty("availability");
          }

          // Check maxHourlyRate
          if (filters.maxHourlyRate !== undefined) {
            expect(params.max_hourly_rate).toBe(String(filters.maxHourlyRate));
          } else {
            expect(params).not.toHaveProperty("max_hourly_rate");
          }

          // Check sortBy
          if (filters.sortBy) {
            expect(params.sort_by).toBe(filters.sortBy);
          } else {
            expect(params).not.toHaveProperty("sort_by");
          }

          // Check sortOrder
          if (filters.sortOrder) {
            expect(params.sort_order).toBe(filters.sortOrder);
          } else {
            expect(params).not.toHaveProperty("sort_order");
          }

          // Page and limit are always included
          expect(params.page).toBe(String(page));
          expect(params.limit).toBe(String(limit));
        }
      ),
      { numRuns: 100 }
    );
  });

  it("produces no additional keys beyond the expected filter parameters", () => {
    fc.assert(
      fc.property(
        queryArb,
        filtersArb,
        pageArb,
        limitArb,
        (query, filters, page, limit) => {
          const params = buildQueryParams(query, filters, page, limit);

          // Define the set of all allowed keys
          const allowedKeys = new Set([
            "query",
            "category",
            "city",
            "state",
            "min_rating",
            "verification_status",
            "availability",
            "max_hourly_rate",
            "sort_by",
            "sort_order",
            "page",
            "limit",
          ]);

          // Every key in params must be in the allowed set
          for (const key of Object.keys(params)) {
            expect(allowedKeys.has(key)).toBe(true);
          }

          // Count expected keys
          let expectedKeyCount = 2; // page and limit are always present
          if (query) expectedKeyCount++;
          if (filters.category) expectedKeyCount++;
          if (filters.location?.city) expectedKeyCount++;
          if (filters.location?.state) expectedKeyCount++;
          if (filters.minRating !== undefined) expectedKeyCount++;
          if (filters.verificationStatus) expectedKeyCount++;
          if (filters.availability) expectedKeyCount++;
          if (filters.maxHourlyRate !== undefined) expectedKeyCount++;
          if (filters.sortBy) expectedKeyCount++;
          if (filters.sortOrder) expectedKeyCount++;

          expect(Object.keys(params).length).toBe(expectedKeyCount);
        }
      ),
      { numRuns: 100 }
    );
  });

  it("constructs correct params for empty filters (only page and limit)", () => {
    fc.assert(
      fc.property(
        pageArb,
        limitArb,
        (page, limit) => {
          const emptyFilters: MarketplaceFilters = {};
          const params = buildQueryParams("", emptyFilters, page, limit);

          expect(Object.keys(params).length).toBe(2);
          expect(params.page).toBe(String(page));
          expect(params.limit).toBe(String(limit));
        }
      ),
      { numRuns: 100 }
    );
  });

  it("constructs correct params when all filters are fully specified", () => {
    fc.assert(
      fc.property(
        fc.string({ minLength: 1, maxLength: 100 }),
        fc.string({ minLength: 1, maxLength: 50 }),
        fc.string({ minLength: 1, maxLength: 50 }),
        fc.string({ minLength: 1, maxLength: 50 }),
        fc.double({ min: 1, max: 5, noNaN: true }),
        fc.constantFrom("unverified" as const, "pending" as const, "verified" as const, "rejected" as const),
        fc.constantFrom("available" as const, "busy" as const, "offline" as const),
        fc.double({ min: 0.01, max: 100000, noNaN: true }),
        fc.constantFrom("rating" as const, "trust_score" as const, "completed_jobs" as const, "hourly_rate" as const),
        fc.constantFrom("asc" as const, "desc" as const),
        pageArb,
        limitArb,
        (query, category, city, state, minRating, verificationStatus, availability, maxHourlyRate, sortBy, sortOrder, page, limit) => {
          const filters: MarketplaceFilters = {
            category,
            location: { city, state },
            minRating,
            verificationStatus,
            availability,
            maxHourlyRate,
            sortBy,
            sortOrder,
          };

          const params = buildQueryParams(query, filters, page, limit);

          // All 12 keys should be present
          expect(Object.keys(params).length).toBe(12);
          expect(params.query).toBe(query);
          expect(params.category).toBe(category);
          expect(params.city).toBe(city);
          expect(params.state).toBe(state);
          expect(params.min_rating).toBe(String(minRating));
          expect(params.verification_status).toBe(verificationStatus);
          expect(params.availability).toBe(availability);
          expect(params.max_hourly_rate).toBe(String(maxHourlyRate));
          expect(params.sort_by).toBe(sortBy);
          expect(params.sort_order).toBe(sortOrder);
          expect(params.page).toBe(String(page));
          expect(params.limit).toBe(String(limit));
        }
      ),
      { numRuns: 100 }
    );
  });
});
