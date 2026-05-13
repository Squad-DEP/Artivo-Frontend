export interface Badge {
  id: string;
  name: string;
  description: string;
  icon: string;
  earned_at: string;
  category: "verification" | "achievement" | "milestone" | "skill";
}

export interface TrustScoreComponents {
  completion_rate: number; // 0-100
  response_time: number; // 0-100
  customer_satisfaction: number; // 0-100
  verification_level: number; // 0-100
  tenure_months: number;
}

export interface TrustScore {
  overall: number; // 0-100
  components: TrustScoreComponents;
  badges: Badge[];
  last_updated: string;
  trend: "up" | "down" | "stable";
  trend_change: number;
}

export interface Review {
  id: string;
  job_id: string;
  job_title: string;
  reviewer_id: string;
  reviewer_name: string;
  reviewer_image?: string;
  reviewee_id: string;
  rating: number; // 1-5
  comment: string;
  response?: string;
  response_at?: string;
  helpful_count: number;
  created_at: string;
  updated_at: string;
  is_verified: boolean;
}

export interface ReviewSummary {
  total_reviews: number;
  average_rating: number;
  rating_distribution: {
    5: number;
    4: number;
    3: number;
    2: number;
    1: number;
  };
  recent_reviews: Review[];
}

export interface CreateReviewRequest {
  job_id: string;
  reviewee_id: string;
  rating: number;
  comment: string;
}

export interface UpdateReviewRequest {
  rating?: number;
  comment?: string;
}

export interface ReviewResponse {
  response: string;
}

export interface ReputationHistory {
  date: string;
  trust_score: number;
  event?: string;
}

export interface ReputationInsight {
  type: "positive" | "negative" | "neutral";
  title: string;
  description: string;
  impact: number;
  action?: string;
}

export interface WorkerReputation {
  trust_score: TrustScore;
  review_summary: ReviewSummary;
  history: ReputationHistory[];
  insights: ReputationInsight[];
  rank_percentile: number;
}

export interface CreditScoreComponents {
  job_completion: number; // 0-100 weight
  earnings_consistency: number; // 0-100 weight
  tenure: number; // 0-100 weight
  verification_level: number; // 0-100 weight
  payment_history: number; // 0-100 weight
}

export interface CreditScore {
  score: number; // 300-850
  components: CreditScoreComponents;
  last_updated: string;
  trend: "up" | "down" | "stable";
  trend_change: number;
  eligible_products: CreditProduct[];
}

export interface CreditProduct {
  id: string;
  name: string;
  type: "loan" | "savings" | "insurance" | "credit_line";
  provider: string;
  description: string;
  min_credit_score: number;
  max_amount?: number;
  interest_rate?: number;
  terms?: string;
}

export interface CreditHistory {
  date: string;
  score: number;
  event?: string;
}

export interface CreditInsight {
  type: "positive" | "negative" | "neutral";
  title: string;
  description: string;
  impact: string;
  action?: string;
}

export interface WorkerCreditProfile {
  credit_score: CreditScore;
  history: CreditHistory[];
  insights: CreditInsight[];
  financial_summary: {
    total_earnings: number;
    average_monthly_earnings: number;
    earnings_trend: "up" | "down" | "stable";
    on_time_payment_rate: number;
  };
}
