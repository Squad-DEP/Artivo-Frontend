/**
 * @vitest-environment jsdom
 */
import React from "react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render } from "@testing-library/react";
import "@testing-library/jest-dom/vitest";
import * as fc from "fast-check";
import type { WorkerProfile } from "@/api/types/worker";
import type { ServiceCategory } from "@/lib/constants/categories";
import type { VerificationStatus, AvailabilityStatus } from "@/lib/constants/user-types";

// Mock supabase client (required by authStore → HireDialog → ArtisanProfileContent)
vi.mock("@/lib/supabaseClient", () => ({
  supabase: {
    auth: {
      getSession: vi.fn().mockResolvedValue({ data: { session: null }, error: null }),
      onAuthStateChange: vi.fn().mockReturnValue({ data: { subscription: { unsubscribe: vi.fn() } } }),
    },
  },
}));

// Mock next/navigation
const mockPush = vi.fn();
const mockBack = vi.fn();
vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: mockPush,
    back: mockBack,
  }),
}));

// Mock framer-motion to render children directly
vi.mock("framer-motion", () => ({
  motion: {
    div: ({ children, ...props }: any) =>
      React.createElement("div", { "data-testid": props["data-testid"] }, children),
    circle: (props: any) => React.createElement("circle", props),
  },
  AnimatePresence: ({ children }: any) => children,
}));

import { ArtisanProfileContent } from "@/app/artisan/[username]/_components/ArtisanProfileContent";

// ─── Generators ──────────────────────────────────────────────────────────────

/** Generates a valid ServiceCategory */
const serviceCategoryArb: fc.Arbitrary<ServiceCategory> = fc.record({
  id: fc.uuid(),
  name: fc.string({ minLength: 1, maxLength: 30 }).filter((s) => s.trim().length > 0),
  slug: fc.string({ minLength: 1, maxLength: 30 }),
  icon: fc.string({ minLength: 1, maxLength: 20 }),
  description: fc.string({ minLength: 1, maxLength: 100 }),
  subcategories: fc.array(fc.string({ minLength: 1, maxLength: 30 }), { minLength: 0, maxLength: 5 }),
});

/** Generates a valid Skill */
const skillArb = fc.record({
  id: fc.uuid(),
  name: fc.string({ minLength: 1, maxLength: 30 }).filter((s) => s.trim().length > 0),
  years_experience: fc.option(fc.integer({ min: 1, max: 30 }), { nil: undefined }),
  verified: fc.option(fc.boolean(), { nil: undefined }),
});

/** Generates a valid ISO date string within a safe range */
const isoDateStringArb = fc.integer({
  min: new Date("2000-01-01").getTime(),
  max: new Date("2030-12-31").getTime(),
}).map((ts) => new Date(ts).toISOString());

/** Generates a valid PortfolioItem */
const portfolioItemArb = fc.record({
  id: fc.uuid(),
  title: fc.stringMatching(/^[A-Za-z0-9 ]{1,50}$/).filter((s) => s.trim().length > 0),
  description: fc.option(fc.string({ minLength: 1, maxLength: 100 }), { nil: undefined }),
  image_url: fc.webUrl(),
  created_at: isoDateStringArb,
  category: fc.option(fc.string({ minLength: 1, maxLength: 30 }), { nil: undefined }),
});

/** Generates a valid verification status */
const verificationStatusArb: fc.Arbitrary<VerificationStatus> = fc.constantFrom(
  "unverified" as const,
  "pending" as const,
  "verified" as const,
  "rejected" as const
);

/** Generates a valid availability status */
const availabilityStatusArb: fc.Arbitrary<AvailabilityStatus> = fc.constantFrom(
  "available" as const,
  "busy" as const,
  "offline" as const
);

/** Generates a valid WorkerProfile with at least 1 skill, 1 category, and 1 portfolio item */
const workerProfileArb: fc.Arbitrary<WorkerProfile> = fc.record({
  id: fc.uuid(),
  user_id: fc.uuid(),
  display_name: fc.string({ minLength: 1, maxLength: 50 }).filter((s) => s.trim().length > 0),
  username: fc.option(fc.string({ minLength: 3, maxLength: 30 }), { nil: undefined }),
  bio: fc.string({ minLength: 1, maxLength: 200 }).filter((s) => s.trim().length > 0),
  phone: fc.option(fc.string({ minLength: 10, maxLength: 15 }), { nil: undefined }),
  skills: fc.array(skillArb, { minLength: 1, maxLength: 5 }).map(
    (items) => items.map((item, idx) => ({ ...item, id: `skill-${idx}-${item.id}` }))
  ),
  categories: fc.array(serviceCategoryArb, { minLength: 1, maxLength: 3 }).map(
    (items) => items.map((item, idx) => ({ ...item, id: `cat-${idx}-${item.id}` }))
  ),
  location: fc.record({
    city: fc.string({ minLength: 1, maxLength: 30 }).filter((s) => s.trim().length > 0),
    state: fc.string({ minLength: 1, maxLength: 30 }).filter((s) => s.trim().length > 0),
    country: fc.string({ minLength: 1, maxLength: 30 }).filter((s) => s.trim().length > 0),
  }),
  portfolio: fc.array(portfolioItemArb, { minLength: 1, maxLength: 5 }).map(
    (items) => items.map((item, idx) => ({ ...item, id: `portfolio-${idx}-${item.id}` }))
  ),
  trust_score: fc.integer({ min: 0, max: 100 }),
  credit_score: fc.option(
    fc.record({
      score: fc.integer({ min: 300, max: 850 }),
      last_updated: isoDateStringArb,
      factors: fc.record({
        job_completion: fc.integer({ min: 0, max: 100 }),
        earnings_consistency: fc.integer({ min: 0, max: 100 }),
        tenure: fc.integer({ min: 0, max: 100 }),
        verification_level: fc.integer({ min: 0, max: 100 }),
      }),
    }),
    { nil: undefined }
  ),
  verification_status: verificationStatusArb,
  hourly_rate: fc.option(fc.integer({ min: 500, max: 50000 }), { nil: undefined }),
  minimum_budget: fc.option(fc.integer({ min: 1000, max: 100000 }), { nil: undefined }),
  completed_jobs: fc.integer({ min: 0, max: 1000 }),
  rating: fc.double({ min: 0, max: 5, noNaN: true, noDefaultInfinity: true }),
  reviews_count: fc.integer({ min: 0, max: 500 }),
  availability: availabilityStatusArb,
  response_time_hours: fc.option(fc.integer({ min: 1, max: 72 }), { nil: undefined }),
  profile_image_url: fc.option(fc.webUrl(), { nil: undefined }),
  cover_image_url: fc.option(fc.webUrl(), { nil: undefined }),
  created_at: isoDateStringArb,
  updated_at: isoDateStringArb,
});

