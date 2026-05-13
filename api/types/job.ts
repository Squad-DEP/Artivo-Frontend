import type { ServiceCategory } from "@/lib/constants/categories";
import type { JobStatus, PaymentStatus } from "@/lib/constants/user-types";
import type { Location, WorkerProfileSummary } from "./worker";

export interface JobStage {
  id: string;
  job_id: string;
  title: string;
  description: string;
  amount: number;
  status: "pending" | "in_progress" | "completed" | "paid";
  due_date?: string;
  completed_at?: string;
  created_at: string;
  order: number;
}

export interface Job {
  id: string;
  title: string;
  description: string;
  category: ServiceCategory;
  budget_min: number;
  budget_max: number;
  final_amount?: number;
  location: Location;
  customer_id: string;
  customer_name?: string;
  worker_id?: string;
  worker?: WorkerProfileSummary;
  status: JobStatus;
  stages: JobStage[];
  created_at: string;
  updated_at: string;
  deadline?: string;
  started_at?: string;
  completed_at?: string;
  is_remote?: boolean;
  requirements?: string[];
  attachments?: JobAttachment[];
}

export interface JobAttachment {
  id: string;
  name: string;
  url: string;
  type: string;
  size: number;
  uploaded_at: string;
}

export interface JobSummary {
  id: string;
  title: string;
  category: string;
  budget_min: number;
  budget_max: number;
  location: {
    city: string;
    state: string;
  };
  status: JobStatus;
  customer_name?: string;
  worker_name?: string;
  created_at: string;
  deadline?: string;
  applications_count?: number;
}

export interface JobApplication {
  id: string;
  job_id: string;
  worker_id: string;
  worker: WorkerProfileSummary;
  proposed_amount: number;
  cover_letter?: string;
  estimated_duration?: string;
  status: "pending" | "accepted" | "rejected" | "withdrawn";
  created_at: string;
  updated_at: string;
}

export interface CreateJobRequest {
  title: string;
  description: string;
  category_id: string;
  budget_min: number;
  budget_max: number;
  location: Location;
  deadline?: string;
  is_remote?: boolean;
  requirements?: string[];
  stages?: CreateJobStageRequest[];
}

export interface CreateJobStageRequest {
  title: string;
  description: string;
  amount: number;
  due_date?: string;
}

export interface UpdateJobRequest {
  title?: string;
  description?: string;
  category_id?: string;
  budget_min?: number;
  budget_max?: number;
  location?: Location;
  deadline?: string;
  is_remote?: boolean;
  requirements?: string[];
  status?: JobStatus;
}

export interface JobSearchParams {
  query?: string;
  category?: string;
  location?: {
    city?: string;
    state?: string;
    country?: string;
  };
  min_budget?: number;
  max_budget?: number;
  status?: JobStatus;
  is_remote?: boolean;
  posted_within_days?: number;
  page?: number;
  limit?: number;
  sort_by?: "created_at" | "budget_max" | "deadline";
  sort_order?: "asc" | "desc";
}

export interface JobSearchResponse {
  jobs: JobSummary[];
  total: number;
  page: number;
  limit: number;
  has_more: boolean;
}

export interface JobPayment {
  id: string;
  job_id: string;
  stage_id?: string;
  amount: number;
  status: PaymentStatus;
  payment_method: "mobile_money" | "bank_transfer" | "wallet";
  transaction_id?: string;
  created_at: string;
  completed_at?: string;
}

export interface CustomerJobStats {
  total_jobs: number;
  active_jobs: number;
  completed_jobs: number;
  total_spent: number;
  pending_payments: number;
}

export interface WorkerJobStats {
  total_jobs: number;
  active_jobs: number;
  completed_jobs: number;
  total_earned: number;
  pending_earnings: number;
  completion_rate: number;
  average_rating: number;
}
