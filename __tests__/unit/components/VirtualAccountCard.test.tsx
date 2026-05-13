/**
 * @vitest-environment jsdom
 */
import React from "react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import "@testing-library/jest-dom/vitest";
import { VirtualAccountCard } from "@/components/payments/VirtualAccountCard";

// Mock the payment store
const mockFetchVirtualAccount = vi.fn();

vi.mock("@/store/paymentStore", () => ({
  usePaymentStore: vi.fn(),
}));

import { usePaymentStore } from "@/store/paymentStore";
const mockUsePaymentStore = vi.mocked(usePaymentStore);

describe("VirtualAccountCard", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockFetchVirtualAccount.mockReset();
  });

  it("shows loading state when fetching account", () => {
    mockUsePaymentStore.mockReturnValue({
      virtualAccount: null,
      isLoading: true,
      error: null,
      fetchVirtualAccount: mockFetchVirtualAccount,
    } as any);

    render(<VirtualAccountCard />);
    expect(screen.getByText("Loading account details...")).toBeInTheDocument();
  });

  it("displays virtual account details when active", () => {
    mockUsePaymentStore.mockReturnValue({
      virtualAccount: {
        account_number: "1234567890",
        bank_name: "Squad Bank",
        account_name: "John Doe",
        bank_code: "058",
        status: "active",
        created_at: "2024-01-01T00:00:00Z",
      },
      isLoading: false,
      error: null,
      fetchVirtualAccount: mockFetchVirtualAccount,
    } as any);

    render(<VirtualAccountCard />);
    expect(screen.getByText("1234567890")).toBeInTheDocument();
    expect(screen.getByText("Squad Bank")).toBeInTheDocument();
    expect(screen.getByText("John Doe")).toBeInTheDocument();
    expect(screen.getByText("058")).toBeInTheDocument();
    expect(screen.getByText("Active")).toBeInTheDocument();
  });

  it("shows pending status with informational message", () => {
    mockUsePaymentStore.mockReturnValue({
      virtualAccount: {
        account_number: "1234567890",
        bank_name: "Squad Bank",
        account_name: "John Doe",
        bank_code: "058",
        status: "pending",
        created_at: "2024-01-01T00:00:00Z",
      },
      isLoading: false,
      error: null,
      fetchVirtualAccount: mockFetchVirtualAccount,
    } as any);

    render(<VirtualAccountCard />);
    expect(screen.getByText("Pending")).toBeInTheDocument();
    expect(
      screen.getByText(
        "Your account is being set up. This usually takes less than 30 seconds."
      )
    ).toBeInTheDocument();
  });

  it("shows error banner when virtual account creation fails", () => {
    mockUsePaymentStore.mockReturnValue({
      virtualAccount: null,
      isLoading: false,
      error: "Squad API unavailable",
      fetchVirtualAccount: mockFetchVirtualAccount,
    } as any);

    render(<VirtualAccountCard />);
    expect(
      screen.getByText("Virtual Account Creation Failed")
    ).toBeInTheDocument();
    expect(screen.getByText("Squad API unavailable")).toBeInTheDocument();
    expect(
      screen.getByText("Auto-retrying in the background")
    ).toBeInTheDocument();
    expect(screen.getByText("Retry Now")).toBeInTheDocument();
  });

  it("shows error banner when account status is failed", () => {
    mockUsePaymentStore.mockReturnValue({
      virtualAccount: {
        account_number: "",
        bank_name: "",
        account_name: "",
        bank_code: "",
        status: "failed",
        created_at: "2024-01-01T00:00:00Z",
      },
      isLoading: false,
      error: "Account creation timed out",
      fetchVirtualAccount: mockFetchVirtualAccount,
    } as any);

    render(<VirtualAccountCard />);
    expect(
      screen.getByText("Virtual Account Creation Failed")
    ).toBeInTheDocument();
    expect(
      screen.getByText("Account creation timed out")
    ).toBeInTheDocument();
    expect(
      screen.getByText("Auto-retrying in the background")
    ).toBeInTheDocument();
  });

  it("calls fetchVirtualAccount on mount", () => {
    mockUsePaymentStore.mockReturnValue({
      virtualAccount: null,
      isLoading: true,
      error: null,
      fetchVirtualAccount: mockFetchVirtualAccount,
    } as any);

    render(<VirtualAccountCard />);
    expect(mockFetchVirtualAccount).toHaveBeenCalledTimes(1);
  });

  it("renders copy button for account number", () => {
    mockUsePaymentStore.mockReturnValue({
      virtualAccount: {
        account_number: "1234567890",
        bank_name: "Squad Bank",
        account_name: "John Doe",
        bank_code: "058",
        status: "active",
        created_at: "2024-01-01T00:00:00Z",
      },
      isLoading: false,
      error: null,
      fetchVirtualAccount: mockFetchVirtualAccount,
    } as any);

    render(<VirtualAccountCard />);
    expect(
      screen.getByRole("button", { name: "Copy account number" })
    ).toBeInTheDocument();
  });

  it("renders nothing when no account and no error", () => {
    mockUsePaymentStore.mockReturnValue({
      virtualAccount: null,
      isLoading: false,
      error: null,
      fetchVirtualAccount: mockFetchVirtualAccount,
    } as any);

    const { container } = render(<VirtualAccountCard />);
    expect(container.firstChild).toBeNull();
  });
});
