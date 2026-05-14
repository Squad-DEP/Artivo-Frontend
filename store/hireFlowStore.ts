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

export type HireFlowStep =
  | "idle"
  | "requesting"
  | "hiring"
  | "choosing_payment"
  | "paying"
  | "verifying"
  | "checking"   // Squad closed without onSuccess — polling job status
  | "complete";

export type PaymentMethod = "online" | "offline";

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
  /** Set when hire fails with 402 — contains available_balance and required amount */
  insufficientBalance: { available: number; required: number } | null;

  paymentMethod: PaymentMethod;

  // Actions
  createJobRequest: (data: CreateJobRequestPayload) => Promise<boolean>;
  hireWorker: (jobRequestId: string, workerId: string, amount: number, paymentMethod: PaymentMethod) => Promise<boolean>;
  openSquadModal: (email: string, amount: number, jobId: string) => void;
  verifyPayment: (jobId: string, transactionReference: string, amount: number) => Promise<boolean>;
  checkJobStatus: (jobId: string) => Promise<void>;
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

  if (response.status === 402) {
    try {
      const errorData = await response.json();
      const err = new Error(errorData.msg || "Insufficient balance") as any;
      err.statusCode = 402;
      err.availableBalance = errorData.available_balance ?? 0;
      err.required = errorData.required ?? 0;
      throw err;
    } catch (e: any) {
      if (e.statusCode === 402) throw e;
      throw new Error("Insufficient balance. Please fund your virtual account.");
    }
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
  insufficientBalance: null as HireFlowState["insufficientBalance"],
  paymentMethod: "online" as PaymentMethod,
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

  hireWorker: async (jobRequestId: string, workerId: string, amount: number, paymentMethod: PaymentMethod) => {
    set({ isLoading: true, error: null, validationErrors: {}, insufficientBalance: null, step: "hiring", paymentMethod });

    try {
      const payload: HirePayload = {
        job_request_id: jobRequestId,
        worker_id: workerId,
        amount,
        payment_method: paymentMethod,
      };
      const result = await postWithValidation<HireResponse>("/customer/hire", payload);

      if (result.data) {
        const job = { id: result.data.job.id, status: result.data.job.status };
        set({ job, isLoading: false });

        if (paymentMethod === "offline") {
          // Offline: job is immediately in_progress — no payment needed
          set({ step: "complete" });
        } else {
          // Online: open Squad checkout for this job
          set({ step: "paying" });
        }
        return true;
      }

      set({ error: result.errorMessage, validationErrors: result.validationErrors, isLoading: false, step: "hiring" });
      return false;
    } catch (error: any) {
      set({ error: error instanceof Error ? error.message : "Failed to hire worker", isLoading: false, step: "hiring" });
      return false;
    }
  },

  openSquadModal: (email: string, amount: number, jobId: string) => {
    set({ step: "paying", error: null });

    const koboAmount = amount * 100; // Convert Naira to kobo

    const openModal = () => {
      if (!window.squad) {
        set({ error: "Payment SDK not available. Please refresh and try again.", step: "paying" });
        return;
      }

      const squadInstance = new window.squad({
        onClose: () => {
          console.log("Squad widget closed");
          const currentStep = get().step;
          // Don't override if already past paying
          if (currentStep === "verifying" || currentStep === "complete") return;
          // Squad closed without onSuccess — poll the job to see if payment landed
          get().checkJobStatus(jobId);
        },
        onLoad: () => {
          console.log("Squad widget loaded successfully");
        },
        onSuccess: (response: { transaction_ref?: string }) => {
          console.log("Payment successful", response);
          const transactionRef = response?.transaction_ref ?? `txn_${Date.now()}`;
          get().verifyPayment(jobId, transactionRef, amount);
        },
        key: process.env.NEXT_PUBLIC_SQUAD_PUBLIC_KEY!,
        amount: koboAmount,
        email,
        currency_code: "NGN",
        customer_name: email.split('@')[0],
        callback_url: `${window.location.origin}/dashboard/jobs`,
        metadata: { job_id: jobId },
        pass_charge: false,
      });

      squadInstance.setup();
      squadInstance.open();
    };

    if (window.squad) {
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

  checkJobStatus: async (jobId: string) => {
    set({ step: "checking", error: null });
    const baseUrl = getApiBaseUrl();
    const user = useAuthStore.getState().user;

    // Poll up to 12 times (60s) waiting for job status to flip to in_progress/paid
    for (let i = 0; i < 12; i++) {
      await new Promise((r) => setTimeout(r, 5000));
      try {
        const res = await fetch(`${baseUrl}/v1/jobs/${jobId}`, {
          headers: { Authorization: `Bearer ${user?.access_token}` },
        });
        if (res.ok) {
          const data = await res.json();
          const status = data?.job?.status ?? data?.status;
          if (status === "in_progress" || status === "paid" || status === "pending_payment") {
            // Payment confirmed (webhook may have beaten us here)
            set({ step: "complete", isLoading: false });
            return;
          }
        }
      } catch { /* network hiccup — keep polling */ }

      // Stop polling if user navigated away or reset
      if (get().step !== "checking") return;
    }

    // Gave up — let user retry manually
    set({
      step: "paying",
      error: "We couldn't confirm your payment automatically. If funds were deducted, please contact support with your transaction reference.",
    });
  },

  reset: () => set(initialState),
}));
