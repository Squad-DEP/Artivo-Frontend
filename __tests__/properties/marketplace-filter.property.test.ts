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

// ─── Property 1: Filter parameters are correctly built (marketplace-integration) ─

/**
 * Property 1: Filter parameters are correctly built
 *
 * For any combination of MarketplaceFilters, `buildQueryParams` SHALL produce a query
 * object where `category` maps to `job_type_id` and `location` (city/state) maps to
 * a single `location` string param matching the backend's expected format.
 *
 * Feature: marketplace-integration, Property 1: Filter parameters are correctly built
 * Validates: Requirements 1.2, 1.6
 */
describe("Feature: marketplace-integration, Property 1: Filter parameters are correctly built", () => {
  const categoryArb = fc.string({ minLength: 1, maxLength: 50 });
  const locationArb = fc.string({ minLength: 1, maxLength: 50 });
  const pageArb = fc.integer({ min: 1, max: 100 });
  const limitArb = fc.integer({ min: 1, max: 100 });

  it("maps category filter to job_type_id query param", () => {
    fc.assert(
      fc.property(
        categoryArb,
        pageArb,
        limitArb,
        (category, page, limit) => {
          const filters: MarketplaceFilters = { category };
          const params = buildQueryParams("", filters, page, limit);

          // category is mapped to job_type_id
          expect(params.job_type_id).toBe(category);
          expect(params).not.toHaveProperty("category");
        }
      ),
      { numRuns: 100 }
    );
  });

  it("maps location city and state to a single location query param", () => {
    fc.assert(
      fc.property(
        locationArb,
        locationArb,
        pageArb,
        limitArb,
        (city, state, page, limit) => {
          const filters: MarketplaceFilters = { location: { city, state } };
          const params = buildQueryParams("", filters, page, limit);

          // location fields are combined into a single location param
          expect(params).toHaveProperty("location");
          expect(params).not.toHaveProperty("city");
          expect(params).not.toHaveProperty("state");

          if (city && state && city !== state) {
            expect(params.location).toBe(`${city}, ${state}`);
          } else {
            expect(params.location).toBe(city || state);
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  it("omits job_type_id param when category filter is undefined", () => {
    fc.assert(
      fc.property(
        pageArb,
        limitArb,
        (page, limit) => {
          const filters: MarketplaceFilters = {};
          const params = buildQueryParams("", filters, page, limit);

          expect(params).not.toHaveProperty("category");
          expect(params).not.toHaveProperty("job_type_id");
        }
      ),
      { numRuns: 100 }
    );
  });

  it("omits location param when location filter is undefined", () => {
    fc.assert(
      fc.property(
        pageArb,
        limitArb,
        (page, limit) => {
          const filters: MarketplaceFilters = {};
          const params = buildQueryParams("", filters, page, limit);

          expect(params).not.toHaveProperty("city");
          expect(params).not.toHaveProperty("state");
          expect(params).not.toHaveProperty("location");
        }
      ),
      { numRuns: 100 }
    );
  });

  it("includes search query when provided for AI-semantic matching", () => {
    fc.assert(
      fc.property(
        fc.string({ minLength: 1, maxLength: 100 }),
        pageArb,
        limitArb,
        (query, page, limit) => {
          const params = buildQueryParams(query, {}, page, limit);
          expect(params.query).toBe(query);
        }
      ),
      { numRuns: 100 }
    );
  });
});

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

          // Check category → job_type_id
          if (filters.category) {
            expect(params.job_type_id).toBe(filters.category);
          } else {
            expect(params).not.toHaveProperty("job_type_id");
          }

          // Check location (city/state combined into single location param)
          if (filters.location?.city || filters.location?.state) {
            expect(params).toHaveProperty("location");
          } else {
            expect(params).not.toHaveProperty("location");
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
            "job_type_id",
            "location",
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
          if (filters.category) expectedKeyCount++; // maps to job_type_id
          if (filters.location?.city || filters.location?.state) expectedKeyCount++; // single location param
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

          // 11 keys: query, job_type_id, location, min_rating, verification_status,
          // availability, max_hourly_rate, sort_by, sort_order, page, limit
          expect(Object.keys(params).length).toBe(11);
          expect(params.query).toBe(query);
          expect(params.job_type_id).toBe(category);
          expect(params).toHaveProperty("location");
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
