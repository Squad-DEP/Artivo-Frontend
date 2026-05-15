"use client";

import { useState } from "react";
import {
  Building2,
  Copy,
  Check,
  RefreshCw,
  Wallet,
  ArrowDownLeft,
  PlusCircle,
  Link,
} from "lucide-react";
import { usePaymentStore } from "@/store/paymentStore";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

function formatNGN(amount: number): string {
  return new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency: "NGN",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}

interface VirtualAccountCardProps {
  /**
   * "wallet"  — customer view. Shows wallet balance, funding instructions,
   *             and the simulate-deposit tool for demo purposes.
   * "payout"  — worker view. Shows the account as their payout destination.
   *             No funding instructions, no simulate deposit.
   */
  variant?: "wallet" | "payout";
}

export function VirtualAccountCard({ variant = "wallet" }: VirtualAccountCardProps) {
  const { virtualAccount, isLoading, error, fetchVirtualAccount, simulateDeposit } =
    usePaymentStore();
  const [copied, setCopied]               = useState(false);
  const [depositAmount, setDepositAmount] = useState("");
  const [showDepositInput, setShowDepositInput] = useState(false);

  const isPayoutVariant = variant === "payout";

  const handleSimulateDeposit = async () => {
    const amount = parseFloat(depositAmount);
    if (!amount || amount < 1) return;
    await simulateDeposit(amount);
    setDepositAmount("");
    setShowDepositInput(false);
  };

  const handleCopy = async () => {
    if (!virtualAccount?.account_number) return;
    try {
      await navigator.clipboard.writeText(virtualAccount.account_number);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // clipboard not available in some environments
    }
  };

  if (!virtualAccount && error) {
    return (
      <div className="rounded-xl border border-border bg-card p-6">
        <div className="flex items-center gap-3">
          <Building2 className="w-5 h-5 text-muted-foreground" />
          <div className="flex-1">
            <p className="text-sm font-medium text-foreground">
              {isPayoutVariant ? "Payout Account" : "Virtual Account"}
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
            {isPayoutVariant
              ? <ArrowDownLeft className="w-5 h-5 opacity-80" />
              : <Wallet className="w-5 h-5 opacity-80" />
            }
            <span className="text-sm font-medium opacity-80">
              {isPayoutVariant ? "Payout Account" : "Wallet Balance"}
            </span>
          </div>
          <button
            onClick={() => fetchVirtualAccount()}
            className="p-1 rounded-md hover:bg-white/10 transition-colors"
            aria-label="Refresh"
          >
            <RefreshCw className={cn("w-3.5 h-3.5", isLoading && "animate-spin")} />
          </button>
        </div>

        <div className="mb-6">
          <p className="text-3xl font-bold tracking-tight">
            {formatNGN(isPayoutVariant ? virtualAccount.balance : virtualAccount.total_deposited)}
          </p>
          <p className="text-xs mt-1 opacity-70">
            {isPayoutVariant ? "Earnings received so far" : "Total deposited"}
          </p>
        </div>

        {/* Only show the account number if it's a real one — sandbox accounts use "SANDBOX" as placeholder */}
        {virtualAccount.account_number && virtualAccount.account_number !== "SANDBOX" ? (
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
                {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                {copied ? "Copied" : "Copy"}
              </button>
            </div>
          </div>
        ) : isPayoutVariant ? (
          <div className="bg-white/10 rounded-lg p-3">
            <p className="text-xs opacity-70">Status</p>
            <p className="text-sm font-medium mt-0.5">Sandbox mode — balance tracked internally</p>
          </div>
        ) : null}
      </div>

      {/* Bank details */}
      <div className="rounded-xl border border-border bg-card p-5 space-y-4">
        <div className="flex items-center gap-2">
          <Building2 className="w-4 h-4 text-muted-foreground" />
          <h3 className="text-sm font-semibold text-foreground">
            {isPayoutVariant ? "Where your payouts land" : "Bank Details"}
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

        {/* Funding instructions — customers only */}
        {!isPayoutVariant && (
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
        )}

        {/* Payout note — workers only */}
        {isPayoutVariant && (
          <div className="border-t border-border pt-4">
            <p className="text-xs text-muted-foreground leading-relaxed">
              When a job is confirmed complete by both parties, Artivo transfers
              your earnings to this account automatically. No action needed on your end.
            </p>
          </div>
        )}
      </div>

      {/* Simulate Deposit — customers only, demo tool */}
      {!isPayoutVariant && (
        <div className="rounded-xl border border-dashed border-amber-300 bg-amber-50 p-4 space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-amber-800">Demo Mode — Simulate Deposit</p>
              <p className="text-xs text-amber-700 mt-0.5">
                Instantly credit your wallet to test the hire flow.
              </p>
            </div>
            {!showDepositInput && (
              <Button
                size="sm"
                variant="outline"
                className="gap-1.5 border-amber-400 text-amber-800 hover:bg-amber-100 shrink-0"
                onClick={() => setShowDepositInput(true)}
                disabled={isLoading}
              >
                <PlusCircle className="w-3.5 h-3.5" />
                Add Funds
              </Button>
            )}
          </div>
          {showDepositInput && (
            <div className="flex gap-2">
              <Input
                type="number"
                min={1}
                placeholder="Amount in ₦ (e.g. 50000)"
                value={depositAmount}
                onChange={(e) => setDepositAmount(e.target.value)}
                className="h-8 text-sm"
                onKeyDown={(e) => e.key === "Enter" && handleSimulateDeposit()}
                autoFocus
              />
              <Button
                size="sm"
                onClick={handleSimulateDeposit}
                disabled={isLoading || !depositAmount}
                className="shrink-0"
              >
                {isLoading ? "..." : "Deposit"}
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => { setShowDepositInput(false); setDepositAmount(""); }}
                className="shrink-0"
              >
                Cancel
              </Button>
            </div>
          )}
          {error && <p className="text-xs text-destructive">{error}</p>}
        </div>
      )}
    </div>
  );
}

export function ClaimVirtualAccountCard() {
  const { claimAccount, isLoading, error } = usePaymentStore();
  const [claimNumber, setClaimNumber] = useState("");

  const handleClaim = async () => {
    if (!claimNumber.trim()) return;
    await claimAccount(claimNumber.trim());
  };

  return (
    <div className="rounded-xl border border-dashed border-orange-300 bg-orange-50 p-5 space-y-3">
      <div className="flex items-center gap-2">
        <Link className="w-4 h-4 text-orange-500" />
        <p className="text-sm font-semibold text-orange-800">Link Existing Account</p>
      </div>
      <p className="text-xs text-orange-700">
        Enter your Squad virtual account number to link it to your profile.
      </p>
      <div className="flex gap-2">
        <Input
          placeholder="e.g. 8277238916"
          value={claimNumber}
          onChange={(e) => setClaimNumber(e.target.value)}
          className="h-8 text-sm"
          onKeyDown={(e) => e.key === "Enter" && handleClaim()}
        />
        <Button
          size="sm"
          onClick={handleClaim}
          disabled={isLoading || !claimNumber}
          className="shrink-0"
        >
          {isLoading ? "..." : "Link"}
        </Button>
      </div>
      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  );
}
