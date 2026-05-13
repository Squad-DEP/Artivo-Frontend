import { create } from "zustand";
import { apiService, getApiBaseUrl } from "@/api/api-service";
import { useAuthStore } from "@/store/authStore";
import { calculateBackoffDelay } from "@/lib/utils/sse-backoff";
import type {
  JobTypesResponse,
  SubscribePayload,
  AcceptJobPayload,
  StreamedJob,
} from "@/api/types/marketplace-api";

// Module-level variables for SSE connection management (not in Zustand state)
let eventSource: EventSource | null = null;
let reconnectTimer: ReturnType<typeof setTimeout> | null = null;
let reconnectAttempts = 0;
const MAX_RECONNECT_ATTEMPTS = 10;

export interface JobType {
  id: string;
  name: string;
  description: string;
}

export interface Subscription {
  id: string;
  job_type_id: string;
  created_at: string;
}

export interface WorkerJobState {
  // State
  subscriptions: Subscription[];
  availableJobTypes: JobType[];
  streamedJobs: StreamedJob[];
  connectionStatus: "disconnected" | "connecting" | "connected" | "error";
  isLoading: boolean;
  error: string | null;

  // Actions
  fetchJobTypes: () => Promise<void>;
  subscribe: (jobTypeId: string) => Promise<boolean>;
  unsubscribe: (jobTypeId: string) => Promise<boolean>;
  connectStream: () => void;
  disconnectStream: () => void;
  acceptJob: (jobRequestId: string, proposedAmount: number) => Promise<boolean>;
  reset: () => void;
}

const initialState = {
  subscriptions: [] as Subscription[],
  availableJobTypes: [] as JobType[],
  streamedJobs: [] as StreamedJob[],
  connectionStatus: "disconnected" as const,
  isLoading: false,
  error: null as string | null,
};

export const useWorkerJobStore = create<WorkerJobState>()((set, get) => ({
  ...initialState,

  fetchJobTypes: async () => {
    set({ isLoading: true, error: null });

    try {
      const response = await apiService.get<JobTypesResponse[]>(
        "/matching/job-types"
      );

      const jobTypes: JobType[] = response.map((jt) => ({
        id: jt.id,
        name: jt.name,
        description: jt.description,
      }));

      set({ availableJobTypes: jobTypes, isLoading: false });
    } catch (error) {
      set({
        error:
          error instanceof Error
            ? error.message
            : "Failed to fetch job types",
        isLoading: false,
      });
    }
  },

  subscribe: async (jobTypeId: string) => {
    set({ isLoading: true, error: null });

    try {
      const payload: SubscribePayload = { job_type_id: jobTypeId };

      const response = await apiService.post<{ subscription: Subscription }>(
        "/worker/subscribe",
        { body: payload }
      );

      set((state) => ({
        subscriptions: [...state.subscriptions, response.subscription],
        isLoading: false,
      }));

      return true;
    } catch (error) {
      set({
        error:
          error instanceof Error
            ? error.message
            : "Failed to subscribe to job type",
        isLoading: false,
      });
      return false;
    }
  },

  unsubscribe: async (jobTypeId: string) => {
    set({ isLoading: true, error: null });

    try {
      await apiService.post<{ msg: string }>("/worker/unsubscribe", {
        body: { job_type_id: jobTypeId },
      });

      set((state) => ({
        subscriptions: state.subscriptions.filter(
          (sub) => sub.job_type_id !== jobTypeId
        ),
        isLoading: false,
      }));

      return true;
    } catch (error) {
      set({
        error:
          error instanceof Error
            ? error.message
            : "Failed to unsubscribe from job type",
        isLoading: false,
      });
      return false;
    }
  },

  connectStream: () => {
    // Close existing connection if any
    if (eventSource) {
      eventSource.close();
      eventSource = null;
    }

    // Clear any pending reconnect timer
    if (reconnectTimer) {
      clearTimeout(reconnectTimer);
      reconnectTimer = null;
    }

    const token = useAuthStore.getState().user?.access_token;
    if (!token) {
      set({ connectionStatus: "error", error: "No authentication token available" });
      return;
    }

    const baseUrl = getApiBaseUrl();
    const streamUrl = `${baseUrl}/v1/worker/jobs/stream?token=${token}`;

    set({ connectionStatus: "connecting" });

    const es = new EventSource(streamUrl);
    eventSource = es;

    es.addEventListener("connected", (event: MessageEvent) => {
      reconnectAttempts = 0;
      set({ connectionStatus: "connected", error: null });
    });

    es.addEventListener("jobs", (event: MessageEvent) => {
      try {
        const jobs: StreamedJob[] = JSON.parse(event.data);
        set((state) => ({
          streamedJobs: [...state.streamedJobs, ...jobs],
        }));
      } catch {
        // Silently ignore malformed JSON events
      }
    });

    es.onerror = () => {
      // EventSource will fire error when connection is closed
      if (es.readyState === EventSource.CLOSED) {
        es.close();
        eventSource = null;

        // Attempt reconnection with exponential backoff
        if (reconnectAttempts < MAX_RECONNECT_ATTEMPTS) {
          reconnectAttempts++;
          const delay = calculateBackoffDelay(reconnectAttempts);
          set({ connectionStatus: "connecting" });

          reconnectTimer = setTimeout(() => {
            reconnectTimer = null;
            const { connectStream } = useWorkerJobStore.getState();
            connectStream();
          }, delay);
        } else {
          // Max retries exceeded — show manual reconnect option
          set({
            connectionStatus: "error",
            error: "Connection lost. Please reconnect manually.",
          });
        }
      }
    };
  },

  disconnectStream: () => {
    // Close EventSource if open
    if (eventSource) {
      eventSource.close();
      eventSource = null;
    }

    // Clear any reconnect timer
    if (reconnectTimer) {
      clearTimeout(reconnectTimer);
      reconnectTimer = null;
    }

    // Reset reconnect attempts
    reconnectAttempts = 0;

    // Set status to disconnected
    set({ connectionStatus: "disconnected" });
  },

  acceptJob: async (jobRequestId: string, proposedAmount: number) => {
    set({ isLoading: true, error: null });

    try {
      const payload: AcceptJobPayload = {
        job_request_id: jobRequestId,
        proposed_amount: proposedAmount,
      };

      await apiService.post<{ msg: string }>("/worker/accept-job", {
        body: payload,
      });

      // Remove the accepted job from the streamed jobs list
      set((state) => ({
        streamedJobs: state.streamedJobs.filter(
          (job) => job.id !== jobRequestId
        ),
        isLoading: false,
      }));

      return true;
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Failed to accept job";

      // Handle 409 conflict — job already accepted by another worker
      const isConflict =
        errorMessage.includes("409") ||
        errorMessage.toLowerCase().includes("already accepted") ||
        errorMessage.toLowerCase().includes("conflict");

      set({
        error: isConflict
          ? "This job has already been accepted by another worker"
          : errorMessage,
        isLoading: false,
      });

      // Remove the job from the feed if it's already taken
      if (isConflict) {
        set((state) => ({
          streamedJobs: state.streamedJobs.filter(
            (job) => job.id !== jobRequestId
          ),
        }));
      }

      return false;
    }
  },

  reset: () => {
    const { disconnectStream } = get();
    disconnectStream();
    set(initialState);
  },
}));
