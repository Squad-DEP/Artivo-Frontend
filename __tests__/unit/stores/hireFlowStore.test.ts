import { describe, it, expect, beforeEach, vi, afterEach } from "vitest";
import { useHireFlowStore } from "@/store/hireFlowStore";

// Mock getApiBaseUrl
vi.mock("@/api/api-service", () => ({
  apiService: {
    get: vi.fn(),
    post: vi.fn(),
  },
  getApiBaseUrl: () => "http://localhost:8080/api",
}));

// Mock authStore
vi.mock("@/store/authStore", () => ({
  useAuthStore: {
    getState: () => ({
      user: {
        id: "test-user-id",
        email: "test@example.com",
        access_token: "test-token-123",
      },
    }),
  },
}));

// Mock global fetch
const mockFetch = vi.fn();
global.fetch = mockFetch;

describe("hireFlowStore", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useHireFlowStore.getState().reset();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  const validJobRequestPayload = {
    job_type_id: "plumbing-123",
    title: "Fix kitchen sink",
    description: "The kitchen sink is leaking and needs repair",
    location: "Ikeja, Lagos",
    budget: 15000,
  };

  describe("createJobRequest()", () => {
    it("should transition step from idle → requesting → hiring on success", async () => {
      const responseData = {
        job_request: {
          id: "jr-001",
          status: "open",
          created_at: "2024-01-01T00:00:00Z",
        },
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => responseData,
      });

      // Initially idle
      expect(useHireFlowStore.getState().step).toBe("idle");

      const result = await useHireFlowStore
        .getState()
        .createJobRequest(validJobRequestPayload);

      expect(result).toBe(true);
      const state = useHireFlowStore.getState();
      expect(state.step).toBe("hiring");
      expect(state.jobRequest).toEqual({ id: "jr-001", status: "open" });
      expect(state.isLoading).toBe(false);
      expect(state.error).toBeNull();
    });

    it("should store jobRequest id and status from response", async () => {
      const responseData = {
        job_request: {
          id: "jr-456",
          status: "pending",
          created_at: "2024-01-01T00:00:00Z",
        },
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => responseData,
      });

      await useHireFlowStore
        .getState()
        .createJobRequest(validJobRequestPayload);

      const state = useHireFlowStore.getState();
      expect(state.jobRequest).toEqual({ id: "jr-456", status: "pending" });
    });

    it("should set validationErrors without API call when client-side validation fails (missing fields)", async () => {
      const incompletePayload = {
        job_type_id: "",
        title: "",
        description: "",
        location: "",
        budget: 0,
      };

      const result = await useHireFlowStore
        .getState()
        .createJobRequest(incompletePayload);

      expect(result).toBe(false);
      const state = useHireFlowStore.getState();
      expect(state.validationErrors).toBeDefined();
      expect(Object.keys(state.validationErrors).length).toBeGreaterThan(0);
      expect(state.error).toBe("Validation failed");
      // fetch should NOT have been called
      expect(mockFetch).not.toHaveBeenCalled();
    });

    it("should set validationErrors for individual missing fields", async () => {
      const payloadMissingTitle = {
        job_type_id: "plumbing-123",
        title: "",
        description: "Some description",
        location: "Lagos",
        budget: 5000,
      };

      const result = await useHireFlowStore
        .getState()
        .createJobRequest(payloadMissingTitle);

      expect(result).toBe(false);
      const state = useHireFlowStore.getState();
      expect(state.validationErrors.title).toBeDefined();
      expect(mockFetch).not.toHaveBeenCalled();
    });

    it("should parse field-level errors from 422 response", async () => {
      const errorResponse = {
        msg: "Validation error",
        errors: [
          { field: "title", message: "Title must be at least 5 characters" },
          { field: "budget", message: "Budget must be at least 1000" },
        ],
      };

      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 422,
        json: async () => errorResponse,
      });

      const result = await useHireFlowStore
        .getState()
        .createJobRequest(validJobRequestPayload);

      expect(result).toBe(false);
      const state = useHireFlowStore.getState();
      expect(state.validationErrors.title).toBe(
        "Title must be at least 5 characters"
      );
      expect(state.validationErrors.budget).toBe(
        "Budget must be at least 1000"
      );
      expect(state.error).toBe("Validation error");
      expect(state.step).toBe("idle");
    });

    it("should handle non-422 API errors gracefully", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 500,
        json: async () => ({ msg: "Internal server error" }),
      });

      const result = await useHireFlowStore
        .getState()
        .createJobRequest(validJobRequestPayload);

      expect(result).toBe(false);
      const state = useHireFlowStore.getState();
      expect(state.error).toBe("Internal server error");
      expect(state.step).toBe("idle");
      expect(state.isLoading).toBe(false);
    });

    it("should handle network errors", async () => {
      mockFetch.mockRejectedValueOnce(new Error("Network failure"));

      const result = await useHireFlowStore
        .getState()
        .createJobRequest(validJobRequestPayload);

      expect(result).toBe(false);
      const state = useHireFlowStore.getState();
      expect(state.error).toBe("Network failure");
      expect(state.step).toBe("idle");
      expect(state.isLoading).toBe(false);
    });

    it("should send correct payload to the API", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({
          job_request: { id: "jr-001", status: "open", created_at: "2024-01-01" },
        }),
      });

      await useHireFlowStore
        .getState()
        .createJobRequest(validJobRequestPayload);

      expect(mockFetch).toHaveBeenCalledWith(
        "http://localhost:8080/api/v1/customer/request-job",
        expect.objectContaining({
          method: "POST",
          headers: expect.objectContaining({
            "Content-Type": "application/json",
            Authorization: "Bearer test-token-123",
          }),
          body: JSON.stringify(validJobRequestPayload),
        })
      );
    });
  });

  describe("hireWorker()", () => {
    it("should transition step to 'paying' and store job on success", async () => {
      const responseData = {
        job: {
          id: "job-001",
          status: "pending",
          created_at: "2024-01-01T00:00:00Z",
        },
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => responseData,
      });

      const result = await useHireFlowStore
        .getState()
        .hireWorker("jr-001", "worker-123", 15000, "online");

      expect(result).toBe(true);
      const state = useHireFlowStore.getState();
      expect(state.step).toBe("paying");
      expect(state.job).toEqual({ id: "job-001", status: "pending" });
      expect(state.isLoading).toBe(false);
      expect(state.error).toBeNull();
    });

    it("should keep step at 'hiring' on failure", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 400,
        json: async () => ({ msg: "Worker is not available" }),
      });

      const result = await useHireFlowStore
        .getState()
        .hireWorker("jr-001", "worker-123", 15000, "online");

      expect(result).toBe(false);
      const state = useHireFlowStore.getState();
      expect(state.step).toBe("hiring");
      expect(state.error).toBe("Worker is not available");
      expect(state.job).toBeNull();
      expect(state.isLoading).toBe(false);
    });

    it("should keep step at 'hiring' on network error", async () => {
      mockFetch.mockRejectedValueOnce(new Error("Connection refused"));

      const result = await useHireFlowStore
        .getState()
        .hireWorker("jr-001", "worker-123", 15000, "online");

      expect(result).toBe(false);
      const state = useHireFlowStore.getState();
      expect(state.step).toBe("hiring");
      expect(state.error).toBe("Connection refused");
      expect(state.isLoading).toBe(false);
    });

    it("should send correct payload to the hire endpoint", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({
          job: { id: "job-001", status: "pending", created_at: "2024-01-01" },
        }),
      });

      await useHireFlowStore
        .getState()
        .hireWorker("jr-001", "worker-456", 20000, "online");

      expect(mockFetch).toHaveBeenCalledWith(
        "http://localhost:8080/api/v1/customer/hire",
        expect.objectContaining({
          method: "POST",
          body: JSON.stringify({
            job_request_id: "jr-001",
            worker_id: "worker-456",
            amount: 20000,
          }),
        })
      );
    });

    it("should not open Squad modal on hire failure", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 500,
        json: async () => ({ msg: "Server error" }),
      });

      const result = await useHireFlowStore
        .getState()
        .hireWorker("jr-001", "worker-123", 15000, "online");

      expect(result).toBe(false);
      const state = useHireFlowStore.getState();
      // Step should remain at "hiring", NOT "paying" (which would trigger Squad modal)
      expect(state.step).toBe("hiring");
      expect(state.step).not.toBe("paying");
    });
  });

  describe("verifyPayment()", () => {
    it("should transition step to 'complete' and store paymentResult on success", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({
          payment_log: {
            id: "pl-001",
            squadTransactionId: "txn-abc-123",
            amount: 1500000,
            status: "success",
            jobId: "job-001",
          },
          msg: "Payment verified",
        }),
      });

      const result = await useHireFlowStore
        .getState()
        .verifyPayment("job-001", "txn-abc-123", 15000);

      expect(result).toBe(true);
      const state = useHireFlowStore.getState();
      expect(state.step).toBe("complete");
      expect(state.paymentResult).toMatchObject({
        transactionReference: "txn-abc-123",
        amount: 15000,
        status: "success",
      });
      expect(state.isLoading).toBe(false);
      expect(state.error).toBeNull();
    });

    it("should revert step to 'paying' on failure", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 400,
        json: async () => ({ msg: "Transaction not found" }),
      });

      const result = await useHireFlowStore
        .getState()
        .verifyPayment("job-001", "txn-abc-123", 15000);

      expect(result).toBe(false);
      const state = useHireFlowStore.getState();
      expect(state.step).toBe("paying");
      expect(state.error).toBeDefined();
      expect(state.paymentResult).toBeNull();
      expect(state.isLoading).toBe(false);
    });

    it("should send correct payload to verify-payment endpoint", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({
          payment_log: { id: "pl-002", squadTransactionId: "txn-xyz", amount: 2500000, status: "success", jobId: "job-002" },
          msg: "ok",
        }),
      });

      await useHireFlowStore.getState().verifyPayment("job-002", "txn-xyz", 25000);

      expect(mockFetch).toHaveBeenCalledWith(
        "http://localhost:8080/api/v1/customer/verify-payment",
        expect.objectContaining({
          method: "POST",
          body: JSON.stringify({
            job_id: "job-002",
            transaction_reference: "txn-xyz",
          }),
        })
      );
    });
  });

  describe("reset()", () => {
    it("should clear all state back to initial values", async () => {
      // First, put the store in a non-initial state
      const responseData = {
        job_request: {
          id: "jr-001",
          status: "open",
          created_at: "2024-01-01T00:00:00Z",
        },
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => responseData,
      });

      await useHireFlowStore
        .getState()
        .createJobRequest(validJobRequestPayload);

      // Verify state is non-initial
      expect(useHireFlowStore.getState().jobRequest).not.toBeNull();
      expect(useHireFlowStore.getState().step).toBe("hiring");

      // Reset
      useHireFlowStore.getState().reset();

      const state = useHireFlowStore.getState();
      expect(state.jobRequest).toBeNull();
      expect(state.job).toBeNull();
      expect(state.paymentResult).toBeNull();
      expect(state.isLoading).toBe(false);
      expect(state.error).toBeNull();
      expect(state.validationErrors).toEqual({});
      expect(state.step).toBe("idle");
    });

    it("should clear error and validation errors", async () => {
      // Trigger a validation error
      await useHireFlowStore.getState().createJobRequest({
        job_type_id: "",
        title: "",
        description: "",
        location: "",
        budget: 0,
      });

      expect(
        Object.keys(useHireFlowStore.getState().validationErrors).length
      ).toBeGreaterThan(0);

      useHireFlowStore.getState().reset();

      const state = useHireFlowStore.getState();
      expect(state.validationErrors).toEqual({});
      expect(state.error).toBeNull();
    });
  });
});
