import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { useWorkerJobStore } from "@/store/workerJobStore";
import type { StreamedJob } from "@/api/types/marketplace-api";

// Mock the API service
vi.mock("@/api/api-service", () => ({
  apiService: {
    get: vi.fn(),
    post: vi.fn(),
  },
  getApiBaseUrl: () => "http://localhost:8080/api",
}));

// Mock authStore
vi.mock("@/store/authStore", () => ({
  useAuthStore: {
    getState: () => ({
      user: {
        id: "worker-user-id",
        email: "artisan@example.com",
        access_token: "test-auth-token",
      },
    }),
  },
}));

// Mock sse-backoff
vi.mock("@/lib/utils/sse-backoff", () => ({
  calculateBackoffDelay: vi.fn((attempt: number) =>
    Math.min(1000 * Math.pow(2, attempt - 1), 30000)
  ),
}));

// --- Mock EventSource ---
class MockEventSource {
  static CONNECTING = 0;
  static OPEN = 1;
  static CLOSED = 2;

  url: string;
  readyState: number = MockEventSource.OPEN;
  onopen: ((event: Event) => void) | null = null;
  onmessage: ((event: MessageEvent) => void) | null = null;
  onerror: (() => void) | null = null;

  private listeners: Record<string, ((event: MessageEvent) => void)[]> = {};

  constructor(url: string) {
    this.url = url;
    mockEventSourceInstances.push(this);
  }

  addEventListener(type: string, listener: (event: MessageEvent) => void) {
    if (!this.listeners[type]) {
      this.listeners[type] = [];
    }
    this.listeners[type].push(listener);
  }

  removeEventListener(type: string, listener: (event: MessageEvent) => void) {
    if (this.listeners[type]) {
      this.listeners[type] = this.listeners[type].filter((l) => l !== listener);
    }
  }

  close() {
    this.readyState = MockEventSource.CLOSED;
  }

  // Test helper: simulate an event
  _emit(type: string, data?: string) {
    const event = { data } as MessageEvent;
    if (this.listeners[type]) {
      this.listeners[type].forEach((listener) => listener(event));
    }
  }

  // Test helper: simulate error
  _emitError() {
    this.readyState = MockEventSource.CLOSED;
    if (this.onerror) {
      this.onerror();
    }
  }
}

let mockEventSourceInstances: MockEventSource[] = [];
(global as any).EventSource = MockEventSource;

import { apiService } from "@/api/api-service";
const mockedApiService = vi.mocked(apiService);

// --- Test Fixtures ---

function createMockStreamedJob(overrides: Partial<StreamedJob> = {}): StreamedJob {
  return {
    id: "job-req-1",
    title: "Fix Kitchen Plumbing",
    description: "Need a plumber to fix leaking pipes",
    location: "Lagos",
    budget: 15000,
    job_type: "Plumbing",
    customer_name: "Chioma Okafor",
    created_at: "2024-01-15T10:00:00Z",
    ...overrides,
  };
}

