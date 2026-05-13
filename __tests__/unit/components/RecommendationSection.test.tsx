/**
 * @vitest-environment jsdom
 */
import React from "react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import "@testing-library/jest-dom/vitest";
import { RecommendationSection } from "@/components/marketplace/RecommendationSection";

// Mock the marketplace store
const mockFetchRecommendations = vi.fn();

vi.mock("@/store/marketplaceStore", () => ({
  useMarketplaceStore: vi.fn(),
}));

import { useMarketplaceStore } from "@/store/marketplaceStore";
const mockUseMarketplaceStore = vi.mocked(useMarketplaceStore);

const mockWorkers = [
  {
    id: "w1",
    user_id: "u1",
    display_name: "Alice Builder",
    username: "alice-builder",
    skills: ["Carpentry", "Woodwork"],
    primary_category: "Construction",
    location: { city: "Lagos", state: "Lagos" },
    trust_score: 85,
    rating: 4.8,
    reviews_count: 32,
    completed_jobs: 45,
    hourly_rate: 5000,
    verification_status: "verified" as const,
    availability: "available" as const,
  },
  {
    id: "w2",
    user_id: "u2",
    display_name: "Bob Plumber",
    username: "bob-plumber",
    skills: ["Plumbing"],
    primary_category: "Home Services",
    location: { city: "Abuja", state: "FCT" },
    trust_score: 92,
    rating: 4.5,
    reviews_count: 18,
    completed_jobs: 30,
    hourly_rate: 4000,
    verification_status: "unverified" as const,
    availability: "available" as const,
  },
  {
    id: "w3",
    user_id: "u3",
    display_name: "Carol Electrician",
    username: "carol-elec",
    skills: ["Electrical"],
    primary_category: "Home Services",
    location: { city: "Lagos", state: "Lagos" },
    trust_score: 78,
    rating: 4.9,
    reviews_count: 50,
    completed_jobs: 60,
    hourly_rate: 6000,
    verification_status: "verified" as const,
    availability: "busy" as const,
  },
];

describe("RecommendationSection", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockFetchRecommendations.mockReset();
  });

  it("shows loading state while fetching recommendations", () => {
    mockUseMarketplaceStore.mockReturnValue({
      recommendations: [],
      isLoadingRecommendations: true,
      error: null,
      fetchRecommendations: mockFetchRecommendations,
    } as any);

    render(<RecommendationSection />);
    expect(screen.getByText("Loading recommendations...")).toBeInTheDocument();
  });

  it("displays personalized recommendations for returning customers", () => {
    mockUseMarketplaceStore.mockReturnValue({
      recommendations: mockWorkers,
      isLoadingRecommendations: false,
      error: null,
      fetchRecommendations: mockFetchRecommendations,
    } as any);

    render(<RecommendationSection isNewCustomer={false} />);
    expect(screen.getByText("Recommended for You")).toBeInTheDocument();
    expect(screen.getByText("Alice Builder")).toBeInTheDocument();
    expect(screen.getByText("Bob Plumber")).toBeInTheDocument();
    expect(screen.getByText("Carol Electrician")).toBeInTheDocument();
  });

  it("displays workers sorted by trust score for new customers (fallback)", () => {
    mockUseMarketplaceStore.mockReturnValue({
      recommendations: mockWorkers,
      isLoadingRecommendations: false,
      error: null,
      fetchRecommendations: mockFetchRecommendations,
    } as any);

    render(<RecommendationSection isNewCustomer={true} />);
    expect(screen.getByText("Top Rated Workers")).toBeInTheDocument();
    expect(screen.getByText("— sorted by trust score")).toBeInTheDocument();

    // All workers should still be displayed
    expect(screen.getByText("Alice Builder")).toBeInTheDocument();
    expect(screen.getByText("Bob Plumber")).toBeInTheDocument();
    expect(screen.getByText("Carol Electrician")).toBeInTheDocument();
  });

  it("sorts workers by trust score descending for new customers", () => {
    mockUseMarketplaceStore.mockReturnValue({
      recommendations: mockWorkers,
      isLoadingRecommendations: false,
      error: null,
      fetchRecommendations: mockFetchRecommendations,
    } as any);

    const { container } = render(<RecommendationSection isNewCustomer={true} />);
    const links = container.querySelectorAll("a");

    // Bob (92) should come first, then Alice (85), then Carol (78)
    expect(links[0]).toHaveAttribute("href", "/artisan/bob-plumber");
    expect(links[1]).toHaveAttribute("href", "/artisan/alice-builder");
    expect(links[2]).toHaveAttribute("href", "/artisan/carol-elec");
  });

  it("shows error state with retry button on failure", () => {
    mockUseMarketplaceStore.mockReturnValue({
      recommendations: [],
      isLoadingRecommendations: false,
      error: "Network error",
      fetchRecommendations: mockFetchRecommendations,
    } as any);

    render(<RecommendationSection />);
    expect(
      screen.getByText("Unable to load recommendations. Please try again later.")
    ).toBeInTheDocument();
    expect(screen.getByText("Retry")).toBeInTheDocument();
  });

  it("renders nothing when there are no recommendations and no error", () => {
    mockUseMarketplaceStore.mockReturnValue({
      recommendations: [],
      isLoadingRecommendations: false,
      error: null,
      fetchRecommendations: mockFetchRecommendations,
    } as any);

    const { container } = render(<RecommendationSection />);
    expect(container.firstChild).toBeNull();
  });

  it("calls fetchRecommendations on mount", () => {
    mockUseMarketplaceStore.mockReturnValue({
      recommendations: [],
      isLoadingRecommendations: true,
      error: null,
      fetchRecommendations: mockFetchRecommendations,
    } as any);

    render(<RecommendationSection />);
    expect(mockFetchRecommendations).toHaveBeenCalledTimes(1);
  });
});
