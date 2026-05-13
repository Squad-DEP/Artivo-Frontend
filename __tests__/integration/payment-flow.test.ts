import { describe, it, expect, beforeEach, vi } from "vitest";
import { usePaymentStore } from "@/store/paymentStore";
import type { Transaction, VirtualAccount } from "@/store/paymentStore";

// Mock the API service
vi.mock("@/api/api-service", () => ({
  apiService: {
    post: vi.fn(),
    get: vi.fn(),
  },
}));

import { apiService } from "@/api/api-service";

const mockedApiService = vi.mocked(apiService);

// --- Test Fixtures ---

function createMockVirtualAccount(overrides: Partial<VirtualAccount> = {}): VirtualAccount {
  return {
    account_number: "0123456789",
    bank_name: "Squad Microfinance Bank",
    account_name: "Adebayo Plumber",
    status: "active",
    created_at: "2024-01-01T00:00:00Z",
    ...overrides,
  };
}

function createMockTransaction(overrides: Partial<Transaction> = {}): Transaction {
  return {
    id: "txn-1",
    type: "credit",
    amount: 5000,
    currency: "NGN",
    status: "completed",
    payment_method: "mobile_money",
    counterparty_name: "Chioma Okafor",
    job_reference: "job-1",
    created_at: "2024-01-15T10:00:00Z",
    completed_at: "2024-01-15T10:01:00Z",
    ...overrides,
  };
}

