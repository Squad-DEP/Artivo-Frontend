"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { User, MapPin, Banknote, Clock, CheckCircle2, XCircle, Loader2, ChevronLeft, Plus, Sparkles, Star, ExternalLink } from "lucide-react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { apiService } from "@/api/api-service";
import { HirePaymentDialog } from "@/components/customer/HirePaymentDialog";

interface JobRequest {
  id: string;
  title: string;
  description: string;
  location: string | null;
  budget: number | null;
  status: string;
  job_type_name: string;
  proposal_count: number;
  created_at: string;
}

interface Proposal {
  id: string;
  worker_id: string;
  worker_name: string;
  photo_url: string | null;
  share_slug: string | null;
  proposed_amount: number;
  proposed_amount_max: number | null;
  status: string;
  created_at: string;
}

interface AiMatch {
  worker_id: string;
  worker_name: string;
  share_slug: string | null;
  match_score: number;
  explanation: string;
  score_breakdown: {
    skills_match: number;
    location_match: number;
    reputation: number;
    ai_semantic: number;
  };
}

const formatBudget = (v: number | null | undefined) =>
  !v || v === 0 ? "Negotiable" : `₦${Number(v).toLocaleString("en-NG")}`;
const formatAmount = (v: number) => `₦${Number(v).toLocaleString("en-NG")}`;

