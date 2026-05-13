/**
 * @vitest-environment jsdom
 */
import React from "react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import "@testing-library/jest-dom/vitest";

// Mock next/navigation
const mockPush = vi.fn();
const mockBack = vi.fn();
vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: mockPush,
    back: mockBack,
  }),
}));

// Mock framer-motion to render children directly
vi.mock("framer-motion", () => ({
  motion: {
    div: ({ children, ...props }: any) =>
      React.createElement("div", { "data-testid": props["data-testid"] }, children),
  },
  AnimatePresence: ({ children }: any) => children,
}));

// Mock the job store
const mockCreateJob = vi.fn();
vi.mock("@/store/jobStore", () => ({
  useJobStore: vi.fn(),
}));

import { useJobStore } from "@/store/jobStore";
const mockUseJobStore = vi.mocked(useJobStore);

// Mock DatePicker to a simple input
vi.mock("@/components/ui/date-picker", () => ({
  DatePicker: ({ value, onChange, placeholder }: any) =>
    React.createElement("input", {
      type: "text",
      "aria-label": "deadline",
      placeholder,
      value: value ? value.toISOString() : "",
      onChange: (e: any) => onChange(e.target.value ? new Date(e.target.value) : undefined),
    }),
}));

// Mock Select to avoid Radix scrollIntoView issues in jsdom
vi.mock("@/components/ui/select", () => ({
  Select: ({ children, onValueChange, value }: any) => {
    return React.createElement(
      "div",
      { "data-testid": "select-wrapper" },
      React.createElement("input", {
        type: "hidden",
        "data-testid": "select-hidden-input",
        value: value || "",
      }),
      React.createElement(
        "button",
        {
          role: "combobox",
          "data-testid": "select-trigger",
          onClick: () => onValueChange?.("home-services"),
        },
        value || "Select a category"
      ),
      children
    );
  },
  SelectContent: ({ children }: any) => React.createElement("div", null, children),
  SelectItem: ({ children, value }: any) =>
    React.createElement("option", { value }, children),
  SelectTrigger: ({ children, className }: any) =>
    React.createElement("span", { className }, children),
  SelectValue: ({ placeholder }: any) =>
    React.createElement("span", null, placeholder),
}));

import CreateJobPage from "@/app/dashboard/jobs/new/page";

