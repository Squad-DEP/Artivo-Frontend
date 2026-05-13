import type { ServiceCategory } from "@/lib/constants/categories";
import type { VerificationStatus, AvailabilityStatus } from "@/lib/constants/user-types";

export interface Location {
  city: string;
  state: string;
  country: string;
  coordinates?: {
    lat: number;
    lng: number;
  };
}

export interface Skill {
  id: string;
  name: string;
  years_experience?: number;
  verified?: boolean;
}

export interface PortfolioItem {
  id: string;
  title: string;
  description?: string;
  image_url: string;
  /** Additional images for the project (displayed in modal gallery) */
  images?: string[];
  created_at: string;
  category?: string;
}

export interface CreditScoreData {
  score: number;
  last_updated: string;
  factors: {
    job_completion: number;
    earnings_consistency: number;
    tenure: number;
    verification_level: number;
  };
}

export interface ExperienceItem {
  id: string;
  title: string;
  company: string;
  start_year: number;
  end_year?: number;
  description?: string;
}

export interface EducationItem {
  id: string;
  title: string;
  institution: string;
  year: number;
}

export interface CertificationItem {
  id: string;
  title: string;
  issuer: string;
  year: number;
}

export interface WorkerProfile {
  id: string;
  user_id: string;
  display_name: string;
  username?: string;
  bio: string;
  phone?: string;
  skills: Skill[];
  categories: ServiceCategory[];
  location: Location;
  portfolio: PortfolioItem[];
  trust_score: number;
  credit_score?: CreditScoreData;
  verification_status: VerificationStatus;
  hourly_rate?: number;
  minimum_budget?: number;
  completed_jobs: number;
  /** Completion rate as a percentage (0-100), available from public profile endpoint */
  completion_rate?: number;
  rating: number;
  reviews_count: number;
  availability: AvailabilityStatus;
  response_time_hours?: number;
  profile_image_url?: string;
  cover_image_url?: string;
  experience?: ExperienceItem[];
  education?: EducationItem[];
  certifications?: CertificationItem[];
  languages?: string[];
  created_at: string;
  updated_at: string;
}

export interface WorkerProfileSummary {
  id: string;
  user_id: string;
  display_name: string;
  username?: string;
  profile_image_url?: string;
  skills: string[];
  primary_category: string;
  location: {
    city: string;
    state: string;
  };
  trust_score: number;
  rating: number;
  reviews_count: number;
  completed_jobs: number;
  hourly_rate?: number;
  verification_status: VerificationStatus;
  availability: AvailabilityStatus;
  /** Short tagline describing their specialty */
  tagline?: string;
  /** Preview thumbnail from portfolio */
  portfolio_preview?: {
    image_url: string;
    title: string;
  };
  /** Featured review snippet for social proof */
  featured_review?: {
    comment: string;
    reviewer_name: string;
    rating: number;
  };
  /** Response time in human-readable format */
  response_time?: string;
}

export interface CreateWorkerProfileRequest {
  display_name: string;
  bio: string;
  phone?: string;
  skills: string[];
  categories: string[];
  location: Location;
  hourly_rate?: number;
  minimum_budget?: number;
}

export interface UpdateWorkerProfileRequest {
  display_name?: string;
  username?: string;
  bio?: string;
  phone?: string;
  skills?: Skill[];
  categories?: string[];
  location?: Location;
  hourly_rate?: number;
  minimum_budget?: number;
  availability?: AvailabilityStatus;
  profile_image_url?: string;
  cover_image_url?: string;
}

export interface WorkerSearchParams {
  query?: string;
  category?: string;
  skills?: string[];
  location?: {
    city?: string;
    state?: string;
    country?: string;
  };
  min_rating?: number;
  min_trust_score?: number;
  verification_status?: VerificationStatus;
  availability?: AvailabilityStatus;
  max_hourly_rate?: number;
  page?: number;
  limit?: number;
  sort_by?: "rating" | "trust_score" | "completed_jobs" | "hourly_rate";
  sort_order?: "asc" | "desc";
}

export interface WorkerSearchResponse {
  workers: WorkerProfileSummary[];
  total: number;
  page: number;
  limit: number;
  has_more: boolean;
}
