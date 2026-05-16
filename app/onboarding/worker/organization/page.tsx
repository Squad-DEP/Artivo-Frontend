"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { motion } from "framer-motion";
import { ArrowLeft, Building2, Mail, Upload, FileSpreadsheet, CheckCircle2, X } from "lucide-react";
import { BRAND } from "@/lib/constants";

export default function AssociationOnboardingPage() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [email, setEmail] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (f) setFile(f);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    const f = e.dataTransfer.files?.[0];
    if (f) setFile(f);
  };

  const handleSubmit = () => {
    if (!email.trim() || !file) {
      setError("Please provide your association email and upload a file.");
      return;
    }
    // No backend logic yet — just show confirmation
    setSubmitted(true);
    setError(null);
  };

  if (submitted) {
    return (
      <div className="min-h-screen w-full bg-white flex flex-col items-center justify-center px-6">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.4 }}
          className="text-center max-w-md"
        >
          <div className="w-16 h-16 rounded-full bg-emerald-100 flex items-center justify-center mx-auto mb-6">
            <CheckCircle2 className="w-8 h-8 text-emerald-600" />
          </div>
          <h2 className="text-2xl font-bold text-foreground mb-3">We&apos;ve got it!</h2>
          <p className="text-base text-foreground/55 leading-relaxed mb-8">
            Your association&apos;s file has been received. Our team will process the artisan data and reach out to <strong>{email}</strong> within 24–48 hours.
          </p>
          <button
            onClick={() => router.push("/login")}
            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-[var(--orange)] text-white font-semibold text-sm hover:bg-[var(--orange-hover)] transition-all"
          >
            Go to login
          </button>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen w-full bg-white flex flex-col">
      {/* Top bar */}
      <header className="flex items-center justify-between px-6 sm:px-10 py-5">
        <div className="flex items-center gap-2.5">
          <Image src="/logo_primary.svg" alt={BRAND.name} width={36} height={36} />
          <span className="text-xl font-semibold text-[#444] tracking-tight">{BRAND.name}</span>
        </div>
        <button
          onClick={() => router.back()}
          className="flex items-center gap-1.5 text-sm text-foreground/50 hover:text-foreground transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back
        </button>
      </header>

      <main className="flex-1 flex flex-col items-center justify-center px-6 pb-16 pt-4">
        <div className="w-full max-w-lg">
          {/* Hero block */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="text-center mb-10"
          >
            <div className="w-14 h-14 rounded-2xl bg-[var(--orange)]/10 flex items-center justify-center mx-auto mb-6">
              <Building2 className="w-7 h-7 text-[var(--orange)]" />
            </div>
            <h1 className="text-[34px] sm:text-[44px] font-bold leading-[1.1] tracking-[-2px] text-foreground mb-3">
              Onboard your artisans
            </h1>
            <p className="text-[15px] text-foreground/50 leading-relaxed max-w-sm mx-auto">
              Cooperatives, unions, and businesses — upload your artisan roster and we handle the rest. Each artisan gets their own Artivo profile, ready to find work.
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45, delay: 0.1 }}
            className="space-y-5"
          >
            {/* Email field */}
            <div>
              <label className="block text-sm font-semibold text-foreground/70 mb-2">
                Organization email
              </label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-foreground/30" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="info@yourassociation.com"
                  className="w-full pl-11 pr-4 py-3.5 rounded-xl border-2 border-gray-200 text-[15px] text-foreground placeholder:text-foreground/25 outline-none focus:border-[var(--orange)] focus:ring-4 focus:ring-[var(--orange)]/10 transition-all"
                />
              </div>
              <p className="text-xs text-foreground/35 mt-1.5 ml-1">We&apos;ll send updates to this address</p>
            </div>

            {/* File upload */}
            <div>
              <label className="block text-sm font-semibold text-foreground/70 mb-2">
                Upload artisan data
              </label>

              {file ? (
                <div className="flex items-center gap-3 px-4 py-3.5 rounded-xl border-2 border-emerald-300 bg-emerald-50">
                  <FileSpreadsheet className="w-5 h-5 text-emerald-600 shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-emerald-800 truncate">{file.name}</p>
                    <p className="text-xs text-emerald-600">{(file.size / 1024).toFixed(1)} KB</p>
                  </div>
                  <button onClick={() => setFile(null)} className="p-1 hover:bg-emerald-100 rounded-lg transition-colors">
                    <X className="w-4 h-4 text-emerald-500" />
                  </button>
                </div>
              ) : (
                <div
                  onDrop={handleDrop}
                  onDragOver={(e) => e.preventDefault()}
                  onClick={() => fileInputRef.current?.click()}
                  className="flex flex-col items-center gap-3 px-6 py-10 rounded-xl border-2 border-dashed border-gray-200 bg-gray-50/60 hover:border-[var(--orange)] hover:bg-[var(--orange)]/5 transition-all cursor-pointer group"
                >
                  <div className="w-11 h-11 rounded-xl bg-white border border-gray-200 flex items-center justify-center group-hover:border-[var(--orange)]/30 transition-colors shadow-sm">
                    <Upload className="w-5 h-5 text-foreground/40 group-hover:text-[var(--orange)] transition-colors" />
                  </div>
                  <div className="text-center">
                    <p className="text-sm font-semibold text-foreground/60 group-hover:text-foreground transition-colors">
                      Drop your file here, or <span className="text-[var(--orange)]">browse</span>
                    </p>
                    <p className="text-xs text-foreground/35 mt-1">CSV, JSON, Excel (.xlsx) — up to 10 MB</p>
                  </div>
                </div>
              )}

              <input
                ref={fileInputRef}
                type="file"
                accept=".csv,.json,.xlsx,.xls,.tsv"
                onChange={handleFileChange}
                className="hidden"
              />

              {/* Template hint */}
              <div className="mt-3 rounded-xl border border-gray-100 bg-gray-50 px-4 py-3">
                <p className="text-xs text-foreground/50 leading-relaxed">
                  <strong className="text-foreground/70">Recommended columns:</strong>{" "}
                  full_name, phone, skills, location, years_experience — we&apos;ll map any format automatically.
                </p>
              </div>
            </div>

            {error && (
              <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-xl px-4 py-3">
                {error}
              </p>
            )}

            {/* Submit */}
            <button
              onClick={handleSubmit}
              className="w-full flex items-center justify-center gap-2 px-6 py-4 rounded-xl bg-[var(--orange)] text-white font-bold text-base hover:bg-[var(--orange-hover)] shadow-lg shadow-[var(--orange)]/25 transition-all"
            >
              Submit for processing
            </button>

            <p className="text-center text-xs text-foreground/30">
              Our team reviews each submission — artisans are notified when their profiles are ready
            </p>
          </motion.div>
        </div>
      </main>
    </div>
  );
}