// ─── Property 5: Public Profile Data Completeness ────────────────────────────

/**
 * Property 5: Public Profile Data Completeness
 *
 * For any valid WorkerProfile object, the public profile renderer SHALL include
 * the worker's display name, bio, skills, service categories, portfolio items,
 * trust score, rating, completed job count, and verification status in the
 * rendered output.
 *
 * Validates: Requirements 3.2
 */
describe("Feature: gig-worker-platform, Property 5: Public Profile Data Completeness", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders the worker's display name in the output", () => {
    fc.assert(
      fc.property(workerProfileArb, (worker) => {
        const { container } = render(
          React.createElement(ArtisanProfileContent, { worker })
        );
        expect(container.textContent).toContain(worker.display_name);
      }),
      { numRuns: 100 }
    );
  }, 15000);

  it("renders the worker's bio in the output", () => {
    fc.assert(
      fc.property(workerProfileArb, (worker) => {
        const { container } = render(
          React.createElement(ArtisanProfileContent, { worker })
        );
        expect(container.textContent).toContain(worker.bio);
      }),
      { numRuns: 100 }
    );
  });

  it("renders all of the worker's skills in the output", () => {
    fc.assert(
      fc.property(workerProfileArb, (worker) => {
        const { container } = render(
          React.createElement(ArtisanProfileContent, { worker })
        );
        const text = container.textContent || "";
        for (const skill of worker.skills) {
          expect(text).toContain(skill.name);
        }
      }),
      { numRuns: 100 }
    );
  });

  it("renders all of the worker's service categories in the output", () => {
    fc.assert(
      fc.property(workerProfileArb, (worker) => {
        const { container } = render(
          React.createElement(ArtisanProfileContent, { worker })
        );
        const text = container.textContent || "";
        for (const category of worker.categories) {
          expect(text).toContain(category.name);
        }
      }),
      { numRuns: 100 }
    );
  });

  it("renders all of the worker's portfolio item titles in the output", () => {
    fc.assert(
      fc.property(workerProfileArb, (worker) => {
        const { container } = render(
          React.createElement(ArtisanProfileContent, { worker })
        );
        const text = container.textContent || "";
        for (const item of worker.portfolio) {
          // Portfolio items render title in hover overlay text
          expect(text).toContain(item.title);
        }
      }),
      { numRuns: 100 }
    );
  });

  it("renders the worker's trust score in the output", () => {
    fc.assert(
      fc.property(workerProfileArb, (worker) => {
        const { container } = render(
          React.createElement(ArtisanProfileContent, { worker })
        );
        const text = container.textContent || "";
        expect(text).toContain(String(worker.trust_score));
      }),
      { numRuns: 100 }
    );
  });

  it("renders the worker's rating in the output", () => {
    fc.assert(
      fc.property(workerProfileArb, (worker) => {
        const { container } = render(
          React.createElement(ArtisanProfileContent, { worker })
        );
        const text = container.textContent || "";
        expect(text).toContain(String(worker.rating));
      }),
      { numRuns: 100 }
    );
  });

  it("renders the worker's completed job count in the output", () => {
    fc.assert(
      fc.property(workerProfileArb, (worker) => {
        const { container } = render(
          React.createElement(ArtisanProfileContent, { worker })
        );
        const text = container.textContent || "";
        expect(text).toContain(String(worker.completed_jobs));
      }),
      { numRuns: 100 }
    );
  });

  it("renders the worker's verification status in the output", () => {
    fc.assert(
      fc.property(workerProfileArb, (worker) => {
        const { container } = render(
          React.createElement(ArtisanProfileContent, { worker })
        );
        const text = container.textContent || "";
        // The component renders the verification status label from VERIFICATION_STATUS constant
        const verificationLabels: Record<VerificationStatus, string> = {
          unverified: "Unverified",
          pending: "Pending",
          verified: "Verified",
          rejected: "Rejected",
        };
        expect(text).toContain(verificationLabels[worker.verification_status]);
      }),
      { numRuns: 100 }
    );
  });
});
