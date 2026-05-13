import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { getApiBaseUrl } from "@/api/api-service";
import type { WorkerProfile } from "@/api/types/worker";
import type { Review } from "@/api/types/reputation";
import { BRAND } from "@/lib/constants";
import { ArtisanProfileContent } from "./_components/ArtisanProfileContent";

interface PageProps {
  params: Promise<{ username: string }>;
}

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
    const res = await fetch(`${baseUrl}/v1/workers/username/${username}`, {
      next: { revalidate: 60 },
    });

    if (res.status === 404) {
      return null;
    }

    if (!res.ok) {
      return null;
    }

    return await res.json();
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

  const primaryCategory =
    worker.categories.length > 0 ? worker.categories[0].name : "Artisan";
  const title = `${worker.display_name} - ${primaryCategory} | ${BRAND.name}`;
  const description =
    worker.bio.length > 160 ? `${worker.bio.slice(0, 157)}...` : worker.bio;

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      type: "profile",
      url: `${BRAND.website}/artisan/${username}`,
      siteName: BRAND.name,
    },
    twitter: {
      card: "summary",
      title,
      description,
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
