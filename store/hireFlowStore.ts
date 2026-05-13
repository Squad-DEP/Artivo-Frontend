import { create } from "zustand";
import { getApiBaseUrl } from "@/api/api-service";
import { useAuthStore } from "@/store/authStore";
import type {
  RequestJobPayload,
  RequestJobResponse,
  HirePayload,
  HireResponse,
  VerifyPaymentPayload,
  VerifyPaymentResponse,
} from "@/api/types/marketplace-api";
import { validateJobRequest } from "@/lib/utils/hire-validation";
import { nairaToKobo } from "@/lib/utils/payment";

export type HireFlowStep =
  | "idle"
  | "requesting"
  | "hiring"
  | "paying"
  | "verifying"
  | "complete";

export interface CreateJobRequestPayload {
  job_type_id: string;
  title: string;
  description: string;
  location: string;
  budget: number;
}

export interface HireFlowState {
  // State
  jobRequest: { id: string; status: string } | null;
  job: { id: string; status: string } | null;
  paymentResult: {
    transactionReference: string;
    amount: number;
    status: string;
  } | null;
  isLoading: boolean;
  error: string | null;
  validationErrors: Record<string, string>;
  step: HireFlowStep;

  // Actions
  createJobRequest: (data: CreateJobRequestPayload) => Promise<boolean>;
  hireWorker: (jobRequestId: string, workerId: string, amount: number) => Promise<boolean>;
  openSquadModal: (email: string, amount: number, jobId: string) => void;
  verifyPayment: (jobId: string, transactionReference: string, amount: number) => Promise<boolean>;
  reset: () => void;
}

/**
 * POST a request and handle 422 validation errors by extracting field-level messages.
 */
