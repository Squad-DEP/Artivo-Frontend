"use client";

import { useState, useEffect } from "react";
import { Loader2, CreditCard, Wallet, CheckCircle2, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useHireFlowStore } from "@/store/hireFlowStore";
import { useAuthStore } from "@/store/authStore";
import type { PaymentMethod } from "@/store/hireFlowStore";

interface HirePaymentDialogProps {
  isOpen: boolean;
  onClose: (didSucceed?: boolean) => void;
  proposal: {
    id: string;
    worker_id: string;
    worker_name: string;
    proposed_amount: number;
    proposed_amount_max: number | null;
  };
  jobRequestId: string;
}

export function HirePaymentDialog({
  isOpen,
  onClose,
  proposal,
  jobRequestId,
}: HirePaymentDialogProps) {
  const { user } = useAuthStore();
  const {
    hireWorker,
    openSquadModal,
    isLoading,
    error,
    step,
    job,
    paymentResult,
    reset,
  } = useHireFlowStore();

  const [selectedMethod, setSelectedMethod] = useState<PaymentMethod>("online");

  useEffect(() => {
    if (step === "complete") {
      const timer = setTimeout(() => {
        onClose(true); // signal success so parent can refresh
        reset();
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [step, onClose, reset]);

  useEffect(() => {
    // When job is created and payment method is online, open Squad modal
    if (step === "paying" && job && selectedMethod === "online") {
      const payAmount = proposal.proposed_amount_max && Number(proposal.proposed_amount_max) > Number(proposal.proposed_amount)
        ? proposal.proposed_amount_max
        : proposal.proposed_amount;
      openSquadModal(
        user?.email || "",
        payAmount,
        job.id
      );
    }
  }, [step, job, selectedMethod, openSquadModal, user?.email, proposal.proposed_amount, proposal.proposed_amount_max]);

  const handleHire = async () => {
    const success = await hireWorker(
      jobRequestId,
      proposal.worker_id,
      proposal.proposed_amount,
      selectedMethod
    );

    if (success && selectedMethod === "offline") {
      setTimeout(() => {
        onClose(true);
        reset();
      }, 1500);
    }
  };

  if (!isOpen) return null;

  // Success state
  if (step === "complete") {
    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-2xl p-6 max-w-md w-full space-y-4">
          <div className="flex flex-col items-center text-center space-y-3">
            <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center">
              <CheckCircle2 className="w-8 h-8 text-green-600" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900">
                {selectedMethod === "online" ? "Payment Successful!" : "Worker Hired!"}
              </h3>
              <p className="text-sm text-gray-600 mt-1">
                {selectedMethod === "online"
                  ? "Your payment has been secured in escrow. The job is now active."
                  : "The job has started. Payment will be handled offline."}
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Verifying payment state
  if (step === "verifying" || step === "checking") {
    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-2xl p-6 max-w-md w-full space-y-4">
          <div className="flex flex-col items-center text-center space-y-3">
            <Loader2 className="w-12 h-12 animate-spin text-[var(--orange)]" />
            <div>
              <h3 className="text-lg font-semibold text-gray-900">
                {step === "checking" ? "Waiting for Payment" : "Verifying Payment"}
              </h3>
              <p className="text-sm text-gray-600 mt-1">
                {step === "checking"
                  ? "Checking if your payment went through. This can take up to a minute…"
                  : "Please wait while we confirm your payment…"}
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl p-6 max-w-md w-full space-y-6">
        {/* Header */}
        <div>
          <h3 className="text-lg font-semibold text-gray-900">Hire {proposal.worker_name}</h3>
          <p className="text-sm text-gray-600 mt-1">
            Choose how you'd like to pay for this job
          </p>
        </div>

        {/* Amount */}
        <div className="bg-gray-50 rounded-xl p-4 text-center">
          <p className="text-sm text-gray-600">Job Amount</p>
          <p className="text-2xl font-bold text-gray-900 mt-1">
            ₦{Number(proposal.proposed_amount).toLocaleString("en-NG")}
            {proposal.proposed_amount_max && Number(proposal.proposed_amount_max) > Number(proposal.proposed_amount)
              ? ` – ₦${Number(proposal.proposed_amount_max).toLocaleString("en-NG")}`
              : ""}
          </p>
        </div>

        {/* Payment Method Selection */}
        <div className="space-y-3">
          <label className="text-sm font-medium text-gray-700">Payment Method</label>
          
          {/* Online Payment */}
          <button
            onClick={() => setSelectedMethod("online")}
            disabled={isLoading}
            className={`w-full p-4 rounded-xl border-2 transition-all text-left ${
              selectedMethod === "online"
                ? "border-[var(--orange)] bg-[var(--orange)]/5"
                : "border-gray-200 hover:border-gray-300"
            }`}
          >
            <div className="flex items-start gap-3">
              <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center mt-0.5 ${
                selectedMethod === "online"
                  ? "border-[var(--orange)]"
                  : "border-gray-300"
              }`}>
                {selectedMethod === "online" && (
                  <div className="w-3 h-3 rounded-full bg-[var(--orange)]" />
                )}
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <CreditCard className="w-5 h-5 text-gray-700" />
                  <span className="font-medium text-gray-900">Pay Online (Secure Escrow)</span>
                </div>
                <p className="text-xs text-gray-600 mt-1">
                  Pay now via card, bank transfer, or USSD. Money is held securely in escrow until job completion.
                </p>
              </div>
            </div>
          </button>

          {/* Offline Payment */}
          <button
            onClick={() => setSelectedMethod("offline")}
            disabled={isLoading}
            className={`w-full p-4 rounded-xl border-2 transition-all text-left ${
              selectedMethod === "offline"
                ? "border-[var(--orange)] bg-[var(--orange)]/5"
                : "border-gray-200 hover:border-gray-300"
            }`}
          >
            <div className="flex items-start gap-3">
              <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center mt-0.5 ${
                selectedMethod === "offline"
                  ? "border-[var(--orange)]"
                  : "border-gray-300"
              }`}>
                {selectedMethod === "offline" && (
                  <div className="w-3 h-3 rounded-full bg-[var(--orange)]" />
                )}
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <Wallet className="w-5 h-5 text-gray-700" />
                  <span className="font-medium text-gray-900">Pay Offline (Cash)</span>
                </div>
                <p className="text-xs text-gray-600 mt-1">
                  Arrange payment directly with the artisan. Job starts immediately.
                </p>
              </div>
            </div>
          </button>
        </div>

        {/* Error Message */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-3 flex items-start gap-2">
            <AlertCircle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
            <p className="text-sm text-red-700">{error}</p>
          </div>
        )}

        {/* Info Box for Online Payment */}
        {selectedMethod === "online" && (
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-3">
            <p className="text-xs text-blue-700">
              <strong>Secure Escrow:</strong> Your payment is held by Squad (CBN-licensed) until you confirm job completion. The artisan receives payment only after you approve.
            </p>
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-3">
          <Button
            variant="outline"
            onClick={() => {
              onClose();
              reset();
            }}
            disabled={isLoading}
            className="flex-1"
          >
            Cancel
          </Button>
          <Button
            onClick={handleHire}
            disabled={isLoading}
            className="flex-1 bg-[var(--orange)] hover:bg-[var(--orange)]/90 text-white"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Processing...
              </>
            ) : (
              <>
                {selectedMethod === "online" ? "Pay Now" : "Start Job"}
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
