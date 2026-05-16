import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { getApiBaseUrl } from "@/api/api-service";
import type { WorkerProfile } from "@/api/types/worker";
import type { PublicProfileResponse } from "@/api/types/marketplace-api";
import type { Review } from "@/api/types/reputation";
import { BRAND } from "@/lib/constants";
import { ArtisanProfileContent } from "./_components/ArtisanProfileContent";

interface PageProps {
  params: Promise<{ username: string }>;
}

/**
 * Fetches a worker's public profile from GET /profile/:slug.
 * This endpoint is accessible without authentication.
 * Returns null if the profile is not found (404).
 *
 * Validates: Requirements 13.1, 13.4, 13.5
 */
async function fetchWorkerByUsername(
  username: string
): Promise<WorkerProfile | null> {
  // Use mock data when NEXT_PUBLIC_USE_MOCKS is enabled
  if (process.env.NEXT_PUBLIC_USE_MOCKS === "true") {
    const { mockWorkerProfiles } = await import("@/api/mock-data");
    const worker = mockWorkerProfiles.find((w) => w.username === username);
    return worker || null;
  }

  try {
    const baseUrl = getApiBaseUrl();
    const res = await fetch(`${baseUrl}/v1/public/profile/${username}`, {
      next: { revalidate: 60 },
    });

    if (res.status === 404) {
      return null;
    }

    if (!res.ok) {
      return null;
    }

    const data: PublicProfileResponse = await res.json();
    const p = data.worker;

    // Map the full public profile response to the WorkerProfile type
    const workerProfile: WorkerProfile = {
      id: p.share_slug,
      user_id: p.share_slug,
      display_name: p.display_name,
      username,
      bio: p.bio ?? "",
      phone: p.phone ?? undefined,
      profile_image_url: p.photo_url ?? undefined,
      skills: (p.skills ?? []).map((skillName, idx) => ({
        id: `skill-${idx}`,
        name: skillName,
      })),
      categories: [],
      location: {
        city: p.location ?? "",
        state: "",
        country: "",
      },
      portfolio: (p.portfolio ?? []).map((item) => ({
        id: item.id,
        title: item.title,
        description: item.description ?? undefined,
        image_url: item.image_url ?? "",
        images: item.images ?? [],
        category: item.category ?? undefined,
        created_at: item.created_at ?? new Date().toISOString(),
      })),
      experience: (p.experience ?? []).map((e) => ({
        id: e.id,
        title: e.title,
        company: e.company,
        start_year: e.start_year,
        end_year: e.end_year ?? undefined,
        description: e.description ?? undefined,
      })),
      education: (p.education ?? []).map((e) => ({
        id: e.id,
        title: e.title,
        institution: e.institution,
        year: e.year ?? 0,
      })),
      certifications: (p.certifications ?? []).map((c) => ({
        id: c.id,
        title: c.title,
        issuer: c.issuer,
        year: c.year ?? 0,
      })),
      languages: p.languages ?? [],
      hourly_rate: p.hourly_rate ?? undefined,
      minimum_budget: p.minimum_budget ?? undefined,
      trust_score: Math.round((p.average_rating / 5) * 100),
      completed_jobs: 0,
      completion_rate: undefined,
      rating: p.average_rating,
      reviews_count: 0,
      verification_status: "verified",
      availability: (p.availability === "unavailable" ? "offline" : (p.availability as "available" | "busy" | "offline")) ?? "available",
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    return workerProfile;
  } catch {
    return null;
  }
}

async function fetchWorkerReviews(workerId: string): Promise<Review[]> {
  if (process.env.NEXT_PUBLIC_USE_MOCKS === "true") {
    const { mockReviews } = await import("@/api/mock-data");
    // Return reviews for this worker (or all reviews as demo data)
    const workerReviews = mockReviews.filter(
      (r) => r.reviewee_id === workerId
    );
    return workerReviews.length > 0 ? workerReviews : mockReviews;
  }

  try {
    const baseUrl = getApiBaseUrl();
    const res = await fetch(`${baseUrl}/v1/workers/${workerId}/reviews`, {
      next: { revalidate: 60 },
    });

    if (!res.ok) {
      return [];
    }

    const data = await res.json();
    return data.recent_reviews ?? data ?? [];
  } catch {
    return [];
  }
}

/**
 * Generates OpenGraph and Twitter meta tags for social sharing.
 * Includes the worker's name, bio, skills, and reputation metrics.
 *
 * Validates: Requirements 13.3
 */
export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { username } = await params;
  const worker = await fetchWorkerByUsername(username);

  if (!worker) {
    return {
      title: "Profile Not Found | Artivo",
      description: "This artisan profile does not exist.",
    };
  }

  const skillsList = worker.skills.map((s) => s.name).join(", ");
  const title = `${worker.display_name} - Artisan on ${BRAND.name}`;
  const bio = worker.bio || "";
  const description = bio.length > 160 ? `${bio.slice(0, 157)}...` : bio || `${worker.display_name} is an artisan on ${BRAND.name}`;
  const completionRate = worker.completion_rate ?? 0;
  const extendedDescription = `${description} | Skills: ${skillsList} | Rating: ${worker.rating}/5 | ${worker.completed_jobs} jobs completed | Trust Score: ${worker.trust_score}/100 | Completion Rate: ${completionRate}%`;

  return {
    title,
    description: extendedDescription,
    openGraph: {
      title,
      description: extendedDescription,
      type: "profile",
      url: `${BRAND.website}/artisan/${username}`,
      siteName: BRAND.name,
    },
    twitter: {
      card: "summary",
      title,
      description: extendedDescription,
    },
  };
}

export default async function ArtisanProfilePage({ params }: PageProps) {
  const { username } = await params;
  const worker = await fetchWorkerByUsername(username);

  if (!worker) {
    notFound();
  }

  const reviews = await fetchWorkerReviews(worker.id);

  return <ArtisanProfileContent worker={worker} reviews={reviews} />;
}
