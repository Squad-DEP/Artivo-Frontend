"use client";

import { useState } from "react";
import { usePaymentStore } from "@/store/paymentStore";
import { useAuthStore } from "@/store/authStore";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  ShieldCheck,
  Wallet,
  Zap,
  Lock,
  Loader2,
  ChevronRight,
  BadgeCheck,
  AlertTriangle,
} from "lucide-react";

const BENEFITS = [
  {
    icon: Wallet,
    title: "Fund your wallet instantly",
    desc: "Transfer from any Nigerian bank and your balance updates within seconds.",
  },
  {
    icon: Zap,
    title: "Hire artisans without friction",
    desc: "Pay for jobs directly from your wallet — no card details needed every time.",
  },
  {
    icon: Lock,
    title: "Secure & dedicated to you",
    desc: "Your account number is unique to you. Funds are held safely until a job is done.",
  },
];

interface FormState {
  firstName: string;
  lastName: string;
  phone: string;
  bvn: string;
  dob: string;
  gender: "1" | "2";
  address: string;
}

function validate(form: FormState): Partial<Record<keyof FormState, string>> {
  const errors: Partial<Record<keyof FormState, string>> = {};
  if (!form.firstName.trim()) errors.firstName = "First name is required.";
  if (!form.lastName.trim()) errors.lastName = "Last name is required.";
  if (!/^\d{11}$/.test(form.phone.replace(/\D/g, "")))
    errors.phone = "Enter a valid 11-digit Nigerian phone number.";
  if (!/^\d{11}$/.test(form.bvn)) errors.bvn = "BVN must be exactly 11 digits.";
  if (!form.dob) errors.dob = "Date of birth is required.";
  if (!form.address.trim() || form.address.trim().length < 5)
    errors.address = "Enter a valid address.";
  return errors;
}

