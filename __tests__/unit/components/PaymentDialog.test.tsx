/**
 * @vitest-environment jsdom
 */
import React from "react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor, act } from "@testing-library/react";
import "@testing-library/jest-dom/vitest";
import { PaymentDialog } from "@/components/payments/PaymentDialog";

// Mock the payment store
const mockInitiatePayment = vi.fn();
const mockClearError = vi.fn();

vi.mock("@/store/paymentStore", () => ({
  usePaymentStore: vi.fn(),
}));

import { usePaymentStore } from "@/store/paymentStore";
const mockUsePaymentStore = vi.mocked(usePaymentStore);

describe("PaymentDialog", () => {
  const defaultProps = {
    open: true,
    onOpenChange: vi.fn(),
    jobId: "job-1",
    stageId: "stage-1",
    stageName: "Design Phase",
    defaultAmount: 5000,
    onSuccess: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
    mockUsePaymentStore.mockReturnValue({
      initiatePayment: mockInitiatePayment,
      isLoading: false,
      error: null,
      clearError: mockClearError,
    } as any);
  });

  describe("Amount Validation (Requirement 5.3)", () => {
    it("shows validation error for amount below 100 NGN", async () => {
      render(<PaymentDialog {...defaultProps} defaultAmount={50} />);

      // Select a payment method
      fireEvent.click(screen.getByText("Mobile Money"));

      // Submit the form via the form element
      const form = screen.getByRole("dialog").querySelector("form")!;
      fireEvent.submit(form);

      await waitFor(() => {
        expect(
          screen.getByText("Payment amount must be at least 100 NGN")
        ).toBeInTheDocument();
      });
      expect(mockInitiatePayment).not.toHaveBeenCalled();
    });

    it("shows validation error for amount above 10,000,000 NGN", async () => {
      render(<PaymentDialog {...defaultProps} defaultAmount={10_000_001} />);

      // Select a payment method
      fireEvent.click(screen.getByText("Bank Transfer"));

      // Submit the form via the form element
      const form = screen.getByRole("dialog").querySelector("form")!;
      fireEvent.submit(form);

      await waitFor(() => {
        expect(
          screen.getByText("Payment amount must be at most 10,000,000 NGN")
        ).toBeInTheDocument();
      });
      expect(mockInitiatePayment).not.toHaveBeenCalled();
    });

    it("shows validation error for empty amount", async () => {
      render(<PaymentDialog {...defaultProps} defaultAmount={undefined} />);

      // Select a payment method
      fireEvent.click(screen.getByText("Platform Wallet"));

      // Submit the form without entering amount
      const form = screen.getByRole("dialog").querySelector("form")!;
      fireEvent.submit(form);

      await waitFor(() => {
        expect(screen.getByRole("alert")).toBeInTheDocument();
      });
      expect(mockInitiatePayment).not.toHaveBeenCalled();
    });

    it("shows validation error when no payment method is selected", async () => {
      render(<PaymentDialog {...defaultProps} />);

      // Submit without selecting a payment method
      const form = screen.getByRole("dialog").querySelector("form")!;
      fireEvent.submit(form);

      await waitFor(() => {
        expect(
          screen.getByText("Please select a payment method")
        ).toBeInTheDocument();
      });
      expect(mockInitiatePayment).not.toHaveBeenCalled();
    });

    it("accepts valid amount at minimum boundary (100 NGN)", async () => {
      mockInitiatePayment.mockResolvedValueOnce(true);

      render(<PaymentDialog {...defaultProps} defaultAmount={100} />);

      // Select a payment method
      fireEvent.click(screen.getByText("Mobile Money"));

      // Submit the form
      const form = screen.getByRole("dialog").querySelector("form")!;
      fireEvent.submit(form);

      await waitFor(() => {
        expect(mockInitiatePayment).toHaveBeenCalledWith(
          "job-1",
          "stage-1",
          "mobile_money",
          100
        );
      });
    });

    it("accepts valid amount at maximum boundary (10,000,000 NGN)", async () => {
      mockInitiatePayment.mockResolvedValueOnce(true);

      render(<PaymentDialog {...defaultProps} defaultAmount={10_000_000} />);

      // Select a payment method
      fireEvent.click(screen.getByText("Bank Transfer"));

      // Submit the form
      const form = screen.getByRole("dialog").querySelector("form")!;
      fireEvent.submit(form);

      await waitFor(() => {
        expect(mockInitiatePayment).toHaveBeenCalledWith(
          "job-1",
          "stage-1",
          "bank_transfer",
          10_000_000
        );
      });
    });

    it("clears validation error when dialog is reopened", async () => {
      const { rerender } = render(<PaymentDialog {...defaultProps} defaultAmount={50} />);

      fireEvent.click(screen.getByText("Mobile Money"));

      const form = screen.getByRole("dialog").querySelector("form")!;
      fireEvent.submit(form);

      await waitFor(() => {
        expect(
          screen.getByText("Payment amount must be at least 100 NGN")
        ).toBeInTheDocument();
      });

      // Close and reopen the dialog — state should reset
      rerender(<PaymentDialog {...defaultProps} defaultAmount={50} open={false} />);
      rerender(<PaymentDialog {...defaultProps} defaultAmount={500} open={true} />);

      expect(
        screen.queryByText("Payment amount must be at least 100 NGN")
      ).not.toBeInTheDocument();
    });
  });

  describe("Retry Limit Enforcement (Requirement 5.6)", () => {
    it("shows retry button after first payment failure", async () => {
      mockInitiatePayment.mockResolvedValueOnce(false);
      mockUsePaymentStore.mockReturnValue({
        initiatePayment: mockInitiatePayment,
        isLoading: false,
        error: "Payment gateway timeout",
        clearError: mockClearError,
      } as any);

      render(<PaymentDialog {...defaultProps} />);

      fireEvent.click(screen.getByText("Mobile Money"));

      const form = screen.getByRole("dialog").querySelector("form")!;
      fireEvent.submit(form);

      await waitFor(() => {
        expect(screen.getByText("Payment Failed")).toBeInTheDocument();
      });
      expect(screen.getByText("Retry Payment")).toBeInTheDocument();
      expect(screen.getByText("Attempt 1 of 3")).toBeInTheDocument();
    });

    it("disables retry after 3 failed attempts", async () => {
      let attemptCount = 0;
      mockInitiatePayment.mockImplementation(async () => {
        attemptCount++;
        return false;
      });

      mockUsePaymentStore.mockReturnValue({
        initiatePayment: mockInitiatePayment,
        isLoading: false,
        error: "Payment failed",
        clearError: mockClearError,
      } as any);

      render(<PaymentDialog {...defaultProps} />);

      // Select payment method
      fireEvent.click(screen.getByText("Mobile Money"));

      // First attempt (submit)
      const form = screen.getByRole("dialog").querySelector("form")!;
      fireEvent.submit(form);
      await waitFor(() => {
        expect(screen.getByText("Payment Failed")).toBeInTheDocument();
      });

      // Second attempt (retry)
      fireEvent.click(screen.getByText("Retry Payment"));
      await waitFor(() => {
        expect(screen.getByText("Attempt 2 of 3")).toBeInTheDocument();
      });

      // Third attempt (retry)
      fireEvent.click(screen.getByText("Retry Payment"));
      await waitFor(() => {
        expect(
          screen.getByText(
            "Maximum retry attempts reached. Please try again later."
          )
        ).toBeInTheDocument();
      });
    });

    it("calls onSuccess and closes dialog on successful payment", async () => {
      mockInitiatePayment.mockResolvedValueOnce(true);

      render(<PaymentDialog {...defaultProps} />);

      fireEvent.click(screen.getByText("Mobile Money"));

      const form = screen.getByRole("dialog").querySelector("form")!;
      fireEvent.submit(form);

      await waitFor(() => {
        expect(defaultProps.onSuccess).toHaveBeenCalled();
        expect(defaultProps.onOpenChange).toHaveBeenCalledWith(false);
      });
    });
  });

  describe("Dialog Behavior", () => {
    it("renders stage name in description", () => {
      render(<PaymentDialog {...defaultProps} />);
      expect(
        screen.getByText("Pay for stage: Design Phase")
      ).toBeInTheDocument();
    });

    it("renders default description when no stage name", () => {
      render(<PaymentDialog {...defaultProps} stageName={undefined} />);
      expect(
        screen.getByText("Complete payment for this job stage")
      ).toBeInTheDocument();
    });

    it("pre-fills amount from defaultAmount prop", () => {
      render(<PaymentDialog {...defaultProps} defaultAmount={7500} />);
      const input = screen.getByLabelText("Amount (NGN)") as HTMLInputElement;
      expect(input.value).toBe("7500");
    });

    it("disables inputs when loading", () => {
      mockUsePaymentStore.mockReturnValue({
        initiatePayment: mockInitiatePayment,
        isLoading: true,
        error: null,
        clearError: mockClearError,
      } as any);

      render(<PaymentDialog {...defaultProps} />);

      const input = screen.getByLabelText("Amount (NGN)");
      expect(input).toBeDisabled();
    });
  });
});
