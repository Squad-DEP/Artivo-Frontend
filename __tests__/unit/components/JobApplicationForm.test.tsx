/**
 * @vitest-environment jsdom
 */
import React from "react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import "@testing-library/jest-dom/vitest";
import { JobApplicationForm } from "@/components/jobs/JobApplicationForm";

// Mock the job store
const mockApplyToJob = vi.fn();

vi.mock("@/store/jobStore", () => ({
  useJobStore: vi.fn(),
}));

import { useJobStore } from "@/store/jobStore";
const mockUseJobStore = vi.mocked(useJobStore);

describe("JobApplicationForm", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockApplyToJob.mockReset();
    mockUseJobStore.mockReturnValue({
      applyToJob: mockApplyToJob,
      isLoading: false,
      error: null,
    } as any);
  });

  it("renders the form with all fields", () => {
    render(
      <JobApplicationForm jobId="job-1" budgetMin={1000} budgetMax={50000} />
    );

    expect(screen.getByText("Apply for this Job")).toBeInTheDocument();
    expect(screen.getByLabelText(/Proposed Amount/)).toBeInTheDocument();
    expect(screen.getByLabelText(/Cover Letter/)).toBeInTheDocument();
    expect(screen.getByLabelText(/Estimated Duration/)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Submit Application" })).toBeInTheDocument();
  });

  it("displays the budget range", () => {
    render(
      <JobApplicationForm jobId="job-1" budgetMin={5000} budgetMax={100000} />
    );

    expect(screen.getByText("Budget Range")).toBeInTheDocument();
  });

  it("shows validation error when proposed amount is below budget min", async () => {
    render(
      <JobApplicationForm jobId="job-1" budgetMin={5000} budgetMax={100000} />
    );

    const amountInput = screen.getByLabelText(/Proposed Amount/);
    const coverLetterInput = screen.getByLabelText(/Cover Letter/);

    fireEvent.change(amountInput, { target: { value: "1000" } });
    fireEvent.change(coverLetterInput, { target: { value: "I am a great fit for this job." } });
    fireEvent.click(screen.getByRole("button", { name: "Submit Application" }));

    await waitFor(() => {
      expect(screen.getByText(/Proposed amount must be at least 5000/)).toBeInTheDocument();
    });

    expect(mockApplyToJob).not.toHaveBeenCalled();
  });

  it("shows validation error when proposed amount is above budget max", async () => {
    render(
      <JobApplicationForm jobId="job-1" budgetMin={5000} budgetMax={100000} />
    );

    const amountInput = screen.getByLabelText(/Proposed Amount/);
    const coverLetterInput = screen.getByLabelText(/Cover Letter/);

    fireEvent.change(amountInput, { target: { value: "200000" } });
    fireEvent.change(coverLetterInput, { target: { value: "I am a great fit for this job." } });
    fireEvent.click(screen.getByRole("button", { name: "Submit Application" }));

    await waitFor(() => {
      expect(screen.getByText(/Proposed amount must be at most 100000/)).toBeInTheDocument();
    });

    expect(mockApplyToJob).not.toHaveBeenCalled();
  });

  it("shows validation error when cover letter is empty", async () => {
    render(
      <JobApplicationForm jobId="job-1" budgetMin={5000} budgetMax={100000} />
    );

    const amountInput = screen.getByLabelText(/Proposed Amount/);
    fireEvent.change(amountInput, { target: { value: "10000" } });
    fireEvent.click(screen.getByRole("button", { name: "Submit Application" }));

    await waitFor(() => {
      expect(screen.getByText(/Cover letter is required/)).toBeInTheDocument();
    });

    expect(mockApplyToJob).not.toHaveBeenCalled();
  });

  it("submits the form successfully with valid data", async () => {
    mockApplyToJob.mockResolvedValue(true);

    const onSuccess = vi.fn();
    render(
      <JobApplicationForm
        jobId="job-1"
        budgetMin={5000}
        budgetMax={100000}
        onSuccess={onSuccess}
      />
    );

    const amountInput = screen.getByLabelText(/Proposed Amount/);
    const coverLetterInput = screen.getByLabelText(/Cover Letter/);
    const durationInput = screen.getByLabelText(/Estimated Duration/);

    fireEvent.change(amountInput, { target: { value: "25000" } });
    fireEvent.change(coverLetterInput, { target: { value: "I have 5 years of experience in this field." } });
    fireEvent.change(durationInput, { target: { value: "2 weeks" } });
    fireEvent.click(screen.getByRole("button", { name: "Submit Application" }));

    await waitFor(() => {
      expect(mockApplyToJob).toHaveBeenCalledWith("job-1", {
        proposed_amount: 25000,
        cover_letter: "I have 5 years of experience in this field.",
        estimated_duration: "2 weeks",
      });
    });

    expect(onSuccess).toHaveBeenCalled();
  });

  it("displays store error when submission fails", async () => {
    mockApplyToJob.mockResolvedValue(false);
    mockUseJobStore.mockReturnValue({
      applyToJob: mockApplyToJob,
      isLoading: false,
      error: "Network error occurred",
    } as any);

    render(
      <JobApplicationForm jobId="job-1" budgetMin={5000} budgetMax={100000} />
    );

    expect(screen.getByText("Network error occurred")).toBeInTheDocument();
  });

  it("disables inputs when loading", () => {
    mockUseJobStore.mockReturnValue({
      applyToJob: mockApplyToJob,
      isLoading: true,
      error: null,
    } as any);

    render(
      <JobApplicationForm jobId="job-1" budgetMin={5000} budgetMax={100000} />
    );

    expect(screen.getByLabelText(/Proposed Amount/)).toBeDisabled();
    expect(screen.getByLabelText(/Cover Letter/)).toBeDisabled();
    expect(screen.getByLabelText(/Estimated Duration/)).toBeDisabled();
    expect(screen.getByRole("button", { name: /Submitting/ })).toBeDisabled();
  });

  it("shows character count for cover letter", () => {
    render(
      <JobApplicationForm jobId="job-1" budgetMin={5000} budgetMax={100000} />
    );

    expect(screen.getByText("0/2000")).toBeInTheDocument();

    const coverLetterInput = screen.getByLabelText(/Cover Letter/);
    fireEvent.change(coverLetterInput, { target: { value: "Hello world" } });

    expect(screen.getByText("11/2000")).toBeInTheDocument();
  });
});
