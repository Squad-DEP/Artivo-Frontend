"use client";

import * as React from "react";
import { useWorkerJobStore } from "@/store/workerJobStore";
import type { WorkerProposal } from "@/store/workerJobStore";
import { cn } from "@/lib/utils";
import { FileText } from "lucide-react";

const formatBudget = (v: number | null | undefined) =>
  !v || v === 0 ? "Negotiable" : `₦${Number(v).toLocaleString("en-NG")}`;

export function WorkerApplicationsView() {
  const { proposals, fetchProposals } = useWorkerJobStore();

  React.useEffect(() => {
    fetchProposals();
  }, [fetchProposals]);

  if (proposals.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-2xl border border-gray-200 bg-gradient-to-b from-gray-50 to-white py-14 px-6 text-center">
        <div className="w-14 h-14 rounded-2xl bg-amber-50 flex items-center justify-center mb-4">
          <FileText className="w-7 h-7 text-amber-500" />
        </div>
        <h3 className="text-base font-semibold text-gray-900 mb-1">No applications yet</h3>
        <p className="text-sm text-muted-foreground max-w-xs">
          Apply to jobs in the Job Feed tab. Your proposals will appear here so you can track their status.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {proposals.map((proposal) => (
        <ProposalCard key={proposal.id} proposal={proposal} />
      ))}
    </div>
  );
}

function ProposalCard({ proposal }: { proposal: WorkerProposal }) {
  const statusConfig: Record<string, { label: string; className: string }> = {
    pending: { label: "Awaiting review", className: "bg-amber-50 text-amber-700 border-amber-200" },
    accepted: { label: "Accepted", className: "bg-emerald-50 text-emerald-700 border-emerald-200" },
    rejected: { label: "Declined", className: "bg-red-50 text-red-600 border-red-200" },
  };
  const { label, className } = statusConfig[proposal.status] ?? statusConfig.pending;

  return (
    <div className="rounded-lg border border-gray-200 bg-gray-50 p-4 space-y-3">
      <div className="flex items-start justify-between gap-3">
        <div className="space-y-1 min-w-0">
          <h4 className="text-sm font-semibold text-foreground truncate">{proposal.title}</h4>
          <p className="text-sm text-muted-foreground line-clamp-2">{proposal.description}</p>
        </div>
        <span className={cn("shrink-0 inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium", className)}>
          {label}
        </span>
      </div>
      <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
        <span>{proposal.location}</span>
        <span>Job budget: {formatBudget(proposal.budget)}</span>
        <span>By {proposal.customer_name}</span>
      </div>
      <div className="flex items-center justify-between pt-1 border-t border-border">
        <span className="text-xs text-muted-foreground">Your price range</span>
        <span className="text-sm font-semibold text-foreground">
          ₦{Number(proposal.proposed_amount).toLocaleString("en-NG")}
          {proposal.proposed_amount_max && proposal.proposed_amount_max > proposal.proposed_amount
            ? ` – ₦${Number(proposal.proposed_amount_max).toLocaleString("en-NG")}`
            : ""}
        </span>
      </div>
    </div>
  );
}
