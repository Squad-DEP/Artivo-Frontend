import type { BackendFeedWorker } from "@/api/types/marketplace-api";
import type { WorkerProfileSummary } from "@/api/types/worker";

/**
 * Parses a string location (e.g., "Lagos") into a { city, state } object.
 * When only a single value is provided, it is used for both city and state.
 * If a comma-separated format is provided (e.g., "Ikeja, Lagos"), the first
 * part is used as city and the second as state.
 */
export function parseLocation(location: string): { city: string; state: string } {
  if (!location) {
    return { city: "", state: "" };
  }

  const parts = location.split(",").map((part) => part.trim());

  if (parts.length >= 2) {
    return { city: parts[0], state: parts[1] };
  }

  return { city: parts[0], state: parts[0] };
}

/**
 * Maps a backend feed worker object to the frontend WorkerProfileSummary type.
 * This adapter bridges the difference between the backend's flat worker object
 * and the frontend's richer type contract used by WorkerCard components.
 */
export function mapFeedWorkerToSummary(worker: BackendFeedWorker): WorkerProfileSummary {
  return {
    id: worker.id,
    user_id: worker.id,
    display_name: worker.display_name || worker.full_name,
    profile_image_url: worker.photo_url,
    skills: worker.skills,
    primary_category: worker.skills[0] ?? "General",
    location: parseLocation(worker.location),
    trust_score: worker.credit_score,
    rating: worker.average_rating,
    reviews_count: 0, // Not provided by feed endpoint
    completed_jobs: worker.total_jobs,
    verification_status: "verified",
    availability: "available",
    tagline: worker.match_explanation,
  };
}
