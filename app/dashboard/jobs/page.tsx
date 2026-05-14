"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import {
  Briefcase,
  Clock,
  CheckCircle2,
  AlertCircle,
  MapPin,
  Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useJobStore } from "@/store/jobStore";
import { useAuthStore } from "@/store/authStore";
import { JobProposalsView } from "@/components/customer/JobProposalsView";

const STATUS_CONFIG: Record<string, { label: string; className: string; icon: React.ReactNode }> = {
  open: { label: "Open", className: "bg-blue-100 text-blue-700", icon: <AlertCircle className="w-3 h-3" /> },
  in_progress: { label: "In Progress", className: "bg-yellow-100 text-yellow-700", icon: <Clock className="w-3 h-3" /> },
  completed: { label: "Completed", className: "bg-green-100 text-green-700", icon: <CheckCircle2 className="w-3 h-3" /> },
  worker_completed: { label: "Worker Done", className: "bg-emerald-100 text-emerald-700", icon: <CheckCircle2 className="w-3 h-3" /> },
  customer_completed: { label: "Customer Done", className: "bg-emerald-100 text-emerald-700", icon: <CheckCircle2 className="w-3 h-3" /> },
  disputed: { label: "Disputed", className: "bg-red-100 text-red-700", icon: <AlertCircle className="w-3 h-3" /> },
  cancelled: { label: "Cancelled", className: "bg-gray-100 text-gray-700", icon: <AlertCircle className="w-3 h-3" /> },
};

export default function JobsListPage() {
  const router = useRouter();
  const { jobs, isLoading, error, fetchJobs, clearError } = useJobStore();
  const { getUserType } = useAuthStore();
  const userType = getUserType();
  const [tab, setTab] = useState<"jobs" | "posts">("posts");

  useEffect(() => {
    fetchJobs();
  }, [fetchJobs]);

  const formatBudget = (value: number | null | undefined) =>
    !value || value === 0
      ? "Negotiable"
      : `₦${Number(value).toLocaleString("en-NG")}`;

  if (isLoading && jobs.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">My Jobs</h1>
        <p className="text-gray-500 mt-1">
          {userType === "worker" ? "Jobs you're working on" : "Your active jobs and job posts"}
        </p>
      </div>

      {/* Primary CTA — always visible */}
      {userType === "customer" ? (
        <button
          onClick={() => router.push("/dashboard/jobs/new")}
          className="w-full flex items-center justify-between gap-3 rounded-xl border-2 border-dashed border-[var(--orange)]/40 bg-[var(--orange)]/5 hover:bg-[var(--orange)]/10 hover:border-[var(--orange)]/60 transition-all px-5 py-4 text-left"
        >
          <div>
            <p className="font-semibold text-gray-900 text-sm">Find / Hire an Artisan</p>
            <p className="text-xs text-gray-500 mt-0.5">Describe your job by voice or text — our AI posts it instantly</p>
          </div>
          <span className="shrink-0 w-9 h-9 rounded-full bg-[var(--orange)] flex items-center justify-center text-white text-lg font-bold">+</span>
        </button>
      ) : (
        <Button
          onClick={() => router.push("/dashboard/jobs/feed")}
          className="bg-[var(--orange)] hover:bg-[var(--orange)]/90 text-white w-full sm:w-auto"
        >
          Find Jobs
        </Button>
      )}

      {/* Customer tabs */}
      {userType === "customer" && (
        <div className="flex gap-1 p-1 bg-gray-100 rounded-lg w-fit">
          <button
            onClick={() => setTab("posts")}
            className={`px-4 py-1.5 text-sm font-medium rounded-md transition-colors ${tab === "posts" ? "bg-white shadow-sm text-gray-900" : "text-gray-500 hover:text-gray-700"}`}
          >
            My Posts
          </button>
          <button
            onClick={() => setTab("jobs")}
            className={`px-4 py-1.5 text-sm font-medium rounded-md transition-colors ${tab === "jobs" ? "bg-white shadow-sm text-gray-900" : "text-gray-500 hover:text-gray-700"}`}
          >
            Hired Jobs
          </button>
        </div>
      )}

      {userType === "customer" && tab === "posts" && <JobProposalsView />}


      {/* Error */}
      {error && (
        <div className="rounded-xl border border-gray-200 bg-gray-50 p-4 flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-gray-400 shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="text-sm text-gray-600">Unable to load jobs. Please try again.</p>
            <Button size="sm" variant="outline" className="mt-2" onClick={() => { clearError(); fetchJobs(); }}>
              Retry
            </Button>
          </div>
        </div>
      )}

      {/* Jobs List — shown for workers always, and for customers on "Hired Jobs" tab */}
      {(userType === "worker" || (userType === "customer" && tab === "jobs")) && jobs.filter(j => j.status !== "open").length > 0 ? (
        <div className="space-y-3">
          {jobs.filter(j => j.status !== "open").map((job, index) => {
            const status = STATUS_CONFIG[job.status] || STATUS_CONFIG.open;
            return (
              <motion.div
                key={job.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.03 }}
                onClick={() => router.push(`/dashboard/jobs/${job.id}`)}
                className="bg-white rounded-xl border border-gray-100 p-4 sm:p-5 hover:border-gray-200 hover:shadow-sm transition-all cursor-pointer"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-gray-900 truncate">{job.title}</h3>
                    <div className="flex items-center gap-3 mt-1.5 text-sm text-gray-500 flex-wrap">
                      {job.location && (
                        <span className="flex items-center gap-1">
                          <MapPin className="w-3.5 h-3.5" />
                          {job.location.city}{job.location.state ? `, ${job.location.state}` : ""}
                        </span>
                      )}
                      <span className="flex items-center gap-1">
                        <Briefcase className="w-3.5 h-3.5" />
                        {job.category?.name || "General"}
                      </span>
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="font-semibold text-gray-900">
                      {formatBudget(job.budget_max)}
                    </p>
                    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium mt-1 ${status.className}`}>
                      {status.icon}
                      {status.label}
                    </span>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      ) : (userType === "worker" || (userType === "customer" && tab === "jobs")) ? (
        <div className="text-center py-12 flex flex-col items-center justify-center rounded-2xl border border-gray-100 bg-gray-50/50">
          <Briefcase className="w-10 h-10 text-gray-300 mx-auto mb-3" />
          <h3 className="text-base font-semibold text-gray-900 mb-1">
            {userType === "worker" ? "No active jobs" : "No hired jobs yet"}
          </h3>
          <p className="text-gray-400 text-sm">
            {userType === "worker" ? "Apply to jobs from the feed to get started" : "Hire an artisan using the button above"}
          </p>
        </div>
      ) : null}
    </div>
  );
}