export function VirtualAccountSetup() {
  const { ensureSetup, isLoading, error } = usePaymentStore();
  const { user } = useAuthStore();

  const fullName = user?.user_metadata?.full_name ?? "";
  const nameParts = fullName.trim().split(/\s+/);
  const defaultFirst = nameParts[0] ?? "";
  const defaultLast = nameParts.slice(1).join(" ") ?? "";

  const [form, setForm] = useState<FormState>({
    firstName: defaultFirst,
    lastName: defaultLast,
    phone: "",
    bvn: "",
    dob: "",
    gender: "1",
    address: "",
  });
  const [fieldErrors, setFieldErrors] = useState<Partial<Record<keyof FormState, string>>>({});

  function set<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
    setFieldErrors((prev) => ({ ...prev, [key]: undefined }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const errors = validate(form);
    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      return;
    }
    await ensureSetup({
      bvn: form.bvn,
      dob: form.dob,
      gender: form.gender,
      address: form.address,
      first_name: form.firstName.trim(),
      last_name: form.lastName.trim(),
      phone: form.phone.replace(/\D/g, ""),
    });
  }

  return (
    <div className="space-y-6">
      {/* Hero card */}
      <div className="rounded-2xl bg-gradient-to-br from-primary to-primary/80 text-primary-foreground p-6 sm:p-8">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-xl bg-white/15 flex items-center justify-center shrink-0">
            <Wallet className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-lg font-bold">Get your virtual account</h2>
            <p className="text-sm opacity-75">Your dedicated Nigerian bank account</p>
          </div>
        </div>

        <div className="space-y-3 mt-6">
          {BENEFITS.map(({ icon: Icon, title, desc }) => (
            <div key={title} className="flex items-start gap-3">
              <div className="w-7 h-7 rounded-lg bg-white/15 flex items-center justify-center shrink-0 mt-0.5">
                <Icon className="w-3.5 h-3.5" />
              </div>
              <div>
                <p className="text-sm font-semibold">{title}</p>
                <p className="text-xs opacity-70 mt-0.5">{desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* KYC form */}
      <div className="rounded-2xl border border-border bg-card p-6">
        <div className="flex items-center gap-2 mb-1">
          <ShieldCheck className="w-4 h-4 text-primary" />
          <h3 className="text-sm font-semibold text-foreground">Identity Verification</h3>
        </div>
        <p className="text-xs text-muted-foreground mb-5">
          Required by CBN regulations to open your virtual account. Your data is
          encrypted and never shared.
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Name fields */}
          <div className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2.5 flex items-start gap-2">
            <AlertTriangle className="w-3.5 h-3.5 text-amber-600 shrink-0 mt-0.5" />
            <p className="text-xs text-amber-800">
              The name below is pre-filled from your profile. If your BVN is registered
              under a different name, update it here — it must match exactly.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="firstName">First Name</Label>
              <Input
                id="firstName"
                placeholder="As on your BVN"
                value={form.firstName}
                onChange={(e) => set("firstName", e.target.value)}
                disabled={isLoading}
                aria-invalid={!!fieldErrors.firstName}
              />
              {fieldErrors.firstName && (
                <p className="text-xs text-destructive">{fieldErrors.firstName}</p>
              )}
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="lastName">Last Name</Label>
              <Input
                id="lastName"
                placeholder="As on your BVN"
                value={form.lastName}
                onChange={(e) => set("lastName", e.target.value)}
                disabled={isLoading}
                aria-invalid={!!fieldErrors.lastName}
              />
              {fieldErrors.lastName && (
                <p className="text-xs text-destructive">{fieldErrors.lastName}</p>
              )}
            </div>
          </div>

          {/* Phone */}
          <div className="space-y-1.5">
            <Label htmlFor="phone">Phone Number</Label>
            <Input
              id="phone"
              placeholder="e.g. 08012345678"
              value={form.phone}
              onChange={(e) => set("phone", e.target.value.replace(/[^\d+\s-]/g, "").slice(0, 14))}
              inputMode="tel"
              disabled={isLoading}
              aria-invalid={!!fieldErrors.phone}
            />
            {fieldErrors.phone && (
              <p className="text-xs text-destructive">{fieldErrors.phone}</p>
            )}
          </div>

          {/* BVN */}
          <div className="space-y-1.5">
            <Label htmlFor="bvn">BVN</Label>
            <Input
              id="bvn"
              placeholder="Enter your 11-digit BVN"
              value={form.bvn}
              onChange={(e) => set("bvn", e.target.value.replace(/\D/g, "").slice(0, 11))}
              inputMode="numeric"
              maxLength={11}
              disabled={isLoading}
              aria-invalid={!!fieldErrors.bvn}
            />
            {fieldErrors.bvn && (
              <p className="text-xs text-destructive">{fieldErrors.bvn}</p>
            )}
            <p className="text-xs text-muted-foreground">
              Dial <span className="font-mono">*565*0#</span> on your registered number to get your BVN.
            </p>
          </div>

          {/* DOB + Gender row */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="dob">Date of Birth</Label>
              <Input
                id="dob"
                type="date"
                value={form.dob}
                onChange={(e) => set("dob", e.target.value)}
                disabled={isLoading}
                aria-invalid={!!fieldErrors.dob}
                max={new Date().toISOString().split("T")[0]}
              />
              {fieldErrors.dob && (
                <p className="text-xs text-destructive">{fieldErrors.dob}</p>
              )}
            </div>

            <div className="space-y-1.5">
              <Label>Gender</Label>
              <div className="flex gap-2 h-9">
                {(["1", "2"] as const).map((val) => (
                  <button
                    key={val}
                    type="button"
                    onClick={() => set("gender", val)}
                    disabled={isLoading}
                    className={`flex-1 rounded-md border text-xs font-medium transition-colors ${
                      form.gender === val
                        ? "border-primary bg-primary/5 text-primary"
                        : "border-border text-muted-foreground hover:border-primary/40"
                    }`}
                  >
                    {val === "1" ? "Male" : "Female"}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Address */}
          <div className="space-y-1.5">
            <Label htmlFor="address">Residential Address</Label>
            <Input
              id="address"
              placeholder="e.g. 12 Bode Thomas Street, Lagos"
              value={form.address}
              onChange={(e) => set("address", e.target.value)}
              disabled={isLoading}
              aria-invalid={!!fieldErrors.address}
            />
            {fieldErrors.address && (
              <p className="text-xs text-destructive">{fieldErrors.address}</p>
            )}
          </div>

          {error && (
            <p className="text-xs text-destructive bg-destructive/5 border border-destructive/20 rounded-lg px-3 py-2">
              {error}
            </p>
          )}

          {/* Trust badge + submit */}
          <div className="flex items-center gap-2 pt-1">
            <div className="flex-1 flex items-center gap-1.5 text-xs text-muted-foreground">
              <BadgeCheck className="w-3.5 h-3.5 text-green-500 shrink-0" />
              256-bit encrypted · Never stored in plain text
            </div>
            <Button type="submit" disabled={isLoading} className="gap-1.5 shrink-0">
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Creating…
                </>
              ) : (
                <>
                  Create Account
                  <ChevronRight className="w-4 h-4" />
                </>
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
