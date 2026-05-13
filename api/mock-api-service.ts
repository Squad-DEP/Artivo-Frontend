/**
 * Mock API Service that intercepts requests and returns mock data.
 * Activated when NEXT_PUBLIC_USE_MOCKS=true is set.
 * Provides realistic delays to simulate network latency.
 */

import {
  mockWorkerProfiles,
  mockWorkerSearchResponse,
  mockRecommendations,
  mockJobs,
  mockJobSummaries,
  mockJobApplications,
  mockWorkerJobStats,
  mockCustomerJobStats,
  mockVirtualAccount,
  mockTransactions,
  mockReputation,
  mockReviewSummary,
  mockCreditProfile,
  mockOnboardingProcessResponse,
  mockOnboardingResumeResponse,
} from "./mock-data";

// ─── Helpers ─────────────────────────────────────────────────────────────────

/** Simulate network delay between 200-500ms */
function delay(): Promise<void> {
  const ms = Math.floor(Math.random() * 300) + 200;
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/** Resolve path params like /jobs/:id into actual values */
function resolvePath(
  path: string,
  params?: Record<string, string | number>
): string {
  let resolved = path;
  if (params) {
    for (const [key, value] of Object.entries(params)) {
      resolved = resolved.replace(`:${key}`, String(value));
    }
  }
  return resolved;
}

type RequestOptions = {
  params?: Record<string, string | number>;
  body?: object;
  headers?: Record<string, string>;
  query?: Record<string, string>;
};

// ─── Route Matching ──────────────────────────────────────────────────────────

interface MockRoute {
  method: string;
  pattern: RegExp;
  handler: (match: RegExpMatchArray, options?: RequestOptions) => unknown;
}

const routes: MockRoute[] = [
  // Workers
  {
    method: "GET",
    pattern: /^\/workers\/search$/,
    handler: () => mockWorkerSearchResponse,
  },
  {
    method: "GET",
    pattern: /^\/workers\/recommendations$/,
    handler: () => ({
      workers: mockRecommendations,
      total: mockRecommendations.length,
      page: 1,
      limit: 20,
      has_more: false,
    }),
  },
  {
    method: "GET",
    pattern: /^\/workers\/username\/(.+)$/,
    handler: (match) => {
      const username = match[1];
      const worker = mockWorkerProfiles.find((w) => w.username === username);
      if (!worker) {
        throw new Error("Worker not found");
      }
      return worker;
    },
  },

  // Onboarding
  {
    method: "POST",
    pattern: /^\/onboarding\/process$/,
    handler: (_match, options) => {
      const body = options?.body as { field?: string } | undefined;
      const field = body?.field || "display_name";

      // Return field-specific extracted data
      const fieldData: Record<string, unknown> = {
        display_name: "Chinedu Okafor",
        skills: ["Electrical Wiring", "Solar Installation", "Generator Repair"],
        categories: ["Home Services"],
        location: { city: "Lagos", state: "Lagos", country: "Nigeria" },
        bio: "Master electrician with 12 years of experience in residential and commercial wiring.",
      };

      return {
        extracted: { [field]: fieldData[field] || fieldData.display_name },
        confidence: mockOnboardingProcessResponse.confidence,
      };
    },
  },
  {
    method: "POST",
    pattern: /^\/onboarding\/confirm$/,
    handler: () => ({ success: true }),
  },
  {
    method: "POST",
    pattern: /^\/onboarding\/complete$/,
    handler: () => ({ success: true }),
  },
  {
    method: "GET",
    pattern: /^\/onboarding\/resume$/,
    handler: () => {
      if (mockOnboardingResumeResponse === null) {
        // Simulate a 404-like response that the store handles
        throw new Error("No onboarding session found");
      }
      return mockOnboardingResumeResponse;
    },
  },

  // Jobs
  {
    method: "GET",
    pattern: /^\/jobs\/stats\/worker$/,
    handler: () => mockWorkerJobStats,
  },
  {
    method: "GET",
    pattern: /^\/jobs\/stats\/customer$/,
    handler: () => mockCustomerJobStats,
  },
  {
    method: "GET",
    pattern: /^\/jobs\/([^/]+)\/applications$/,
    handler: (match) => {
      const jobId = match[1];
      return mockJobApplications.filter((app) => app.job_id === jobId);
    },
  },
  {
    method: "POST",
    pattern: /^\/jobs\/([^/]+)\/apply$/,
    handler: () => ({ success: true, application_id: "app-new-1" }),
  },
  {
    method: "POST",
    pattern: /^\/jobs\/([^/]+)\/applications\/([^/]+)\/accept$/,
    handler: (match) => {
      const jobId = match[1];
      const job = mockJobs.find((j) => j.id === jobId);
      return job ? { ...job, status: "in_progress" } : { success: true };
    },
  },
  {
    method: "POST",
    pattern: /^\/jobs\/([^/]+)\/stages\/([^/]+)\/complete$/,
    handler: (match) => {
      const jobId = match[1];
      const stageId = match[2];
      const job = mockJobs.find((j) => j.id === jobId);
      if (job) {
        const updatedStages = job.stages.map((s) =>
          s.id === stageId ? { ...s, status: "completed" as const, completed_at: new Date().toISOString() } : s
        );
        return { ...job, stages: updatedStages };
      }
      return { success: true };
    },
  },
  {
    method: "POST",
    pattern: /^\/jobs\/([^/]+)\/stages\/([^/]+)\/confirm$/,
    handler: (match) => {
      const jobId = match[1];
      const stageId = match[2];
      const job = mockJobs.find((j) => j.id === jobId);
      if (job) {
        const updatedStages = job.stages.map((s) =>
          s.id === stageId ? { ...s, status: "paid" as const } : s
        );
        return { ...job, stages: updatedStages };
      }
      return { success: true };
    },
  },
  {
    method: "POST",
    pattern: /^\/jobs\/([^/]+)\/stages\/([^/]+)\/dispute$/,
    handler: (match) => {
      const jobId = match[1];
      const job = mockJobs.find((j) => j.id === jobId);
      return job ? { ...job, status: "disputed" } : { success: true };
    },
  },
  {
    method: "POST",
    pattern: /^\/jobs\/([^/]+)\/review$/,
    handler: () => ({ success: true }),
  },
  {
    method: "GET",
    pattern: /^\/jobs\/([^/]+)$/,
    handler: (match) => {
      const jobId = match[1];
      const job = mockJobs.find((j) => j.id === jobId);
      if (!job) {
        throw new Error("Job not found");
      }
      return job;
    },
  },
  {
    method: "POST",
    pattern: /^\/jobs$/,
    handler: () => ({ id: "job-new-1" }),
  },
  {
    method: "GET",
    pattern: /^\/jobs$/,
    handler: (_match, options) => {
      const page = parseInt(options?.query?.page || "1");
      const limit = parseInt(options?.query?.limit || "20");
      return {
        jobs: mockJobSummaries,
        total: mockJobSummaries.length,
        page,
        limit,
        has_more: false,
      };
    },
  },

  // Payments
  {
    method: "GET",
    pattern: /^\/payments\/account$/,
    handler: () => mockVirtualAccount,
  },
  {
    method: "POST",
    pattern: /^\/payments\/account$/,
    handler: () => mockVirtualAccount,
  },
  {
    method: "POST",
    pattern: /^\/payments\/initiate$/,
    handler: () => ({ success: true, transaction_id: "txn-new-1" }),
  },
  {
    method: "POST",
    pattern: /^\/payments\/([^/]+)\/retry$/,
    handler: () => ({ success: true }),
  },
  {
    method: "GET",
    pattern: /^\/payments\/transactions$/,
    handler: (_match, options) => {
      const page = parseInt(options?.query?.page || "1");
      const limit = parseInt(options?.query?.limit || "20");
      const start = (page - 1) * limit;
      const paginatedTransactions = mockTransactions.slice(start, start + limit);
      return {
        transactions: paginatedTransactions,
        total: mockTransactions.length,
        page,
      };
    },
  },

  // Reputation
  {
    method: "GET",
    pattern: /^\/reputation\/reviews$/,
    handler: () => mockReviewSummary,
  },
  {
    method: "POST",
    pattern: /^\/reputation\/reviews\/([^/]+)\/respond$/,
    handler: (match, options) => {
      const reviewId = match[1];
      const body = options?.body as { response?: string } | undefined;
      const review = mockReviewSummary.recent_reviews.find((r) => r.id === reviewId);
      if (review) {
        return {
          ...review,
          response: body?.response || "Thank you for your feedback!",
          response_at: new Date().toISOString(),
        };
      }
      return { success: true };
    },
  },
  {
    method: "GET",
    pattern: /^\/reputation$/,
    handler: () => mockReputation,
  },

  // Credit
  {
    method: "GET",
    pattern: /^\/credit$/,
    handler: () => mockCreditProfile,
  },
  {
    method: "PUT",
    pattern: /^\/credit\/consent$/,
    handler: () => ({ success: true, consented_at: new Date().toISOString() }),
  },
];

// ─── Mock API Service Class ──────────────────────────────────────────────────

class MockApiService {
  private findRoute(
    method: string,
    resolvedPath: string
  ): { route: MockRoute; match: RegExpMatchArray } | null {
    for (const route of routes) {
      if (route.method !== method) continue;
      const match = resolvedPath.match(route.pattern);
      if (match) {
        return { route, match };
      }
    }
    return null;
  }

  private async handleRequest<T>(
    method: string,
    path: string,
    options?: RequestOptions
  ): Promise<T> {
    await delay();

    const resolvedPath = resolvePath(path, options?.params);
    const found = this.findRoute(method, resolvedPath);

    if (!found) {
      console.warn(`[MockAPI] No handler for ${method} ${resolvedPath}`);
      throw new Error(`Mock not implemented: ${method} ${resolvedPath}`);
    }

    try {
      const result = found.route.handler(found.match, options);
      return result as T;
    } catch (error) {
      throw error;
    }
  }

  public async get<T>(path: string, options?: Omit<RequestOptions, "body">) {
    return this.handleRequest<T>("GET", path, options);
  }

  public async post<T>(path: string, options?: RequestOptions) {
    return this.handleRequest<T>("POST", path, options);
  }

  public async put<T>(path: string, options?: RequestOptions) {
    return this.handleRequest<T>("PUT", path, options);
  }

  public async patch<T>(path: string, options?: RequestOptions) {
    return this.handleRequest<T>("PATCH", path, options);
  }

  public async delete<T>(path: string, options?: RequestOptions) {
    return this.handleRequest<T>("DELETE", path, options);
  }
}

export const mockApiService = new MockApiService();
