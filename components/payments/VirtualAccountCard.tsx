"use client";

import { useEffect, useState } from "react";
import {
  Building2,
  Copy,
  Check,
  RefreshCw,
  Wallet,
  TrendingDown,
} from "lucide-react";
import { usePaymentStore } from "@/store/paymentStore";
import { Button } from "@/components/ui/button";
import { VirtualAccountSetup } from "@/components/payments/VirtualAccountSetup";
import { cn } from "@/lib/utils";

function formatNGN(amount: number): string {
  return new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency: "NGN",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}

export function VirtualAccountCard() {
  const { virtualAccount, isLoading, error, needsSetup, fetchVirtualAccount } =
    usePaymentStore();
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    fetchVirtualAccount();
  }, [fetchVirtualAccount]);

  const handleCopy = async () => {
    if (!virtualAccount?.account_number) return;
    try {
      await navigator.clipboard.writeText(virtualAccount.account_number);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // clipboard not available
    }
  };

  if (isLoading && !virtualAccount) {
    return (
      <div className="rounded-xl border border-border bg-card p-6">
        <div className="flex items-center gap-3">
          <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-primary" />
          <span className="text-sm text-muted-foreground">
            Loading account details...
          </span>
        </div>
      </div>
    );
  }

  if (needsSetup) {
    return <VirtualAccountSetup />;
  }

  if (!virtualAccount && error) {
    return (
      <div className="rounded-xl border border-border bg-card p-6">
        <div className="flex items-center gap-3">
          <Building2 className="w-5 h-5 text-muted-foreground" />
          <div className="flex-1">
            <p className="text-sm font-medium text-foreground">
              Virtual Account
            </p>
            <p className="text-xs text-destructive mt-0.5">{error}</p>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => fetchVirtualAccount()}
            className="gap-1"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            Retry
          </Button>
        </div>
      </div>
    );
  }

  if (!virtualAccount) return null;

  return (
    <div className="space-y-4">
      {/* Balance card */}
      <div className="rounded-xl bg-gradient-to-br from-primary to-primary/80 text-primary-foreground p-6">
        <div className="flex items-start justify-between mb-6">
          <div className="flex items-center gap-2">
            <Wallet className="w-5 h-5 opacity-80" />
            <span className="text-sm font-medium opacity-80">
              Wallet Balance
            </span>
          </div>
          <button
            onClick={() => fetchVirtualAccount()}
            className="p-1 rounded-md hover:bg-white/10 transition-colors"
            aria-label="Refresh balance"
          >
            <RefreshCw className={cn("w-3.5 h-3.5", isLoading && "animate-spin")} />
          </button>
        </div>

        <div className="mb-6">
          <p className="text-3xl font-bold tracking-tight">
            {formatNGN(virtualAccount.balance)}
          </p>
          <div className="flex items-center gap-1.5 mt-1 opacity-70">
            <TrendingDown className="w-3.5 h-3.5" />
            <span className="text-xs">
              {formatNGN(virtualAccount.total_deposited)} total deposited
            </span>
          </div>
        </div>

        <div className="bg-white/10 rounded-lg p-3 space-y-1">
          <p className="text-xs opacity-70">Account Number</p>
          <div className="flex items-center justify-between">
            <p className="text-lg font-mono font-semibold tracking-wider">
              {virtualAccount.account_number}
            </p>
            <button
              onClick={handleCopy}
              className="flex items-center gap-1 text-xs px-2 py-1 rounded-md bg-white/15 hover:bg-white/25 transition-colors"
              aria-label={copied ? "Copied" : "Copy account number"}
            >
              {copied ? (
                <Check className="w-3.5 h-3.5" />
              ) : (
                <Copy className="w-3.5 h-3.5" />
              )}
              {copied ? "Copied" : "Copy"}
            </button>
          </div>
        </div>
      </div>

      {/* Account details + funding instructions */}
      <div className="rounded-xl border border-border bg-card p-5 space-y-4">
        <div className="flex items-center gap-2">
          <Building2 className="w-4 h-4 text-muted-foreground" />
          <h3 className="text-sm font-semibold text-foreground">
            Bank Details
          </h3>
        </div>

        <div className="grid grid-cols-2 gap-3 text-sm">
          <div>
            <p className="text-xs text-muted-foreground">Bank Name</p>
            <p className="font-medium mt-0.5">{virtualAccount.bank_name}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Bank Code</p>
            <p className="font-medium mt-0.5">{virtualAccount.bank_code}</p>
          </div>
          <div className="col-span-2">
            <p className="text-xs text-muted-foreground">Account Name</p>
            <p className="font-medium mt-0.5">{virtualAccount.account_name}</p>
          </div>
        </div>

        <div className="border-t border-border pt-4">
          <p className="text-xs font-medium text-foreground mb-2">
            How to fund your wallet
          </p>
          <ol className="space-y-1.5 text-xs text-muted-foreground list-decimal list-inside">
            <li>Open your bank app or USSD</li>
            <li>
              Transfer to{" "}
              <span className="font-medium text-foreground">
                {virtualAccount.bank_name}
              </span>
            </li>
            <li>
              Account number:{" "}
              <span className="font-mono font-medium text-foreground">
                {virtualAccount.account_number}
              </span>
            </li>
            <li>Your balance updates automatically within seconds</li>
          </ol>
        </div>
      </div>
    </div>
  );
}
