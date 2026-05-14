import { create } from "zustand";
import { apiService } from "@/api/api-service";
import type {
  JobTypesResponse,
  SubscribePayload,
  AcceptJobPayload,
  StreamedJob,
} from "@/api/types/marketplace-api";

let pollTimer: ReturnType<typeof setInterval> | null = null;
const POLL_INTERVAL_MS = 10_000;

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

export interface WorkerProposal {
  id: string;
  job_request_id: string;
  proposed_amount: number;
  proposed_amount_max: number | null;
  status: "pending" | "accepted" | "rejected";
  created_at: string;
  title: string;
  description: string;
  location: string;
  budget: number;
  job_type: string;
  customer_name: string;
  job_request_status: string;
}

export interface WorkerJobState {
  subscriptions: Subscription[];
  availableJobTypes: JobType[];
  streamedJobs: StreamedJob[];
  proposals: WorkerProposal[];
  isLoading: boolean;
  error: string | null;

  fetchJobTypes: () => Promise<void>;
  fetchJobs: () => Promise<void>;
  fetchProposals: () => Promise<void>;
  startPolling: () => void;
  stopPolling: () => void;
  subscribe: (jobTypeId: string) => Promise<boolean>;
  unsubscribe: (jobTypeId: string) => Promise<boolean>;
  acceptJob: (jobRequestId: string, proposedAmountMin: number, proposedAmountMax: number) => Promise<boolean>;
  reset: () => void;
}

const initialState = {
  subscriptions: [] as Subscription[],
  availableJobTypes: [] as JobType[],
  streamedJobs: [] as StreamedJob[],
  proposals: [] as WorkerProposal[],
  isLoading: false,
  error: null as string | null,
};

export const useWorkerJobStore = create<WorkerJobState>()((set, get) => ({
  ...initialState,

  fetchJobTypes: async () => {
    try {
      const response = await apiService.get<JobTypesResponse[]>("/matching/job-types");
      set({
        availableJobTypes: response.map((jt) => ({
          id: jt.id,
          name: jt.name,
          description: jt.description,
        })),
      });
    } catch (error) {
      set({ error: error instanceof Error ? error.message : "Failed to fetch job types" });
    }
  },

  fetchJobs: async () => {
    try {
      const response = await apiService.get<{ jobs: StreamedJob[] }>("/worker/jobs");
      set({ streamedJobs: response.jobs ?? [], error: null });
    } catch (error) {
      set({ error: error instanceof Error ? error.message : "Failed to fetch jobs" });
    }
  },

  fetchProposals: async () => {
    try {
      const response = await apiService.get<{ proposals: WorkerProposal[] }>("/worker/proposals");
      set({ proposals: response.proposals ?? [] });
    } catch (error) {
      set({ error: error instanceof Error ? error.message : "Failed to fetch proposals" });
    }
  },

  startPolling: () => {
    if (pollTimer) return;
    get().fetchJobs();
    pollTimer = setInterval(() => {
      get().fetchJobs();
    }, POLL_INTERVAL_MS);
  },

  stopPolling: () => {
    if (pollTimer) {
      clearInterval(pollTimer);
      pollTimer = null;
    }
  },

  subscribe: async (jobTypeId: string) => {
    try {
      const payload: SubscribePayload = { job_type_id: jobTypeId };
      const response = await apiService.post<{ subscription: Subscription }>(
        "/worker/subscribe",
        { body: payload }
      );
      set((state) => ({ subscriptions: [...state.subscriptions, response.subscription] }));
      return true;
    } catch (error) {
      set({ error: error instanceof Error ? error.message : "Failed to subscribe" });
      return false;
    }
  },

  unsubscribe: async (jobTypeId: string) => {
    try {
      await apiService.post<{ msg: string }>("/worker/unsubscribe", {
        body: { job_type_id: jobTypeId },
      });
      set((state) => ({
        subscriptions: state.subscriptions.filter((sub) => sub.job_type_id !== jobTypeId),
      }));
      return true;
    } catch (error) {
      set({ error: error instanceof Error ? error.message : "Failed to unsubscribe" });
      return false;
    }
  },

  acceptJob: async (jobRequestId: string, proposedAmountMin: number, proposedAmountMax: number) => {
    set({ isLoading: true, error: null });
    try {
      const payload = {
        job_request_id: jobRequestId,
        proposed_amount: proposedAmountMin,
        proposed_amount_max: proposedAmountMax,
      };
      await apiService.post<{ msg: string }>("/worker/accept-job", { body: payload });
      // Remove from available feed, refresh proposals
      set((state) => ({
        streamedJobs: state.streamedJobs.filter((job) => job.id !== jobRequestId),
        isLoading: false,
      }));
      get().fetchProposals();
      return true;
    } catch (error) {
      const msg = error instanceof Error ? error.message : "Failed to accept job";
      const isConflict =
        msg.includes("409") ||
        msg.toLowerCase().includes("already accepted") ||
        msg.toLowerCase().includes("conflict");
      set({
        error: isConflict ? "This job has already been accepted by another worker" : msg,
        isLoading: false,
      });
      if (isConflict) {
        set((state) => ({
          streamedJobs: state.streamedJobs.filter((job) => job.id !== jobRequestId),
        }));
      }
      return false;
    }
  },

  reset: () => {
    get().stopPolling();
    set(initialState);
  },
}));
