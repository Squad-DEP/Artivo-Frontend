import { create } from "zustand";
import { apiService } from "@/api/api-service";
import { validatePaymentAmount } from "@/lib/validators";
import { VirtualAccountResponse } from "@/api/types/marketplace-api";

// --- Interfaces ---

export interface VirtualAccount {
  account_number: string;
  bank_name: string;
  account_name: string;
  bank_code: string;
  status: "active" | "pending" | "failed";
  created_at: string;
}

export interface Transaction {
  id: string;
  type: "credit" | "debit";
  amount: number;
  currency: string;
  status: "pending" | "completed" | "failed";
  payment_method: PaymentMethod;
  counterparty_name: string;
  job_reference?: string;
  created_at: string;
  completed_at?: string;
}

export type PaymentMethod = "mobile_money" | "bank_transfer" | "wallet";

interface PaymentState {
  // State
  virtualAccount: VirtualAccount | null;
  transactions: Transaction[];
  totalTransactions: number;
  currentPage: number;
  isLoading: boolean;
  error: string | null;
  retryAttempts: Record<string, number>;
  virtualAccountError: string | null;
  isCreatingVirtualAccount: boolean;

  // Actions
  createVirtualAccount: () => Promise<boolean>;
  fetchVirtualAccount: () => Promise<void>;
  initiatePayment: (
    jobId: string,
    stageId: string,
    method: PaymentMethod,
    amount: number
  ) => Promise<boolean>;
  retryPayment: (transactionId: string) => Promise<boolean>;
  fetchTransactions: (page?: number) => Promise<void>;
  clearError: () => void;
  clearVirtualAccountError: () => void;
}

// --- Constants ---

const PAGE_SIZE = 20;
const MAX_RETRY_ATTEMPTS = 3;

// --- Store ---

export const usePaymentStore = create<PaymentState>()((set, get) => ({
  virtualAccount: null,
  transactions: [],
  totalTransactions: 0,
  currentPage: 1,
  isLoading: false,
  error: null,
  retryAttempts: {},
  virtualAccountError: null,
  isCreatingVirtualAccount: false,

  createVirtualAccount: async (): Promise<boolean> => {
    set({ isCreatingVirtualAccount: true, virtualAccountError: null });

    try {
      const data = await apiService.post<VirtualAccount>("/payments/account");
      set({ virtualAccount: data, isCreatingVirtualAccount: false });
      return true;
    } catch (error) {
      set({
        virtualAccountError:
          error instanceof Error
            ? error.message
            : "Failed to create virtual account",
        isCreatingVirtualAccount: false,
      });
      return false;
    }
  },

  fetchVirtualAccount: async () => {
    set({ isLoading: true, error: null });

    try {
      const data = await apiService.get<VirtualAccountResponse>("/account/virtual-account");
      const va = data.virtual_account;
      set({
        virtualAccount: {
          account_number: va.account_number,
          account_name: va.account_name,
          bank_name: va.bank_name,
          bank_code: va.bank_code,
          status: "active",
          created_at: new Date().toISOString(),
        },
        isLoading: false,
      });
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : "Failed to fetch virtual account",
        isLoading: false,
      });
    }
  },

  initiatePayment: async (
    jobId: string,
    stageId: string,
    method: PaymentMethod,
    amount: number
  ): Promise<boolean> => {
    // Validate amount before making API call
    const validation = validatePaymentAmount(amount);
    if (!validation.valid) {
      set({ error: validation.error || "Invalid payment amount" });
      return false;
    }

    set({ isLoading: true, error: null });

    try {
      await apiService.post("/payments/initiate", {
        body: {
          job_id: jobId,
          stage_id: stageId,
          payment_method: method,
          amount,
        },
      });

      set({ isLoading: false });
      return true;
    } catch (error) {
      set({
        error:
          error instanceof Error
            ? error.message
            : "Failed to initiate payment",
        isLoading: false,
      });
      return false;
    }
  },

  retryPayment: async (transactionId: string): Promise<boolean> => {
    const { retryAttempts } = get();
    const currentAttempts = retryAttempts[transactionId] || 0;

    // Enforce max 3 retry attempts
    if (currentAttempts >= MAX_RETRY_ATTEMPTS) {
      set({
        error: "Maximum retry attempts (3) reached for this transaction",
      });
      return false;
    }

    set({ isLoading: true, error: null });

    try {
      await apiService.post(`/payments/:id/retry`, {
        params: { id: transactionId },
      });

      // Increment retry count on success or failure of the API call
      set((state) => ({
        isLoading: false,
        retryAttempts: {
          ...state.retryAttempts,
          [transactionId]: currentAttempts + 1,
        },
      }));
      return true;
    } catch (error) {
      // Still increment retry count on failure
      set((state) => ({
        error:
          error instanceof Error ? error.message : "Failed to retry payment",
        isLoading: false,
        retryAttempts: {
          ...state.retryAttempts,
          [transactionId]: currentAttempts + 1,
        },
      }));
      return false;
    }
  },

  fetchTransactions: async (page: number = 1) => {
    set({ isLoading: true, error: null });

    try {
      const data = await apiService.get<{
        transactions: Transaction[];
        total: number;
        page: number;
      }>("/payments/transactions", {
        query: {
          page: String(page),
          limit: String(PAGE_SIZE),
          sort: "created_at",
          order: "desc",
        },
      });

      set({
        transactions: data.transactions,
        totalTransactions: data.total,
        currentPage: data.page,
        isLoading: false,
      });
    } catch (error) {
      set({
        error:
          error instanceof Error
            ? error.message
            : "Failed to fetch transactions",
        isLoading: false,
      });
    }
  },

  clearError: () => set({ error: null }),

  clearVirtualAccountError: () => set({ virtualAccountError: null }),
}));
