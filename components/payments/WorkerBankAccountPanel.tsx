"use client";

import * as React from "react";
import { Building2, CheckCircle2, Pencil, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { apiService } from "@/api/api-service";
import { cn } from "@/lib/utils";

interface BankAccount {
  account_number: string;
  bank_name: string;
  account_name: string;
  bank_code: string;
  verified: boolean;
}

interface LookupResult {
  account_name: string;
  account_number: string;
  bank_code: string;
}

export function WorkerBankAccountPanel() {
  const [account, setAccount] = React.useState<BankAccount | null>(null);
  const [loadingAccount, setLoadingAccount] = React.useState(true);
  const [editing, setEditing] = React.useState(false);

  // Form state
  const [accountNumber, setAccountNumber] = React.useState("");
  const [bankCode, setBankCode] = React.useState("");
  const [bankName, setBankName] = React.useState("");
  const [lookedUp, setLookedUp] = React.useState<LookupResult | null>(null);
  const [lookingUp, setLookingUp] = React.useState(false);
  const [saving, setSaving] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  // Nigerian banks — Squad NIP codes (6-digit), required by Squad payout API
  const BANKS = [
    { code: "000013", name: "GTBank (GTCO)" },
    { code: "000016", name: "First Bank" },
    { code: "000014", name: "Access Bank" },
    { code: "000015", name: "Zenith Bank" },
    { code: "000004", name: "UBA" },
    { code: "000003", name: "FCMB" },
    { code: "000007", name: "Fidelity Bank" },
    { code: "000001", name: "Sterling Bank" },
    { code: "000017", name: "Wema Bank" },
    { code: "000012", name: "Stanbic IBTC" },
    { code: "000018", name: "Union Bank" },
    { code: "000002", name: "Keystone Bank" },
    { code: "000008", name: "Polaris Bank" },
    { code: "000010", name: "Ecobank" },
    { code: "000011", name: "Unity Bank" },
    { code: "000020", name: "Heritage Bank" },
    { code: "000021", name: "Standard Chartered" },
    { code: "000023", name: "Providus Bank" },
    { code: "000025", name: "Titan Trust Bank" },
    { code: "000027", name: "Globus Bank" },
    { code: "000029", name: "Lotus Bank" },
    { code: "090267", name: "Kuda Bank" },
    { code: "100004", name: "OPay" },
    { code: "100033", name: "PalmPay" },
    { code: "100039", name: "Paystack (Titan)" },
    { code: "110006", name: "Paystack" },
    { code: "110007", name: "Moniepoint" },
    { code: "090551", name: "FairMoney" },
    { code: "090325", name: "Sparkle" },
  ];

  React.useEffect(() => {
    (async () => {
      try {
        const data = await apiService.get<{ bank_account: BankAccount | null }>("/worker/bank-account");
        setAccount(data.bank_account);
      } catch {
        // no account yet
      } finally {
        setLoadingAccount(false);
      }
    })();
  }, []);

  const handleBankChange = (code: string) => {
    setBankCode(code);
    const bank = BANKS.find((b) => b.code === code);
    setBankName(bank?.name ?? "");
    setLookedUp(null);
    setError(null);
  };

  const handleLookup = async () => {
    if (!accountNumber || accountNumber.length < 10 || !bankCode) {
      setError("Enter a 10-digit account number and select a bank.");
      return;
    }
    setLookingUp(true);
    setError(null);
    try {
      const data = await apiService.post<{ account: LookupResult }>(
        "/worker/bank-account/lookup",
        { body: { account_number: accountNumber, bank_code: bankCode } }
      );
      setLookedUp(data.account);
    } catch (e: any) {
      setError(e?.message ?? "Could not verify account. Check the number and bank.");
    } finally {
      setLookingUp(false);
    }
  };

  const handleSave = async () => {
    if (!lookedUp) return;
    setSaving(true);
    setError(null);
    try {
      const data = await apiService.post<{ bank_account: BankAccount }>(
        "/worker/bank-account",
        {
          body: {
            account_number: lookedUp.account_number,
            bank_code: lookedUp.bank_code,
            bank_name: bankName,
            account_name: lookedUp.account_name,
          },
        }
      );
      setAccount(data.bank_account);
      setEditing(false);
      setLookedUp(null);
      setAccountNumber("");
      setBankCode("");
      setBankName("");
    } catch (e: any) {
      setError(e?.message ?? "Failed to save bank account.");
    } finally {
      setSaving(false);
    }
  };

  if (loadingAccount) {
    return (
      <div className="flex items-center gap-2 text-muted-foreground py-4">
        <Loader2 className="size-4 animate-spin" />
        <span className="text-sm">Loading bank account...</span>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-border bg-card p-5 space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Building2 className="size-5 text-muted-foreground" />
          <h3 className="text-base font-semibold">Payout Bank Account</h3>
        </div>
        {account && !editing && (
          <button
            onClick={() => {
              setEditing(true);
              setAccountNumber(account.account_number);
              setBankCode(account.bank_code);
              setBankName(account.bank_name);
              setLookedUp(null);
            }}
            className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
          >
            <Pencil className="size-3" /> Change
          </button>
        )}
      </div>

      {/* Saved account display */}
      {account && !editing && (
        <div className="rounded-lg bg-muted/50 px-4 py-3 space-y-1">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="size-4 text-emerald-500 shrink-0" />
            <span className="text-sm font-medium">{account.account_name}</span>
          </div>
          <p className="text-xs text-muted-foreground pl-6">
            {account.account_number} · {account.bank_name}
          </p>
          <p className="text-xs text-emerald-600 pl-6">Payouts will be sent here when a job completes</p>
        </div>
      )}

      {/* No account yet + not editing */}
      {!account && !editing && (
        <div className="space-y-3">
          <p className="text-sm text-muted-foreground">
            Add your bank account so you can receive payouts when jobs are completed.
          </p>
          <Button size="sm" onClick={() => setEditing(true)}>Add Bank Account</Button>
        </div>
      )}

      {/* Edit / Add form */}
      {editing && (
        <div className="space-y-3">
          {/* Bank selector */}
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-foreground">Bank</label>
            <select
              value={bankCode}
              onChange={(e) => handleBankChange(e.target.value)}
              className={cn(
                "flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-xs",
                "focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
              )}
            >
              <option value="">Select bank</option>
              {BANKS.map((b) => (
                <option key={b.code} value={b.code}>{b.name}</option>
              ))}
            </select>
          </div>

          {/* Account number */}
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-foreground">Account Number</label>
            <div className="flex gap-2">
              <input
                type="text"
                inputMode="numeric"
                maxLength={10}
                value={accountNumber}
                onChange={(e) => {
                  setAccountNumber(e.target.value.replace(/\D/g, ""));
                  setLookedUp(null);
                  setError(null);
                }}
                placeholder="0000000000"
                className={cn(
                  "flex h-9 flex-1 rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-xs",
                  "focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                )}
              />
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={handleLookup}
                disabled={lookingUp || accountNumber.length < 10 || !bankCode}
              >
                {lookingUp ? <Loader2 className="size-3.5 animate-spin" /> : "Verify"}
              </Button>
            </div>
          </div>

          {/* Lookup result */}
          {lookedUp && (
            <div className="rounded-md border border-emerald-200 bg-emerald-50 px-3 py-2 flex items-center gap-2">
              <CheckCircle2 className="size-4 text-emerald-600 shrink-0" />
              <div>
                <p className="text-sm font-medium text-emerald-800">{lookedUp.account_name}</p>
                <p className="text-xs text-emerald-600">{lookedUp.account_number} · {bankName}</p>
              </div>
            </div>
          )}

          {error && (
            <p className="text-xs text-destructive">{error}</p>
          )}

          <div className="flex gap-2 pt-1">
            <Button
              type="button"
              size="sm"
              variant="outline"
              onClick={() => {
                setEditing(false);
                setLookedUp(null);
                setError(null);
                setAccountNumber("");
                setBankCode("");
                setBankName("");
              }}
            >
              Cancel
            </Button>
            <Button
              type="button"
              size="sm"
              onClick={handleSave}
              disabled={!lookedUp || saving}
            >
              {saving ? <><Loader2 className="size-3.5 animate-spin mr-1.5" />Saving...</> : "Save Account"}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
