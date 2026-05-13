import { describe, it, expect, beforeEach, vi } from "vitest";
import { usePaymentStore } from "@/store/paymentStore";

vi.mock("@/api/api-service", () => ({
  apiService: {
    post: vi.fn(),
    get: vi.fn(),
  },
}));

import { apiService } from "@/api/api-service";

const mockedApiService = vi.mocked(apiService);

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
    it("should fetch and store virtual account data including balance", async () => {
      const mockResponse = {
        virtual_account: {
          account_number: "1234567890",
          account_name: "John Doe",
          bank_name: "Squad Bank",
          bank_code: "058",
          customer_identifier: "artivo-user-123",
          balance: 50000,
          total_deposited: 150000,
        },
      };

      mockedApiService.get.mockResolvedValueOnce(mockResponse);

      await usePaymentStore.getState().fetchVirtualAccount();
      const state = usePaymentStore.getState();

      expect(mockedApiService.get).toHaveBeenCalledWith("/account/virtual-account");
      expect(state.virtualAccount).toEqual({
        account_number: "1234567890",
        account_name: "John Doe",
        bank_name: "Squad Bank",
        bank_code: "058",
        customer_identifier: "artivo-user-123",
        balance: 50000,
        total_deposited: 150000,
        status: "active",
      });
      expect(state.isLoading).toBe(false);
      expect(state.error).toBeNull();
    });

    it("should set error on API failure", async () => {
      mockedApiService.get.mockRejectedValueOnce(
        new Error("Failed to fetch account")
      );

      await usePaymentStore.getState().fetchVirtualAccount();
      const state = usePaymentStore.getState();

      expect(state.virtualAccount).toBeNull();
      expect(state.error).toBe("Failed to fetch account");
      expect(state.isLoading).toBe(false);
    });

    it("should set isLoading to true during fetch", async () => {
      let resolvePromise!: (value: unknown) => void;
      const promise = new Promise((resolve) => {
        resolvePromise = resolve;
      });
      mockedApiService.get.mockReturnValueOnce(promise as any);

      const fetchPromise = usePaymentStore.getState().fetchVirtualAccount();
      expect(usePaymentStore.getState().isLoading).toBe(true);

      resolvePromise({
        virtual_account: {
          account_number: "123",
          bank_name: "Test",
          account_name: "Test",
          bank_code: "000",
          customer_identifier: "test-id",
          balance: 0,
          total_deposited: 0,
        },
      });
      await fetchPromise;

      expect(usePaymentStore.getState().isLoading).toBe(false);
    });

    it("should default balance and total_deposited to 0 when missing from response", async () => {
      mockedApiService.get.mockResolvedValueOnce({
        virtual_account: {
          account_number: "9999",
          account_name: "No Balance",
          bank_name: "Bank",
          bank_code: "001",
          customer_identifier: "cust-001",
        },
      });

      await usePaymentStore.getState().fetchVirtualAccount();
      const va = usePaymentStore.getState().virtualAccount!;

      expect(va.balance).toBe(0);
      expect(va.total_deposited).toBe(0);
    });
  });

  describe("fetchTransactions", () => {
    it("should fetch and store Squad transactions", async () => {
      const mockResponse = {
        transactions: [
          {
            transaction_reference: "ref-abc-001",
            virtual_account_number: "8012345678",
            transaction_indicator: "C",
            principal_amount: "500000",
            settled_amount: "500000",
            fee_charged: "0",
            remarks: "top-up",
            currency: "NGN",
            transaction_date: "2024-01-15T10:00:00Z",
          },
        ],
      };

      mockedApiService.get.mockResolvedValueOnce(mockResponse);

      await usePaymentStore.getState().fetchTransactions();
      const state = usePaymentStore.getState();

      expect(mockedApiService.get).toHaveBeenCalledWith("/account/transactions");
      expect(state.transactions).toHaveLength(1);
      expect(state.transactions[0].transaction_reference).toBe("ref-abc-001");
      expect(state.transactions[0].transaction_indicator).toBe("C");
      expect(state.transactions[0].transaction_date).toBe("2024-01-15T10:00:00Z");
      expect(state.isLoading).toBe(false);
    });

    it("should default to empty array when response has no transactions", async () => {
      mockedApiService.get.mockResolvedValueOnce({ transactions: null });

      await usePaymentStore.getState().fetchTransactions();

      expect(usePaymentStore.getState().transactions).toEqual([]);
    });

    it("should set error on API failure", async () => {
      mockedApiService.get.mockRejectedValueOnce(new Error("Server error"));

      await usePaymentStore.getState().fetchTransactions();
      const state = usePaymentStore.getState();

      expect(state.error).toBe("Server error");
      expect(state.isLoading).toBe(false);
      expect(state.transactions).toHaveLength(0);
    });
  });

  describe("clearError", () => {
    it("should clear the error state", () => {
      usePaymentStore.setState({ error: "Some error" });
      usePaymentStore.getState().clearError();
      expect(usePaymentStore.getState().error).toBeNull();
    });
  });

  describe("clearVirtualAccountError", () => {
    it("should clear the virtualAccountError state", () => {
      usePaymentStore.setState({ virtualAccountError: "VA error" });
      usePaymentStore.getState().clearVirtualAccountError();
      expect(usePaymentStore.getState().virtualAccountError).toBeNull();
    });
  });
});
