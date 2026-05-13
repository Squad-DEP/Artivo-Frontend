import { describe, it, expect } from "vitest";
import * as fc from "fast-check";
import type { Job, JobStage } from "@/api/types/job";
import type { JobStatus } from "@/lib/constants/user-types";

// ─── Pure Logic Under Test ───────────────────────────────────────────────────

/**
 * Derives whether a job should be considered "completed" based on its stages.
 * A job is "completed" if and only if all stages have status "paid".
 */
function isJobCompleted(stages: JobStage[]): boolean {
  if (stages.length === 0) return false;
  return stages.every((stage) => stage.status === "paid");
}

/**
 * Normalizes a job with no explicit stages into a single-stage job
 * with the full job amount (mirrors normalizeSingleStageJob from jobStore).
 */
function normalizeSingleStageJob(job: Job): Job {
  if (job.stages && job.stages.length > 0) {
    return job;
  }

  const singleStage: JobStage = {
    id: `${job.id}-full`,
    job_id: job.id,
    title: job.title,
    description: job.description,
    amount: job.final_amount ?? job.budget_max,
    status: mapJobStatusToStageStatus(job.status),
    created_at: job.created_at,
    order: 0,
  };

  return { ...job, stages: [singleStage] };
}

function mapJobStatusToStageStatus(
  jobStatus: string
): "pending" | "in_progress" | "completed" | "paid" {
  switch (jobStatus) {
    case "completed":
      return "paid";
    case "in_progress":
      return "in_progress";
    default:
      return "pending";
  }
}

// ─── Generators ──────────────────────────────────────────────────────────────

const stageStatus = fc.constantFrom(
  "pending" as const,
  "in_progress" as const,
  "completed" as const,
  "paid" as const
);

const jobStatus = fc.constantFrom(
  "draft" as const,
  "open" as const,
  "in_progress" as const,
  "completed" as const,
  "cancelled" as const,
  "disputed" as const
);

/** Generates a valid ISO date string within a safe range */
const isoDateArb = fc.integer({
  min: new Date("2000-01-01T00:00:00.000Z").getTime(),
  max: new Date("2030-12-31T23:59:59.999Z").getTime(),
}).map((ts) => new Date(ts).toISOString());

/** Generates a valid JobStage with a given status */
const jobStageWithStatus = (status: "pending" | "in_progress" | "completed" | "paid") =>
  fc.record({
    id: fc.uuid(),
    job_id: fc.uuid(),
    title: fc.string({ minLength: 5, maxLength: 100 }),
    description: fc.string({ minLength: 10, maxLength: 200 }),
    amount: fc.double({ min: 100, max: 10_000_000, noNaN: true, noDefaultInfinity: true }),
    status: fc.constant(status),
    created_at: isoDateArb,
    order: fc.nat({ max: 19 }),
  }) as fc.Arbitrary<JobStage>;

/** Generates a valid JobStage with any status */
const jobStage = fc.record({
  id: fc.uuid(),
  job_id: fc.uuid(),
  title: fc.string({ minLength: 5, maxLength: 100 }),
  description: fc.string({ minLength: 10, maxLength: 200 }),
  amount: fc.double({ min: 100, max: 10_000_000, noNaN: true, noDefaultInfinity: true }),
  status: stageStatus,
  created_at: isoDateArb,
  order: fc.nat({ max: 19 }),
}) as fc.Arbitrary<JobStage>;

/** Generates a minimal Job object for testing normalization */
const minimalJob = (overrides: Partial<Job> = {}) =>
  fc.record({
    id: fc.uuid(),
    title: fc.string({ minLength: 5, maxLength: 100 }),
    description: fc.string({ minLength: 50, maxLength: 200 }),
    category: fc.constant("plumbing" as any),
    budget_min: fc.double({ min: 0.01, max: 5_000_000, noNaN: true, noDefaultInfinity: true }),
    budget_max: fc.double({ min: 5_000_001, max: 10_000_000, noNaN: true, noDefaultInfinity: true }),
    location: fc.record({
      city: fc.string({ minLength: 1, maxLength: 50 }),
      state: fc.string({ minLength: 1, maxLength: 50 }),
      country: fc.constant("Nigeria"),
    }),
    customer_id: fc.uuid(),
    status: jobStatus,
    stages: fc.constant([] as JobStage[]),
    created_at: isoDateArb,
    updated_at: isoDateArb,
  }).map((job) => ({ ...job, ...overrides } as unknown as Job));

// ─── Property 17: Job Completion Derivation ──────────────────────────────────

/**
 * Property 17: Job Completion Derivation
 *
 * For any job, the job status SHALL be "completed" if and only if all stages have
 * status "paid". For any job with no explicit stage breakdown, the system SHALL
 * treat it as having a single stage with the full job amount, and the same
 * completion rule applies.
 *
 * Validates: Requirements 9.7, 9.8
 */
