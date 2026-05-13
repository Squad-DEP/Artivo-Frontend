export type UserType = "worker" | "customer" | "business";

export interface UserTypeConfig {
  type: UserType;
  label: string;
  description: string;
  icon: string;
  dashboardPath: string;
  features: string[];
}

export const USER_TYPES: Record<UserType, UserTypeConfig> = {
  worker: {
    type: "worker",
    label: "Artisan / Worker",
    description: "I offer services and want to find jobs",
    icon: "Wrench",
    dashboardPath: "/dashboard/worker",
    features: [
      "Create professional profile",
      "Get matched to jobs with AI",
      "Build trust score & reputation",
      "Access alternative credit scoring",
      "Receive secure payments",
      "Track earnings & insights",
    ],
  },
  customer: {
    type: "customer",
    label: "Customer / Client",
    description: "I need to hire skilled workers",
    icon: "User",
    dashboardPath: "/dashboard/customer",
    features: [
      "Find verified artisans",
      "Get AI-powered recommendations",
      "Post jobs and receive quotes",
      "Secure payments",
      "Rate and review workers",
      "Track job progress",
    ],
  },
  business: {
    type: "business",
    label: "Business / Lender",
    description: "I want API access for lending or services",
    icon: "Building2",
    dashboardPath: "/dashboard/business",
    features: [
      "API access to credit scores",
      "Bulk worker verification",
      "Integration with your platform",
      "Custom scoring models",
      "Analytics dashboard",
      "Enterprise support",
    ],
  },
} as const;

export const VERIFICATION_STATUS = {
  unverified: {
    label: "Unverified",
    color: "gray",
    description: "Complete verification to unlock more features",
  },
  pending: {
    label: "Pending",
    color: "yellow",
    description: "Your verification is being reviewed",
  },
  verified: {
    label: "Verified",
    color: "green",
    description: "Your identity has been verified",
  },
  rejected: {
    label: "Rejected",
    color: "red",
    description: "Verification was not successful. Please try again.",
  },
} as const;

export type VerificationStatus = keyof typeof VERIFICATION_STATUS;

export const AVAILABILITY_STATUS = {
  available: {
    label: "Available",
    color: "green",
    description: "Ready to take on new jobs",
  },
  busy: {
    label: "Busy",
    color: "yellow",
    description: "Currently working on jobs",
  },
  offline: {
    label: "Offline",
    color: "gray",
    description: "Not accepting jobs right now",
  },
} as const;

export type AvailabilityStatus = keyof typeof AVAILABILITY_STATUS;

export const JOB_STATUS = {
  draft: {
    label: "Draft",
    color: "gray",
    description: "Job has not been posted yet",
  },
  open: {
    label: "Open",
    color: "blue",
    description: "Job is open for applications",
  },
  in_progress: {
    label: "In Progress",
    color: "yellow",
    description: "Work is currently underway",
  },
  worker_completed: {
    label: "Worker Completed",
    color: "yellow",
    description: "Worker has confirmed completion, waiting for customer",
  },
  customer_completed: {
    label: "Customer Completed",
    color: "yellow",
    description: "Customer has confirmed completion, waiting for worker",
  },
  completed: {
    label: "Completed",
    color: "green",
    description: "Job has been completed successfully",
  },
  cancelled: {
    label: "Cancelled",
    color: "red",
    description: "Job was cancelled",
  },
  disputed: {
    label: "Disputed",
    color: "orange",
    description: "There is a dispute on this job",
  },
} as const;

export type JobStatus = keyof typeof JOB_STATUS;

export const PAYMENT_STATUS = {
  pending: {
    label: "Pending",
    color: "gray",
    description: "Payment has not been made",
  },
  held: {
    label: "Held",
    color: "blue",
    description: "Payment is held securely",
  },
  released: {
    label: "Released",
    color: "green",
    description: "Payment has been released to worker",
  },
  refunded: {
    label: "Refunded",
    color: "orange",
    description: "Payment was refunded to customer",
  },
} as const;

export type PaymentStatus = keyof typeof PAYMENT_STATUS;

export const TRUST_SCORE_RANGES = {
  excellent: { min: 90, max: 100, label: "Excellent", color: "green" },
  good: { min: 75, max: 89, label: "Good", color: "blue" },
  fair: { min: 60, max: 74, label: "Fair", color: "yellow" },
  building: { min: 0, max: 59, label: "Building", color: "gray" },
} as const;

export const getTrustScoreLabel = (score: number) => {
  if (score >= 90) return TRUST_SCORE_RANGES.excellent;
  if (score >= 75) return TRUST_SCORE_RANGES.good;
  if (score >= 60) return TRUST_SCORE_RANGES.fair;
  return TRUST_SCORE_RANGES.building;
};

export const CREDIT_SCORE_RANGES = {
  excellent: { min: 750, max: 850, label: "Excellent", color: "green" },
  good: { min: 650, max: 749, label: "Good", color: "blue" },
  fair: { min: 550, max: 649, label: "Fair", color: "yellow" },
  poor: { min: 300, max: 549, label: "Building", color: "gray" },
} as const;

export const getCreditScoreLabel = (score: number) => {
  if (score >= 750) return CREDIT_SCORE_RANGES.excellent;
  if (score >= 650) return CREDIT_SCORE_RANGES.good;
  if (score >= 550) return CREDIT_SCORE_RANGES.fair;
  return CREDIT_SCORE_RANGES.poor;
};
