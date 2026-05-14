"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, CheckCircle2 } from "lucide-react";
import JobCreationChat from "@/components/customer/JobCreationChat";
import { useJobCreationStore } from "@/store/jobCreationStore";
import { Button } from "@/components/ui/button";

export default function CreateJobPage() {
  const router = useRouter();
  const { initJobCreation, jobCreated, createdJobId, reset } = useJobCreationStore();

  useEffect(() => {
    initJobCreation();
    
    // Cleanup on unmount
    return () => {
      reset();
    };
  }, [initJobCreation, reset]);

  const handleViewJob = () => {
    if (createdJobId) {
      router.push(`/dashboard/jobs`);
    }
  };

  const handleCreateAnother = () => {
    reset();
    initJobCreation();
  };

  if (jobCreated) {
    return (
      <div className="max-w-2xl mx-auto">
        <div className="bg-white rounded-2xl border border-gray-100 p-8 text-center space-y-6">
          <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mx-auto">
            <CheckCircle2 className="w-8 h-8 text-green-600" />
          </div>
          
          <div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              Job Posted Successfully!
            </h2>
            <p className="text-gray-600">
              Your job has been posted and artisans can now send proposals.
              You'll be notified when proposals come in.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 justify-center pt-4">
            <Button
              onClick={handleViewJob}
              className="bg-[var(--orange)] hover:bg-[var(--orange)]/90 text-white"
            >
              View My Jobs
            </Button>
            <Button
              onClick={handleCreateAnother}
              variant="outline"
            >
              Create Another Job
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <button
          onClick={() => router.back()}
          className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700 mb-4"
        >
          <ArrowLeft className="w-4 h-4" />
          Back
        </button>
        <h1 className="text-2xl font-bold text-gray-900">Create a Job Post</h1>
        <p className="text-gray-500 mt-1">
          Tell me what you need done using voice or text, and I'll help you create a job post.
        </p>
      </div>

      {/* Chat Interface */}
      <div className="bg-white rounded-2xl border border-gray-100 p-4 sm:p-6 h-[600px]">
        <JobCreationChat />
      </div>

      {/* Help Text */}
      <div className="mt-4 text-center">
        <p className="text-xs text-gray-500">
          💡 Try saying: "I need a plumber to fix my bathroom sink in Lagos, budget is 5000 naira"
        </p>
      </div>
    </div>
  );
}