describe("Integration: Payment Flow", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    usePaymentStore.setState({
      virtualAccount: null,
      transactions: [],
      totalTransactions: 0,
      currentPage: 1,
      isLoading: false,
      error: null,
      retryAttempts: {},
      virtualAccountError: null,
      isCreatingVirtualAccount: false,
    });
  });

  describe("Virtual Account Creation on Onboarding", () => {
    it("should create virtual account successfully after worker onboarding", async () => {
      const mockAccount = createMockVirtualAccount();
      mockedApiService.post.mockResolvedValueOnce(mockAccount);

      const result = await usePaymentStore.getState().createVirtualAccount();

      expect(result).toBe(true);
      expect(mockedApiService.post).toHaveBeenCalledWith("/payments/account");

      const state = usePaymentStore.getState();
      expect(state.virtualAccount).toEqual(mockAccount);
      expect(state.virtualAccount?.status).toBe("active");
      expect(state.virtualAccountError).toBeNull();
      expect(state.isCreatingVirtualAccount).toBe(false);
    });

    it("should handle virtual account creation failure gracefully", async () => {
      mockedApiService.post.mockRejectedValueOnce(
        new Error("Squad API unavailable")
      );

      const result = await usePaymentStore.getState().createVirtualAccount();

      expect(result).toBe(false);

      const state = usePaymentStore.getState();
      expect(state.virtualAccount).toBeNull();
      expect(state.virtualAccountError).toBe("Squad API unavailable");
      expect(state.isCreatingVirtualAccount).toBe(false);
    });

    it("should allow retry after virtual account creation failure", async () => {
      // First attempt fails
      mockedApiService.post.mockRejectedValueOnce(
        new Error("Squad API unavailable")
      );
      await usePaymentStore.getState().createVirtualAccount();

      expect(usePaymentStore.getState().virtualAccountError).toBe("Squad API unavailable");

      // Clear error and retry
      usePaymentStore.getState().clearVirtualAccountError();
      expect(usePaymentStore.getState().virtualAccountError).toBeNull();

      // Second attempt succeeds
      const mockAccount = createMockVirtualAccount();
      mockedApiService.post.mockResolvedValueOnce(mockAccount);

      const result = await usePaymentStore.getState().createVirtualAccount();

      expect(result).toBe(true);
      expect(usePaymentStore.getState().virtualAccount).toEqual(mockAccount);
    });
  });

  describe("Payment Initiation Flow", () => {
    it("should initiate payment successfully with valid amount", async () => {
      mockedApiService.post.mockResolvedValueOnce({});

      const result = await usePaymentStore
        .getState()
        .initiatePayment("job-1", "stage-1", "mobile_money", 5000);

      expect(result).toBe(true);
      expect(mockedApiService.post).toHaveBeenCalledWith("/payments/initiate", {
        body: {
          job_id: "job-1",
          stage_id: "stage-1",
          payment_method: "mobile_money",
          amount: 5000,
        },
      });
      expect(usePaymentStore.getState().error).toBeNull();
    });

    it("should reject payment below minimum (100 NGN)", async () => {
      const result = await usePaymentStore
        .getState()
        .initiatePayment("job-1", "stage-1", "bank_transfer", 50);

      expect(result).toBe(false);
      expect(mockedApiService.post).not.toHaveBeenCalled();
      expect(usePaymentStore.getState().error).toContain("100");
    });

    it("should reject payment above maximum (10,000,000 NGN)", async () => {
      const result = await usePaymentStore
        .getState()
        .initiatePayment("job-1", "stage-1", "wallet", 10_000_001);

      expect(result).toBe(false);
      expect(mockedApiService.post).not.toHaveBeenCalled();
      expect(usePaymentStore.getState().error).toContain("10,000,000");
    });

    it("should accept boundary amounts (100 and 10,000,000 NGN)", async () => {
      // Minimum boundary
      mockedApiService.post.mockResolvedValueOnce({});
      const minResult = await usePaymentStore
        .getState()
        .initiatePayment("job-1", "stage-1", "mobile_money", 100);
      expect(minResult).toBe(true);

      // Maximum boundary
      mockedApiService.post.mockResolvedValueOnce({});
      const maxResult = await usePaymentStore
        .getState()
        .initiatePayment("job-1", "stage-2", "bank_transfer", 10_000_000);
      expect(maxResult).toBe(true);
    });

    it("should support all payment methods", async () => {
      const methods = ["mobile_money", "bank_transfer", "wallet"] as const;

      for (const method of methods) {
        mockedApiService.post.mockResolvedValueOnce({});

        const result = await usePaymentStore
          .getState()
          .initiatePayment("job-1", "stage-1", method, 5000);

        expect(result).toBe(true);
      }

      expect(mockedApiService.post).toHaveBeenCalledTimes(3);
    });

    it("should handle payment gateway failure", async () => {
      mockedApiService.post.mockRejectedValueOnce(
        new Error("Payment gateway timeout")
      );

      const result = await usePaymentStore
        .getState()
        .initiatePayment("job-1", "stage-1", "mobile_money", 5000);

      expect(result).toBe(false);
      expect(usePaymentStore.getState().error).toBe("Payment gateway timeout");
      expect(usePaymentStore.getState().isLoading).toBe(false);
    });
  });

  describe("Payment Retry Flow", () => {
    it("should retry a failed payment successfully", async () => {
      mockedApiService.post.mockResolvedValueOnce({});

      const result = await usePaymentStore.getState().retryPayment("txn-1");

      expect(result).toBe(true);
      expect(usePaymentStore.getState().retryAttempts["txn-1"]).toBe(1);
    });

    it("should allow up to 3 retry attempts", async () => {
      mockedApiService.post.mockResolvedValue({});

      // Attempts 1-3 should succeed
      for (let i = 1; i <= 3; i++) {
        const result = await usePaymentStore.getState().retryPayment("txn-1");
        expect(result).toBe(true);
        expect(usePaymentStore.getState().retryAttempts["txn-1"]).toBe(i);
      }

      // Attempt 4 should be blocked
      const result = await usePaymentStore.getState().retryPayment("txn-1");
      expect(result).toBe(false);
      expect(usePaymentStore.getState().error).toContain("Maximum retry attempts");
      expect(usePaymentStore.getState().retryAttempts["txn-1"]).toBe(3);
    });

    it("should count failed API retries toward the limit", async () => {
      // First retry fails at API level
      mockedApiService.post.mockRejectedValueOnce(new Error("Network error"));
      const result1 = await usePaymentStore.getState().retryPayment("txn-1");
      expect(result1).toBe(false);
      expect(usePaymentStore.getState().retryAttempts["txn-1"]).toBe(1);

      // Second retry succeeds
      mockedApiService.post.mockResolvedValueOnce({});
      const result2 = await usePaymentStore.getState().retryPayment("txn-1");
      expect(result2).toBe(true);
      expect(usePaymentStore.getState().retryAttempts["txn-1"]).toBe(2);

      // Third retry fails
      mockedApiService.post.mockRejectedValueOnce(new Error("Timeout"));
      const result3 = await usePaymentStore.getState().retryPayment("txn-1");
      expect(result3).toBe(false);
      expect(usePaymentStore.getState().retryAttempts["txn-1"]).toBe(3);

      // Fourth attempt blocked
      const result4 = await usePaymentStore.getState().retryPayment("txn-1");
      expect(result4).toBe(false);
      expect(usePaymentStore.getState().error).toContain("Maximum retry attempts");
    });

    it("should track retry attempts independently per transaction", async () => {
      mockedApiService.post.mockResolvedValue({});

      await usePaymentStore.getState().retryPayment("txn-1");
      await usePaymentStore.getState().retryPayment("txn-2");
      await usePaymentStore.getState().retryPayment("txn-1");
      await usePaymentStore.getState().retryPayment("txn-3");

      const state = usePaymentStore.getState();
      expect(state.retryAttempts["txn-1"]).toBe(2);
      expect(state.retryAttempts["txn-2"]).toBe(1);
      expect(state.retryAttempts["txn-3"]).toBe(1);
    });
  });

  describe("Transaction History", () => {
    it("should fetch paginated transaction history", async () => {
      const mockTransactions = [
        createMockTransaction({ id: "txn-1", amount: 5000 }),
        createMockTransaction({ id: "txn-2", amount: 10000, type: "debit" }),
        createMockTransaction({ id: "txn-3", amount: 3000, status: "pending" }),
      ];

      mockedApiService.get.mockResolvedValueOnce({
        transactions: mockTransactions,
        total: 45,
        page: 1,
      });

      await usePaymentStore.getState().fetchTransactions();

      const state = usePaymentStore.getState();
      expect(state.transactions).toHaveLength(3);
      expect(state.totalTransactions).toBe(45);
      expect(state.currentPage).toBe(1);
      expect(mockedApiService.get).toHaveBeenCalledWith("/payments/transactions", {
        query: {
          page: "1",
          limit: "20",
          sort: "created_at",
          order: "desc",
        },
      });
    });

    it("should navigate to specific page", async () => {
      mockedApiService.get.mockResolvedValueOnce({
        transactions: [createMockTransaction({ id: "txn-21" })],
        total: 45,
        page: 2,
      });

      await usePaymentStore.getState().fetchTransactions(2);

      const state = usePaymentStore.getState();
      expect(state.currentPage).toBe(2);
      expect(mockedApiService.get).toHaveBeenCalledWith("/payments/transactions", {
        query: expect.objectContaining({ page: "2" }),
      });
    });

    it("should handle transaction fetch failure", async () => {
      mockedApiService.get.mockRejectedValueOnce(new Error("Server error"));

      await usePaymentStore.getState().fetchTransactions();

      const state = usePaymentStore.getState();
      expect(state.error).toBe("Server error");
      expect(state.transactions).toHaveLength(0);
      expect(state.isLoading).toBe(false);
    });
  });

  describe("Full Payment Lifecycle: Initiate → Fail → Retry → Success", () => {
    it("should complete payment after initial failure and retry", async () => {
      // Step 1: Initial payment attempt fails
      mockedApiService.post.mockRejectedValueOnce(
        new Error("Insufficient funds")
      );

      const initialResult = await usePaymentStore
        .getState()
        .initiatePayment("job-1", "stage-1", "wallet", 5000);

      expect(initialResult).toBe(false);
      expect(usePaymentStore.getState().error).toBe("Insufficient funds");

      // Step 2: User clears error and retries with different method
      usePaymentStore.getState().clearError();
      expect(usePaymentStore.getState().error).toBeNull();

      // Step 3: Retry with bank transfer succeeds
      mockedApiService.post.mockResolvedValueOnce({});

      const retryResult = await usePaymentStore
        .getState()
        .initiatePayment("job-1", "stage-1", "bank_transfer", 5000);

      expect(retryResult).toBe(true);
      expect(usePaymentStore.getState().error).toBeNull();
    });

    it("should handle payment flow with virtual account fetch and payment", async () => {
      // Step 1: Fetch virtual account (mock returns VirtualAccountResponse format)
      mockedApiService.get.mockResolvedValueOnce({
        virtual_account: {
          virtual_account_number: "0123456789",
          virtual_account_name: "Adebayo Plumber",
          bank_name: "Squad Microfinance Bank",
          bank_code: "000017",
        },
      });

      await usePaymentStore.getState().fetchVirtualAccount();

      let state = usePaymentStore.getState();
      expect(state.virtualAccount).toEqual(
        expect.objectContaining({
          account_number: "0123456789",
          account_name: "Adebayo Plumber",
          bank_name: "Squad Microfinance Bank",
          bank_code: "000017",
          status: "active",
        })
      );
      expect(state.virtualAccount?.status).toBe("active");

      // Step 2: Initiate payment
      mockedApiService.post.mockResolvedValueOnce({});

      const payResult = await usePaymentStore
        .getState()
        .initiatePayment("job-1", "stage-1", "mobile_money", 7500);

      expect(payResult).toBe(true);

      // Step 3: Verify transaction appears in history
      mockedApiService.get.mockResolvedValueOnce({
        transactions: [
          createMockTransaction({
            id: "txn-new",
            amount: 7500,
            status: "completed",
            payment_method: "mobile_money",
          }),
        ],
        total: 1,
        page: 1,
      });

      await usePaymentStore.getState().fetchTransactions();

      state = usePaymentStore.getState();
      expect(state.transactions).toHaveLength(1);
      expect(state.transactions[0].amount).toBe(7500);
      expect(state.transactions[0].status).toBe("completed");
    });

    it("should handle retry flow: fail → retry(fail) → retry(fail) → retry(success)", async () => {
      // Initial payment fails — user gets a transaction ID for retry
      // Retry 1: fails
      mockedApiService.post.mockRejectedValueOnce(new Error("Gateway timeout"));
      const retry1 = await usePaymentStore.getState().retryPayment("txn-failed");
      expect(retry1).toBe(false);
      expect(usePaymentStore.getState().retryAttempts["txn-failed"]).toBe(1);

      // Retry 2: fails
      mockedApiService.post.mockRejectedValueOnce(new Error("Gateway timeout"));
      const retry2 = await usePaymentStore.getState().retryPayment("txn-failed");
      expect(retry2).toBe(false);
      expect(usePaymentStore.getState().retryAttempts["txn-failed"]).toBe(2);

      // Retry 3: succeeds
      mockedApiService.post.mockResolvedValueOnce({});
      const retry3 = await usePaymentStore.getState().retryPayment("txn-failed");
      expect(retry3).toBe(true);
      expect(usePaymentStore.getState().retryAttempts["txn-failed"]).toBe(3);

      // No more retries allowed
      const retry4 = await usePaymentStore.getState().retryPayment("txn-failed");
      expect(retry4).toBe(false);
      expect(usePaymentStore.getState().error).toContain("Maximum retry attempts");
    });

    it("should handle retry flow: all 3 retries fail", async () => {
      mockedApiService.post.mockRejectedValue(new Error("Persistent failure"));

      // All 3 retries fail
      await usePaymentStore.getState().retryPayment("txn-stuck");
      await usePaymentStore.getState().retryPayment("txn-stuck");
      await usePaymentStore.getState().retryPayment("txn-stuck");

      expect(usePaymentStore.getState().retryAttempts["txn-stuck"]).toBe(3);

      // 4th attempt is blocked without API call
      vi.clearAllMocks();
      const result = await usePaymentStore.getState().retryPayment("txn-stuck");

      expect(result).toBe(false);
      expect(mockedApiService.post).not.toHaveBeenCalled();
      expect(usePaymentStore.getState().error).toContain("Maximum retry attempts");
    });
  });
});
