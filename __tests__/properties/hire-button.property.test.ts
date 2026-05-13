import { describe, it, expect } from "vitest";
import * as fc from "fast-check";

// ─── Types ───────────────────────────────────────────────────────────────────

type UserType = "worker" | "customer";

interface AuthUser {
  id: string;
  user_metadata?: {
    user_type?: UserType;
    worker_profile_id?: string;
  };
  user_type?: UserType;
}

interface HireMeButtonInput {
  user: AuthUser | null;
  workerUserId: string;
  workerUsername: string;
}

type HireMeButtonResult =
  | { visible: false; reason: "own_profile" | "non_customer_worker" }
  | { visible: true; action: "navigate_to_job_creation"; target: string }
  | { visible: true; action: "redirect_to_login"; target: string };

// ─── Logic Under Test ────────────────────────────────────────────────────────

/**
 * Extracts the pure decision logic from HireMeButton component.
 * This mirrors the component's behavior without requiring DOM rendering.
 *
 * The component logic:
 * - Workers viewing their own profile: hidden
 * - Authenticated non-customers (workers viewing other profiles): hidden
 * - Authenticated customers: visible, links to job creation
 * - Unauthenticated visitors: visible, redirects to login
 */
function determineHireMeButtonBehavior(input: HireMeButtonInput): HireMeButtonResult {
  const { user, workerUserId, workerUsername } = input;

  const isAuthenticated = !!user;
  const userType = user?.user_metadata?.user_type ?? user?.user_type;
  const isCustomer = userType === "customer";
  const isWorker = userType === "worker";

  // Hidden for workers viewing their own profile
  const isOwnProfile =
    isWorker &&
    (user?.user_metadata?.worker_profile_id === workerUserId ||
      user?.id === workerUserId);

  if (isOwnProfile) {
    return { visible: false, reason: "own_profile" };
  }

  // Hidden for authenticated non-customers (workers viewing other profiles)
  if (isAuthenticated && !isCustomer) {
    return { visible: false, reason: "non_customer_worker" };
  }

  // Authenticated customers: navigate to job creation
  if (isAuthenticated && isCustomer) {
    return {
      visible: true,
      action: "navigate_to_job_creation",
      target: `/dashboard/jobs/new?worker=${workerUsername}`,
    };
  }

  // Unauthenticated visitors: redirect to login
  return {
    visible: true,
    action: "redirect_to_login",
    target: `/login?redirect=/artisan/${workerUsername}`,
  };
}

// ─── Generators ──────────────────────────────────────────────────────────────

/** Generates a valid username (3-30 chars, lowercase letters, digits, hyphens) */
const usernameArb = fc.stringMatching(/^[a-z0-9-]{3,30}$/);

/** Generates a valid user ID */
const userIdArb = fc.uuid();

/** Generates an authenticated customer user */
const customerUserArb = fc.record({
  id: userIdArb,
  user_metadata: fc.record({
    user_type: fc.constant("customer" as UserType),
    worker_profile_id: fc.constant(undefined),
  }),
  user_type: fc.constant("customer" as UserType),
});

/** Generates an authenticated worker user viewing their OWN profile */
const workerOwnProfileArb = userIdArb.chain((id) =>
  fc.record({
    id: fc.constant(id),
    user_metadata: fc.record({
      user_type: fc.constant("worker" as UserType),
      worker_profile_id: fc.oneof(
        fc.constant(id), // worker_profile_id matches workerUserId
        fc.constant(undefined) // will match via user.id
      ),
    }),
    user_type: fc.constant("worker" as UserType),
  }).map((user) => ({ user, workerUserId: id }))
);

/** Generates an authenticated worker user viewing ANOTHER worker's profile */
const workerOtherProfileArb = fc.tuple(userIdArb, userIdArb, userIdArb).filter(
  ([userId, profileId, workerUserId]) =>
    userId !== workerUserId && profileId !== workerUserId
).map(([userId, profileId, workerUserId]) => ({
  user: {
    id: userId,
    user_metadata: {
      user_type: "worker" as UserType,
      worker_profile_id: profileId,
    },
    user_type: "worker" as UserType,
  },
  workerUserId,
}));

/** Generates a null user (unauthenticated) */
const unauthenticatedUserArb = fc.constant(null);

// ─── Property 6: Auth-Conditional Hire Button Behavior ───────────────────────

/**
 * Property 6: Auth-Conditional Hire Button Behavior
 *
 * For any user authentication state, the "Hire Me" button on a public profile SHALL:
 * be visible and link to job creation for authenticated customers, be hidden for
 * authenticated workers viewing their own profile, and redirect to the login page
 * for unauthenticated visitors.
 *
 * Validates: Requirements 3.5
 */
