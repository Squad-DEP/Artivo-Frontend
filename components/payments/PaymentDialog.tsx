"use client";

import * as React from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { PaymentMethodSelector } from "@/components/payments/PaymentMethodSelector";
import { usePaymentStore, type PaymentMethod } from "@/store/paymentStore";
import { validatePaymentAmount } from "@/lib/validators";
import { cn } from "@/lib/utils";

interface PaymentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  jobId: string;
  stageId: string;
  stageName?: string;
  /** Pre-filled amount for the stage payment */
  defaultAmount?: number;
  onSuccess?: () => void;
}

const MAX_ATTEMPTS = 3;

export function PaymentDialog({
  open,
  onOpenChange,
  jobId,
  stageId,
  stageName,
  defaultAmount,
  onSuccess,
}: PaymentDialogProps) {
  const [amount, setAmount] = React.useState<string>(
    defaultAmount?.toString() ?? ""
  );
  const [selectedMethod, setSelectedMethod] =
    React.useState<PaymentMethod | null>(null);
  const [validationError, setValidationError] = React.useState<string | null>(
    null
  );
  const [attempts, setAttempts] = React.useState(0);
  const [lastError, setLastError] = React.useState<string | null>(null);

  const { initiatePayment, isLoading, error, clearError } = usePaymentStore();

  // Reset state when dialog opens
  React.useEffect(() => {
    if (open) {
      setAmount(defaultAmount?.toString() ?? "");
      setSelectedMethod(null);
      setValidationError(null);
      setAttempts(0);
      setLastError(null);
      clearError();
    }
  }, [open, defaultAmount, clearError]);

  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setAmount(value);
    // Clear validation error on input change
    if (validationError) {
      setValidationError(null);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validate amount
    const numericAmount = parseFloat(amount);
    const validation = validatePaymentAmount(numericAmount);
    if (!validation.valid) {
      setValidationError(validation.error ?? "Invalid amount");
      return;
    }

    // Validate payment method selection
    if (!selectedMethod) {
      setValidationError("Please select a payment method");
      return;
    }

    setValidationError(null);
    setLastError(null);

    const success = await initiatePayment(
      jobId,
      stageId,
      selectedMethod,
      numericAmount
    );

    if (success) {
      onSuccess?.();
      onOpenChange(false);
    } else {
      // Payment failed — increment attempts
      setAttempts((prev) => prev + 1);
      setLastError(
        error ?? "Payment failed. Please try again."
      );
    }
  };

  const handleRetry = async () => {
    if (attempts >= MAX_ATTEMPTS) return;

    setLastError(null);
    clearError();

    const numericAmount = parseFloat(amount);
    const success = await initiatePayment(
      jobId,
      stageId,
      selectedMethod!,
      numericAmount
    );

    if (success) {
      onSuccess?.();
      onOpenChange(false);
    } else {
      setAttempts((prev) => prev + 1);
      setLastError(
        error ?? "Payment failed. Please try again."
      );
    }
  };

  const retriesExhausted = attempts >= MAX_ATTEMPTS;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Initiate Payment</DialogTitle>
          <DialogDescription>
            {stageName
              ? `Pay for stage: ${stageName}`
              : "Complete payment for this job stage"}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Amount Input */}
          <div className="space-y-2">
            <label
              htmlFor="payment-amount"
              className="text-sm font-medium text-foreground"
            >
              Amount (NGN)
            </label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
                ₦
              </span>
              <input
                id="payment-amount"
                type="number"
                min="100"
                max="10000000"
                step="0.01"
                value={amount}
                onChange={handleAmountChange}
                placeholder="Enter amount (100 – 10,000,000)"
                disabled={isLoading || retriesExhausted}
                className={cn(
                  "flex h-9 w-full rounded-md border bg-transparent pl-7 pr-3 py-1 text-sm shadow-xs transition-colors",
                  "placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring",
                  "disabled:cursor-not-allowed disabled:opacity-50",
                  validationError
                    ? "border-destructive focus-visible:ring-destructive"
                    : "border-input"
                )}
                aria-invalid={!!validationError}
                aria-describedby={
                  validationError ? "amount-error" : undefined
                }
              />
            </div>
            {validationError && (
              <p
                id="amount-error"
                className="text-xs text-destructive"
                role="alert"
              >
                {validationError}
              </p>
            )}
            <p className="text-xs text-muted-foreground">
              Min: ₦100 · Max: ₦10,000,000
            </p>
          </div>

          {/* Payment Method Selector */}
          <PaymentMethodSelector
            value={selectedMethod}
            onChange={setSelectedMethod}
            disabled={isLoading || retriesExhausted}
          />

          {/* Error Display */}
          {lastError && (
            <div
              className="rounded-md border border-destructive/50 bg-destructive/10 p-3"
              role="alert"
            >
              <div className="flex items-start gap-2">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="size-4 mt-0.5 text-destructive shrink-0"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <circle cx="12" cy="12" r="10" />
                  <line x1="12" y1="8" x2="12" y2="12" />
                  <line x1="12" y1="16" x2="12.01" y2="16" />
                </svg>
                <div className="flex-1">
                  <p className="text-sm text-destructive font-medium">
                    Payment Failed
                  </p>
                  <p className="text-xs text-destructive/80 mt-0.5">
                    {lastError}
                  </p>
                  {!retriesExhausted && (
                    <p className="text-xs text-muted-foreground mt-1">
                      Attempt {attempts} of {MAX_ATTEMPTS}
                    </p>
                  )}
                  {retriesExhausted && (
                    <p className="text-xs text-destructive mt-1 font-medium">
                      Maximum retry attempts reached. Please try again later.
                    </p>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Footer Actions */}
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isLoading}
            >
              Cancel
            </Button>

            {lastError && !retriesExhausted ? (
              <Button
                type="button"
                onClick={handleRetry}
                disabled={isLoading || retriesExhausted}
              >
                {isLoading ? (
                  <>
                    <svg
                      className="size-4 animate-spin"
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                    >
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                      />
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                      />
                    </svg>
                    Retrying...
                  </>
                ) : (
                  "Retry Payment"
                )}
              </Button>
            ) : (
              <Button
                type="submit"
                disabled={isLoading || retriesExhausted}
              >
                {isLoading ? (
                  <>
                    <svg
                      className="size-4 animate-spin"
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                    >
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                      />
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                      />
                    </svg>
                    Processing...
                  </>
                ) : (
                  "Pay Now"
                )}
              </Button>
            )}
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
