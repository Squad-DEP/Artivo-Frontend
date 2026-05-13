/**
 * @vitest-environment jsdom
 */
import React from "react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import "@testing-library/jest-dom/vitest";
import { StageCompletionDialog } from "@/components/jobs/StageCompletionDialog";

describe("StageCompletionDialog", () => {
  const defaultProps = {
    open: true,
    onOpenChange: vi.fn(),
    stageName: "Design Phase",
    stageAmount: 50000,
    onConfirm: vi.fn(),
    onDispute: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders the dialog with stage name and amount", () => {
    render(<StageCompletionDialog {...defaultProps} />);

    expect(screen.getByText("Stage Completion")).toBeInTheDocument();
    expect(screen.getByText("Design Phase")).toBeInTheDocument();
    expect(screen.getByText("₦50,000")).toBeInTheDocument();
  });

  it("shows confirm and dispute buttons in initial mode", () => {
    render(<StageCompletionDialog {...defaultProps} />);

    expect(
      screen.getByRole("button", { name: "Confirm Completion" })
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Dispute" })
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Cancel" })
    ).toBeInTheDocument();
  });

  it("calls onConfirm when Confirm Completion is clicked", () => {
    render(<StageCompletionDialog {...defaultProps} />);

    fireEvent.click(
      screen.getByRole("button", { name: "Confirm Completion" })
    );

    expect(defaultProps.onConfirm).toHaveBeenCalledTimes(1);
  });

  it("switches to dispute mode when Dispute is clicked", () => {
    render(<StageCompletionDialog {...defaultProps} />);

    fireEvent.click(screen.getByRole("button", { name: "Dispute" }));

    expect(screen.getByText("Dispute Stage")).toBeInTheDocument();
    expect(screen.getByLabelText("Dispute Reason")).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Submit Dispute" })
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Back" })
    ).toBeInTheDocument();
  });

  it("shows validation error when submitting empty dispute reason", () => {
    render(<StageCompletionDialog {...defaultProps} />);

    // Switch to dispute mode
    fireEvent.click(screen.getByRole("button", { name: "Dispute" }));

    // Submit without entering a reason
    fireEvent.click(
      screen.getByRole("button", { name: "Submit Dispute" })
    );

    expect(
      screen.getByText("Please provide a reason for the dispute")
    ).toBeInTheDocument();
    expect(defaultProps.onDispute).not.toHaveBeenCalled();
  });

  it("shows validation error when dispute reason exceeds 1000 characters", () => {
    render(<StageCompletionDialog {...defaultProps} />);

    fireEvent.click(screen.getByRole("button", { name: "Dispute" }));

    const textarea = screen.getByLabelText("Dispute Reason");
    fireEvent.change(textarea, { target: { value: "x".repeat(1001) } });

    fireEvent.click(
      screen.getByRole("button", { name: "Submit Dispute" })
    );

    expect(
      screen.getByText("Dispute reason must be 1000 characters or less")
    ).toBeInTheDocument();
    expect(defaultProps.onDispute).not.toHaveBeenCalled();
  });

  it("calls onDispute with trimmed reason when valid", () => {
    render(<StageCompletionDialog {...defaultProps} />);

    fireEvent.click(screen.getByRole("button", { name: "Dispute" }));

    const textarea = screen.getByLabelText("Dispute Reason");
    fireEvent.change(textarea, {
      target: { value: "  Work was not completed properly  " },
    });

    fireEvent.click(
      screen.getByRole("button", { name: "Submit Dispute" })
    );

    expect(defaultProps.onDispute).toHaveBeenCalledWith(
      "Work was not completed properly"
    );
  });

  it("navigates back from dispute mode to choose mode", () => {
    render(<StageCompletionDialog {...defaultProps} />);

    // Go to dispute mode
    fireEvent.click(screen.getByRole("button", { name: "Dispute" }));
    expect(screen.getByText("Dispute Stage")).toBeInTheDocument();

    // Go back
    fireEvent.click(screen.getByRole("button", { name: "Back" }));
    expect(screen.getByText("Stage Completion")).toBeInTheDocument();
  });

  it("disables buttons when isLoading is true", () => {
    render(<StageCompletionDialog {...defaultProps} isLoading={true} />);

    expect(
      screen.getByRole("button", { name: /confirm/i })
    ).toBeDisabled();
    expect(
      screen.getByRole("button", { name: "Dispute" })
    ).toBeDisabled();
    expect(
      screen.getByRole("button", { name: "Cancel" })
    ).toBeDisabled();
  });

  it("shows character count for dispute reason", () => {
    render(<StageCompletionDialog {...defaultProps} />);

    fireEvent.click(screen.getByRole("button", { name: "Dispute" }));

    expect(screen.getByText("0/1000 characters")).toBeInTheDocument();

    const textarea = screen.getByLabelText("Dispute Reason");
    fireEvent.change(textarea, { target: { value: "Hello" } });

    expect(screen.getByText("5/1000 characters")).toBeInTheDocument();
  });

  it("calls onOpenChange when Cancel is clicked", () => {
    render(<StageCompletionDialog {...defaultProps} />);

    fireEvent.click(screen.getByRole("button", { name: "Cancel" }));

    expect(defaultProps.onOpenChange).toHaveBeenCalledWith(false);
  });

  it("shows informational text about payment initiation", () => {
    render(<StageCompletionDialog {...defaultProps} />);

    expect(
      screen.getByText("Confirming will initiate payment for this stage.")
    ).toBeInTheDocument();
  });
});