export function JobProposalsView() {
  const router = useRouter();
  const [jobRequests, setJobRequests] = useState<JobRequest[]>([]);
  const [selectedJob, setSelectedJob] = useState<JobRequest | null>(null);
  const [proposals, setProposals] = useState<Proposal[]>([]);
  const [isLoadingJobs, setIsLoadingJobs] = useState(true);
  const [isLoadingProposals, setIsLoadingProposals] = useState(false);
  const [selectedProposal, setSelectedProposal] = useState<Proposal | null>(null);
  const [showPaymentDialog, setShowPaymentDialog] = useState(false);
  const [hiredProposalIds, setHiredProposalIds] = useState<Set<string>>(new Set());
  const [error, setError] = useState<string | null>(null);
  const [aiMatches, setAiMatches] = useState<AiMatch[]>([]);
  const [isLoadingMatches, setIsLoadingMatches] = useState(false);
  // Cache AI results by job ID so reopening a job doesn't refetch
  const aiCache = useRef<Map<string, AiMatch[]>>(new Map());

  const fetchJobRequests = useCallback(async () => {
    setIsLoadingJobs(true);
    try {
      const data = await apiService.get<{ job_requests: JobRequest[] }>("/customer/my-job-requests");
      setJobRequests(data.job_requests ?? []);
    } catch {
      setError("Failed to load your job posts.");
    } finally {
      setIsLoadingJobs(false);
    }
  }, []);

  useEffect(() => {
    fetchJobRequests();
  }, [fetchJobRequests]);

  function openProposals(job: JobRequest) {
    setSelectedJob(job);
    setProposals([]);
    setError(null);

    // ── Proposals: fetch independently, show as soon as ready ──
    setIsLoadingProposals(true);
    apiService
      .get<{ proposals: Proposal[] }>(`/customer/job-requests/${job.id}/proposals`)
      .then((data) => setProposals(data.proposals ?? []))
      .catch(() => setError("Failed to load proposals."))
      .finally(() => setIsLoadingProposals(false));

    // ── AI matches: serve from cache instantly, fetch only on first open ──
    const cached = aiCache.current.get(job.id);
    if (cached) {
      setAiMatches(cached);
      setIsLoadingMatches(false);
    } else {
      setAiMatches([]);
      setIsLoadingMatches(true);
      apiService
        .get<{ matches: AiMatch[] }>(`/jobs/${job.id}/matches?limit=5`)
        .then((data) => {
          const matches = data.matches ?? [];
          aiCache.current.set(job.id, matches);
          setAiMatches(matches);
        })
        .catch(() => { /* silent — AI suggestions are non-critical */ })
        .finally(() => setIsLoadingMatches(false));
    }
  }

  function initiateHire(proposal: Proposal) {
    setSelectedProposal(proposal);
    setShowPaymentDialog(true);
  }

  function handlePaymentDialogClose(didSucceed = false) {
    setShowPaymentDialog(false);
    setSelectedProposal(null);
    if (didSucceed) {
      // Only refresh data if payment actually completed
      fetchJobRequests();
      if (selectedJob) openProposals(selectedJob);
    }
  }

  if (selectedJob) {
    return (
      <div className="space-y-4">
        <button
          onClick={() => { setSelectedJob(null); setProposals([]); setAiMatches([]); setError(null); }}
          className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <ChevronLeft className="w-4 h-4" />
          Back to my posts
        </button>

        <div className="rounded-xl border border-gray-200 bg-gray-50 p-5">
          <div className="flex items-start justify-between gap-3 mb-1">
            <h3 className="font-semibold text-foreground">{selectedJob.title}</h3>
            <StatusBadge status={selectedJob.status} />
          </div>
          <p className="text-sm text-muted-foreground line-clamp-2">{selectedJob.description}</p>
          <div className="flex flex-wrap gap-3 mt-3 text-xs text-muted-foreground">
            {selectedJob.location && <span className="flex items-center gap-1"><MapPin className="w-3.5 h-3.5" />{selectedJob.location}</span>}
            <span className="flex items-center gap-1"><Banknote className="w-3.5 h-3.5" />Budget: {formatBudget(selectedJob.budget)}</span>
          </div>
        </div>

        {/* AI Matches */}
        <div className="space-y-2">
          <div className="flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-[var(--orange)]" />
            <h4 className="font-semibold text-sm text-foreground">AI-Suggested Artisans</h4>
          </div>

          {isLoadingMatches && (
            <div className="flex items-center gap-2 text-xs text-muted-foreground py-2">
              <Loader2 className="w-3.5 h-3.5 animate-spin" /> Finding best matches…
            </div>
          )}

          {!isLoadingMatches && aiMatches.length === 0 && (
            <p className="text-xs text-muted-foreground py-1">
              No subscribed artisans found for this job type yet.
            </p>
          )}

          {!isLoadingMatches && aiMatches.length > 0 && (
            <div className="space-y-2">
              {aiMatches.map((match, i) => (
                <div key={match.worker_id} className="rounded-xl border border-gray-200 bg-white p-3.5 flex gap-3">
                  {/* Rank badge */}
                  <div className="shrink-0 w-7 h-7 rounded-full bg-[var(--orange)]/10 flex items-center justify-center mt-0.5">
                    <span className="text-xs font-bold text-[var(--orange)]">#{i + 1}</span>
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2 flex-wrap">
                      <p className="font-medium text-sm text-foreground">{match.worker_name}</p>
                      <span className="flex items-center gap-0.5 text-xs font-semibold text-amber-600">
                        <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                        {match.match_score}/100
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                      {match.explanation}
                    </p>
                    {match.share_slug && (
                      <button
                        onClick={() => router.push(`/artisan/${match.share_slug}`)}
                        className="mt-2.5 flex items-center gap-1 text-xs font-medium text-primary hover:underline"
                      >
                        <ExternalLink className="w-3 h-3" />
                        View Profile
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <h4 className="font-semibold text-sm text-foreground">
          {isLoadingProposals ? "Loading proposals…" : `${proposals.length} Proposal${proposals.length !== 1 ? "s" : ""}`}
        </h4>

        {error && (
          <p className="text-xs text-destructive bg-destructive/5 border border-destructive/20 rounded-lg px-3 py-2">{error}</p>
        )}

        {isLoadingProposals && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground py-4">
            <Loader2 className="w-4 h-4 animate-spin" />
            Loading proposals…
          </div>
        )}

        {!isLoadingProposals && proposals.length === 0 && (
          <div className="rounded-xl border border-dashed border-border p-8 text-center">
            <p className="text-sm text-muted-foreground">No artisans have applied yet.</p>
            <p className="text-xs text-muted-foreground mt-1">Check back soon — proposals will appear here.</p>
          </div>
        )}

        <div className="space-y-3">
          {proposals.map((proposal) => {
            const isHired = hiredProposalIds.has(proposal.id) || proposal.status === "accepted";
            const isRejected = proposal.status === "rejected";
            const jobAssigned = selectedJob.status === "assigned";

            return (
              <div key={proposal.id} className="rounded-xl border border-gray-200 bg-gray-50 p-4 flex items-center gap-4">
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0 overflow-hidden">
                  {proposal.photo_url
                    ? <img src={proposal.photo_url} alt={proposal.worker_name} className="w-full h-full object-cover" />
                    : <User className="w-5 h-5 text-primary" />
                  }
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="font-medium text-sm text-foreground truncate">{proposal.worker_name}</p>
                    {proposal.share_slug && (
                      <button
                        onClick={() => router.push(`/artisan/${proposal.share_slug}`)}
                        className="shrink-0 flex items-center gap-0.5 text-xs text-primary hover:underline"
                      >
                        <ExternalLink className="w-3 h-3" />
                        Profile
                      </button>
                    )}
                  </div>
                  <div className="flex items-center gap-3 mt-0.5">
                    <span className="text-sm font-semibold text-primary">
                      {formatAmount(proposal.proposed_amount)}
                      {proposal.proposed_amount_max && Number(proposal.proposed_amount_max) > Number(proposal.proposed_amount)
                        ? ` – ${formatAmount(Number(proposal.proposed_amount_max))}`
                        : ""}
                    </span>
                    <span className="text-xs text-muted-foreground flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {new Date(proposal.created_at).toLocaleDateString()}
                    </span>
                  </div>
                </div>

                <div className="shrink-0">
                  {isHired ? (
                    <span className="flex items-center gap-1 text-xs font-medium text-green-600">
                      <CheckCircle2 className="w-4 h-4" />Hired
                    </span>
                  ) : isRejected ? (
                    <span className="flex items-center gap-1 text-xs font-medium text-muted-foreground">
                      <XCircle className="w-4 h-4" />Rejected
                    </span>
                  ) : (
                    <Button
                      size="sm"
                      onClick={() => initiateHire(proposal)}
                      disabled={jobAssigned}
                      className="gap-1.5"
                    >
                      Hire
                    </Button>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Payment Dialog */}
        {selectedProposal && selectedJob && (
          <HirePaymentDialog
            isOpen={showPaymentDialog}
            onClose={handlePaymentDialogClose}
            proposal={selectedProposal}
            jobRequestId={selectedJob.id}
          />
        )}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-foreground">My Job Posts</h3>
        <Button
          onClick={() => router.push("/dashboard/jobs/new")}
          className="bg-[var(--orange)] hover:bg-[var(--orange)]/90 text-white gap-2"
          size="sm"
        >
          <Plus className="w-4 h-4" />
          Create Job
        </Button>
      </div>

      {error && (
        <p className="text-xs text-destructive bg-destructive/5 border border-destructive/20 rounded-lg px-3 py-2">{error}</p>
      )}

      {isLoadingJobs && (
        <div className="flex items-center gap-2 text-sm text-muted-foreground py-4">
          <Loader2 className="w-4 h-4 animate-spin" />Loading your job posts…
        </div>
      )}

      {!isLoadingJobs && jobRequests.filter(j => j.status === "open").length === 0 && (
        <div className="rounded-xl border border-dashed border-border p-8 text-center space-y-4">
          <p className="text-sm text-muted-foreground">You haven't posted any jobs yet.</p>
          <Button
            onClick={() => router.push("/dashboard/jobs/new")}
            className="bg-[var(--orange)] hover:bg-[var(--orange)]/90 text-white gap-2"
          >
            <Plus className="w-4 h-4" />
            Create Your First Job
          </Button>
        </div>
      )}

      <div className="space-y-3">
        {jobRequests.filter(j => j.status === "open").map((job) => (
          <div key={job.id} className="rounded-xl border border-gray-200 bg-gray-50 p-4">
            <div className="flex items-start justify-between gap-3 mb-1">
              <div className="min-w-0">
                <h4 className="font-medium text-sm text-foreground truncate">{job.title}</h4>
                <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">{job.description}</p>
              </div>
              <StatusBadge status={job.status} />
            </div>

            <div className="flex items-center justify-between mt-3">
              <div className="flex flex-wrap gap-3 text-xs text-muted-foreground">
                {job.location && <span className="flex items-center gap-1"><MapPin className="w-3 h-3" />{job.location}</span>}
                <span className="flex items-center gap-1">
                  <User className="w-3 h-3" />
                  {job.proposal_count ?? 0} proposal{(job.proposal_count ?? 0) !== 1 ? "s" : ""}
                </span>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => openProposals(job)}
                className="shrink-0"
              >
                View Proposals
              </Button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, { label: string; className: string }> = {
    open: { label: "Open", className: "bg-green-100 text-green-700" },
    assigned: { label: "Assigned", className: "bg-blue-100 text-blue-700" },
    completed: { label: "Completed", className: "bg-gray-100 text-gray-600" },
    cancelled: { label: "Cancelled", className: "bg-red-100 text-red-600" },
  };
  const config = map[status] ?? { label: status, className: "bg-gray-100 text-gray-600" };
  return (
    <span className={`shrink-0 inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${config.className}`}>
      {config.label}
    </span>
  );
}
