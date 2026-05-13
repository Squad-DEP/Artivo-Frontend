/**
 * @vitest-environment jsdom
 */
import React from "react";
import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import "@testing-library/jest-dom/vitest";
import {
  JobStageTracker,
  type JobStageTrackerProps,
} from "@/components/jobs/JobStageTracker";
import type { JobStage } from "@/api/types/job";

function createStage(overrides: Partial<JobStage> = {}): JobStage {
  return {
    id: "stage-1",
    job_id: "job-1",
    title: "Design Phase",
    description: "Create initial designs",
    amount: 50000,
    status: "pending",
    created_at: "2024-01-01T00:00:00Z",
    order: 0,
    ...overrides,
  };
}

describe("JobStageTracker", () => {
  it("renders all stages in order", () => {
    const stages: JobStage[] = [
      createStage({ id: "s1", title: "Stage 1", order: 0 }),
      createStage({ id: "s2", title: "Stage 2", order: 1 }),
      createStage({ id: "s3", title: "Stage 3", order: 2 }),
    ];

    render(<JobStageTracker stages={stages} role="worker" />);

    expect(screen.getByText("Stage 1")).toBeInTheDocument();
    expect(screen.getByText("Stage 2")).toBeInTheDocument();
    expect(screen.getByText("Stage 3")).toBeInTheDocument();
  });

  it("displays stage amounts formatted with currency", () => {
    const stages = [createStage({ amount: 150000 })];

    render(<JobStageTracker stages={stages} role="worker" />);

    expect(screen.getByText("Amount: ₦150,000")).toBeInTheDocument();
  });

  it("shows status badges for each stage", () => {
    const stages: JobStage[] = [
      createStage({ id: "s1", title: "S1", status: "pending", order: 0 }),
      createStage({
        id: "s2",
        title: "S2",
        status: "in_progress",
        order: 1,
      }),
      createStage({ id: "s3", title: "S3", status: "completed", order: 2 }),
      createStage({ id: "s4", title: "S4", status: "paid", order: 3 }),
    ];

    render(<JobStageTracker stages={stages} role="worker" />);

    expect(screen.getByText("Pending")).toBeInTheDocument();
    expect(screen.getByText("In Progress")).toBeInTheDocument();
    expect(screen.getByText("Completed")).toBeInTheDocument();
    expect(screen.getByText("Paid")).toBeInTheDocument();
  });

  it("shows 'Mark Complete' button for worker on in_progress stages", () => {
    const stages = [createStage({ status: "in_progress" })];
    const onMarkComplete = vi.fn();

    render(
      <JobStageTracker
        stages={stages}
        role="worker"
        onMarkComplete={onMarkComplete}
      />
    );

    const button = screen.getByRole("button", {
      name: /mark.*complete/i,
    });
    expect(button).toBeInTheDocument();

    fireEvent.click(button);
    expect(onMarkComplete).toHaveBeenCalledWith("stage-1");
  });

  it("does not show 'Mark Complete' for worker on non-in_progress stages", () => {
    const stages: JobStage[] = [
      createStage({ id: "s1", status: "pending", order: 0 }),
      createStage({ id: "s2", status: "completed", order: 1 }),
      createStage({ id: "s3", status: "paid", order: 2 }),
    ];

    render(<JobStageTracker stages={stages} role="worker" />);

    expect(
      screen.queryByRole("button", { name: /mark.*complete/i })
    ).not.toBeInTheDocument();
  });

  it("shows Confirm and Dispute buttons for customer on completed stages", () => {
    const stages = [createStage({ status: "completed" })];
    const onConfirm = vi.fn();
    const onDispute = vi.fn();

    render(
      <JobStageTracker
        stages={stages}
        role="customer"
        onConfirm={onConfirm}
        onDispute={onDispute}
      />
    );

    const confirmBtn = screen.getByRole("button", { name: /confirm/i });
    const disputeBtn = screen.getByRole("button", { name: /dispute/i });

    expect(confirmBtn).toBeInTheDocument();
    expect(disputeBtn).toBeInTheDocument();

    fireEvent.click(confirmBtn);
    expect(onConfirm).toHaveBeenCalledWith("stage-1");

    fireEvent.click(disputeBtn);
    expect(onDispute).toHaveBeenCalledWith("stage-1");
  });

  it("does not show Confirm/Dispute for customer on non-completed stages", () => {
    const stages: JobStage[] = [
      createStage({ id: "s1", status: "pending", order: 0 }),
      createStage({ id: "s2", status: "in_progress", order: 1 }),
      createStage({ id: "s3", status: "paid", order: 2 }),
    ];

    render(<JobStageTracker stages={stages} role="customer" />);

    expect(
      screen.queryByRole("button", { name: /confirm/i })
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: /dispute/i })
    ).not.toBeInTheDocument();
  });

  it("handles single-stage jobs by displaying 'Full Job' label", () => {
    const stages = [
      createStage({ id: "job-1-full", title: "Full Job", amount: 200000 }),
    ];

    render(<JobStageTracker stages={stages} role="worker" />);

    expect(screen.getByText("Full Job")).toBeInTheDocument();
    expect(screen.getByText("Amount: ₦200,000")).toBeInTheDocument();
  });

  it("disables action buttons when isLoading is true", () => {
    const stages = [createStage({ status: "in_progress" })];

    render(
      <JobStageTracker stages={stages} role="worker" isLoading={true} />
    );

    const button = screen.getByRole("button", {
      name: /mark.*complete/i,
    });
    expect(button).toBeDisabled();
  });

  it("renders with accessible list role", () => {
    const stages = [createStage()];

    render(<JobStageTracker stages={stages} role="worker" />);

    expect(screen.getByRole("list", { name: "Job stages" })).toBeInTheDocument();
    expect(screen.getByRole("listitem")).toBeInTheDocument();
  });
});
