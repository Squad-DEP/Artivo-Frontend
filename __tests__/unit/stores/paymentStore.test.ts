import { describe, it, expect, beforeEach, vi } from "vitest";
import { usePaymentStore } from "@/store/paymentStore";

// Mock the API service
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
    // Reset store state
    usePaymentStore.setState({
      virtualAccount: null,
      transactions: [],
      totalTransactions: 0,
      currentPage: 1,
      isLoading: false,
      error: null,
      retryAttempts: {},
    });
  });

  describe("fetchVirtualAccount", () => {
    it("should fetch and store virtual account data", async () => {
      const mockResponse = {
        virtual_account: {
          virtual_account_number: "1234567890",
          virtual_account_name: "John Doe",
          bank_name: "Squad Bank",
          bank_code: "058",
        },
      };

      mockedApiService.get.mockResolvedValueOnce(mockResponse);

      await usePaymentStore.getState().fetchVirtualAccount();
      const state = usePaymentStore.getState();

      expect(mockedApiService.get).toHaveBeenCalledWith("/user/virtual-account");
      expect(state.virtualAccount).toEqual({
        account_number: "1234567890",
        account_name: "John Doe",
        bank_name: "Squad Bank",
        bank_code: "058",
        status: "active",
        created_at: expect.any(String),
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
      let resolvePromise: (value: unknown) => void;
      const promise = new Promise((resolve) => {
        resolvePromise = resolve;
      });
      mockedApiService.get.mockReturnValueOnce(promise as any);

      const fetchPromise = usePaymentStore.getState().fetchVirtualAccount();
      expect(usePaymentStore.getState().isLoading).toBe(true);

      resolvePromise!({
        account_number: "123",
        bank_name: "Test",
        account_name: "Test",
        status: "active",
        created_at: "2024-01-01",
      });
      await fetchPromise;

      expect(usePaymentStore.getState().isLoading).toBe(false);
    });
  });

  describe("initiatePayment", () => {
    it("should initiate payment with valid amount", async () => {
      mockedApiService.post.mockResolvedValueOnce({});

      const result = await usePaymentStore
        .getState()
        .initiatePayment("job-1", "stage-1", "mobile_money", 5000);

      expect(result).toBe(true);
      expect(mockedApiService.post).toHaveBeenCalledWith(
        "/payments/initiate",
        {
          body: {
            job_id: "job-1",
            stage_id: "stage-1",
            payment_method: "mobile_money",
            amount: 5000,
          },
        }
      );
      expect(usePaymentStore.getState().isLoading).toBe(false);
      expect(usePaymentStore.getState().error).toBeNull();
    });

    it("should reject amount below 100 NGN", async () => {
      const result = await usePaymentStore
        .getState()
        .initiatePayment("job-1", "stage-1", "bank_transfer", 50);

      expect(result).toBe(false);
      expect(mockedApiService.post).not.toHaveBeenCalled();
      expect(usePaymentStore.getState().error).toBe(
        "Payment amount must be at least 100 NGN"
      );
    });

    it("should reject amount above 10,000,000 NGN", async () => {
      const result = await usePaymentStore
        .getState()
        .initiatePayment("job-1", "stage-1", "wallet", 10_000_001);

      expect(result).toBe(false);
      expect(mockedApiService.post).not.toHaveBeenCalled();
      expect(usePaymentStore.getState().error).toBe(
        "Payment amount must be at most 10,000,000 NGN"
      );
    });

    it("should accept minimum valid amount (100 NGN)", async () => {
      mockedApiService.post.mockResolvedValueOnce({});

      const result = await usePaymentStore
        .getState()
        .initiatePayment("job-1", "stage-1", "mobile_money", 100);

      expect(result).toBe(true);
    });

    it("should accept maximum valid amount (10,000,000 NGN)", async () => {
      mockedApiService.post.mockResolvedValueOnce({});

      const result = await usePaymentStore
        .getState()
        .initiatePayment("job-1", "stage-1", "bank_transfer", 10_000_000);

      expect(result).toBe(true);
    });

    it("should set error on API failure", async () => {
      mockedApiService.post.mockRejectedValueOnce(
        new Error("Payment gateway unavailable")
      );

      const result = await usePaymentStore
        .getState()
        .initiatePayment("job-1", "stage-1", "wallet", 5000);

      expect(result).toBe(false);
      expect(usePaymentStore.getState().error).toBe(
        "Payment gateway unavailable"
      );
      expect(usePaymentStore.getState().isLoading).toBe(false);
    });
  });

  describe("retryPayment", () => {
    it("should retry a failed payment successfully", async () => {
      mockedApiService.post.mockResolvedValueOnce({});

      const result = await usePaymentStore
        .getState()
        .retryPayment("txn-1");

      expect(result).toBe(true);
      expect(mockedApiService.post).toHaveBeenCalledWith(
        "/payments/:id/retry",
        { params: { id: "txn-1" } }
      );
      expect(usePaymentStore.getState().retryAttempts["txn-1"]).toBe(1);
    });

    it("should track retry attempts per transaction", async () => {
      mockedApiService.post.mockResolvedValue({});

      await usePaymentStore.getState().retryPayment("txn-1");
      await usePaymentStore.getState().retryPayment("txn-1");

      expect(usePaymentStore.getState().retryAttempts["txn-1"]).toBe(2);
    });

    it("should block retry after 3 attempts", async () => {
      // Set up state with 3 attempts already made
      usePaymentStore.setState({
        retryAttempts: { "txn-1": 3 },
      });

      const result = await usePaymentStore
        .getState()
        .retryPayment("txn-1");

      expect(result).toBe(false);
      expect(mockedApiService.post).not.toHaveBeenCalled();
      expect(usePaymentStore.getState().error).toBe(
        "Maximum retry attempts (3) reached for this transaction"
      );
    });

    it("should allow exactly 3 retry attempts", async () => {
      mockedApiService.post.mockResolvedValue({});

      // Attempt 1
      const result1 = await usePaymentStore.getState().retryPayment("txn-1");
      expect(result1).toBe(true);

      // Attempt 2
      const result2 = await usePaymentStore.getState().retryPayment("txn-1");
      expect(result2).toBe(true);

      // Attempt 3
      const result3 = await usePaymentStore.getState().retryPayment("txn-1");
      expect(result3).toBe(true);

      // Attempt 4 should be blocked
      const result4 = await usePaymentStore.getState().retryPayment("txn-1");
      expect(result4).toBe(false);
      expect(usePaymentStore.getState().retryAttempts["txn-1"]).toBe(3);
    });

    it("should increment retry count even on API failure", async () => {
      mockedApiService.post.mockRejectedValueOnce(
        new Error("Network error")
      );

      const result = await usePaymentStore
        .getState()
        .retryPayment("txn-1");

      expect(result).toBe(false);
      expect(usePaymentStore.getState().retryAttempts["txn-1"]).toBe(1);
      expect(usePaymentStore.getState().error).toBe("Network error");
    });

    it("should track retry attempts independently per transaction", async () => {
      mockedApiService.post.mockResolvedValue({});

      await usePaymentStore.getState().retryPayment("txn-1");
      await usePaymentStore.getState().retryPayment("txn-2");
      await usePaymentStore.getState().retryPayment("txn-1");

      const state = usePaymentStore.getState();
      expect(state.retryAttempts["txn-1"]).toBe(2);
      expect(state.retryAttempts["txn-2"]).toBe(1);
    });
  });

  describe("fetchTransactions", () => {
    it("should fetch transactions with default pagination", async () => {
      const mockResponse = {
        transactions: [
          {
            id: "txn-1",
            type: "credit" as const,
            amount: 5000,
            currency: "NGN",
            status: "completed" as const,
            payment_method: "mobile_money" as const,
            counterparty_name: "Jane Doe",
            job_reference: "job-1",
            created_at: "2024-01-15T10:00:00Z",
            completed_at: "2024-01-15T10:01:00Z",
          },
        ],
        total: 1,
        page: 1,
      };

      mockedApiService.get.mockResolvedValueOnce(mockResponse);

      await usePaymentStore.getState().fetchTransactions();
      const state = usePaymentStore.getState();

      expect(mockedApiService.get).toHaveBeenCalledWith(
        "/payments/transactions",
        {
          query: {
            page: "1",
            limit: "20",
            sort: "created_at",
            order: "desc",
          },
        }
      );
      expect(state.transactions).toHaveLength(1);
      expect(state.transactions[0].id).toBe("txn-1");
      expect(state.totalTransactions).toBe(1);
      expect(state.currentPage).toBe(1);
      expect(state.isLoading).toBe(false);
    });

    it("should fetch transactions for a specific page", async () => {
      const mockResponse = {
        transactions: [],
        total: 50,
        page: 3,
      };

      mockedApiService.get.mockResolvedValueOnce(mockResponse);

      await usePaymentStore.getState().fetchTransactions(3);
      const state = usePaymentStore.getState();

      expect(mockedApiService.get).toHaveBeenCalledWith(
        "/payments/transactions",
        {
          query: {
            page: "3",
            limit: "20",
            sort: "created_at",
            order: "desc",
          },
        }
      );
      expect(state.currentPage).toBe(3);
      expect(state.totalTransactions).toBe(50);
    });

    it("should set error on API failure", async () => {
      mockedApiService.get.mockRejectedValueOnce(
        new Error("Server error")
      );

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
});