describe("Feature: gig-worker-platform, Property 17: Job Completion Derivation", () => {
  describe("Job completion iff all stages are paid", () => {
    it("a job with all stages 'paid' is considered completed", () => {
      fc.assert(
        fc.property(
          fc.array(jobStageWithStatus("paid"), { minLength: 1, maxLength: 20 }),
          (stages) => {
            const completed = isJobCompleted(stages);
            expect(completed).toBe(true);
          }
        ),
        { numRuns: 100 }
      );
    });

    it("a job with any stage NOT 'paid' is NOT considered completed", () => {
      fc.assert(
        fc.property(
          fc.array(jobStage, { minLength: 1, maxLength: 20 }).filter(
            (stages) => stages.some((s) => s.status !== "paid")
          ),
          (stages) => {
            const completed = isJobCompleted(stages);
            expect(completed).toBe(false);
          }
        ),
        { numRuns: 100 }
      );
    });

    it("isJobCompleted is true if and only if every stage status is 'paid'", () => {
      fc.assert(
        fc.property(
          fc.array(jobStage, { minLength: 1, maxLength: 20 }),
          (stages) => {
            const completed = isJobCompleted(stages);
            const allPaid = stages.every((s) => s.status === "paid");
            expect(completed).toBe(allPaid);
          }
        ),
        { numRuns: 100 }
      );
    });

    it("a job with zero stages is not considered completed", () => {
      const completed = isJobCompleted([]);
      expect(completed).toBe(false);
    });
  });

  describe("Single-stage normalization for jobs without explicit stages", () => {
    it("normalizes a job with no stages into a single stage with the full job amount", () => {
      fc.assert(
        fc.property(
          minimalJob(),
          (job) => {
            const normalized = normalizeSingleStageJob(job);
            expect(normalized.stages).toHaveLength(1);
            expect(normalized.stages[0].amount).toBe(
              job.final_amount ?? job.budget_max
            );
          }
        ),
        { numRuns: 100 }
      );
    });

    it("does not modify a job that already has stages", () => {
      fc.assert(
        fc.property(
          fc.array(jobStage, { minLength: 1, maxLength: 20 }),
          minimalJob(),
          (stages, baseJob) => {
            const jobWithStages = { ...baseJob, stages };
            const normalized = normalizeSingleStageJob(jobWithStages);
            expect(normalized.stages).toEqual(stages);
            expect(normalized.stages.length).toBe(stages.length);
          }
        ),
        { numRuns: 100 }
      );
    });

    it("the single normalized stage inherits the job's id and title", () => {
      fc.assert(
        fc.property(
          minimalJob(),
          (job) => {
            const normalized = normalizeSingleStageJob(job);
            const stage = normalized.stages[0];
            expect(stage.job_id).toBe(job.id);
            expect(stage.title).toBe(job.title);
            expect(stage.id).toBe(`${job.id}-full`);
          }
        ),
        { numRuns: 100 }
      );
    });

    it("a normalized completed job has its single stage set to 'paid'", () => {
      fc.assert(
        fc.property(
          minimalJob({ status: "completed" as JobStatus }),
          (job) => {
            const normalized = normalizeSingleStageJob(job);
            expect(normalized.stages[0].status).toBe("paid");
            expect(isJobCompleted(normalized.stages)).toBe(true);
          }
        ),
        { numRuns: 100 }
      );
    });

    it("a normalized non-completed job does NOT have its single stage set to 'paid'", () => {
      fc.assert(
        fc.property(
          minimalJob().filter((job) => job.status !== "completed"),
          (job) => {
            const normalized = normalizeSingleStageJob(job);
            expect(normalized.stages[0].status).not.toBe("paid");
            expect(isJobCompleted(normalized.stages)).toBe(false);
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  describe("Completion derivation consistency across multi-stage and single-stage jobs", () => {
    it("the completion rule is the same for multi-stage and single-stage jobs: all stages must be paid", () => {
      fc.assert(
        fc.property(
          fc.oneof(
            // Multi-stage: all paid
            fc.array(jobStageWithStatus("paid"), { minLength: 2, maxLength: 20 }),
            // Single-stage: paid
            fc.array(jobStageWithStatus("paid"), { minLength: 1, maxLength: 1 })
          ),
          (stages) => {
            expect(isJobCompleted(stages)).toBe(true);
          }
        ),
        { numRuns: 100 }
      );
    });

    it("partial payment in multi-stage jobs does not result in completion", () => {
      fc.assert(
        fc.property(
          fc.array(jobStageWithStatus("paid"), { minLength: 1, maxLength: 10 }),
          fc.array(
            fc.oneof(
              jobStageWithStatus("pending"),
              jobStageWithStatus("in_progress"),
              jobStageWithStatus("completed")
            ),
            { minLength: 1, maxLength: 10 }
          ),
          (paidStages, unpaidStages) => {
            const allStages = [...paidStages, ...unpaidStages];
            expect(isJobCompleted(allStages)).toBe(false);
          }
        ),
        { numRuns: 100 }
      );
    });
  });
});
