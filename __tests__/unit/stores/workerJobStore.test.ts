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

  describe("fetchJobs()", () => {
    it("should call GET /worker/jobs and replace streamedJobs", async () => {
      mockApiService.get.mockResolvedValueOnce({
        jobs: [
          { id: "job-1", title: "Fix sink", description: "Repair", location: "Lagos", budget: 5000, job_type: "Plumbing", customer_name: "John", created_at: "2024-01-01T00:00:00Z" },
        ],
      });
      await useWorkerJobStore.getState().fetchJobs();

      const state = useWorkerJobStore.getState();
      expect(state.streamedJobs).toHaveLength(1);
      expect(state.streamedJobs[0].id).toBe("job-1");
      expect(state.error).toBeNull();
    });

    it("should replace jobs on each fetch (not accumulate)", async () => {
      mockApiService.get.mockResolvedValueOnce({ jobs: [{ id: "job-1", title: "A", description: "", location: "", budget: 0, job_type: "", customer_name: "", created_at: "" }] });
      await useWorkerJobStore.getState().fetchJobs();

      mockApiService.get.mockResolvedValueOnce({ jobs: [{ id: "job-2", title: "B", description: "", location: "", budget: 0, job_type: "", customer_name: "", created_at: "" }, { id: "job-3", title: "C", description: "", location: "", budget: 0, job_type: "", customer_name: "", created_at: "" }] });
      await useWorkerJobStore.getState().fetchJobs();

      const state = useWorkerJobStore.getState();
      expect(state.streamedJobs).toHaveLength(2);
      expect(state.streamedJobs.map((j) => j.id)).toEqual(["job-2", "job-3"]);
    });
  });

  describe("startPolling() / stopPolling()", () => {
    it("should fetch jobs immediately on startPolling", async () => {
      mockApiService.get.mockResolvedValue({ jobs: [] });
      useWorkerJobStore.getState().startPolling();
      await vi.runAllTimersAsync();

      expect(mockApiService.get).toHaveBeenCalledWith("/worker/jobs");
      useWorkerJobStore.getState().stopPolling();
    });

    it("should stop fetching after stopPolling", async () => {
      mockApiService.get.mockResolvedValue({ jobs: [] });
      useWorkerJobStore.getState().startPolling();
      await vi.runAllTimersAsync();
      useWorkerJobStore.getState().stopPolling();

      const callsBefore = mockApiService.get.mock.calls.length;
      vi.advanceTimersByTime(60_000);
      expect(mockApiService.get.mock.calls.length).toBe(callsBefore);
    });
  });

  describe("reset()", () => {
    it("should clear all state to initial values", async () => {
      mockApiService.post.mockResolvedValueOnce({
        subscription: { id: "sub-1", job_type_id: "jt-1", created_at: "2024-01-01T00:00:00Z" },
      });
      await useWorkerJobStore.getState().subscribe("jt-1");

      useWorkerJobStore.setState({
        streamedJobs: [
          { id: "job-1", title: "Fix sink", description: "Repair", location: "Lagos", budget: 5000, job_type: "Plumbing", customer_name: "John", created_at: "2024-01-01T00:00:00Z" },
        ],
      });

      expect(useWorkerJobStore.getState().subscriptions).toHaveLength(1);
      expect(useWorkerJobStore.getState().streamedJobs).toHaveLength(1);

      useWorkerJobStore.getState().reset();

      const state = useWorkerJobStore.getState();
      expect(state.subscriptions).toEqual([]);
      expect(state.availableJobTypes).toEqual([]);
      expect(state.streamedJobs).toEqual([]);
      expect(state.proposals).toEqual([]);
      expect(state.isLoading).toBe(false);
      expect(state.error).toBeNull();
    });
  });
});
