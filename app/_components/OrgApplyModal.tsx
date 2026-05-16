"use client";

import { useState, useEffect } from "react";
import { X, Building2, CheckCircle2, ChevronDown, Loader2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { getApiBaseUrl } from "@/api/api-service";

interface Organization {
  id: string;
  name: string;
  description: string | null;
  sector: string | null;
  website: string | null;
}

interface OrgApplyModalProps {
  open: boolean;
  onClose: () => void;
}

export function OrgApplyModal({ open, onClose }: OrgApplyModalProps) {
  const [orgs, setOrgs] = useState<Organization[]>([]);
  const [loadingOrgs, setLoadingOrgs] = useState(false);
  const [selectedOrgId, setSelectedOrgId] = useState("");
  const [phone, setPhone] = useState("");
  const [fullName, setFullName] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [orgName, setOrgName] = useState("");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    setLoadingOrgs(true);
    fetch(`${getApiBaseUrl()}/v1/public/organizations`)
      .then((r) => r.json())
      .then((data) => setOrgs(data.organizations ?? []))
      .catch(() => setOrgs([]))
      .finally(() => setLoadingOrgs(false));
  }, [open]);

  const handleSubmit = async () => {
    if (!selectedOrgId || !phone.trim()) {
      setError("Please select an association and enter your phone number.");
      return;
    }
    setError(null);
    setSubmitting(true);
    try {
      const res = await fetch(`${getApiBaseUrl()}/v1/public/organizations/${selectedOrgId}/apply`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          phone: phone.trim(),
          full_name: fullName.trim() || undefined,
        }),
      });
      if (!res.ok) throw new Error("Failed");
      const data = await res.json();
      setOrgName(data.organization);
      setSubmitted(true);
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleClose = () => {
    // Reset state after close animation
    setTimeout(() => {
      setSubmitted(false);
      setSelectedOrgId("");
      setPhone("");
      setFullName("");
      setError(null);
    }, 300);
    onClose();
  };

  return (
    <AnimatePresence>
      {open && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={handleClose}
            className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm"
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.96, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 20 }}
            transition={{ duration: 0.25 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none"
          >
            <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl pointer-events-auto overflow-hidden">
              {/* Header */}
              <div className="flex items-center justify-between px-6 pt-6 pb-4 border-b border-gray-100">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-[var(--orange)]/10 flex items-center justify-center">
                    <Building2 className="w-5 h-5 text-[var(--orange)]" />
                  </div>
                  <h2 className="text-lg font-bold text-foreground">Apply via Association</h2>
                </div>
                <button onClick={handleClose} className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors">
                  <X className="w-5 h-5 text-foreground/40" />
                </button>
              </div>

              {submitted ? (
                /* Success state */
                <div className="px-6 py-10 text-center">
                  <div className="w-14 h-14 rounded-full bg-emerald-100 flex items-center justify-center mx-auto mb-5">
                    <CheckCircle2 className="w-7 h-7 text-emerald-600" />
                  </div>
                  <h3 className="text-xl font-bold text-foreground mb-2">Application submitted!</h3>
                  <p className="text-base text-foreground/55 leading-relaxed mb-6">
                    We have notified <strong className="text-foreground/70">{orgName}</strong> of your application.
                    Your application is <strong className="text-amber-600">under review</strong> — you&apos;ll hear back soon.
                  </p>
                  <button
                    onClick={handleClose}
                    className="px-6 py-3 rounded-xl bg-[var(--orange)] text-white font-semibold text-sm hover:bg-[var(--orange-hover)] transition-all"
                  >
                    Done
                  </button>
                </div>
              ) : (
                /* Form */
                <div className="px-6 py-5 space-y-4">
                  <p className="text-sm text-foreground/50 leading-relaxed">
                    Select the association you&apos;re registered with and leave your contact details — they&apos;ll verify your membership.
                  </p>

                  {/* Org dropdown */}
                  <div>
                    <label className="block text-sm font-semibold text-foreground/70 mb-1.5">Association</label>
                    <div className="relative">
                      <select
                        value={selectedOrgId}
                        onChange={(e) => setSelectedOrgId(e.target.value)}
                        disabled={loadingOrgs}
                        className="w-full appearance-none pl-4 pr-10 py-3 rounded-xl border-2 border-gray-200 text-[15px] text-foreground bg-white outline-none focus:border-[var(--orange)] focus:ring-4 focus:ring-[var(--orange)]/10 transition-all disabled:opacity-50"
                      >
                        <option value="">
                          {loadingOrgs ? "Loading associations…" : "Select an association"}
                        </option>
                        {orgs.map((org) => (
                          <option key={org.id} value={org.id}>
                            {org.name}{org.sector ? ` — ${org.sector}` : ""}
                          </option>
                        ))}
                      </select>
                      <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-foreground/30 pointer-events-none" />
                    </div>
                    {selectedOrgId && (
                      <p className="text-xs text-foreground/40 mt-1.5 ml-1">
                        {orgs.find((o) => o.id === selectedOrgId)?.description ?? ""}
                      </p>
                    )}
                  </div>

                  {/* Full name */}
                  <div>
                    <label className="block text-sm font-semibold text-foreground/70 mb-1.5">Your name <span className="text-foreground/30 font-normal">(optional)</span></label>
                    <input
                      type="text"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      placeholder="e.g. Emeka Johnson"
                      className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 text-[15px] text-foreground placeholder:text-foreground/25 outline-none focus:border-[var(--orange)] focus:ring-4 focus:ring-[var(--orange)]/10 transition-all"
                    />
                  </div>

                  {/* Phone */}
                  <div>
                    <label className="block text-sm font-semibold text-foreground/70 mb-1.5">Phone number</label>
                    <div className="relative">
                      <span className="absolute left-4 top-1/2 -translate-y-1/2 text-foreground/40 text-[15px] pointer-events-none select-none">+234</span>
                      <input
                        type="tel"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        placeholder="801 234 5678"
                        className="w-full pl-16 pr-4 py-3 rounded-xl border-2 border-gray-200 text-[15px] text-foreground placeholder:text-foreground/25 outline-none focus:border-[var(--orange)] focus:ring-4 focus:ring-[var(--orange)]/10 transition-all"
                      />
                    </div>
                  </div>

                  {error && (
                    <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-xl px-4 py-3">
                      {error}
                    </p>
                  )}

                  <button
                    onClick={handleSubmit}
                    disabled={submitting || !selectedOrgId || !phone.trim()}
                    className="w-full flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl bg-[var(--orange)] text-white font-bold text-base hover:bg-[var(--orange-hover)] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {submitting ? (
                      <><Loader2 className="w-4 h-4 animate-spin" /> Submitting…</>
                    ) : (
                      "Submit application"
                    )}
                  </button>
                </div>
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
