/**
 * @vitest-environment jsdom
 */
import React from "react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import "@testing-library/jest-dom/vitest";
import { RatingDialog } from "@/components/jobs/RatingDialog";

// Mock the apiService
vi.mock("@/api/api-service", () => ({
  apiService: {
    post: vi.fn(),
  },
}));

import { apiService } from "@/api/api-service";
const mockPost = vi.mocked(apiService.post);

describe("RatingDialog", () => {
  const defaultProps = {
    isOpen: true,
    onClose: vi.fn(),
    jobId: "job-123",
    jobStatus: "completed",
    role: "customer" as const,
    onRatingSubmitted: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
    mockPost.mockReset();
  });

  it("renders dialog with title and description when open", () => {
    render(<RatingDialog {...defaultProps} />);
    expect(screen.getByText("Rate this Job")).toBeInTheDocument();
    expect(
      screen.getByText(
        "Share your experience by selecting a rating and leaving an optional comment."
      )
    ).toBeInTheDocument();
  });

  it("renders 5 star rating buttons", () => {
    render(<RatingDialog {...defaultProps} />);
    const stars = screen.getAllByRole("radio");
    expect(stars).toHaveLength(5);
  });

  it("does not render when isOpen is false", () => {
    render(<RatingDialog {...defaultProps} isOpen={false} />);
    expect(screen.queryByText("Rate this Job")).not.toBeInTheDocument();
  });

  it("disables submit button when no rating is selected", () => {
    render(<RatingDialog {...defaultProps} />);
    const submitButton = screen.getByRole("button", { name: "Submit Rating" });
    expect(submitButton).toBeDisabled();
  });

  it("enables submit button when a rating is selected", () => {
    render(<RatingDialog {...defaultProps} />);
    const stars = screen.getAllByRole("radio");
    fireEvent.click(stars[3]); // 4 stars
    const submitButton = screen.getByRole("button", { name: "Submit Rating" });
    expect(submitButton).not.toBeDisabled();
  });

  it("shows disabled notice when job status is not completed", () => {
    render(<RatingDialog {...defaultProps} jobStatus="in_progress" />);
    expect(
      screen.getByText("Rating is only available for completed jobs.")
    ).toBeInTheDocument();
  });

  it("disables star buttons when job status is not completed", () => {
    render(<RatingDialog {...defaultProps} jobStatus="in_progress" />);
    const stars = screen.getAllByRole("radio");
    stars.forEach((star) => {
      expect(star).toBeDisabled();
    });
  });

  it("disables submit button when job status is not completed", () => {
    render(<RatingDialog {...defaultProps} jobStatus="in_progress" />);
    const submitButton = screen.getByRole("button", { name: "Submit Rating" });
    expect(submitButton).toBeDisabled();
  });

  it("calls POST /customer/rate for customer role", async () => {
    mockPost.mockResolvedValue({ review: {}, msg: "Success" });

    render(<RatingDialog {...defaultProps} role="customer" />);

    // Select 4 stars
    const stars = screen.getAllByRole("radio");
    fireEvent.click(stars[3]);

    // Enter comment
    const commentInput = screen.getByPlaceholderText("Share your experience...");
    fireEvent.change(commentInput, { target: { value: "Great work!" } });

    // Submit
    fireEvent.click(screen.getByRole("button", { name: "Submit Rating" }));

    await waitFor(() => {
      expect(mockPost).toHaveBeenCalledWith("/customer/rate", {
        body: { job_id: "job-123", rating: 4, comment: "Great work!" },
      });
    });
  });

  it("calls POST /worker/rate-customer for worker role", async () => {
    mockPost.mockResolvedValue({ review: {}, msg: "Success" });

    render(<RatingDialog {...defaultProps} role="worker" />);

    // Select 5 stars
    const stars = screen.getAllByRole("radio");
    fireEvent.click(stars[4]);

    // Submit without comment (optional)
    fireEvent.click(screen.getByRole("button", { name: "Submit Rating" }));

    await waitFor(() => {
      expect(mockPost).toHaveBeenCalledWith("/worker/rate-customer", {
        body: { job_id: "job-123", rating: 5, comment: "" },
      });
    });
  });

  it("shows confirmation on success", async () => {
    mockPost.mockResolvedValue({ review: {}, msg: "Success" });

    render(<RatingDialog {...defaultProps} />);

    const stars = screen.getAllByRole("radio");
    fireEvent.click(stars[2]); // 3 stars

    fireEvent.click(screen.getByRole("button", { name: "Submit Rating" }));

    await waitFor(() => {
      expect(screen.getByText("Rating Submitted")).toBeInTheDocument();
      expect(
        screen.getByText("Your rating has been recorded successfully.")
      ).toBeInTheDocument();
    });
  });

  it("calls onRatingSubmitted callback on success", async () => {
    mockPost.mockResolvedValue({ review: {}, msg: "Success" });

    render(<RatingDialog {...defaultProps} />);

    const stars = screen.getAllByRole("radio");
    fireEvent.click(stars[0]); // 1 star

    fireEvent.click(screen.getByRole("button", { name: "Submit Rating" }));

    await waitFor(() => {
      expect(defaultProps.onRatingSubmitted).toHaveBeenCalled();
    });
  });

  it("preserves input on failure for retry", async () => {
    mockPost.mockRejectedValue(new Error("Network error"));

    render(<RatingDialog {...defaultProps} />);

    // Select 4 stars
    const stars = screen.getAllByRole("radio");
    fireEvent.click(stars[3]);

    // Enter comment
    const commentInput = screen.getByPlaceholderText("Share your experience...");
    fireEvent.change(commentInput, { target: { value: "My feedback" } });

    // Submit
    fireEvent.click(screen.getByRole("button", { name: "Submit Rating" }));

    await waitFor(() => {
      expect(screen.getByText("Network error")).toBeInTheDocument();
    });

    // Verify input is preserved
    expect(commentInput).toHaveValue("My feedback");
    // Rating should still be selected (star 4 should be aria-checked)
    expect(stars[3]).toHaveAttribute("aria-checked", "true");
  });

  it("shows loading state during submission", async () => {
    // Create a promise that we can control
    let resolvePromise: (value: unknown) => void;
    const pendingPromise = new Promise((resolve) => {
      resolvePromise = resolve;
    });
    mockPost.mockReturnValue(pendingPromise as any);

    render(<RatingDialog {...defaultProps} />);

    const stars = screen.getAllByRole("radio");
    fireEvent.click(stars[2]);

    fireEvent.click(screen.getByRole("button", { name: "Submit Rating" }));

    await waitFor(() => {
      expect(screen.getByText("Submitting...")).toBeInTheDocument();
    });

    // Resolve to clean up
    resolvePromise!({ review: {}, msg: "Success" });
  });

  it("allows submission without comment (comment is optional)", async () => {
    mockPost.mockResolvedValue({ review: {}, msg: "Success" });

    render(<RatingDialog {...defaultProps} />);

    const stars = screen.getAllByRole("radio");
    fireEvent.click(stars[4]); // 5 stars

    // Submit without entering a comment
    fireEvent.click(screen.getByRole("button", { name: "Submit Rating" }));

    await waitFor(() => {
      expect(mockPost).toHaveBeenCalledWith("/customer/rate", {
        body: { job_id: "job-123", rating: 5, comment: "" },
      });
    });
  });
});
