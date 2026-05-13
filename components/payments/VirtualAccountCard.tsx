"use client";

import { useEffect } from "react";
import {
  AlertCircle,
  Building2,
  CheckCircle2,
  Clock,
  Copy,
  RefreshCw,
} from "lucide-react";
import { usePaymentStore } from "@/store/paymentStore";

export function VirtualAccountCard() {
  const { virtualAccount, isLoading, error, fetchVirtualAccount } =
    usePaymentStore();

  useEffect(() => {
    fetchVirtualAccount();
  }, [fetchVirtualAccount]);

  if (isLoading && !virtualAccount) {
    return (
      <div className="rounded-lg border border-gray-200 bg-white p-6">
        <div className="flex items-center gap-3">
          <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-[#FF6200]" />
          <span className="text-sm text-gray-500">
            Loading account details...
          </span>
        </div>
      </div>
    );
  }

  // Failed creation state with error banner and auto-retry indicator
  if (virtualAccount?.status === "failed" || (!virtualAccount && error)) {
    return (
      <div className="rounded-lg border border-red-200 bg-red-50 p-6">
        <div className="flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-red-500 mt-0.5 shrink-0" />
          <div className="flex-1">
            <h3 className="text-sm font-semibold text-red-800">
              Virtual Account Creation Failed
            </h3>
            <p className="mt-1 text-sm text-red-600">
              {error || "Unable to create your virtual account. Please try again."}
            </p>
            <div className="mt-3 flex items-center gap-4">
              <div className="flex items-center gap-1.5 text-xs text-red-500">
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                <span>Auto-retrying in the background</span>
              </div>
              <button
                onClick={fetchVirtualAccount}
                className="flex items-center gap-1.5 text-xs font-medium text-red-700 hover:text-red-900 transition-colors"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                Retry Now
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!virtualAccount) {
    return null;
  }

  const statusConfig = {
    active: {
      icon: CheckCircle2,
      label: "Active",
      className: "text-green-600 bg-green-50",
    },
    pending: {
      icon: Clock,
      label: "Pending",
      className: "text-yellow-600 bg-yellow-50",
    },
    failed: {
      icon: AlertCircle,
      label: "Failed",
      className: "text-red-600 bg-red-50",
    },
  };

  const status = statusConfig[virtualAccount.status];
  const StatusIcon = status.icon;

  const handleCopyAccountNumber = async () => {
    try {
      await navigator.clipboard.writeText(virtualAccount.account_number);
    } catch {
      // Fallback for environments without clipboard API
    }
  };

  return (
    <div className="rounded-lg border border-gray-200 bg-white p-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Building2 className="w-5 h-5 text-gray-600" />
          <h3 className="text-sm font-semibold text-gray-900">
            Virtual Account
          </h3>
        </div>
        <span
          className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium ${status.className}`}
        >
          <StatusIcon className="w-3.5 h-3.5" />
          {status.label}
        </span>
      </div>

      {virtualAccount.status === "pending" && (
        <div className="mb-4 flex items-center gap-2 rounded-md bg-yellow-50 border border-yellow-200 px-3 py-2">
          <Clock className="w-4 h-4 text-yellow-600 shrink-0" />
          <p className="text-xs text-yellow-700">
            Your account is being set up. This usually takes less than 30
            seconds.
          </p>
        </div>
      )}

      <div className="space-y-3">
        <div>
          <p className="text-xs text-gray-500">Account Number</p>
          <div className="flex items-center gap-2 mt-0.5">
            <p className="text-sm font-medium text-gray-900">
              {virtualAccount.account_number}
            </p>
            <button
              onClick={handleCopyAccountNumber}
              className="text-gray-400 hover:text-gray-600 transition-colors"
              aria-label="Copy account number"
            >
              <Copy className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        <div>
          <p className="text-xs text-gray-500">Bank Name</p>
          <p className="text-sm font-medium text-gray-900 mt-0.5">
            {virtualAccount.bank_name}
          </p>
        </div>

        <div>
          <p className="text-xs text-gray-500">Account Name</p>
          <p className="text-sm font-medium text-gray-900 mt-0.5">
            {virtualAccount.account_name}
          </p>
        </div>
      </div>
    </div>
  );
}
