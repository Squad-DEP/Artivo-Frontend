import { create } from "zustand";
import { apiService } from "@/api/api-service";
import { VirtualAccountResponse } from "@/api/types/marketplace-api";

// Kept for backward-compat with PaymentDialog / PaymentMethodSelector
export type PaymentMethod = "mobile_money" | "bank_transfer" | "wallet";

// --- Interfaces ---

export interface VirtualAccount {
  account_number: string;
  bank_name: string;
  account_name: string;
  bank_code: string;
  customer_identifier: string;
  balance: number;
  total_deposited: number;
  status: "active" | "pending" | "failed";
}

export interface SquadTransaction {
  transaction_reference: string;
  virtual_account_number: string;
  principal_amount: string;   // in kobo
  settled_amount: string;
  fee_charged: string;
  transaction_date: string;
  transaction_indicator: "C" | "D"; // credit / debit
  remarks: string;
  currency: string;
  frozen_transaction?: {
    freeze_transaction_ref: string;
    reason: string;
  } | null;
  customer?: {
    customer_identifier: string;
  };
}

export interface CustomerEscrow {
  id: string;
  jobId: string;
  amount: number;
  status: string;
  fundedAt: string | null;
  title: string;
}

interface PaymentState {
  virtualAccount: VirtualAccount | null;
  transactions: SquadTransaction[];
  escrows: CustomerEscrow[];
  isLoading: boolean;
  error: string | null;
  virtualAccountError: string | null;
  needsSetup: boolean;

  fetchVirtualAccount: () => Promise<void>;
  ensureSetup: (kyc: { bvn: string; dob: string; gender: "1" | "2"; address: string; first_name: string; last_name: string; phone: string }) => Promise<void>;
  claimAccount: (accountNumber: string) => Promise<void>;
  simulateDeposit: (amount: number) => Promise<void>;
  fetchTransactions: () => Promise<void>;
  fetchEscrows: () => Promise<void>;
  clearError: () => void;
  clearVirtualAccountError: () => void;
}

// --- Store ---

export const usePaymentStore = create<PaymentState>()((set) => ({
  virtualAccount: null,
  transactions: [],
  escrows: [],
  isLoading: false,
  error: null,
  virtualAccountError: null,
  needsSetup: false,

  fetchVirtualAccount: async () => {
    set({ isLoading: true, error: null });

    try {
      const data = await apiService.get<VirtualAccountResponse>(
        "/account/virtual-account"
      );
      const va = data.virtual_account;
      set({
        virtualAccount: {
          account_number: va.account_number,
          account_name: va.account_name,
          bank_name: va.bank_name,
          bank_code: va.bank_code,
          customer_identifier: va.customer_identifier || "",
          balance: va.balance ?? 0,
          total_deposited: va.total_deposited ?? 0,
          status: "active",
        },
        isLoading: false,
      });
    } catch (error) {
      const msg = error instanceof Error ? error.message : String(error);
      const isNotFound =
        msg.toLowerCase().includes("not found") ||
        msg.toLowerCase().includes("404");
      set({
        needsSetup: isNotFound,
        error: isNotFound ? null : msg,
        isLoading: false,
      });
    }
  },

  ensureSetup: async (kyc) => {
    set({ isLoading: true, error: null });
    try {
      const data = await apiService.post<VirtualAccountResponse>(
        "/account/ensure-setup",
        { body: kyc }
      );
      const va = data.virtual_account;
      set({
        virtualAccount: {
          account_number: va.account_number,
          account_name: va.account_name,
          bank_name: va.bank_name,
          bank_code: va.bank_code,
          customer_identifier: va.customer_identifier || "",
          balance: va.balance ?? 0,
          total_deposited: va.total_deposited ?? 0,
          status: "active",
        },
        needsSetup: false,
        isLoading: false,
        error: null,
      });
    } catch (error) {
      set({
        error:
          error instanceof Error
            ? error.message
            : "Failed to create virtual account",
        isLoading: false,
      });
    }
  },

  claimAccount: async (accountNumber) => {
    set({ isLoading: true, error: null });
    try {
      const data = await apiService.post<VirtualAccountResponse>(
        "/account/claim",
        { body: { account_number: accountNumber } }
      );
      const va = data.virtual_account;
      set({
        virtualAccount: {
          account_number: va.account_number,
          account_name: va.account_name,
          bank_name: va.bank_name,
          bank_code: va.bank_code,
          customer_identifier: va.customer_identifier || "",
          balance: va.balance ?? 0,
          total_deposited: va.total_deposited ?? 0,
          status: "active",
        },
        needsSetup: false,
        isLoading: false,
        error: null,
      });
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : "Failed to claim account",
        isLoading: false,
      });
    }
  },

  simulateDeposit: async (amount) => {
    set({ isLoading: true, error: null });
    try {
      const data = await apiService.post<{ balance: number; total_deposited: number; msg: string }>(
        "/account/simulate-deposit",
        { body: { amount } }
      );
      set((state) => ({
        virtualAccount: state.virtualAccount
          ? { ...state.virtualAccount, balance: data.balance, total_deposited: data.total_deposited }
          : state.virtualAccount,
        isLoading: false,
      }));
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : "Deposit failed",
        isLoading: false,
      });
    }
  },

  fetchTransactions: async () => {
    set({ isLoading: true, error: null });

    try {
      const data = await apiService.get<{ transactions: SquadTransaction[] }>(
        "/account/transactions"
      );
      set({ transactions: data.transactions ?? [], isLoading: false });
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

  fetchEscrows: async () => {
    try {
      const data = await apiService.get<{ escrows: CustomerEscrow[] }>("/account/escrows");
      set({ escrows: data.escrows ?? [] });
    } catch {
      // non-critical, leave existing state
    }
  },

  clearError: () => set({ error: null }),
  clearVirtualAccountError: () => set({ virtualAccountError: null }),
}));