async function postWithValidation<T>(
  path: string,
  body: object
): Promise<{
  data: T | null;
  validationErrors: Record<string, string>;
  errorMessage: string | null;
}> {
  const baseUrl = getApiBaseUrl();
  const url = `${baseUrl}/v1${path}`;
  const user = useAuthStore.getState().user;

  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${user?.access_token}`,
    },
    body: JSON.stringify(body),
  });

  if (response.ok) {
    const data = await response.json();
    return { data: data as T, validationErrors: {}, errorMessage: null };
  }

  if (response.status === 422) {
    try {
      const errorData = await response.json();
      const validationErrors: Record<string, string> = {};
      // Backend returns { errors: { field: { msg } } } from express-validator
      if (errorData.errors && typeof errorData.errors === "object") {
        for (const [field, errObj] of Object.entries(errorData.errors)) {
          const msg = (errObj as { msg?: string })?.msg;
          if (msg) validationErrors[field] = msg;
        }
      }
      return { data: null, validationErrors, errorMessage: errorData.msg || "Validation error" };
    } catch {
      return { data: null, validationErrors: {}, errorMessage: "Validation error" };
    }
  }

  let errorMessage = `Request failed (${response.status})`;
  try {
    const errorData = await response.json();
    errorMessage = errorData.msg || errorData.message || errorData.error || errorMessage;
  } catch { /* use default */ }

  return { data: null, validationErrors: {}, errorMessage };
}

const initialState = {
  jobRequest: null as HireFlowState["jobRequest"],
  job: null as HireFlowState["job"],
  paymentResult: null as HireFlowState["paymentResult"],
  isLoading: false,
  error: null as string | null,
  validationErrors: {} as Record<string, string>,
  step: "idle" as HireFlowStep,
};

export const useHireFlowStore = create<HireFlowState>()((set, get) => ({
  ...initialState,

  createJobRequest: async (data: CreateJobRequestPayload) => {
    const validation = validateJobRequest(data);
    if (!validation.valid) {
      set({ validationErrors: validation.errors, error: "Validation failed" });
      return false;
    }

    set({ isLoading: true, error: null, validationErrors: {}, step: "requesting" });

    try {
      const payload: RequestJobPayload = {
        job_type_id: data.job_type_id,
        title: data.title,
        description: data.description,
        location: data.location,
        budget: data.budget,
      };

      const result = await postWithValidation<RequestJobResponse>("/customer/request-job", payload);

      if (result.data) {
        set({
          jobRequest: { id: result.data.job_request.id, status: result.data.job_request.status },
          isLoading: false,
          step: "hiring",
        });
        return true;
      }

      set({ error: result.errorMessage, validationErrors: result.validationErrors, isLoading: false, step: "idle" });
      return false;
    } catch (error) {
      set({ error: error instanceof Error ? error.message : "Failed to create job request", isLoading: false, step: "idle" });
      return false;
    }
  },

  hireWorker: async (jobRequestId: string, workerId: string, amount: number) => {
    set({ isLoading: true, error: null, validationErrors: {}, step: "hiring" });

    try {
      const payload: HirePayload = { job_request_id: jobRequestId, worker_id: workerId, amount };
      const result = await postWithValidation<HireResponse>("/customer/hire", payload);

      if (result.data) {
        set({ job: { id: result.data.job.id, status: result.data.job.status }, isLoading: false, step: "paying" });
        return true;
      }

      set({ error: result.errorMessage, validationErrors: result.validationErrors, isLoading: false, step: "hiring" });
      return false;
    } catch (error) {
      set({ error: error instanceof Error ? error.message : "Failed to hire worker", isLoading: false, step: "hiring" });
      return false;
    }
  },

  openSquadModal: (email: string, amount: number, jobId: string) => {
    set({ step: "paying", error: null });

    const koboAmount = nairaToKobo(amount);

    const openModal = () => {
      const SquadPay = (window as unknown as Record<string, unknown>).SquadPay as
        | (new (config: Record<string, unknown>) => { open: () => void })
        | undefined;

      if (!SquadPay) {
        set({ error: "Payment SDK not available. Please refresh and try again.", step: "paying" });
        return;
      }

      const squad = new SquadPay({
        onClose: () => {
          // User dismissed modal without paying — stay on paying step so they can retry
          if (get().step === "verifying") return; // don't override if already verifying
          set({ step: "paying" });
        },
        onLoad: () => { /* modal rendered */ },
        onSuccess: (response: { transaction_ref?: string }) => {
          const transactionRef = response?.transaction_ref ?? `txn_${Date.now()}`;
          get().verifyPayment(jobId, transactionRef, amount);
        },
        key: process.env.NEXT_PUBLIC_SQUAD_PUBLIC_KEY,
        amount: koboAmount,
        email,
        currency_code: "NGN",
        // Embed job ID in metadata so it's traceable in Squad dashboard
        metadata: { job_id: jobId },
      });

      squad.open();
    };

    if ((window as unknown as Record<string, unknown>).SquadPay) {
      openModal();
    } else {
      const script = document.createElement("script");
      script.src = "https://checkout.squadco.com/widget/squad.min.js";
      script.async = true;
      script.onload = openModal;
      script.onerror = () => set({ error: "Failed to load payment SDK. Check your connection.", step: "paying" });
      document.head.appendChild(script);
    }
  },

  /**
   * Called after Squad's onSuccess fires.
   * Sends the transaction reference to the backend for server-side verification.
   * The backend calls Squad's verify endpoint and confirms the amount matches the job.
   */
  verifyPayment: async (jobId: string, transactionReference: string, amount: number) => {
    set({ isLoading: true, error: null, step: "verifying" });

    try {
      const payload: VerifyPaymentPayload = { job_id: jobId, transaction_reference: transactionReference };
      const result = await postWithValidation<VerifyPaymentResponse>("/customer/verify-payment", payload);

      if (result.data) {
        set({
          paymentResult: {
            transactionReference,
            amount,
            status: result.data.payment_log.status,
          },
          isLoading: false,
          step: "complete",
        });
        return true;
      }

      // Verification failed — backend rejected the transaction
      set({
        error: result.errorMessage ?? "Payment verification failed. Please contact support if funds were deducted.",
        isLoading: false,
        step: "paying", // let user retry or contact support
      });
      return false;
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : "Payment verification failed. Please contact support.",
        isLoading: false,
        step: "paying",
      });
      return false;
    }
  },

  reset: () => set(initialState),
}));