describe("Feature: gig-worker-platform, Property 6: Auth-Conditional Hire Button Behavior", () => {
  it("is visible and links to job creation for any authenticated customer", () => {
    fc.assert(
      fc.property(
        customerUserArb,
        usernameArb,
        userIdArb,
        (customer, workerUsername, workerUserId) => {
          const result = determineHireMeButtonBehavior({
            user: customer,
            workerUserId,
            workerUsername,
          });

          expect(result.visible).toBe(true);
          if (result.visible) {
            expect(result.action).toBe("navigate_to_job_creation");
            expect(result.target).toBe(`/dashboard/jobs/new?worker=${workerUsername}`);
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  it("is hidden for any authenticated worker viewing their own profile", () => {
    fc.assert(
      fc.property(
        workerOwnProfileArb,
        usernameArb,
        ({ user, workerUserId }, workerUsername) => {
          const result = determineHireMeButtonBehavior({
            user,
            workerUserId,
            workerUsername,
          });

          expect(result.visible).toBe(false);
          if (!result.visible) {
            expect(result.reason).toBe("own_profile");
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  it("is hidden for any authenticated worker viewing another worker's profile", () => {
    fc.assert(
      fc.property(
        workerOtherProfileArb,
        usernameArb,
        ({ user, workerUserId }, workerUsername) => {
          const result = determineHireMeButtonBehavior({
            user,
            workerUserId,
            workerUsername,
          });

          expect(result.visible).toBe(false);
          if (!result.visible) {
            expect(result.reason).toBe("non_customer_worker");
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  it("is visible and redirects to login for any unauthenticated visitor", () => {
    fc.assert(
      fc.property(
        usernameArb,
        userIdArb,
        (workerUsername, workerUserId) => {
          const result = determineHireMeButtonBehavior({
            user: null,
            workerUserId,
            workerUsername,
          });

          expect(result.visible).toBe(true);
          if (result.visible) {
            expect(result.action).toBe("redirect_to_login");
            expect(result.target).toBe(`/login?redirect=/artisan/${workerUsername}`);
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  it("for any auth state, the result is always one of the three defined behaviors", () => {
    // Generate any possible auth state
    const anyAuthState = fc.oneof(
      // Unauthenticated
      fc.tuple(unauthenticatedUserArb, userIdArb).map(([user, workerUserId]) => ({
        user,
        workerUserId,
      })),
      // Customer
      fc.tuple(customerUserArb, userIdArb).map(([user, workerUserId]) => ({
        user,
        workerUserId,
      })),
      // Worker own profile
      workerOwnProfileArb,
      // Worker other profile
      workerOtherProfileArb
    );

    fc.assert(
      fc.property(anyAuthState, usernameArb, ({ user, workerUserId }, workerUsername) => {
        const result = determineHireMeButtonBehavior({
          user,
          workerUserId,
          workerUsername,
        });

        if (result.visible) {
          // Must be one of the two visible actions
          expect(["navigate_to_job_creation", "redirect_to_login"]).toContain(result.action);
          expect(result.target).toBeTruthy();
        } else {
          // Must be one of the two hidden reasons
          expect(["own_profile", "non_customer_worker"]).toContain(result.reason);
        }
      }),
      { numRuns: 100 }
    );
  });

  it("customer visibility is independent of which worker profile is being viewed", () => {
    fc.assert(
      fc.property(
        customerUserArb,
        usernameArb,
        usernameArb,
        userIdArb,
        userIdArb,
        (customer, username1, username2, workerId1, workerId2) => {
          const result1 = determineHireMeButtonBehavior({
            user: customer,
            workerUserId: workerId1,
            workerUsername: username1,
          });
          const result2 = determineHireMeButtonBehavior({
            user: customer,
            workerUserId: workerId2,
            workerUsername: username2,
          });

          // Both should be visible for customers regardless of which profile
          expect(result1.visible).toBe(true);
          expect(result2.visible).toBe(true);
        }
      ),
      { numRuns: 100 }
    );
  });
});


// ─── Property 6: Rating is gated by job completion status ────────────────────

import { isRatingEnabled } from "@/lib/utils/job-status";

/**
 * Property 6: Rating is gated by job completion status
 *
 * `isRatingEnabled(status)` returns true if and only if status === "completed".
 *
 * Feature: marketplace-integration, Property 6: Rating is gated by job completion status
 * Validates: Requirements 5.4
 */
describe("Feature: marketplace-integration, Property 6: Rating is gated by job completion status", () => {
  it("returns true only when status is 'completed'", () => {
    expect(isRatingEnabled("completed")).toBe(true);
  });

  it("returns false for any status that is not 'completed'", () => {
    fc.assert(
      fc.property(
        fc.constantFrom(
          "open",
          "pending",
          "paid",
          "in_progress",
          "worker_completed",
          "customer_completed",
          "cancelled",
          "disputed",
          "draft"
        ),
        (status) => {
          expect(isRatingEnabled(status)).toBe(false);
        }
      ),
      { numRuns: 100 }
    );
  });

  it("returns false for any arbitrary string that is not 'completed'", () => {
    fc.assert(
      fc.property(
        fc.string({ minLength: 0, maxLength: 50 }).filter((s) => s !== "completed"),
        (status) => {
          expect(isRatingEnabled(status)).toBe(false);
        }
      ),
      { numRuns: 100 }
    );
  });

  it("returns true if and only if status === 'completed'", () => {
    fc.assert(
      fc.property(
        fc.oneof(
          fc.constant("completed"),
          fc.string({ minLength: 0, maxLength: 50 }).filter((s) => s !== "completed")
        ),
        (status) => {
          const result = isRatingEnabled(status);
          expect(result).toBe(status === "completed");
        }
      ),
      { numRuns: 100 }
    );
  });
});
