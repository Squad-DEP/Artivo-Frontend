/** Backend worker object returned by GET /customer/feed */
export interface BackendFeedWorker {
  id: string;
  full_name: string;
  display_name: string;
  photo_url: string;
  bio: string;
  skills: string[];
  location: string;
  share_slug?: string | null;
  credit_score: number;
  completion_rate: number;
  total_jobs: number;
  average_rating: number;
  match_score: number;
  match_explanation?: string;
}

/** GET /customer/feed response */
export interface FeedResponse {
  workers: BackendFeedWorker[];
}

/** POST /customer/request-job request */
export interface RequestJobPayload {
  job_type_id: string;
  title: string;
  description: string;
  location: string;
  budget: number;
}

/** POST /customer/request-job response */
export interface RequestJobResponse {
  job_request: {
    id: string;
    status: string;
    created_at: string;
  };
}

/** POST /customer/hire request */
export interface HirePayload {
  job_request_id: string;
  worker_id: string;
  amount: number;
  payment_method?: "online" | "offline";
}

/** POST /customer/hire response */
export interface HireResponse {
  job: {
    id: string;
    status: string;
    created_at: string;
  };
}

/**
 * POST /customer/verify-payment
 * Called after Squad's onSuccess fires with the transaction reference.
 * The backend verifies the transaction with Squad before logging.
 */
export interface VerifyPaymentPayload {
  job_id: string;
  transaction_reference: string;
}

export interface VerifyPaymentResponse {
  payment_log: {
    id: string;
    squadTransactionId: string;
    amount: number;
    status: string;
    jobId: string;
  };
  msg: string;
}

/** POST /customer/rate & POST /worker/rate-customer request */
export interface RatePayload {
  job_id: string;
  rating: number;
  comment: string;
}

/** POST /customer/rate response */
export interface RateResponse {
  review: Record<string, unknown>;
  msg: string;
}

/** POST /ai/onboard/voice request */
export interface VoiceOnboardPayload {
  audioData: string; // base64
  userType: "artisan" | "customer";
}

/** POST /ai/onboard/voice response */
export interface VoiceOnboardResponse {
  message: boolean;
  data: {
    fullName: string;
    skills: string[];
    bio: string;
    experience: string;
    avgPay: string;
    location: string;
  };
}

/** POST /ai/onboard/text request */
export interface TextOnboardPayload {
  text: string;
  userType: "artisan" | "customer";
  context: Array<{ role: string; content: string }>;
}

/** POST /ai/extract-job/voice request */
export interface ExtractJobVoicePayload {
  audioData: string; // base64
}

/** POST /ai/extract-job/text request */
export interface ExtractJobTextPayload {
  text: string;
}

/** POST /ai/extract-job/voice & /ai/extract-job/text response */
export interface ExtractJobResponse {
  success: boolean;
  data: {
    job_type_id: string;
    title: string;
    description: string;
    location?: string;
    budget?: number;
    confidence?: string;
    language_detected?: string;
  };
}

/** GET /matching/job-types response */
export interface JobTypesResponse {
  id: string;
  name: string;
  description: string;
}

/** POST /worker/subscribe request */
export interface SubscribePayload {
  job_type_id: string;
}

/** POST /worker/accept-job request */
export interface AcceptJobPayload {
  job_request_id: string;
  proposed_amount: number;
}

/** GET /account/virtual-account response */
export interface VirtualAccountResponse {
  virtual_account: {
    account_number: string;
    account_name: string;
    bank_name: string;
    bank_code: string;
    customer_identifier?: string;
    balance: number;
    total_deposited: number;
  };
}

/** Advance payment request (partial escrow release for materials) */
export interface AdvanceRequest {
  id: string;
  job_id: string;
  worker_id: string;
  customer_id: string;
  amount: number;
  reason: string | null;
  status: "pending" | "approved" | "rejected";
  requested_at: string;
  approved_at: string | null;
}

export interface AdvanceRequestsResponse {
  advance_requests: AdvanceRequest[];
}

export interface AdvanceRequestResponse {
  advance_request: AdvanceRequest;
}

/** GET /profile/:slug response */
export interface PublicProfileWorker {
  id: string;
  full_name: string;
  bio: string;
  skills: string[];
  credit_score: number;
  completion_rate: number;
  total_jobs: number;
  average_rating: number;
}

export interface PublicProfileResponse {
  worker: PublicProfileWorker;
}

/** SSE event types from /worker/jobs/stream */
export type SSEEvent =
  | { type: "connected"; message: string }
  | { type: "jobs"; data: StreamedJob[] };

/** Job object received via SSE stream */
export interface StreamedJob {
  id: string;
  title: string;
  description: string;
  location: string;
  budget: number;
  job_type: string;
  customer_name: string;
  created_at: string;
}
