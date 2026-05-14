"use client";

import * as React from "react";
import { Coins, CheckCircle2, XCircle, Clock, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useJobStore } from "@/store/jobStore";
import type { AdvanceRequest } from "@/api/types/marketplace-api";

interface AdvanceRequestPanelProps {
  jobId: string;
  role: "worker" | "customer";
  jobStatus: string;
}

const STATUS_ICON = {
  pending: <Clock className="w-4 h-4 text-yellow-500" />,
  approved: <CheckCircle2 className="w-4 h-4 text-green-600" />,
  rejected: <XCircle className="w-4 h-4 text-red-500" />,
};

const STATUS_LABEL = {
  pending: "Pending approval",
  approved: "Approved",
  rejected: "Rejected",
};

function fmt(n: number) {
  return new Intl.NumberFormat("en-NG", { style: "currency", currency: "NGN", minimumFractionDigits: 0 }).format(n);
}

export function AdvanceRequestPanel({ jobId, role, jobStatus }: AdvanceRequestPanelProps) {
  const { advanceRequests, isLoading, fetchAdvanceRequests, requestAdvance, approveAdvance, rejectAdvance } = useJobStore();

  const [amount, setAmount] = React.useState("");
  const [reason, setReason] = React.useState("");
  const [showForm, setShowForm] = React.useState(false);
  const [actionId, setActionId] = React.useState<string | null>(null);

  React.useEffect(() => {
    fetchAdvanceRequests(jobId);
  }, [jobId, fetchAdvanceRequests]);

  const canRequest = role === "worker" && jobStatus === "in_progress";
  const pendingRequests = advanceRequests.filter((r) => r.status === "pending");
  const pastRequests = advanceRequests.filter((r) => r.status !== "pending");

  const handleRequest = async () => {
    const parsed = parseFloat(amount);
    if (!parsed || parsed <= 0) return;
    const ok = await requestAdvance(jobId, parsed, reason || undefined);
    if (ok) {
      setAmount("");
      setReason("");
      setShowForm(false);
      fetchAdvanceRequests(jobId);
    }
  };

  const handleApprove = async (requestId: string) => {
    setActionId(requestId);
    await approveAdvance(requestId);
    setActionId(null);
  };

  const handleReject = async (requestId: string) => {
    setActionId(requestId);
    await rejectAdvance(requestId);
    setActionId(null);
  };

  if (!canRequest && advanceRequests.length === 0) return null;

  return (
    <section className="rounded-lg border border-amber-200 bg-amber-50 p-5 space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-base font-semibold text-amber-900 flex items-center gap-2">
          <Coins className="w-4 h-4" />
          Advance Payments
        </h2>
        {canRequest && !showForm && (
          <Button
            size="sm"
            variant="outline"
            className="border-amber-300 text-amber-800 hover:bg-amber-100"
            onClick={() => setShowForm(true)}
          >
            Request Advance
          </Button>
        )}
      </div>

      <p className="text-xs text-amber-700">
        {role === "worker"
          ? "Need money upfront for materials? Request a partial release from escrow."
          : "The artisan has requested an advance from escrow for materials."}
      </p>

      {/* Worker request form */}
      {showForm && canRequest && (
        <div className="bg-white rounded-lg border border-amber-200 p-4 space-y-3">
          <div>
            <label className="text-xs font-medium text-gray-700 block mb-1">Amount (₦)</label>
            <input
              type="number"
              min="1"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="e.g. 5000"
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400"
            />
          </div>
          <div>
            <label className="text-xs font-medium text-gray-700 block mb-1">Reason (optional)</label>
            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="e.g. Need to buy paint and supplies"
              rows={2}
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-amber-400"
            />
          </div>
          <div className="flex gap-2">
            <Button size="sm" onClick={handleRequest} disabled={isLoading || !amount}>
              Submit Request
            </Button>
            <Button size="sm" variant="outline" onClick={() => setShowForm(false)}>
              Cancel
            </Button>
          </div>
        </div>
      )}

      {/* Pending requests */}
      {pendingRequests.length > 0 && (
        <div className="space-y-2">
          <p className="text-xs font-medium text-amber-800">Awaiting approval</p>
          {pendingRequests.map((req) => (
            <AdvanceRequestRow
              key={req.id}
              request={req}
              role={role}
              isActing={actionId === req.id}
              onApprove={() => handleApprove(req.id)}
              onReject={() => handleReject(req.id)}
            />
          ))}
        </div>
      )}

      {/* Past requests */}
      {pastRequests.length > 0 && (
        <div className="space-y-2">
          <p className="text-xs font-medium text-gray-500">History</p>
          {pastRequests.map((req) => (
            <AdvanceRequestRow key={req.id} request={req} role={role} isActing={false} />
          ))}
        </div>
      )}
    </section>
  );
}

function AdvanceRequestRow({
  request,
  role,
  isActing,
  onApprove,
  onReject,
}: {
  request: AdvanceRequest;
  role: "worker" | "customer";
  isActing: boolean;
  onApprove?: () => void;
  onReject?: () => void;
}) {
  return (
    <div className="bg-white rounded-lg border border-gray-200 p-3 flex items-start justify-between gap-3">
      <div className="flex items-start gap-2 min-w-0">
        <span className="mt-0.5 shrink-0">{STATUS_ICON[request.status]}</span>
        <div className="min-w-0">
          <p className="text-sm font-semibold text-gray-900">{fmt(Number(request.amount))}</p>
          {request.reason && (
            <p className="text-xs text-gray-500 truncate">{request.reason}</p>
          )}
          <p className="text-xs text-gray-400 mt-0.5">{STATUS_LABEL[request.status]}</p>
        </div>
      </div>

      {role === "customer" && request.status === "pending" && (
        <div className="flex gap-1.5 shrink-0">
          <Button
            size="sm"
            onClick={onApprove}
            disabled={isActing}
            className="bg-green-600 hover:bg-green-700 text-white h-7 px-3 text-xs"
          >
            Release
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={onReject}
            disabled={isActing}
            className="border-red-300 text-red-600 hover:bg-red-50 h-7 px-3 text-xs"
          >
            Decline
          </Button>
        </div>
      )}
    </div>
  );
}
