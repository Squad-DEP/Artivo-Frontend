"use client";

import { WorkerJobFeed } from "@/components/worker/WorkerJobFeed";

export default function WorkerJobFeedPage() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Job Feed</h1>
        <p className="text-gray-500 mt-1">
          Discover and accept new job opportunities in real time
        </p>
      </div>

      {/* WorkerJobFeed handles SSE lifecycle: connects on mount, disconnects on unmount */}
      <WorkerJobFeed />
    </div>
  );
}