describe("CreateJobPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockCreateJob.mockReset();
    mockUseJobStore.mockReturnValue({
      createJob: mockCreateJob,
      isLoading: false,
      error: null,
    } as any);
  });

  it("renders the page with title and step indicator", () => {
    render(<CreateJobPage />);

    expect(screen.getByText("Create a New Job")).toBeInTheDocument();
    expect(screen.getByText("Basics")).toBeInTheDocument();
    expect(screen.getByText("Details")).toBeInTheDocument();
    expect(screen.getByText("Budget")).toBeInTheDocument();
    expect(screen.getByText("Stages")).toBeInTheDocument();
    expect(screen.getByText("Review")).toBeInTheDocument();
  });

  it("renders step 1 (Basics) with title and category fields", () => {
    render(<CreateJobPage />);

    expect(screen.getByText("Job Basics")).toBeInTheDocument();
    expect(screen.getByLabelText("Job Title")).toBeInTheDocument();
    expect(screen.getByText("Category")).toBeInTheDocument();
  });

  it("shows validation error when title is too short", async () => {
    render(<CreateJobPage />);

    const titleInput = screen.getByLabelText("Job Title");
    fireEvent.change(titleInput, { target: { value: "Hi" } });

    // Try to go to next step
    fireEvent.click(screen.getByRole("button", { name: /Next/ }));

    await waitFor(() => {
      expect(screen.getByText("Title must be at least 5 characters")).toBeInTheDocument();
    });
  });

  it("shows validation error when title exceeds 100 characters", async () => {
    render(<CreateJobPage />);

    const titleInput = screen.getByLabelText("Job Title");
    fireEvent.change(titleInput, { target: { value: "x".repeat(101) } });

    fireEvent.click(screen.getByRole("button", { name: /Next/ }));

    await waitFor(() => {
      expect(screen.getByText("Title must be at most 100 characters")).toBeInTheDocument();
    });
  });

  it("shows validation error when category is not selected", async () => {
    render(<CreateJobPage />);

    const titleInput = screen.getByLabelText("Job Title");
    fireEvent.change(titleInput, { target: { value: "Fix leaking kitchen faucet" } });

    fireEvent.click(screen.getByRole("button", { name: /Next/ }));

    await waitFor(() => {
      expect(screen.getByText("Category is required")).toBeInTheDocument();
    });
  });

  it("disables Previous button on first step", () => {
    render(<CreateJobPage />);

    const prevButton = screen.getByRole("button", { name: /Previous/ });
    expect(prevButton).toBeDisabled();
  });

  it("shows Next button on non-final steps", () => {
    render(<CreateJobPage />);

    expect(screen.getByRole("button", { name: /Next/ })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /Create Job/ })).not.toBeInTheDocument();
  });

  it("shows character count for title field", () => {
    render(<CreateJobPage />);

    expect(screen.getByText("0/100 characters (min 5)")).toBeInTheDocument();

    const titleInput = screen.getByLabelText("Job Title");
    fireEvent.change(titleInput, { target: { value: "Hello" } });

    expect(screen.getByText("5/100 characters (min 5)")).toBeInTheDocument();
  });

  it("shows description validation error when description is too short on step 2", async () => {
    render(<CreateJobPage />);

    // Fill step 1 valid data to advance
    const titleInput = screen.getByLabelText("Job Title");
    fireEvent.change(titleInput, { target: { value: "Fix leaking kitchen faucet" } });

    // Click the select trigger to set category value
    const selectTrigger = screen.getByTestId("select-trigger");
    fireEvent.click(selectTrigger);

    // Advance to step 2
    fireEvent.click(screen.getByRole("button", { name: /Next/ }));

    await waitFor(() => {
      expect(screen.getByText("Job Details")).toBeInTheDocument();
    });

    // Enter a short description
    const descInput = screen.getByRole("textbox", { name: /Description/i });
    fireEvent.change(descInput, { target: { value: "Short desc" } });

    // Fill location fields
    const cityInput = screen.getByLabelText("City");
    const stateInput = screen.getByLabelText("State");
    const countryInput = screen.getByLabelText("Country");
    fireEvent.change(cityInput, { target: { value: "Lagos" } });
    fireEvent.change(stateInput, { target: { value: "Lagos" } });
    fireEvent.change(countryInput, { target: { value: "Nigeria" } });

    // Try to advance
    fireEvent.click(screen.getByRole("button", { name: /Next/ }));

    await waitFor(() => {
      expect(screen.getByText("Description must be at least 50 characters")).toBeInTheDocument();
    });
  });

  it("shows budget validation error when budget_min is less than 0.01", async () => {
    render(<CreateJobPage />);

    // Fill step 1
    const titleInput = screen.getByLabelText("Job Title");
    fireEvent.change(titleInput, { target: { value: "Fix leaking kitchen faucet" } });

    const selectTrigger = screen.getByTestId("select-trigger");
    fireEvent.click(selectTrigger);

    // Advance to step 2
    fireEvent.click(screen.getByRole("button", { name: /Next/ }));

    await waitFor(() => {
      expect(screen.getByText("Job Details")).toBeInTheDocument();
    });

    // Fill step 2 with valid data
    const descInput = screen.getByRole("textbox", { name: /Description/i });
    fireEvent.change(descInput, {
      target: { value: "This is a detailed description of the job that needs to be done. It should be at least 50 characters long." },
    });

    const cityInput = screen.getByLabelText("City");
    const stateInput = screen.getByLabelText("State");
    const countryInput = screen.getByLabelText("Country");
    fireEvent.change(cityInput, { target: { value: "Lagos" } });
    fireEvent.change(stateInput, { target: { value: "Lagos" } });
    fireEvent.change(countryInput, { target: { value: "Nigeria" } });

    // Advance to step 3 (Budget)
    fireEvent.click(screen.getByRole("button", { name: /Next/ }));

    await waitFor(() => {
      expect(screen.getByText("Budget")).toBeInTheDocument();
    });

    // Enter invalid budget min
    const budgetMinInput = screen.getByLabelText("Minimum Budget (NGN)");
    fireEvent.change(budgetMinInput, { target: { value: "0" } });

    const budgetMaxInput = screen.getByLabelText("Maximum Budget (NGN)");
    fireEvent.change(budgetMaxInput, { target: { value: "5000" } });

    // Try to advance
    fireEvent.click(screen.getByRole("button", { name: /Next/ }));

    await waitFor(() => {
      expect(screen.getByText("Budget minimum must be at least 0.01")).toBeInTheDocument();
    });
  });
});
