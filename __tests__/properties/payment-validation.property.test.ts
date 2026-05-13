import { describe, it, expect, beforeEach, vi } from "vitest";
import * as fc from "fast-check";
import { usePaymentStore } from "@/store/paymentStore";
import { nairaToKobo } from "@/lib/utils/payment";

vi.mock("@/api/api-service", () => ({
  apiService: {
    post: vi.fn(),
    get: vi.fn(),
  },
}));

import { apiService } from "@/api/api-service";

const mockedApiService = vi.mocked(apiService);

/**
 * Property 4: Naira to kobo conversion
 *
 * For any positive numeric amount, `nairaToKobo(amount)` SHALL equal
 * `Math.round(amount * 100)` and always be a positive integer.
 *
 * Feature: marketplace-integration, Property 4: Naira to kobo conversion
 * Validates: Requirements 3.2
 */
describe("Feature: marketplace-integration, Property 4: Naira to kobo conversion", () => {
  it("equals Math.round(amount * 100) for any positive amount", () => {
    fc.assert(
      fc.property(
        fc.double({ min: 0.01, max: 10_000_000, noNaN: true, noDefaultInfinity: true }),
        (amount) => {
          const result = nairaToKobo(amount);
          expect(result).toBe(Math.round(amount * 100));
        }
      ),
      { numRuns: 100 }
    );
  });

  it("always returns a positive integer for positive input", () => {
    fc.assert(
      fc.property(
        fc.double({ min: 0.01, max: 10_000_000, noNaN: true, noDefaultInfinity: true }),
        (amount) => {
          const result = nairaToKobo(amount);
          expect(result).toBeGreaterThan(0);
          expect(Number.isInteger(result)).toBe(true);
        }
      ),
      { numRuns: 100 }
    );
  });

  it("handles decimal amounts correctly (e.g., 1500.50 → 150050)", () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 1, max: 10_000_000 }),
        fc.integer({ min: 0, max: 99 }),
        (whole, decimal) => {
          const amount = whole + decimal / 100;
          const result = nairaToKobo(amount);
          expect(result).toBe(Math.round(amount * 100));
          expect(Number.isInteger(result)).toBe(true);
        }
      ),
      { numRuns: 100 }
    );
  });
});

/**
 * Property: Virtual Account Balance Consistency
 *
 * The balance displayed in the store always reflects what the API returned,
 * and is always a non-negative number after a successful fetch.
 *
 * Validates: Requirements 4.1 (virtual account dashboard)
 */
describe("Feature: virtual-account, Property: balance consistency", () => {
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

  it("stores the exact balance returned by the API", async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.integer({ min: 0, max: 10_000_000_00 }),
        async (balance) => {
          usePaymentStore.setState({ virtualAccount: null, error: null });

          mockedApiService.get.mockResolvedValueOnce({
            virtual_account: {
              account_number: "0123456789",
              account_name: "Test User",
              bank_name: "Test Bank",
              bank_code: "000",
              customer_identifier: "cust-test",
              balance,
              total_deposited: balance,
            },
          });

          await usePaymentStore.getState().fetchVirtualAccount();

          const stored = usePaymentStore.getState().virtualAccount?.balance;
          expect(stored).toBe(balance);
        }
      ),
      { numRuns: 50 }
    );
  });

  it("balance is always non-negative after a successful fetch", async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.nat(),
        async (balance) => {
          usePaymentStore.setState({ virtualAccount: null, error: null });

          mockedApiService.get.mockResolvedValueOnce({
            virtual_account: {
              account_number: "0000000000",
              account_name: "Prop User",
              bank_name: "Prop Bank",
              bank_code: "001",
              customer_identifier: "prop-cust",
              balance,
              total_deposited: balance,
            },
          });

          await usePaymentStore.getState().fetchVirtualAccount();

          const stored = usePaymentStore.getState().virtualAccount?.balance ?? -1;
          expect(stored).toBeGreaterThanOrEqual(0);
        }
      ),
      { numRuns: 50 }
    );
  });
});
