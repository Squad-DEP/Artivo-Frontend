import { create } from "zustand";
import { apiService, getApiBaseUrl } from "@/api/api-service";
import { useAuthStore } from "@/store/authStore";
import type {
  RequestJobPayload,
  RequestJobResponse,
  HirePayload,
  HireResponse,
  PaymentLogPayload,
  PaymentLogResponse,
} from "@/api/types/marketplace-api";
import { validateJobRequest } from "@/lib/utils/hire-validation";
import { nairaToKobo } from "@/lib/utils/payment";

export type HireFlowStep =
  | "idle"
  | "requesting"
  | "hiring"
  | "paying"
  | "logging"
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
  paymentLog: {
    id: string;
    squad_transaction_id: string;
    amount: number;
    status: string;
  } | null;
  isLoading: boolean;
  error: string | null;
  validationErrors: Record<string, string>;
  step: HireFlowStep;

  // Actions
  createJobRequest: (data: CreateJobRequestPayload) => Promise<boolean>;
  hireWorker: (
    jobRequestId: string,
    workerId: string,
    amount: number
  ) => Promise<boolean>;
  openSquadModal: (email: string, amount: number, jobId: string) => void;
  logPayment: (
    jobId: string,
    transactionId: string,
    amount: number
  ) => Promise<boolean>;
  reset: () => void;
}

/**
 * Attempts a POST request and handles 422 validation errors by parsing
 * field-level error messages from the response body.
 *
 * Returns { data, validationErrors } where data is null on failure.
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

      if (Array.isArray(errorData.errors)) {
        for (const err of errorData.errors) {
          if (err.field && err.message) {
            validationErrors[err.field] = err.message;
          }
        }
      }

      return {
        data: null,
        validationErrors,
        errorMessage: errorData.msg || "Validation error",
      };
    } catch {
      return {
        data: null,
        validationErrors: {},
        errorMessage: "Validation error",
      };
    }
  }

  // Handle other error statuses
  let errorMessage = `Request failed with status ${response.status}`;
  try {
    const errorData = await response.json();
    if (errorData.msg) {
      errorMessage = errorData.msg;
    } else if (errorData.message) {
      errorMessage = errorData.message;
    } else if (errorData.error) {
      errorMessage = errorData.error;
    }
  } catch {
    // Use default error message
  }

  return { data: null, validationErrors: {}, errorMessage };
}

const initialState = {
  jobRequest: null as HireFlowState["jobRequest"],
  job: null as HireFlowState["job"],
  paymentLog: null as HireFlowState["paymentLog"],
  isLoading: false,
  error: null as string | null,
  validationErrors: {} as Record<string, string>,
  step: "idle" as HireFlowStep,
};

export const useHireFlowStore = create<HireFlowState>()((set, get) => ({
  ...initialState,

  createJobRequest: async (data: CreateJobRequestPayload) => {
    // Client-side validation first
    const validation = validateJobRequest(data);
    if (!validation.valid) {
      set({ validationErrors: validation.errors, error: "Validation failed" });
      return false;
    }

    set({
      isLoading: true,
      error: null,
      validationErrors: {},
      step: "requesting",
    });

    try {
      const payload: RequestJobPayload = {
        job_type_id: data.job_type_id,
        title: data.title,
        description: data.description,
        location: data.location,
        budget: data.budget,
      };

      const result = await postWithValidation<RequestJobResponse>(
        "/customer/request-job",
        payload
      );

      if (result.data) {
        set({
          jobRequest: {
            id: result.data.job_request.id,
            status: result.data.job_request.status,
          },
          isLoading: false,
          step: "hiring",
        });
        return true;
      }

      // Handle validation or other errors
      set({
        error: result.errorMessage,
        validationErrors: result.validationErrors,
        isLoading: false,
        step: "idle",
      });
      return false;
    } catch (error) {
      set({
        error:
          error instanceof Error
            ? error.message
            : "Failed to create job request",
        isLoading: false,
        step: "idle",
      });
      return false;
    }
  },

  hireWorker: async (
    jobRequestId: string,
    workerId: string,
    amount: number
  ) => {
    set({ isLoading: true, error: null, validationErrors: {}, step: "hiring" });

    try {
      const payload: HirePayload = {
        job_request_id: jobRequestId,
        worker_id: workerId,
        amount,
      };

      const result = await postWithValidation<HireResponse>(
        "/customer/hire",
        payload
      );

      if (result.data) {
        set({
          job: {
            id: result.data.job.id,
            status: result.data.job.status,
          },
          isLoading: false,
          step: "paying",
        });
        return true;
      }

      set({
        error: result.errorMessage,
        validationErrors: result.validationErrors,
        isLoading: false,
        step: "hiring",
      });
      return false;
    } catch (error) {
      set({
        error:
          error instanceof Error ? error.message : "Failed to hire worker",
        isLoading: false,
        step: "hiring",
      });
      return false;
    }
  },

  openSquadModal: (email: string, amount: number, jobId: string) => {
    set({ step: "paying", error: null });

    const koboAmount = nairaToKobo(amount);

    // Dynamically load and open Squad payment modal
    const openModal = () => {
      const SquadPay = (window as unknown as Record<string, unknown>)
        .SquadPay as
        | (new (config: Record<string, unknown>) => { open: () => void })
        | undefined;

      if (!SquadPay) {
        set({ error: "Payment SDK not available", step: "hiring" });
        return;
      }

      const squad = new SquadPay({
        onClose: () => {
          // User closed modal without completing payment
          const currentStep = get().step;
          if (currentStep === "paying") {
            set({ step: "hiring" });
          }
        },
        onLoad: () => {
          // Modal loaded successfully
        },
        onSuccess: (transactionRef: { transaction_ref?: string }) => {
          const transactionId =
            transactionRef?.transaction_ref || `txn_${Date.now()}`;
          get().logPayment(jobId, transactionId, amount);
        },
        amount: koboAmount,
        email,
        currency_code: "NGN",
      });

      squad.open();
    };

    // Check if Squad SDK is already loaded
    if ((window as unknown as Record<string, unknown>).SquadPay) {
      openModal();
    } else {
      // Dynamically load Squad SDK script
      const script = document.createElement("script");
      script.src = "https://checkout.squadco.com/widget/squad.min.js";
      script.async = true;
      script.onload = () => openModal();
      script.onerror = () => {
        set({ error: "Failed to load payment SDK", step: "hiring" });
      };
      document.head.appendChild(script);
    }
  },

  logPayment: async (
    jobId: string,
    transactionId: string,
    amount: number
  ) => {
    set({ isLoading: true, error: null, step: "logging" });

    try {
      const payload: PaymentLogPayload = {
        job_id: jobId,
        squad_transaction_id: transactionId,
        amount,
        status: "success",
      };

      const result = await postWithValidation<PaymentLogResponse>(
        "/customer/payment",
        payload
      );

      if (result.data) {
        set({
          paymentLog: {
            id: result.data.payment_log.id,
            squad_transaction_id: result.data.payment_log.squad_transaction_id,
            amount: result.data.payment_log.amount,
            status: result.data.payment_log.status,
          },
          isLoading: false,
          step: "complete",
        });
        return true;
      }

      set({
        error: result.errorMessage,
        validationErrors: result.validationErrors,
        isLoading: false,
        step: "paying",
      });
      return false;
    } catch (error) {
      set({
        error:
          error instanceof Error ? error.message : "Failed to log payment",
        isLoading: false,
        step: "paying",
      });
      return false;
    }
  },

  reset: () => {
    set(initialState);
  },
}));