describe("Integration: Worker Job Flow (Subscribe → Stream → Accept)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
    mockEventSourceInstances = [];
    useWorkerJobStore.getState().reset();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe("Full Flow: Fetch Job Types → Subscribe → Stream → Accept", () => {
    it("should complete the full artisan job discovery and acceptance flow", async () => {
      // Step 1: Fetch available job types → verify availableJobTypes populated
      const jobTypesResponse = [
        { id: "jt-plumbing", name: "Plumbing", description: "Plumbing and pipe repair services" },
        { id: "jt-electrical", name: "Electrical", description: "Electrical wiring and repair" },
        { id: "jt-painting", name: "Painting", description: "Interior and exterior painting" },
      ];

      mockedApiService.get.mockResolvedValueOnce(jobTypesResponse);

      await useWorkerJobStore.getState().fetchJobTypes();

      let state = useWorkerJobStore.getState();
      expect(state.availableJobTypes).toHaveLength(3);
      expect(state.availableJobTypes[0].id).toBe("jt-plumbing");
      expect(state.availableJobTypes[1].name).toBe("Electrical");
      expect(state.availableJobTypes[2].description).toBe("Interior and exterior painting");
      expect(state.isLoading).toBe(false);
      expect(state.error).toBeNull();

      // Step 2: Subscribe to a job type → verify subscription added to state
      const subscriptionResponse = {
        subscription: {
          id: "sub-1",
          job_type_id: "jt-plumbing",
          created_at: "2024-01-15T09:00:00Z",
        },
      };

      mockedApiService.post.mockResolvedValueOnce(subscriptionResponse);

      const subscribeResult = await useWorkerJobStore.getState().subscribe("jt-plumbing");

      expect(subscribeResult).toBe(true);
      expect(mockedApiService.post).toHaveBeenCalledWith("/worker/subscribe", {
        body: { job_type_id: "jt-plumbing" },
      });

      state = useWorkerJobStore.getState();
      expect(state.subscriptions).toHaveLength(1);
      expect(state.subscriptions[0].job_type_id).toBe("jt-plumbing");
      expect(state.subscriptions[0].id).toBe("sub-1");

      // Step 3: Connect SSE stream and simulate "connected" event → verify connectionStatus
      useWorkerJobStore.getState().connectStream();

      expect(mockEventSourceInstances).toHaveLength(1);
      const es = mockEventSourceInstances[0];
      expect(es.url).toBe("http://localhost:8080/api/v1/worker/jobs/stream?token=test-auth-token");

      state = useWorkerJobStore.getState();
      expect(state.connectionStatus).toBe("connecting");

      // Simulate "connected" event from server
      es._emit("connected", JSON.stringify({ message: "Connected to job stream" }));

      state = useWorkerJobStore.getState();
      expect(state.connectionStatus).toBe("connected");
      expect(state.error).toBeNull();

      // Step 4: Simulate SSE "jobs" event → verify streamedJobs populated
      const streamedJobs: StreamedJob[] = [
        createMockStreamedJob({ id: "job-req-1", title: "Fix Kitchen Plumbing", budget: 15000 }),
        createMockStreamedJob({ id: "job-req-2", title: "Bathroom Pipe Repair", budget: 20000, customer_name: "Emeka Nwosu" }),
      ];

      es._emit("jobs", JSON.stringify(streamedJobs));

      state = useWorkerJobStore.getState();
      expect(state.streamedJobs).toHaveLength(2);
      expect(state.streamedJobs[0].id).toBe("job-req-1");
      expect(state.streamedJobs[0].title).toBe("Fix Kitchen Plumbing");
      expect(state.streamedJobs[1].id).toBe("job-req-2");
      expect(state.streamedJobs[1].budget).toBe(20000);

      // Step 5: Accept a job → verify job removed from streamedJobs
      mockedApiService.post.mockResolvedValueOnce({ msg: "Job accepted successfully" });

      const acceptResult = await useWorkerJobStore.getState().acceptJob("job-req-1", 14000);

      expect(acceptResult).toBe(true);
      expect(mockedApiService.post).toHaveBeenCalledWith("/worker/accept-job", {
        body: { job_request_id: "job-req-1", proposed_amount: 14000 },
      });

      state = useWorkerJobStore.getState();
      expect(state.streamedJobs).toHaveLength(1);
      expect(state.streamedJobs[0].id).toBe("job-req-2");
      expect(state.isLoading).toBe(false);
      expect(state.error).toBeNull();
    });

    it("should handle 409 conflict when accepting a job already taken by another worker", async () => {
      // Set up: connect stream and receive jobs
      useWorkerJobStore.getState().connectStream();
      const es = mockEventSourceInstances[0];
      es._emit("connected", JSON.stringify({ message: "Connected" }));

      const jobs: StreamedJob[] = [
        createMockStreamedJob({ id: "job-req-1" }),
        createMockStreamedJob({ id: "job-req-2", title: "Paint Living Room" }),
      ];
      es._emit("jobs", JSON.stringify(jobs));

      let state = useWorkerJobStore.getState();
      expect(state.streamedJobs).toHaveLength(2);

      // Attempt to accept a job that was already taken (409 conflict)
      mockedApiService.post.mockRejectedValueOnce(
        new Error("409: Job already accepted by another worker")
      );

      const acceptResult = await useWorkerJobStore.getState().acceptJob("job-req-1", 14000);

      expect(acceptResult).toBe(false);

      state = useWorkerJobStore.getState();
      expect(state.error).toBe("This job has already been accepted by another worker");
      // Conflicted job should be removed from the feed
      expect(state.streamedJobs).toHaveLength(1);
      expect(state.streamedJobs[0].id).toBe("job-req-2");
    });
  });

  describe("SSE Stream Lifecycle", () => {
    it("should accumulate jobs from multiple SSE events over time", () => {
      useWorkerJobStore.getState().connectStream();
      const es = mockEventSourceInstances[0];
      es._emit("connected", JSON.stringify({ message: "Connected" }));

      // First batch of jobs
      es._emit("jobs", JSON.stringify([
        createMockStreamedJob({ id: "job-1", title: "Job One" }),
      ]));

      let state = useWorkerJobStore.getState();
      expect(state.streamedJobs).toHaveLength(1);

      // Second batch of jobs
      es._emit("jobs", JSON.stringify([
        createMockStreamedJob({ id: "job-2", title: "Job Two" }),
        createMockStreamedJob({ id: "job-3", title: "Job Three" }),
      ]));

      state = useWorkerJobStore.getState();
      expect(state.streamedJobs).toHaveLength(3);
      expect(state.streamedJobs.map((j) => j.id)).toEqual(["job-1", "job-2", "job-3"]);

      // Third batch
      es._emit("jobs", JSON.stringify([
        createMockStreamedJob({ id: "job-4", title: "Job Four" }),
      ]));

      state = useWorkerJobStore.getState();
      expect(state.streamedJobs).toHaveLength(4);
    });

    it("should disconnect stream and clean up on disconnectStream()", () => {
      useWorkerJobStore.getState().connectStream();
      const es = mockEventSourceInstances[0];
      es._emit("connected", JSON.stringify({ message: "Connected" }));

      expect(useWorkerJobStore.getState().connectionStatus).toBe("connected");

      useWorkerJobStore.getState().disconnectStream();

      const state = useWorkerJobStore.getState();
      expect(state.connectionStatus).toBe("disconnected");
      expect(es.readyState).toBe(MockEventSource.CLOSED);
    });

    it("should attempt reconnection on connection error", () => {
      useWorkerJobStore.getState().connectStream();
      const es = mockEventSourceInstances[0];

      // Simulate connection error
      es._emitError();

      // Should be in "connecting" state (attempting reconnect)
      expect(useWorkerJobStore.getState().connectionStatus).toBe("connecting");

      // Advance timer to trigger reconnection (first attempt = 1000ms)
      vi.advanceTimersByTime(1000);

      // A new EventSource should have been created
      expect(mockEventSourceInstances).toHaveLength(2);
      expect(mockEventSourceInstances[1].url).toBe(
        "http://localhost:8080/api/v1/worker/jobs/stream?token=test-auth-token"
      );
    });

    it("should set error status when no auth token is available", async () => {
      // Dynamically import the mocked module and override getState
      const authModule = await import("@/store/authStore");
      const originalGetState = authModule.useAuthStore.getState;
      (authModule.useAuthStore as any).getState = () => ({ user: null });

      useWorkerJobStore.getState().connectStream();

      const state = useWorkerJobStore.getState();
      expect(state.connectionStatus).toBe("error");
      expect(state.error).toBe("No authentication token available");

      // Restore
      (authModule.useAuthStore as any).getState = originalGetState;
    });
  });

  describe("Subscription Management", () => {
    it("should manage multiple subscriptions independently", async () => {
      // Subscribe to Plumbing
      mockedApiService.post.mockResolvedValueOnce({
        subscription: { id: "sub-1", job_type_id: "jt-plumbing", created_at: "2024-01-15T09:00:00Z" },
      });
      await useWorkerJobStore.getState().subscribe("jt-plumbing");

      // Subscribe to Electrical
      mockedApiService.post.mockResolvedValueOnce({
        subscription: { id: "sub-2", job_type_id: "jt-electrical", created_at: "2024-01-15T09:01:00Z" },
      });
      await useWorkerJobStore.getState().subscribe("jt-electrical");

      let state = useWorkerJobStore.getState();
      expect(state.subscriptions).toHaveLength(2);
      expect(state.subscriptions[0].job_type_id).toBe("jt-plumbing");
      expect(state.subscriptions[1].job_type_id).toBe("jt-electrical");

      // Unsubscribe from Plumbing
      mockedApiService.post.mockResolvedValueOnce({ msg: "Unsubscribed" });
      await useWorkerJobStore.getState().unsubscribe("jt-plumbing");

      state = useWorkerJobStore.getState();
      expect(state.subscriptions).toHaveLength(1);
      expect(state.subscriptions[0].job_type_id).toBe("jt-electrical");
    });

    it("should handle subscription failure gracefully", async () => {
      mockedApiService.post.mockRejectedValueOnce(
        new Error("Failed to subscribe to job type")
      );

      const result = await useWorkerJobStore.getState().subscribe("jt-plumbing");

      expect(result).toBe(false);
      const state = useWorkerJobStore.getState();
      expect(state.subscriptions).toHaveLength(0);
      expect(state.error).toBe("Failed to subscribe to job type");
    });
  });

  describe("Error Recovery", () => {
    it("should allow accepting another job after a conflict error is cleared", async () => {
      // Set up stream with jobs
      useWorkerJobStore.getState().connectStream();
      const es = mockEventSourceInstances[0];
      es._emit("connected", JSON.stringify({ message: "Connected" }));
      es._emit("jobs", JSON.stringify([
        createMockStreamedJob({ id: "job-req-1" }),
        createMockStreamedJob({ id: "job-req-2", title: "Paint Wall" }),
        createMockStreamedJob({ id: "job-req-3", title: "Fix Wiring" }),
      ]));

      // First accept fails with 409
      mockedApiService.post.mockRejectedValueOnce(
        new Error("409: already accepted")
      );
      await useWorkerJobStore.getState().acceptJob("job-req-1", 14000);

      let state = useWorkerJobStore.getState();
      expect(state.error).toBe("This job has already been accepted by another worker");
      expect(state.streamedJobs).toHaveLength(2);

      // Second accept succeeds
      mockedApiService.post.mockResolvedValueOnce({ msg: "Job accepted" });
      const result = await useWorkerJobStore.getState().acceptJob("job-req-2", 10000);

      expect(result).toBe(true);
      state = useWorkerJobStore.getState();
      expect(state.error).toBeNull();
      expect(state.streamedJobs).toHaveLength(1);
      expect(state.streamedJobs[0].id).toBe("job-req-3");
    });

    it("should reset all state cleanly for a fresh start", async () => {
      // Build up state: subscribe, connect, receive jobs
      mockedApiService.get.mockResolvedValueOnce([
        { id: "jt-1", name: "Plumbing", description: "Plumbing services" },
      ]);
      await useWorkerJobStore.getState().fetchJobTypes();

      mockedApiService.post.mockResolvedValueOnce({
        subscription: { id: "sub-1", job_type_id: "jt-1", created_at: "2024-01-15T09:00:00Z" },
      });
      await useWorkerJobStore.getState().subscribe("jt-1");

      useWorkerJobStore.getState().connectStream();
      const es = mockEventSourceInstances[0];
      es._emit("connected", JSON.stringify({ message: "Connected" }));
      es._emit("jobs", JSON.stringify([createMockStreamedJob()]));

      // Verify non-initial state
      let state = useWorkerJobStore.getState();
      expect(state.availableJobTypes).toHaveLength(1);
      expect(state.subscriptions).toHaveLength(1);
      expect(state.streamedJobs).toHaveLength(1);
      expect(state.connectionStatus).toBe("connected");

      // Reset
      useWorkerJobStore.getState().reset();

      state = useWorkerJobStore.getState();
      expect(state.availableJobTypes).toEqual([]);
      expect(state.subscriptions).toEqual([]);
      expect(state.streamedJobs).toEqual([]);
      expect(state.connectionStatus).toBe("disconnected");
      expect(state.isLoading).toBe(false);
      expect(state.error).toBeNull();
      expect(es.readyState).toBe(MockEventSource.CLOSED);
    });
  });
});
