"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useState, useEffect, Suspense } from "react";
import { Button } from "@/components/ui/button";
import { useAuthStore } from "@/store/authStore";
import { JobProposalsView } from "@/components/customer/JobProposalsView";
import { ActiveJobsView } from "@/components/customer/ActiveJobsView";
import { WorkerJobFeed } from "@/components/worker/WorkerJobFeed";
import { WorkerActiveJobsView } from "@/components/worker/ActiveJobsView";

type CustomerTab = "posts" | "active";
type WorkerTab = "feed" | "active";

// eslint-disable-next-line @typescript-eslint/no-unused-vars
function JobsPageInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { getUserType } = useAuthStore();
  const userType = getUserType();

  const tabParam = searchParams.get("tab");
  const highlightId = searchParams.get("highlight") ?? undefined;

  const [customerTab, setCustomerTab] = useState<CustomerTab>(
    tabParam === "active" ? "active" : "posts"
  );
  const [workerTab, setWorkerTab] = useState<WorkerTab>(
    tabParam === "active" ? "active" : "feed"
  );

  // Sync tab if URL param changes (e.g. navigating from payments)
  useEffect(() => {
    if (tabParam === "active") {
      setCustomerTab("active");
      setWorkerTab("active");
    }
  }, [tabParam]);

  if (userType === "customer") {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">My Jobs</h1>
          <p className="text-sm text-muted-foreground mt-1">Your job posts and active hires</p>
        </div>

        {/* Post a Job CTA */}
        <button
          onClick={() => router.push("/dashboard/jobs/new")}
          className="w-full flex items-center justify-between gap-3 rounded-xl border-2 border-dashed border-[var(--orange)]/40 bg-[var(--orange)]/5 hover:bg-[var(--orange)]/10 hover:border-[var(--orange)]/60 transition-all px-5 py-4 text-left"
        >
          <div>
            <p className="font-semibold text-gray-900 text-sm">Find / Hire an Artisan</p>
            <p className="text-xs text-gray-500 mt-0.5">Describe your job by voice or text — AI posts it instantly</p>
          </div>
          <span className="shrink-0 w-9 h-9 rounded-full bg-[var(--orange)] flex items-center justify-center text-white text-lg font-bold">+</span>
        </button>

        {/* Tabs */}
        <div className="flex gap-1 p-1 bg-gray-100 rounded-lg w-fit">
          <TabBtn active={customerTab === "posts"} onClick={() => setCustomerTab("posts")}>
            My Posts
          </TabBtn>
          <TabBtn active={customerTab === "active"} onClick={() => setCustomerTab("active")}>
            Active Jobs
          </TabBtn>
        </div>

        {customerTab === "posts"  && <JobProposalsView />}
        {customerTab === "active" && <ActiveJobsView />}
      </div>
    );
  }

  // Worker view
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Jobs</h1>
        <p className="text-sm text-muted-foreground mt-1">Find work and track your active jobs</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 p-1 bg-gray-100 rounded-lg w-fit">
        <TabBtn active={workerTab === "feed"} onClick={() => setWorkerTab("feed")}>
          Job Feed
        </TabBtn>
        <TabBtn active={workerTab === "active"} onClick={() => setWorkerTab("active")}>
          My Jobs
        </TabBtn>
      </div>

      {workerTab === "feed"   && <WorkerJobFeed />}
      {workerTab === "active" && <WorkerActiveJobsView highlightJobId={highlightId} />}
    </div>
  );
}

export default function JobsPage() {
  return (
    <Suspense>
      <JobsPageInner />
    </Suspense>
  );
}

function TabBtn({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      className={`px-4 py-1.5 text-sm font-medium rounded-md transition-colors ${
        active ? "bg-white shadow-sm text-gray-900" : "text-gray-500 hover:text-gray-700"
      }`}
    >
      {children}
    </button>
  );
}
