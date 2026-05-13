/**
 * @vitest-environment jsdom
 */
import React from "react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import "@testing-library/jest-dom/vitest";
import { ReviewDialog } from "@/components/jobs/ReviewDialog";

// Mock the job store
const mockSubmitReview = vi.fn();

vi.mock("@/store/jobStore", () => ({
  useJobStore: vi.fn(),
}));

import { useJobStore } from "@/store/jobStore";
const mockUseJobStore = vi.mocked(useJobStore);

describe("ReviewDialog", () => {
  const defaultProps = {
    open: true,
    onOpenChange: vi.fn(),
    jobId: "job-123",
    jobTitle: "Build a website",
    revieweeId: "worker-456",
    revieweeName: "Jane Doe",
    onSuccess: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
    mockSubmitReview.mockReset();
    mockUseJobStore.mockReturnValue({
      submitReview: mockSubmitReview,
      isLoading: false,
      error: null,
    } as any);
  });

  it("renders dialog with title and description", () => {
    render(<ReviewDialog {...defaultProps} />);
    expect(screen.getByText("Leave a Review")).toBeInTheDocument();
    expect(
      screen.getByText(/Share your experience for "Build a website"/)
    ).toBeInTheDocument();
    expect(screen.getByText("Jane Doe")).toBeInTheDocument();
  });

  it("renders 5 star rating buttons", () => {
    render(<ReviewDialog {...defaultProps} />);
    const stars = screen.getAllByRole("radio");
    expect(stars).toHaveLength(5);
  });

  it("disables submit button when no rating is selected even with comment", () => {
    render(<ReviewDialog {...defaultProps} />);

    const commentInput = screen.getByPlaceholderText(
      "Describe your experience..."
    );
    fireEvent.change(commentInput, { target: { value: "Great work!" } });

    const submitButton = screen.getByRole("button", {
      name: "Submit Review",
    });
    expect(submitButton).toBeDisabled();
    expect(mockSubmitReview).not.toHaveBeenCalled();
  });

  it("shows validation error when submitting without comment", async () => {
    render(<ReviewDialog {...defaultProps} />);

    // Select a rating
    const stars = screen.getAllByRole("radio");
    fireEvent.click(stars[3]); // 4 stars

    const submitButton = screen.getByRole("button", {
      name: "Submit Review",
    });
    fireEvent.click(submitButton);

    expect(
      screen.getByText("Please provide a comment for your review")
    ).toBeInTheDocument();
    expect(mockSubmitReview).not.toHaveBeenCalled();
  });

  it("submits review with correct data on valid form", async () => {
    mockSubmitReview.mockResolvedValue(true);

    render(<ReviewDialog {...defaultProps} />);

    // Select 4 stars
    const stars = screen.getAllByRole("radio");
    fireEvent.click(stars[3]);

    // Enter comment
    const commentInput = screen.getByPlaceholderText(
      "Describe your experience..."
    );
    fireEvent.change(commentInput, {
      target: { value: "Excellent work, very professional!" },
    });

    // Submit
    const submitButton = screen.getByRole("button", {
      name: "Submit Review",
    });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(mockSubmitReview).toHaveBeenCalledWith({
        job_id: "job-123",
        reviewee_id: "worker-456",
        rating: 4,
        comment: "Excellent work, very professional!",
      });
    });
  });

  it("calls onSuccess and closes dialog on successful submission", async () => {
    mockSubmitReview.mockResolvedValue(true);

    render(<ReviewDialog {...defaultProps} />);

    // Select rating and enter comment
    const stars = screen.getAllByRole("radio");
    fireEvent.click(stars[4]); // 5 stars
    const commentInput = screen.getByPlaceholderText(
      "Describe your experience..."
    );
    fireEvent.change(commentInput, { target: { value: "Amazing!" } });

    // Submit
    fireEvent.click(
      screen.getByRole("button", { name: "Submit Review" })
    );

    await waitFor(() => {
      expect(defaultProps.onSuccess).toHaveBeenCalled();
      expect(defaultProps.onOpenChange).toHaveBeenCalledWith(false);
    });
  });

  it("displays API error when submission fails", async () => {
    mockSubmitReview.mockResolvedValue(false);
    mockUseJobStore.mockReturnValue({
      submitReview: mockSubmitReview,
      isLoading: false,
      error: "Network error occurred",
    } as any);

    render(<ReviewDialog {...defaultProps} />);

    expect(screen.getByText("Network error occurred")).toBeInTheDocument();
  });

  it("disables submit button when no rating is selected", () => {
    render(<ReviewDialog {...defaultProps} />);

    const submitButton = screen.getByRole("button", {
      name: "Submit Review",
    });
    expect(submitButton).toBeDisabled();
  });

  it("shows loading state during submission", () => {
    mockUseJobStore.mockReturnValue({
      submitReview: mockSubmitReview,
      isLoading: true,
      error: null,
    } as any);

    render(<ReviewDialog {...defaultProps} />);

    expect(screen.getByText("Submitting...")).toBeInTheDocument();
  });

  it("does not render when open is false", () => {
    render(<ReviewDialog {...defaultProps} open={false} />);
    expect(screen.queryByText("Leave a Review")).not.toBeInTheDocument();
  });
});
