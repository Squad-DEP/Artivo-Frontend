import { describe, it, expect, beforeEach, vi, afterEach } from "vitest";
import { useWorkerJobStore } from "@/store/workerJobStore";

// Mock api-service
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
        id: "test-user-id",
        email: "worker@example.com",
        access_token: "test-token-123",
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

// Mock EventSource
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

// Assign mock EventSource to global
(global as any).EventSource = MockEventSource;

// Get the mocked apiService
import { apiService } from "@/api/api-service";
const mockApiService = apiService as unknown as {
  get: ReturnType<typeof vi.fn>;
  post: ReturnType<typeof vi.fn>;
};

describe("workerJobStore", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
    mockEventSourceInstances = [];
    useWorkerJobStore.getState().reset();
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  describe("fetchJobTypes()", () => {
    it("should call GET /matching/job-types and populate availableJobTypes", async () => {
      const jobTypesResponse = [
        { id: "jt-1", name: "Plumbing", description: "Plumbing services" },
        { id: "jt-2", name: "Electrical", description: "Electrical work" },
      ];

      mockApiService.get.mockResolvedValueOnce(jobTypesResponse);

      await useWorkerJobStore.getState().fetchJobTypes();

      expect(mockApiService.get).toHaveBeenCalledWith("/matching/job-types");
      const state = useWorkerJobStore.getState();
      expect(state.availableJobTypes).toEqual(jobTypesResponse);
      expect(state.isLoading).toBe(false);
      expect(state.error).toBeNull();
    });

    it("should set error on fetch failure", async () => {
      mockApiService.get.mockRejectedValueOnce(
        new Error("Failed to fetch job types")
      );

      await useWorkerJobStore.getState().fetchJobTypes();

      const state = useWorkerJobStore.getState();
      expect(state.availableJobTypes).toEqual([]);
      expect(state.error).toBe("Failed to fetch job types");
      expect(state.isLoading).toBe(false);
    });
  });

  describe("subscribe()", () => {
    it("should call POST /worker/subscribe and add subscription to state", async () => {
      const subscriptionResponse = {
        subscription: {
          id: "sub-1",
          job_type_id: "jt-1",
          created_at: "2024-01-01T00:00:00Z",
        },
      };

      mockApiService.post.mockResolvedValueOnce(subscriptionResponse);

      const result = await useWorkerJobStore.getState().subscribe("jt-1");

      expect(result).toBe(true);
      expect(mockApiService.post).toHaveBeenCalledWith("/worker/subscribe", {
        body: { job_type_id: "jt-1" },
      });
      const state = useWorkerJobStore.getState();
      expect(state.subscriptions).toHaveLength(1);
      expect(state.subscriptions[0]).toEqual({
        id: "sub-1",
        job_type_id: "jt-1",
        created_at: "2024-01-01T00:00:00Z",
      });
      expect(state.isLoading).toBe(false);
      expect(state.error).toBeNull();
    });

    it("should set error and return false on failure", async () => {
      mockApiService.post.mockRejectedValueOnce(
        new Error("Failed to subscribe to job type")
      );

      const result = await useWorkerJobStore.getState().subscribe("jt-1");

      expect(result).toBe(false);
      const state = useWorkerJobStore.getState();
      expect(state.subscriptions).toHaveLength(0);
      expect(state.error).toBe("Failed to subscribe to job type");
      expect(state.isLoading).toBe(false);
    });
  });

  describe("unsubscribe()", () => {
    it("should call POST /worker/unsubscribe and remove subscription from state", async () => {
      // First, set up a subscription in state
      const subscriptionResponse = {
        subscription: {
          id: "sub-1",
          job_type_id: "jt-1",
          created_at: "2024-01-01T00:00:00Z",
        },
      };
      mockApiService.post.mockResolvedValueOnce(subscriptionResponse);
      await useWorkerJobStore.getState().subscribe("jt-1");

      // Now unsubscribe
      mockApiService.post.mockResolvedValueOnce({ msg: "Unsubscribed" });

      const result = await useWorkerJobStore.getState().unsubscribe("jt-1");

      expect(result).toBe(true);
      expect(mockApiService.post).toHaveBeenLastCalledWith(
        "/worker/unsubscribe",
        { body: { job_type_id: "jt-1" } }
      );
      const state = useWorkerJobStore.getState();
      expect(state.subscriptions).toHaveLength(0);
      expect(state.isLoading).toBe(false);
      expect(state.error).toBeNull();
    });

    it("should set error and return false on failure", async () => {
      mockApiService.post.mockRejectedValueOnce(
        new Error("Failed to unsubscribe from job type")
      );

      const result = await useWorkerJobStore.getState().unsubscribe("jt-1");

      expect(result).toBe(false);
      const state = useWorkerJobStore.getState();
      expect(state.error).toBe("Failed to unsubscribe from job type");
      expect(state.isLoading).toBe(false);
    });
  });

  describe("acceptJob()", () => {
    it("should remove job from streamedJobs on success", async () => {
      // Set up streamed jobs in state
      useWorkerJobStore.setState({
        streamedJobs: [
          {
            id: "job-1",
            title: "Fix sink",
            description: "Kitchen sink repair",
            location: "Lagos",
            budget: 5000,
            job_type: "Plumbing",
            customer_name: "John",
            created_at: "2024-01-01T00:00:00Z",
          },
          {
            id: "job-2",
            title: "Paint wall",
            description: "Living room painting",
            location: "Abuja",
            budget: 8000,
            job_type: "Painting",
            customer_name: "Jane",
            created_at: "2024-01-02T00:00:00Z",
          },
        ],
      });

      mockApiService.post.mockResolvedValueOnce({ msg: "Job accepted" });

      const result = await useWorkerJobStore
        .getState()
        .acceptJob("job-1", 5000);

      expect(result).toBe(true);
      expect(mockApiService.post).toHaveBeenCalledWith("/worker/accept-job", {
        body: { job_request_id: "job-1", proposed_amount: 5000 },
      });
      const state = useWorkerJobStore.getState();
      expect(state.streamedJobs).toHaveLength(1);
      expect(state.streamedJobs[0].id).toBe("job-2");
      expect(state.isLoading).toBe(false);
      expect(state.error).toBeNull();
    });

    it("should set conflict error message and remove job on 409", async () => {
      // Set up streamed jobs in state
      useWorkerJobStore.setState({
        streamedJobs: [
          {
            id: "job-1",
            title: "Fix sink",
            description: "Kitchen sink repair",
            location: "Lagos",
            budget: 5000,
            job_type: "Plumbing",
            customer_name: "John",
            created_at: "2024-01-01T00:00:00Z",
          },
        ],
      });

      mockApiService.post.mockRejectedValueOnce(
        new Error("409: Job already accepted")
      );

      const result = await useWorkerJobStore
        .getState()
        .acceptJob("job-1", 5000);

      expect(result).toBe(false);
      const state = useWorkerJobStore.getState();
      expect(state.error).toBe(
        "This job has already been accepted by another worker"
      );
      expect(state.streamedJobs).toHaveLength(0);
      expect(state.isLoading).toBe(false);
    });

    it("should set generic error on non-conflict failure", async () => {
      useWorkerJobStore.setState({
        streamedJobs: [
          {
            id: "job-1",
            title: "Fix sink",
            description: "Kitchen sink repair",
            location: "Lagos",
            budget: 5000,
            job_type: "Plumbing",
            customer_name: "John",
            created_at: "2024-01-01T00:00:00Z",
          },
        ],
      });

      mockApiService.post.mockRejectedValueOnce(
        new Error("Network failure")
      );

      const result = await useWorkerJobStore
        .getState()
        .acceptJob("job-1", 5000);

      expect(result).toBe(false);
      const state = useWorkerJobStore.getState();
      expect(state.error).toBe("Network failure");
      // Non-conflict errors should NOT remove the job
      expect(state.streamedJobs).toHaveLength(1);
      expect(state.isLoading).toBe(false);
    });
  });

  describe("connectStream()", () => {
    it("should set connectionStatus to 'connecting' when called", () => {
      useWorkerJobStore.getState().connectStream();

      const state = useWorkerJobStore.getState();
      expect(state.connectionStatus).toBe("connecting");
    });

    it("should create an EventSource with the correct URL", () => {
      useWorkerJobStore.getState().connectStream();

      expect(mockEventSourceInstances).toHaveLength(1);
      expect(mockEventSourceInstances[0].url).toBe(
        "http://localhost:8080/api/v1/worker/jobs/stream?token=test-token-123"
      );
    });

    it("should set connectionStatus to 'connected' on 'connected' event", () => {
      useWorkerJobStore.getState().connectStream();

      const es = mockEventSourceInstances[0];
      es._emit("connected", JSON.stringify({ message: "Connected" }));

      const state = useWorkerJobStore.getState();
      expect(state.connectionStatus).toBe("connected");
      expect(state.error).toBeNull();
    });

    it("should append jobs to streamedJobs on 'jobs' event", () => {
      useWorkerJobStore.getState().connectStream();

      const es = mockEventSourceInstances[0];
      const jobs = [
        {
          id: "job-1",
          title: "Fix sink",
          description: "Kitchen sink repair",
          location: "Lagos",
          budget: 5000,
          job_type: "Plumbing",
          customer_name: "John",
          created_at: "2024-01-01T00:00:00Z",
        },
      ];

      es._emit("jobs", JSON.stringify(jobs));

      const state = useWorkerJobStore.getState();
      expect(state.streamedJobs).toHaveLength(1);
      expect(state.streamedJobs[0].id).toBe("job-1");
    });

    it("should accumulate jobs from multiple events", () => {
      useWorkerJobStore.getState().connectStream();

      const es = mockEventSourceInstances[0];

      es._emit(
        "jobs",
        JSON.stringify([
          {
            id: "job-1",
            title: "Fix sink",
            description: "Repair",
            location: "Lagos",
            budget: 5000,
            job_type: "Plumbing",
            customer_name: "John",
            created_at: "2024-01-01T00:00:00Z",
          },
        ])
      );

      es._emit(
        "jobs",
        JSON.stringify([
          {
            id: "job-2",
            title: "Paint wall",
            description: "Painting",
            location: "Abuja",
            budget: 8000,
            job_type: "Painting",
            customer_name: "Jane",
            created_at: "2024-01-02T00:00:00Z",
          },
        ])
      );

      const state = useWorkerJobStore.getState();
      expect(state.streamedJobs).toHaveLength(2);
      expect(state.streamedJobs[0].id).toBe("job-1");
      expect(state.streamedJobs[1].id).toBe("job-2");
    });
  });

  describe("disconnectStream()", () => {
    it("should set connectionStatus to 'disconnected'", () => {
      // First connect
      useWorkerJobStore.getState().connectStream();
      expect(useWorkerJobStore.getState().connectionStatus).toBe("connecting");

      // Then disconnect
      useWorkerJobStore.getState().disconnectStream();

      const state = useWorkerJobStore.getState();
      expect(state.connectionStatus).toBe("disconnected");
    });

    it("should close the EventSource", () => {
      useWorkerJobStore.getState().connectStream();
      const es = mockEventSourceInstances[0];

      useWorkerJobStore.getState().disconnectStream();

      expect(es.readyState).toBe(MockEventSource.CLOSED);
    });
  });

  describe("reconnection backoff", () => {
    it("should attempt reconnection on connection error", () => {
      useWorkerJobStore.getState().connectStream();
      const es = mockEventSourceInstances[0];

      // Simulate connection error
      es._emitError();

      // Status should be "connecting" (attempting reconnect)
      expect(useWorkerJobStore.getState().connectionStatus).toBe("connecting");

      // Advance timer to trigger reconnection
      vi.advanceTimersByTime(1000);

      // A new EventSource should have been created
      expect(mockEventSourceInstances).toHaveLength(2);
    });

    it("should set error status after max reconnection attempts", () => {
      useWorkerJobStore.getState().connectStream();

      // Simulate 10 consecutive errors (max attempts)
      // Each error triggers a reconnect timer, advancing the timer creates a new ES
      for (let i = 0; i < 10; i++) {
        const es = mockEventSourceInstances[mockEventSourceInstances.length - 1];
        es._emitError();

        // After error, advance timer to trigger the reconnection callback
        // which calls connectStream() again creating a new EventSource
        const delay = Math.min(1000 * Math.pow(2, i), 30000);
        vi.advanceTimersByTime(delay);
      }

      // After 10 failed attempts, the last error should set status to "error"
      // The 10th error fires but does NOT schedule a reconnect (max exceeded)
      const lastEs = mockEventSourceInstances[mockEventSourceInstances.length - 1];
      lastEs._emitError();

      const state = useWorkerJobStore.getState();
      expect(state.connectionStatus).toBe("error");
      expect(state.error).toBe(
        "Connection lost. Please reconnect manually."
      );
    });
  });

  describe("reset()", () => {
    it("should clear all state to initial values", async () => {
      // Set up some state
      mockApiService.post.mockResolvedValueOnce({
        subscription: {
          id: "sub-1",
          job_type_id: "jt-1",
          created_at: "2024-01-01T00:00:00Z",
        },
      });
      await useWorkerJobStore.getState().subscribe("jt-1");

      useWorkerJobStore.setState({
        streamedJobs: [
          {
            id: "job-1",
            title: "Fix sink",
            description: "Repair",
            location: "Lagos",
            budget: 5000,
            job_type: "Plumbing",
            customer_name: "John",
            created_at: "2024-01-01T00:00:00Z",
          },
        ],
      });

      // Connect stream
      useWorkerJobStore.getState().connectStream();

      // Verify non-initial state
      expect(useWorkerJobStore.getState().subscriptions).toHaveLength(1);
      expect(useWorkerJobStore.getState().streamedJobs).toHaveLength(1);
      expect(useWorkerJobStore.getState().connectionStatus).toBe("connecting");

      // Reset
      useWorkerJobStore.getState().reset();

      const state = useWorkerJobStore.getState();
      expect(state.subscriptions).toEqual([]);
      expect(state.availableJobTypes).toEqual([]);
      expect(state.streamedJobs).toEqual([]);
      expect(state.connectionStatus).toBe("disconnected");
      expect(state.isLoading).toBe(false);
      expect(state.error).toBeNull();
    });

    it("should close EventSource connection on reset", () => {
      useWorkerJobStore.getState().connectStream();
      const es = mockEventSourceInstances[0];

      useWorkerJobStore.getState().reset();

      expect(es.readyState).toBe(MockEventSource.CLOSED);
    });
  });
});
