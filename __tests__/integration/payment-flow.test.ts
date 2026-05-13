import { describe, it, expect, beforeEach, vi } from "vitest";
import { usePaymentStore } from "@/store/paymentStore";
import type { VirtualAccount, SquadTransaction } from "@/store/paymentStore";

vi.mock("@/api/api-service", () => ({
  apiService: {
    post: vi.fn(),
    get: vi.fn(),
  },
}));

import { apiService } from "@/api/api-service";

const mockedApiService = vi.mocked(apiService);

function mockVirtualAccount(overrides: Partial<VirtualAccount> = {}): VirtualAccount {
  return {
    account_number: "0123456789",
    bank_name: "Squad Microfinance Bank",
    account_name: "Adebayo Plumber",
    bank_code: "076",
    customer_identifier: "ARTIVO_USER123",
    balance: 50000,
    total_deposited: 100000,
    status: "active",
    ...overrides,
  };
}

function mockSquadTransaction(overrides: Partial<SquadTransaction> = {}): SquadTransaction {
  return {
    transaction_reference: "TXN_REF_001",
    virtual_account_number: "8012345678",
    transaction_indicator: "C",
    principal_amount: "500000",
    settled_amount: "500000",
    fee_charged: "0",
    remarks: "",
    currency: "NGN",
    transaction_date: "2024-01-01T00:00:00Z",
    ...overrides,
  };
}

describe("paymentStore", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    usePaymentStore.setState({
      virtualAccount: null,
      transactions: [],
      isLoading: false,
      error: null,
      virtualAccountError: null,
    });
  });

  describe("fetchVirtualAccount", () => {
    it("fetches and maps virtual account including balance", async () => {
      mockedApiService.get.mockResolvedValueOnce({
        virtual_account: {
          account_number: "0123456789",
          account_name: "Adebayo Plumber",
          bank_name: "Squad Microfinance Bank",
          bank_code: "076",
          customer_identifier: "ARTIVO_USER123",
          balance: 50000,
          total_deposited: 100000,
        },
      });

      await usePaymentStore.getState().fetchVirtualAccount();

      const state = usePaymentStore.getState();
      expect(state.virtualAccount).not.toBeNull();
      expect(state.virtualAccount!.balance).toBe(50000);
      expect(state.virtualAccount!.total_deposited).toBe(100000);
      expect(state.virtualAccount!.account_number).toBe("0123456789");
      expect(state.isLoading).toBe(false);
      expect(state.error).toBeNull();
    });

    it("sets error when fetch fails", async () => {
      mockedApiService.get.mockRejectedValueOnce(new Error("Network error"));

      await usePaymentStore.getState().fetchVirtualAccount();

      const state = usePaymentStore.getState();
      expect(state.error).toBe("Network error");
      expect(state.virtualAccount).toBeNull();
      expect(state.isLoading).toBe(false);
    });

    it("defaults balance to 0 when not in response", async () => {
      mockedApiService.get.mockResolvedValueOnce({
        virtual_account: {
          account_number: "0123456789",
          account_name: "Test User",
          bank_name: "Squad Bank",
          bank_code: "076",
          customer_identifier: "ARTIVO_U1",
        },
      });

      await usePaymentStore.getState().fetchVirtualAccount();

      const state = usePaymentStore.getState();
      expect(state.virtualAccount!.balance).toBe(0);
      expect(state.virtualAccount!.total_deposited).toBe(0);
    });
  });

  describe("fetchTransactions", () => {
    it("fetches transaction list", async () => {
      const tx = mockSquadTransaction();
      mockedApiService.get.mockResolvedValueOnce({ transactions: [tx] });

      await usePaymentStore.getState().fetchTransactions();

      const state = usePaymentStore.getState();
      expect(state.transactions).toHaveLength(1);
      expect(state.transactions[0].transaction_reference).toBe("TXN_REF_001");
      expect(state.transactions[0].transaction_indicator).toBe("C");
      expect(state.isLoading).toBe(false);
    });

    it("handles empty list", async () => {
      mockedApiService.get.mockResolvedValueOnce({ transactions: [] });
      await usePaymentStore.getState().fetchTransactions();
      expect(usePaymentStore.getState().transactions).toHaveLength(0);
    });

    it("handles missing transactions key", async () => {
      mockedApiService.get.mockResolvedValueOnce({});
      await usePaymentStore.getState().fetchTransactions();
      expect(usePaymentStore.getState().transactions).toHaveLength(0);
    });

    it("sets error on failure", async () => {
      mockedApiService.get.mockRejectedValueOnce(new Error("Fetch failed"));
      await usePaymentStore.getState().fetchTransactions();
      expect(usePaymentStore.getState().error).toBe("Fetch failed");
      expect(usePaymentStore.getState().isLoading).toBe(false);
    });
  });

  describe("clearError", () => {
    it("clears error", () => {
      usePaymentStore.setState({ error: "Some error" });
      usePaymentStore.getState().clearError();
      expect(usePaymentStore.getState().error).toBeNull();
    });
  });

  describe("clearVirtualAccountError", () => {
    it("clears virtualAccountError", () => {
      usePaymentStore.setState({ virtualAccountError: "VA error" });
      usePaymentStore.getState().clearVirtualAccountError();
      expect(usePaymentStore.getState().virtualAccountError).toBeNull();
    });
  });

  describe("SquadTransaction credit/debit", () => {
    it("credit transaction indicator is C", () => {
      const tx = mockSquadTransaction({ transaction_indicator: "C" });
      expect(tx.transaction_indicator).toBe("C");
    });

    it("debit transaction indicator is D", () => {
      const tx = mockSquadTransaction({ transaction_indicator: "D" });
      expect(tx.transaction_indicator).toBe("D");
    });
  });
});
