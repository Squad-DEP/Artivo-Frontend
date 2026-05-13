/**
 * @vitest-environment jsdom
 */
import React from "react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import "@testing-library/jest-dom/vitest";
import { TransactionList } from "@/components/payments/TransactionList";

// Mock the payment store
const mockFetchTransactions = vi.fn();

vi.mock("@/store/paymentStore", () => ({
  usePaymentStore: vi.fn(),
}));

import { usePaymentStore } from "@/store/paymentStore";
const mockUsePaymentStore = vi.mocked(usePaymentStore);

const mockTransactions = [
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
  {
    id: "txn-2",
    type: "debit" as const,
    amount: 2500,
    currency: "NGN",
    status: "pending" as const,
    payment_method: "bank_transfer" as const,
    counterparty_name: "John Smith",
    created_at: "2024-01-14T08:00:00Z",
  },
  {
    id: "txn-3",
    type: "debit" as const,
    amount: 1000,
    currency: "NGN",
    status: "failed" as const,
    payment_method: "wallet" as const,
    counterparty_name: "Bob Builder",
    created_at: "2024-01-13T12:00:00Z",
  },
];

describe("TransactionList (Requirement 5.5)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("Rendering", () => {
    it("displays transactions with status, amount, date, counterparty, and payment method", () => {
      mockUsePaymentStore.mockReturnValue({
        transactions: mockTransactions,
        totalTransactions: 3,
        currentPage: 1,
        isLoading: false,
        error: null,
        fetchTransactions: mockFetchTransactions,
      } as any);

      render(<TransactionList />);

      // Status badges
      expect(screen.getByText("Completed")).toBeInTheDocument();
      expect(screen.getByText("Pending")).toBeInTheDocument();
      expect(screen.getByText("Failed")).toBeInTheDocument();

      // Counterparty names
      expect(screen.getByText("Jane Doe")).toBeInTheDocument();
      expect(screen.getByText("John Smith")).toBeInTheDocument();
      expect(screen.getByText("Bob Builder")).toBeInTheDocument();

      // Payment methods
      expect(screen.getByText("Mobile Money")).toBeInTheDocument();
      expect(screen.getByText("Bank Transfer")).toBeInTheDocument();
      expect(screen.getByText("Wallet")).toBeInTheDocument();
    });

    it("shows loading skeleton when fetching with no existing data", () => {
      mockUsePaymentStore.mockReturnValue({
        transactions: [],
        totalTransactions: 0,
        currentPage: 1,
        isLoading: true,
        error: null,
        fetchTransactions: mockFetchTransactions,
      } as any);

      const { container } = render(<TransactionList />);
      const skeletons = container.querySelectorAll(".animate-pulse");
      expect(skeletons.length).toBeGreaterThan(0);
    });

    it("shows empty state when no transactions exist", () => {
      mockUsePaymentStore.mockReturnValue({
        transactions: [],
        totalTransactions: 0,
        currentPage: 1,
        isLoading: false,
        error: null,
        fetchTransactions: mockFetchTransactions,
      } as any);

      render(<TransactionList />);
      expect(screen.getByText("No transactions yet.")).toBeInTheDocument();
    });

    it("shows error state with retry button", () => {
      mockUsePaymentStore.mockReturnValue({
        transactions: [],
        totalTransactions: 0,
        currentPage: 1,
        isLoading: false,
        error: "Failed to fetch transactions",
        fetchTransactions: mockFetchTransactions,
      } as any);

      render(<TransactionList />);
      expect(
        screen.getByText("Failed to fetch transactions")
      ).toBeInTheDocument();
      expect(screen.getByText("Retry")).toBeInTheDocument();
    });

    it("calls fetchTransactions on mount", () => {
      mockUsePaymentStore.mockReturnValue({
        transactions: [],
        totalTransactions: 0,
        currentPage: 1,
        isLoading: true,
        error: null,
        fetchTransactions: mockFetchTransactions,
      } as any);

      render(<TransactionList />);
      expect(mockFetchTransactions).toHaveBeenCalledWith(1);
    });
  });

  describe("Pagination (Requirement 5.5)", () => {
    it("shows pagination controls when total exceeds page size (20)", () => {
      mockUsePaymentStore.mockReturnValue({
        transactions: mockTransactions,
        totalTransactions: 45,
        currentPage: 1,
        isLoading: false,
        error: null,
        fetchTransactions: mockFetchTransactions,
      } as any);

      render(<TransactionList />);

      expect(screen.getByText("Previous")).toBeInTheDocument();
      expect(screen.getByText("Next")).toBeInTheDocument();
      expect(screen.getByText("Page 1 of 3")).toBeInTheDocument();
    });

    it("does not show pagination when total is within one page", () => {
      mockUsePaymentStore.mockReturnValue({
        transactions: mockTransactions,
        totalTransactions: 3,
        currentPage: 1,
        isLoading: false,
        error: null,
        fetchTransactions: mockFetchTransactions,
      } as any);

      render(<TransactionList />);

      expect(screen.queryByText("Previous")).not.toBeInTheDocument();
      expect(screen.queryByText("Next")).not.toBeInTheDocument();
    });

    it("disables Previous button on first page", () => {
      mockUsePaymentStore.mockReturnValue({
        transactions: mockTransactions,
        totalTransactions: 45,
        currentPage: 1,
        isLoading: false,
        error: null,
        fetchTransactions: mockFetchTransactions,
      } as any);

      render(<TransactionList />);

      const prevButton = screen.getByText("Previous");
      expect(prevButton).toBeDisabled();
    });

    it("disables Next button on last page", () => {
      mockUsePaymentStore.mockReturnValue({
        transactions: mockTransactions,
        totalTransactions: 45,
        currentPage: 3,
        isLoading: false,
        error: null,
        fetchTransactions: mockFetchTransactions,
      } as any);

      render(<TransactionList />);

      const nextButton = screen.getByText("Next");
      expect(nextButton).toBeDisabled();
    });

    it("calls fetchTransactions with next page when Next is clicked", () => {
      mockUsePaymentStore.mockReturnValue({
        transactions: mockTransactions,
        totalTransactions: 45,
        currentPage: 1,
        isLoading: false,
        error: null,
        fetchTransactions: mockFetchTransactions,
      } as any);

      render(<TransactionList />);

      // Clear the initial mount call
      mockFetchTransactions.mockClear();

      fireEvent.click(screen.getByText("Next"));
      expect(mockFetchTransactions).toHaveBeenCalledWith(2);
    });

    it("calls fetchTransactions with previous page when Previous is clicked", () => {
      mockUsePaymentStore.mockReturnValue({
        transactions: mockTransactions,
        totalTransactions: 45,
        currentPage: 2,
        isLoading: false,
        error: null,
        fetchTransactions: mockFetchTransactions,
      } as any);

      render(<TransactionList />);

      // Clear the initial mount call
      mockFetchTransactions.mockClear();

      fireEvent.click(screen.getByText("Previous"));
      expect(mockFetchTransactions).toHaveBeenCalledWith(1);
    });

    it("shows correct range text for current page", () => {
      mockUsePaymentStore.mockReturnValue({
        transactions: mockTransactions,
        totalTransactions: 45,
        currentPage: 2,
        isLoading: false,
        error: null,
        fetchTransactions: mockFetchTransactions,
      } as any);

      render(<TransactionList />);

      expect(
        screen.getByText("Showing 21–40 of 45 transactions")
      ).toBeInTheDocument();
    });

    it("shows correct range text for last page with partial results", () => {
      mockUsePaymentStore.mockReturnValue({
        transactions: mockTransactions,
        totalTransactions: 45,
        currentPage: 3,
        isLoading: false,
        error: null,
        fetchTransactions: mockFetchTransactions,
      } as any);

      render(<TransactionList />);

      expect(
        screen.getByText("Showing 41–45 of 45 transactions")
      ).toBeInTheDocument();
    });

    it("disables pagination buttons while loading", () => {
      mockUsePaymentStore.mockReturnValue({
        transactions: mockTransactions,
        totalTransactions: 45,
        currentPage: 2,
        isLoading: true,
        error: null,
        fetchTransactions: mockFetchTransactions,
      } as any);

      render(<TransactionList />);

      expect(screen.getByText("Previous")).toBeDisabled();
      expect(screen.getByText("Next")).toBeDisabled();
    });
  });

  describe("Error Handling", () => {
    it("retries fetching on retry button click", () => {
      mockUsePaymentStore.mockReturnValue({
        transactions: [],
        totalTransactions: 0,
        currentPage: 2,
        isLoading: false,
        error: "Network error",
        fetchTransactions: mockFetchTransactions,
      } as any);

      render(<TransactionList />);

      // Clear the initial mount call
      mockFetchTransactions.mockClear();

      fireEvent.click(screen.getByText("Retry"));
      expect(mockFetchTransactions).toHaveBeenCalledWith(2);
    });
  });
});
