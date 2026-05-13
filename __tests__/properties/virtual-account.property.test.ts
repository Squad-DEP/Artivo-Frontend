// Feature: marketplace-integration, Property 11: Virtual account display completeness

/**
 * @vitest-environment jsdom
 */
import React from "react";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, cleanup } from "@testing-library/react";
import "@testing-library/jest-dom/vitest";
import * as fc from "fast-check";
import { VirtualAccountCard } from "@/components/payments/VirtualAccountCard";

/**
 * Property 11: Virtual account display completeness
 *
 * For any valid VirtualAccountResponse object, the rendered VirtualAccountCard
 * SHALL display all four fields: virtual_account_number, virtual_account_name,
 * bank_name, and bank_code.
 *
 * Validates: Requirements 11.2
 */

// Mock the payment store
const mockFetchVirtualAccount = vi.fn();

vi.mock("@/store/paymentStore", () => ({
  usePaymentStore: vi.fn(),
}));

import { usePaymentStore } from "@/store/paymentStore";
const mockUsePaymentStore = vi.mocked(usePaymentStore);

describe("Feature: marketplace-integration, Property 11: Virtual account display completeness", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockFetchVirtualAccount.mockReset();
  });

  afterEach(() => {
    cleanup();
  });

  // Generator for valid virtual account data ensuring all four fields are unique
  // to avoid ambiguity with getByText queries
  const virtualAccountArb = fc
    .record({
      account_number: fc.stringMatching(/^[0-9]{10}$/),
      account_name: fc.string({ minLength: 3, maxLength: 80 }).filter(s => /[a-zA-Z]/.test(s)),
      bank_name: fc.string({ minLength: 3, maxLength: 50 }).filter(s => /[a-zA-Z]/.test(s)),
      bank_code: fc.stringMatching(/^[0-9]{3}$/),
    })
    .filter(
      (a) =>
        // Ensure all four values are distinct so getByText is unambiguous
        new Set([a.account_number, a.account_name, a.bank_name, a.bank_code]).size === 4
    );

  it("displays all four virtual account fields for any valid account data", () => {
    fc.assert(
      fc.property(virtualAccountArb, (account) => {
        mockUsePaymentStore.mockReturnValue({
          virtualAccount: {
            account_number: account.account_number,
            account_name: account.account_name,
            bank_name: account.bank_name,
            bank_code: account.bank_code,
            status: "active" as const,
            created_at: "2024-01-01T00:00:00Z",
          },
          isLoading: false,
          error: null,
          fetchVirtualAccount: mockFetchVirtualAccount,
        } as any);

        const { container, unmount } = render(React.createElement(VirtualAccountCard));

        // Verify all four fields are present in the rendered output
        const textContent = container.textContent || "";
        expect(textContent).toContain(account.account_number);
        expect(textContent).toContain(account.account_name);
        expect(textContent).toContain(account.bank_name);
        expect(textContent).toContain(account.bank_code);

        unmount();
      }),
      { numRuns: 100 }
    );
  });
});
